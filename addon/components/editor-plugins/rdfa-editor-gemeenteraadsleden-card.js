import { reads } from '@ember/object/computed';
import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/rdfa-editor-gemeenteraadsleden-card';
import { inject as service } from '@ember/service';

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
  //  bestuursorgaan: reads('orgaan.bestuursorgaan'),
  bestuursorgaan: 'http://data.lblod.info/id/bestuursorganen/011d88d368cb43bb315cda320d404028647a197c379e2de4d386970657d9eb46', // todo remove hardcoded orgaan
  actions: {
    insert(html){
      let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
      this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), 'editor-plugins/ember-rdfa-editor-gemeenteraadsleden-card');
      console.log(mappedLocation);
      console.log(html);
      this.get('editor').replaceTextWithHTML(...mappedLocation, html);
    },
    togglePopup() {
      this.toggleProperty('popup');
    }
  }
});
