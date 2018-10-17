import { reads } from '@ember/object/computed';
import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/ember-rdfa-editor-gemeenteraadsleden-card';
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
  actions: {
    insert(html){
      let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
      this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), 'editor-plugins/ember-rdfa-editor-gemeenteraadsleden-card');
      this.get('editor').replaceTextWithHTML(...mappedLocation, html);
    }
  }
});
