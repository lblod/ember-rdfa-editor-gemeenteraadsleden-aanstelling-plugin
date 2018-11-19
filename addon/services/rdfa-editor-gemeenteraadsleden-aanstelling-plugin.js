import { getOwner } from '@ember/application';
import Service from '@ember/service';
import EmberObject from '@ember/object';
import { task } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import RdfaContextScanner from '@lblod/ember-rdfa-editor/utils/rdfa-context-scanner';
import AanTeStellenMandataris from '../models/aan-te-stellen-mandataris';
import { A } from '@ember/array';
import { defaultStatus, afwezigZonderKennisname, afwezigMetKennisname, onverenigbaarheid, afstandMandaat } from '../models/aan-te-stellen-mandataris';

const textToMatch = "beheer aanstelling gemeenteraadsleden.";
const oudMandaatPredicate = 'http://mu.semte.ch/vocabularies/ext/oudMandaat';
const afstandMandaatPredicate = 'http://mu.semte.ch/vocabularies/ext/bekrachtigdAfstandVanMandaatDoor';
const onverenigbaarheidPredicate = 'http://mu.semte.ch/vocabularies/ext/bekrachtigdOnverenigbaarheid';
const afwezigMetKennisnamePredicate = 'http://mu.semte.ch/vocabularies/ext/bekrachtigdAfwezigheidMetKennisGeving';
const afwezigZonderKennisnamePredicate = 'http://mu.semte.ch/vocabularies/ext/bekrachtigdAfwezigheid';
const bestuursfunctie = 'http://data.vlaanderen.be/id/concept/BestuursfunctieCode/5ab0e9b8a3b2ca7c5e000011'; // TODO: hardcoded for now

/**
 * Service responsible for correct annotation of dates
 *
 * @module editor-ember-rdfa-editor-gemeenteraadsleden-plugin
 * @class RdfaEditorEmberRdfaEditorGemeenteraadsledenPlugin
 * @constructor
 * @extends EmberService
 */
