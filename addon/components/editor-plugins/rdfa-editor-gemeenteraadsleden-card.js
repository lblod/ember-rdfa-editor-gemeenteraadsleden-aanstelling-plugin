import { reads } from '@ember/object/computed';
import { computed } from '@ember/object';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import AanTeStellenMandataris from '../../models/aan-te-stellen-mandataris';
import layout from '../../templates/components/editor-plugins/rdfa-editor-gemeenteraadsleden-card';
import { task } from 'ember-concurrency';

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
      this.set('mandatarissen', yield this.info.data);
    }
    else
      this.set('mandatarissen', null);
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
    }
  }
});
