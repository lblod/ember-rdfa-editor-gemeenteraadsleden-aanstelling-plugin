import Component from '@ember/component';
import layout from '../../templates/components/mandataris-aanstelling-tabel/overview';

export default Component.extend({
  layout,
  actions: {
    up(verkozene) {
      this.up(verkozene);
    },
    down(verkozene) {
      this.down(verkozene);
    },
    remove(verkozene) {
      this.remove(verkozene);
    },
    edit(verkozene) {
      this.edit(verkozene);
    }
  }
});
