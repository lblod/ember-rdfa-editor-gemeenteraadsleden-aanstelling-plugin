import Component from '@ember/component';
import layout from '../../templates/components/mandataris-aanstelling-tabel/edit-record';
import AanTeStellenMandataris from '../../models/aan-te-stellen-mandataris';
export default Component.extend({
  layout,
  didReceiveAttrs() {
    if (this.record)
      this.set('oudeMandaten', this.record.oudeMandaten);
  },
  actions: {
    removeOldMandaat(mandaat) {
      this.oudeMandaten.removeObject(mandaat);
    },
    addOldMandaat(){
      this.oudeMandaten.pushObject(AanTeStellenMandataris.create({ einde: 'tot heden'}));
    },
    close() {
      this.set('record', null);
    },
    save() {
      this.record.set('oudeMandaten', this.oudeMandaten);
      this.set('record', null);
    }
  }
});
