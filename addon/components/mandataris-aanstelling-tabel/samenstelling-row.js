import Component from '@ember/component';
import layout from '../../templates/components/mandataris-aanstelling-tabel/samenstelling-row';
import { task } from 'ember-concurrency';

export default Component.extend({
  layout,
  tagName: 'tr',
  opvolgerUri: 'http://data.vlaanderen.be/id/concept/VerkiezingsresultaatGevolgCode/4c713f09-1317-4860-bbbd-e8f7dfd78a2f',

  checkOpvolger: task(function *(){
    let results = this.verkozene.resultaat;
    let gevolg = yield results.get('gevolg');
    let isOpvolger = gevolg.uri === this.opvolgerUri;
    this.set('isOpvolger', isOpvolger);
  }),

  didReceiveAttrs() {
    this._super(...arguments);
    this.checkOpvolger.perform();
  },

  actions: {
    remove(){
      this.onRemove(this.verkozene);
    }
  }
});
