import Component from '@ember/component';
import layout from '../../templates/components/mandataris-aanstelling-tabel/opvolger-selector';
import { inject as service } from '@ember/service';
import { task, timeout } from 'ember-concurrency';

export default Component.extend({
  layout,
  store: service(),
  searchByName: task(function* (searchData) {
    yield timeout(300);
    let queryParams = {
      sort:'verkiezingsresultaten.plaats-rangorde',
      filter: {
        'is-kandidaat-voor': {
          lijstnaam: searchData,
          'rechtstreekse-verkiezing': {'stelt-samen': {':uri:': this.bestuursorgaan}}
        },
        'verkiezingsresultaten': {
          'gevolg': { ':uri:': 'http://data.vlaanderen.be/id/concept/VerkiezingsresultaatGevolgCode/4c713f09-1317-4860-bbbd-e8f7dfd78a2f'}, //opvolger
          'is-resultaat-voor': {'rechtstreekse-verkiezing': {'stelt-samen': {':uri:': this.bestuursorgaan}}}
        }
      },
      include: 'verkiezingsresultaten,is-kandidaat-voor',
      page: {
        number: 0,
        size: 100
      }
    };
    let personen = yield this.store.query('persoon', queryParams);
    return personen;
  }),

  actions: {
    select(persoon){
      this.set('opvolger', persoon);
      this.onSelect(persoon);
    }
  }

});
