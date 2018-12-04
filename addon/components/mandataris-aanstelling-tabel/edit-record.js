import Component from '@ember/component';
import layout from '../../templates/components/mandataris-aanstelling-tabel/edit-record';
import AanTeStellenMandataris from '../../models/aan-te-stellen-mandataris';
import { sort, alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import { task } from 'ember-concurrency';

export default Component.extend({
  layout,
  store: service(),
  didReceiveAttrs() {
    this._super(...arguments);
    if (this.record && isEmpty(this.record.oudeMandaten)) {
      this.fetchOudeMandaten.perform();
    }
  },
  fetchOudeMandaten: task( function *() {
    const mandaten = yield this.store.query('mandataris', {
      filter: {
        'is-bestuurlijke-alias-van': {':uri:': this.record.persoon.uri },
        bekleedt: { bestuursfunctie: {':uri:': 'http://data.vlaanderen.be/id/concept/BestuursfunctieCode/5ab0e9b8a3b2ca7c5e000011' }} // TODO: hardcoded
      },
      include: 'bekleedt.bestuursfunctie'
    });
    this.record.set('oudeMandaten', mandaten.map((m) => AanTeStellenMandataris.create({ uri: m.uri, start: m.start, einde: m.einde, mandaat: m.bekleedt })));
  }),
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
