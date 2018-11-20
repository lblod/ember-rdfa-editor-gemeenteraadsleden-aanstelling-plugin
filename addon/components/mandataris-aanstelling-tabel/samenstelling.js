import Component from '@ember/component';
import layout from '../../templates/components/mandataris-aanstelling-tabel/samenstelling';
import { isEmpty } from '@ember/utils';
export default Component.extend({
  layout,
  tagName:'',
  didReceiveAttrs() {
    this.set('record', null);
    if (!isEmpty(this.mandatarissen)) {
      this.set('verkozenen', this.mandatarissen);
    }
  },
  notAlreadyOnList(opvolger) {
    const r = ! this.verkozenen.any( (verkozene) => verkozene.persoon.uri === opvolger.uri);
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
    }
  }
});
