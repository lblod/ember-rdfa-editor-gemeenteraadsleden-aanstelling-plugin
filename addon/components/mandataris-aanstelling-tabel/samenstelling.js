import Component from '@ember/component';
import layout from '../../templates/components/mandataris-aanstelling-tabel/samenstelling';
import { isEmpty } from '@ember/utils';
import { computed } from '@ember/object';

export default Component.extend({
  layout,
  tagName:'',
  opvolgerUri: 'http://data.vlaanderen.be/id/concept/VerkiezingsresultaatGevolgCode/4c713f09-1317-4860-bbbd-e8f7dfd78a2f',

  verkozenen: computed('mandatarissen', 'mandatarissen.[]', function(){
    return this.mandatarissen;
  }),

  didReceiveAttrs() {
    this.set('record', null);
    if (!isEmpty(this.mandatarissen)) {
      this.set('verkozenen', this.mandatarissen);
    }
  },
  notAlreadyOnList(opvolger) {
    const r = ! this.verkozenen.any( (verkozene) => verkozene.get('persoon.uri') === opvolger.get('uri'));
    return r;
  },
  actions: {
    add() {
      this.toggleProperty('adding');
    },
    selectOpvolger(persoon) {
      this.set('opvolger', persoon);
    },
    addOpvolger() {
      if (this.opvolger) {
        if (this.notAlreadyOnList(this.opvolger)) {
          this.addMandataris(this.opvolger);
        }
        this.toggleProperty('adding');
      }
    },
    cancelAdd() {
      this.set('opvolger', null);
      this.toggleProperty('adding');
    },

    remove(opvolger){
      this.mandatarissen.removeObject(opvolger);
    }
  }
});
