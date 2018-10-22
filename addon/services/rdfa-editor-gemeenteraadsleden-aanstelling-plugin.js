import { getOwner } from '@ember/application';
import Service from '@ember/service';
import EmberObject from '@ember/object';
import { task } from 'ember-concurrency';
const textToMatch = "voeg rangorde tabel gemeenteraadsleden toe.";

/**
 * Service responsible for correct annotation of dates
 *
 * @module editor-ember-rdfa-editor-gemeenteraadsleden-plugin
 * @class RdfaEditorEmberRdfaEditorGemeenteraadsledenPlugin
 * @constructor
 * @extends EmberService
 */
const EmberRdfaEditorGemeenteraadsledenAanstellingPlugin = Service.extend({

  init(){
    this._super(...arguments);
    const config = getOwner(this).resolveRegistration('config:environment');
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
      if (this.detectInsertTableContext(context)) {
        const index = context.text.toLowerCase().indexOf(textToMatch);
        const location = this.normalizeLocation([index, index + textToMatch.length], context.region);
        hintsRegistry.removeHintsInRegion(context.region, hrId, this.who);
        hintsRegistry.addHints(hrId, this.who, [this.generateCard(hrId, hintsRegistry, editor, { location })]);
      }
    }
    const tables = this.extractTables(contexts);
    for (const table of tables) {
      const richNode = editor.getRichNodeFor(table);
      const location = [ richNode.start, richNode.end ];
      hintsRegistry.removeHintsInRegion(location, hrId, this.who);
      const card = this.generateCard(hrId, hintsRegistry, editor, { location, node: table, noHighlight: true});
      hintsRegistry.addHints(hrId, this.who, [ card ]);
    }
  }),

  setBestuursorgaanIfSet(triples) {
    const zitting = triples.find((triple) => triple.object === 'http://data.vlaanderen.be/ns/besluit#Zitting');
    if (zitting) {
      const bestuursorgaan = triples.find((triple) => triple.subject === zitting.subject && triple.predicate === 'http://data.vlaanderen.be/ns/besluit#isGehoudenDoor');
      if (bestuursorgaan) {
        this.set('bestuursorgaan', bestuursorgaan.object);
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
      if ( ! node.tagName || node.tagName.toLowerCase() !== "table")
        return parentTableOf(node.parentNode);
      else
        return node;
    };
    const relevantNodes = relevantContexts.map((context) => {
      const textNode = findFirstTextElement(context.richNode);
      const table = parentTableOf(textNode.domNode);
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
        bestuursorgaan: hint.bestuursorgaan,
        location: hint.location,
        hrId, hintsRegistry, editor,
        node: hint.node
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
