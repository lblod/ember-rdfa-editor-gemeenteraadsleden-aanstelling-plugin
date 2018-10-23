import { reads } from '@ember/object/computed';
import { computed } from '@ember/object';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import AanTeStellenMandataris from '../../models/aan-te-stellen-mandataris';
import RdfaContextScanner from '@lblod/ember-rdfa-editor/utils/rdfa-context-scanner';
import layout from '../../templates/components/editor-plugins/rdfa-editor-gemeenteraadsleden-card';
import { task } from 'ember-concurrency';

const oudMandaatPredicate = 'http://mu.semte.ch/vocabularies/ext/oudMandaat';
/**
* Card displaying a hint of the Date plugin
*
* @module editor-ember-rdfa-editor-gemeenteraadsleden-plugin
* @class EmberRdfaEditorGemeenteraadsledenCard
* @extends Ember.Component
*/
export default Component.extend({
  layout,
  store: service(),
  orgaan: service('rdfa-editor-gemeenteraadsleden-aanstelling-plugin'),
  /**
   * Region on which the card applies
   * @property location
   * @type [number,number]
   * @private
  */
  location: reads('info.location'),

  /**
   * Unique identifier of the event in the hints registry
   * @property hrId
   * @type Object
   * @private
  */
  hrId: reads('info.hrId'),

  /**
   * The RDFa editor instance
   * @property editor
   * @type RdfaEditor
   * @private
  */
  editor: reads('info.editor'),

  /**
   * Hints registry storing the cards
   * @property hintsRegistry
   * @type HintsRegistry
   * @private
  */
  hintsRegistry: reads('info.hintsRegistry'),
  bestuursorgaan: reads('orgaan.bestuursorgaan'),
  bestuursfunctie: reads('info.bestuursfunctie'),

  outputId: computed('id', function() { return `output-mandataris-tabel-${this.id}`;}),
  async didReceiveAttrs() {
    this.fetchResources.perform();
  },
  fetchResources: task( function * () {
    if (this.bestuursorgaan && this.bestuursfunctie) {
      const mandaten = yield this.store.query('mandaat', {
        filter: {
          'bevat-in': {':id:': this.bestuursorgaan.id },
          'bestuursfunctie': { ':uri:': this.bestuursfunctie }
        }
      });
      this.set('mandaat', mandaten.get('firstObject'));
    }
    if (this.info.node) {
      const contextScanner = RdfaContextScanner.create({});
      const contexts = contextScanner.analyse(this.info.node).map((c) => c.context);
      const triples = Array.concat(...contexts);
      const resources = triples.filter((t) => t.predicate === "a");
      const mandatarissen = A();
      for (let resource of resources) {
        if (
          resource.object === 'http://data.vlaanderen.be/ns/mandaat#Mandataris' &&
            ! mandatarissen.some( (m) => m.uri === resource.subject) &&
            ! triples.some((t) => t.predicate === oudMandaatPredicate && t.object === resource.subject)
        ) {
          const mandataris = yield this.buildMandatarisFromTriples(triples.filter((t) => t.subject === resource.subject));
          const oudeMandatenURIs = triples.filter((t) => t.predicate === oudMandaatPredicate && t.subject === resource.subject).map((t) => t.object);
          for (const uri of new Set(oudeMandatenURIs)) {
            const oudMandaat = yield this.buildMandatarisFromTriples(triples.filter((t) => t.subject === uri));
            mandataris.oudeMandaten.pushObject(oudMandaat);
          }
          mandatarissen.pushObject(mandataris);
        }
      }
      this.set('mandatarissen', mandatarissen);
    }
    else
      this.set('mandatarissen', null);
  }),
  async buildMandatarisFromTriples(triples) {
    function setPropIfTripleFound(triples, obj, prop) {
      const triple = triples.find((t) => t.predicate === obj.rdfaBindings[prop]);
      if (triple) {
        obj.set(prop, triple.object.trim());
      }
    }
    const mandataris = AanTeStellenMandataris.create({ uri: triples[0].subject});
    setPropIfTripleFound(triples, mandataris, 'rangorde');
    setPropIfTripleFound(triples, mandataris, 'start');
    setPropIfTripleFound(triples, mandataris, 'einde');
    const mandaatURI = triples.find((t) => t.predicate === mandataris.rdfaBindings.mandaat);
    if (mandaatURI) {
      const mandaat = await this.store.query('mandaat', { filter:{':uri:': mandaatURI.object}});
      mandataris.set('mandaat', mandaat.get('firstObject'));
    }
    const persoonURI = triples.find((t) => t.predicate === mandataris.rdfaBindings.persoon);
    if (persoonURI) {
      const persoon = await this.store.query('persoon',
                                             {
                                               filter: {
                                                 ':uri:': persoonURI.object,
                                                 'is-kandidaat-voor': { 'rechtstreekse-verkiezing': {'stelt-samen': {':uri:': this.bestuursorgaan}}},
                                                 'verkiezingsresultaten': {
                                                   'gevolg': { ':uri:': 'http://data.vlaanderen.be/id/concept/VerkiezingsresultaatGevolgCode/89498d89-6c68-4273-9609-b9c097727a0f'},
                                                   'is-resultaat-voor': {'rechtstreekse-verkiezing': {'stelt-samen': {':uri:': this.bestuursorgaan}}}
                                                 }
                                               },
                                               include: 'verkiezingsresultaten,is-kandidaat-voor'
                                             });
      mandataris.set('persoon', persoon.get('firstObject'));
      mandataris.set('resultaat', mandataris.persoon.verkiezingsresultaten.firstObject);
      mandataris.set('lijst', mandataris.persoon.isKandidaatVoor.firstObject);
    }
    return mandataris;
  },
  actions: {
    insert(){
      const html = document.getElementById(this.outputId).innerHTML;
      if (this.info.node) {
        this.hintsRegistry.removeHintsAtLocation(this.location, this.hrId, this.info.who);
        this.get('editor').replaceNodeWithHTML(this.info.node, html);
      }
      else {
        let mappedLocation = this.hintsRegistry.updateLocationToCurrentIndex(this.hrId, this.location);
        this.hintsRegistry.removeHintsAtLocation(this.location, this.hrId, this.info.who);
        this.get('editor').replaceTextWithHTML(...mappedLocation, html);
      }
    },
    togglePopup() {
      this.toggleProperty('popup');
    }
  }
});
