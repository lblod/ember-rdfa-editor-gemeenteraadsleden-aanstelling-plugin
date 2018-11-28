import { reads, filterBy, bool } from '@ember/object/computed';
import { computed } from '@ember/object';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import AanTeStellenMandataris from '../../models/aan-te-stellen-mandataris';
import { defaultStatus, afwezigZonderKennisname, afwezigMetKennisname, onverenigbaarheid, afstandMandaat } from '../../models/aan-te-stellen-mandataris';
import layout from '../../templates/components/editor-plugins/rdfa-editor-gemeenteraadsleden-card';
import { task } from 'ember-concurrency';
import { A } from '@ember/array';

/**
* Card displaying a hint of the gemeenteraadsleden plugin
*
* @module editor-ember-rdfa-editor-gemeenteraadsleden-plugin
* @class EmberRdfaEditorGemeenteraadsledenCard
* @extends Ember.Component
*/
export default Component.extend({
  layout,
  store: service(),
  isEditing: bool('record'),
  aanstelling: service('rdfa-editor-gemeenteraadsleden-aanstelling-plugin'),
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
  bestuursorgaan: reads('aanstelling.bestuursorgaan'),
  startDate: reads('aanstelling.startDate'),
  bestuursfunctie: reads('info.bestuursfunctie'),
  opgenomenMandaten: filterBy('mandatarissen','status', defaultStatus),
  afstandenVanMandaat: filterBy('mandatarissen', 'status', afstandMandaat),
  onverenigbaarheden: filterBy('mandatarissen', 'status', onverenigbaarheid),
  afwezigenMetKennisGeving: filterBy('mandatarissen', 'status', afwezigMetKennisname),
  afwezigen: filterBy('mandatarissen', 'status', afwezigZonderKennisname),
  outputId: computed('id', function() { return `output-mandataris-tabel-${this.id}`;}),
  async didReceiveAttrs() {
    this.fetchResources.perform();
    this.set('currentStep', null);
    this.set('record', null);
  },
  fetchResources: task( function * () {
    if (this.bestuursorgaan && this.bestuursfunctie) {
      const mandaten = yield this.store.query('mandaat', {
        filter: {
          'bevat-in': {':uri:': this.bestuursorgaan },
          'bestuursfunctie': { ':uri:': this.bestuursfunctie }
        }
      });
      this.set('mandaat', mandaten.get('firstObject'));
    }
    if (this.info.node) {
      this.set('mandatarissen', yield this.info.data);
    }
    else {
      const verkozenen = yield this.store.query('persoon', {
        filter: {
          'is-kandidaat-voor': { 'rechtstreekse-verkiezing': {'stelt-samen': {':uri:': this.bestuursorgaan}}},
          'verkiezingsresultaten': {
            'gevolg': { ':uri:': 'http://data.vlaanderen.be/id/concept/VerkiezingsresultaatGevolgCode/89498d89-6c68-4273-9609-b9c097727a0f'},
            'is-resultaat-voor': {'rechtstreekse-verkiezing': {'stelt-samen': {':uri:': this.bestuursorgaan}}}
          }
        },
        include: 'verkiezingsresultaten,is-kandidaat-voor',
        page: {
          number: 0,
          size: 100
        }
      });
    const aantestellen = A();
    verkozenen.sortBy('verkiezingsresultaten.firstObject.aantalNaamstemmen').reverse().forEach( (verkozene) =>  {
      aantestellen.pushObject(AanTeStellenMandataris.create({
        persoon: verkozene,
        start: this.startDate,
        einde: this.bestuursorgaan.bindingEinde,
        status: defaultStatus,
        mandaat: this.mandaat,
        resultaat: verkozene.verkiezingsresultaten.firstObject,
        lijst: verkozene.isKandidaatVoor.firstObject
      }));
    });
      this.set('mandatarissen', aantestellen);
    }
  }),
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
    },
    addMandataris(persoon) {
      const opvolger = AanTeStellenMandataris.create({
        persoon: persoon,
        start: this.startDate,
        status: defaultStatus,
        mandaat: this.mandaat,
        resultaat: persoon.verkiezingsresultaten.firstObject,
        lijst: persoon.isKandidaatVoor.firstObject
      });
      this.mandatarissen.insertAt(0,opvolger);
    },
    setRecord(record) {
      this.set('record', record);
    }
  }
});