const EmberRdfaEditorGemeenteraadsledenAanstellingPlugin = Service.extend({
  store: service(),
  init(){
    this._super(...arguments);
  },

  personQueryFilter(uris) {
    return {
      filter: {
        ':uri:': uris.join(','),
        'is-kandidaat-voor': { 'rechtstreekse-verkiezing': {'stelt-samen': {':uri:': this.bestuursorgaan}}},
        'verkiezingsresultaten': {
          'is-resultaat-voor': {'rechtstreekse-verkiezing': {'stelt-samen': {':uri:': this.bestuursorgaan}}}
        }
      },
      include: 'verkiezingsresultaten,is-kandidaat-voor'
    };
  },

  /**
   * Restartable task to handle the incoming events from the editor dispatcher
   *
   * @method execute
   *
   * @param {string} hrId Unique identifier of the event in the hintsRegistry
   * @param {Array} contexts RDFa contexts of the text snippets the event applies on
   * @param {Object} hintsRegistry Registry of hints in the editor
   * @param {Object} editor The RDFa editor instance
   *
   * @public
   */
  execute: task(function * (hrId, contexts, hintsRegistry, editor) {
    if (contexts.length === 0) return [];

    for (var context of contexts) {
      this.setBestuursorgaanIfSet(context.context);
      this.setStartDateIfSet(context.context);
      if (this.detectInsertTableContext(context)) {
        const index = context.text.toLowerCase().indexOf(textToMatch);
        const location = this.normalizeLocation([index, index + textToMatch.length], context.region);
        hintsRegistry.removeHintsInRegion(context.region, hrId, this.who);
        hintsRegistry.addHints(hrId, this.who, [this.generateCard(hrId, hintsRegistry, editor, { location })]);
      }
    }
    const tables = this.extractTables(contexts);
    for (const table of tables) {
      const location = [ table.start, table.end ];
      hintsRegistry.removeHintsInRegion(location, hrId, this.who);
      const card = this.generateCard(hrId, hintsRegistry, editor, { location, node: table.domNode, data: this.extractData(table), noHighlight: true});
      hintsRegistry.addHints(hrId, this.who, [ card ]);
    }
  }),
  async buildMandatarisFromTriples(triples) {
    function setPropIfTripleFound(triples, obj, prop) {
      const triple = triples.find((t) => t.predicate === obj.rdfaBindings[prop]);
      if (triple) {
        if (triple.datatype === 'http://www.w3.org/2001/XMLSchema#date')
          obj.set(prop, new Date(triple.object.trim()));
        else
          obj.set(prop, triple.object.trim());
      }
    }
    const mandataris = AanTeStellenMandataris.create({ uri: triples[0].subject, status: defaultStatus});
    setPropIfTripleFound(triples, mandataris, 'rangorde');
    setPropIfTripleFound(triples, mandataris, 'start');
    setPropIfTripleFound(triples, mandataris, 'einde');
    mandataris.set('mandaat', this.mandaat);
    const persoonURI = triples.find((t) => t.predicate === mandataris.rdfaBindings.persoon);
    if (persoonURI) {
      const persoon = await this.store.query('persoon', this.personQueryFilter([persoonURI.object]));
      mandataris.set('persoon', persoon.get('firstObject'));
      mandataris.set('resultaat', mandataris.persoon.verkiezingsresultaten.firstObject);
      mandataris.set('lijst', mandataris.persoon.isKandidaatVoor.firstObject);
    }
    return mandataris;
  },
  async buildNietAangesteldeMandataris(triples, predicate, status) {
    const uris = triples.filter((t) => t.predicate === predicate).map((t) => t.object);
    if (uris.length > 0) {
      const personen = await this.store.query('persoon', this.personQueryFilter(uris));
      return personen.map( (persoon) => AanTeStellenMandataris.create({
        persoon,
        status: status,
        lijst:persoon.isKandidaatVoor.firstObject,  // this works because of the filter
        resultaat: persoon.verkiezingsresultaten.firstObject // this works because of the filter
      }));
    }
    else
      return A();
  },
  async fetchMandaat() {
    const mandaten = await this.store.query('mandaat', {
      filter: {
        'bevat-in': {':uri:': this.bestuursorgaan },
        'bestuursfunctie': { ':uri:': bestuursfunctie }
      },
      include: 'bestuursfunctie'
    });
    this.set('mandaat', mandaten.get('firstObject'));
  },
  async extractData(richNode) {
    const contextScanner = RdfaContextScanner.create({});
    const contexts = contextScanner.analyse(richNode.domNode).map((c) => c.context);
    const triples = Array.concat(...contexts);
    const resources = triples.filter((t) => t.predicate === "a");
    const mandatarissen = A();
    for (let resource of resources) {
      if (
        resource.object === 'http://data.vlaanderen.be/ns/mandaat#Mandataris' &&
          ! mandatarissen.some( (m) => m.uri === resource.subject) &&
          ! triples.some((t) => t.predicate === oudMandaatPredicate && t.object === resource.subject)
      ) {
        const mandataris = await this.buildMandatarisFromTriples(triples.filter((t) => t.subject === resource.subject));
        const oudeMandatenURIs = triples.filter((t) => t.predicate === oudMandaatPredicate && t.subject === resource.subject).map((t) => t.object);
        for (const uri of new Set(oudeMandatenURIs)) {
          const oudMandaat = await this.buildMandatarisFromTriples(triples.filter((t) => t.subject === uri));
          mandataris.oudeMandaten.pushObject(oudMandaat);
        }
        mandatarissen.pushObject(mandataris);
      }
    }
    mandatarissen.pushObjects(await this.buildNietAangesteldeMandataris(triples, afstandMandaatPredicate, afstandMandaat));
    mandatarissen.pushObjects(await this.buildNietAangesteldeMandataris(triples, onverenigbaarheidPredicate, onverenigbaarheid));
    mandatarissen.pushObjects(await this.buildNietAangesteldeMandataris(triples, afwezigMetKennisnamePredicate, afwezigMetKennisname));
    mandatarissen.pushObjects(await this.buildNietAangesteldeMandataris(triples, afwezigZonderKennisnamePredicate, afwezigZonderKennisname));
    return mandatarissen;
  },
  setBestuursorgaanIfSet(triples) {
    const zitting = triples.find((triple) => triple.object === 'http://data.vlaanderen.be/ns/besluit#Zitting');
    if (zitting) {
      const bestuursorgaan = triples.find((triple) => triple.subject === zitting.subject && triple.predicate === 'http://data.vlaanderen.be/ns/besluit#isGehoudenDoor');
      if (bestuursorgaan) {
        this.set('bestuursorgaan', bestuursorgaan.object);
        this.fetchMandaat();
      }
    }
  },
  setStartDateIfSet(triples) {
    const zitting = triples.find((triple) => triple.object === 'http://data.vlaanderen.be/ns/besluit#Zitting');
    if (zitting) {
      const startDate = triples.find((triple) => triple.subject === zitting.subject && triple.predicate === 'http://data.vlaanderen.be/ns/besluit#geplandeStart');
      if (startDate) {
        this.set('startDate', startDate.object);
      }
    }
  },
  /**
   * Given context object, tries to detect a context the plugin can work on
   *
   * @method detectInsertTableContext
   *
   * @param {Object} context Text snippet at a specific location with an RDFa context
   *
   * @return {String} URI of context if found, else empty string.
   *
   * @private
   */
  detectInsertTableContext(context){
    return context.text.toLowerCase().indexOf(textToMatch) >= 0;
  },

  /**
   * @private
   */
  extractTables(contexts) {
    const relevantContexts = contexts.filter((context) => context.context.find((triple) => triple.predicate === 'http://mu.semte.ch/vocabularies/ext/mandatarisTabelInput'));
    const findFirstTextElement = function(node) {
      if (node instanceof Array)
        return findFirstTextElement(node[0]);
      else
        return node;
    };
    const parentTableOf = function (node) {
      if ( node.type === "tag" && node.domNode.getAttribute('property') === 'ext:mandatarisTabelInput')
      {
       return node;
      }
      else
        return parentTableOf(node.parent);
    };
    const relevantNodes = relevantContexts.map((context) => {
      const textNode = findFirstTextElement(context.richNode);
      const table = parentTableOf(textNode);
      return table;
    });
    return new Set(relevantNodes);
  },

  /**
   * Maps location of substring back within reference location
   *
   * @method normalizeLocation
   *
   * @param {[int,int]} [start, end] Location withing string
   * @param {[int,int]} [start, end] reference location
   *
   * @return {[int,int]} [start, end] absolute location
   *
   * @private
   */
  normalizeLocation(location, reference){
    return [location[0] + reference[0], location[1] + reference[0]];
  },

  /**
   * Generates a card given a hint
   *
   * @method generateCard
   *
   * @param {string} hrId Unique identifier of the event in the hintsRegistry
   * @param {Object} hintsRegistry Registry of hints in the editor
   * @param {Object} editor The RDFa editor instance
   * @param {Object} hint containing the hinted string and the location of this string
   *
   * @return {Object} The card to hint for a given template
   *
   * @private
   */
  generateCard(hrId, hintsRegistry, editor, hint){
    return EmberObject.create({
      info: {
        who: this.get('who'),
        location: hint.location,
        hrId, hintsRegistry, editor,
        node: hint.node,
        data: hint.data,
        bestuursfunctie: bestuursfunctie
      },
      options: { noHighlight: hint.noHighlight },
      location: hint.location,
      card: this.get('who')
    });
  }
});

EmberRdfaEditorGemeenteraadsledenAanstellingPlugin.reopen({
  who: 'editor-plugins/rdfa-editor-gemeenteraadsleden-card'
});
export default EmberRdfaEditorGemeenteraadsledenAanstellingPlugin;
