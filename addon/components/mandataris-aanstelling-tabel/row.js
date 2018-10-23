import Component from '@ember/component';
import layout from '../../templates/components/mandataris-aanstelling-tabel/row';
import { isEmpty } from '@ember/utils';
import { inject as service } from '@ember/service';

export default Component.extend({
  layout,
  tagName: '',
  store: service(),
  async didReceiveAttrs() {
    if (! isEmpty(this.verkozene) && ! isEmpty(this.bestuursorgaan)) {
      const lijsten = await this.store.query('kandidatenlijst', {
        filter: {
          'rechtstreekse-verkiezing': {'stelt-samen': {':uri:': this.bestuursorgaan}},
          'kandidaten': { ':id:': this.verkozene.id}
        }
      });
      if (! isEmpty(lijsten))
        this.set('lijst', lijsten.get('firstObject'));
      if (this.lijst) {
        const verkiezingsresultaat = await this.store.query('verkiezingsresultaat', {
          filter: {
            isResultaatVoor: this.lijst,
            isResultaatVan: { ':id:': this.verkozene.id }
          }
        });
        console.log(this.lijst);
        this.set('resultaat', verkiezingsresultaat.get('firstObject'));
      }
    }
}
});
