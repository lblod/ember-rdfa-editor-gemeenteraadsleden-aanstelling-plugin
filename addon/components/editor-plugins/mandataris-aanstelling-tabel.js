import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/mandataris-aanstelling-tabel';
import { inject as service } from '@ember/service';
import { isEmpty } from '@ember/utils';

export default Component.extend({
  layout,
  store: service(),
  didReceiveAttrs() {
    this.set('record', null);
    if (!isEmpty(this.mandatarissen)) {
      var rangorde = 1;
      this.mandatarissen.forEach( (mandataris) => mandataris.set('rangorde', rangorde++));
      this.set('verkozenen', this.mandatarissen);
    }
  },
  renumberVerkozenen() {
    var orde = 1;
    for(var verkozene of this.verkozenen) {
      verkozene.set('rangorde', orde++);
    }
  },
  actions: {
    up(verkozene) {
      const index = this.verkozenen.indexOf(verkozene);
      if (index > 0) {
        this.verkozenen.removeObject(verkozene);
        this.verkozenen.insertAt(index -1, verkozene);
        this.renumberVerkozenen();
      }
    },
    down(verkozene) {
      const index = this.verkozenen.indexOf(verkozene);
      if (index < this.verkozenen.length) {
        this.verkozenen.removeObject(verkozene);
        this.verkozenen.insertAt(index + 1, verkozene);
        this.renumberVerkozenen();
      }
    },
    remove(verkozene) {
      this.verkozenen.removeObject(verkozene);
      this.renumberVerkozenen();
    },
    setRecord(verkozene) {
      this.setRecord(verkozene);
    }
  }
});
