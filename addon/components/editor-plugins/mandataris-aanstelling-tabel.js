import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/mandataris-aanstelling-tabel';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { next } from '@ember/runloop';
export default Component.extend({
  layout,
  store: service(),
  verkozenen: computed('mandatarissen', 'mandatarissen.@each.rangorde', function(){
    return this.mandatarissen.sortBy('rangorde');
  }),

  didReceiveAttrs() {
    this.set('record', null);
    // next runloop because this triggers a reorder in the top level component
    // causing mandatarissen to change twice in the same runloop
    next(this, this.renumberMandatarissen);
  },
  renumberMandatarissen() {
    var orde = 1;
    for(var verkozene of this.mandatarissen) {
      verkozene.set('rangorde', orde++);
    }
  },
  actions: {
    up(verkozene) {
      const index = this.mandatarissen.indexOf(verkozene);
      if (index > 0) {
        this.mandatarissen.removeObject(verkozene);
        this.mandatarissen.insertAt(index -1, verkozene);
        this.renumberMandatarissen();
      }
    },
    down(verkozene) {
      const index = this.mandatarissen.indexOf(verkozene);
      if (index < this.mandatarissen.length) {
        this.mandatarissen.removeObject(verkozene);
        this.mandatarissen.insertAt(index + 1, verkozene);
        this.renumberMandatarissen();
      }
    },
    setRecord(verkozene) {
      this.setRecord(verkozene);
    }
  }
});
