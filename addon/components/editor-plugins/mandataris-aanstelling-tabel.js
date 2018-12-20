import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/mandataris-aanstelling-tabel';
import { inject as service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import { computed } from '@ember/object';

export default Component.extend({
  layout,
  store: service(),

  verkozenen: computed('mandatarissen', 'mandatarissen.[]', 'mandatarissen.@each.rangorde', function(){
    this.renumberVerkozenen();
    return this.mandatarissen.sortBy('rangorde');
  }),

  didReceiveAttrs() {
    this.set('record', null);
    if (!isEmpty(this.mandatarissen)) {
      var rangorde = 1;
      this.mandatarissen.forEach( (mandataris) => {
        if (!mandataris.rangorde) {
          mandataris.set('rangorde', rangorde++);
        }
        else {
          //it might be a string
          rangorde = Number(mandataris.rangorde);
          mandataris.set('rangorde', rangorde);
        }
      });
    }
  },
  renumberVerkozenen() {
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
      }
    },
    down(verkozene) {
      const index = this.mandatarissen.indexOf(verkozene);
      if (index < this.mandatarissen.length) {
        this.mandatarissen.removeObject(verkozene);
        this.mandatarissen.insertAt(index + 1, verkozene);
      }
    },
    remove(verkozene) {
      this.mandatarissen.removeObject(verkozene);
    },
    setRecord(verkozene) {
      this.setRecord(verkozene);
    }
  }
});
