import Component from '@ember/component';
import layout from '../../templates/components/mandataris-aanstelling-tabel/edit-record';
import AanTeStellenMandataris from '../../models/aan-te-stellen-mandataris';
import { sort, alias } from '@ember/object/computed';

export default Component.extend({
  layout,
  oudeMandaten: alias('record.oudeMandaten'),
  mandatenSort:['start'],
  sortedMandaten: sort('oudeMandaten', 'mandatenSort'),
  actions: {
    removeOldMandaat(mandaat) {
      this.oudeMandaten.removeObject(mandaat);
    },
    addOldMandaat(){
      this.oudeMandaten.pushObject(AanTeStellenMandataris.create({}));
    },
    close() {
      this.set('record', null);
    },
    save() {
      this.save();
    }
  }
});
