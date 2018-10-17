import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/verkozenen-lijst';
import { inject as service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import { A } from '@ember/array';
import AanTeStellenMandataris from '../../models/aan-te-stellen-mandataris';

export default Component.extend({
  layout,
  store: service(),
  edit: false,
  didReceiveAttrs() {
    if (! isEmpty(this.bestuursorgaan)) {
      this.buildAanTeStellenMandatarissen();
    }
  },
  async buildAanTeStellenMandatarissen() {

    try {
      const verkozenen = await this.store.query('persoon', {
        filter: {
          'is-kandidaat-voor': { 'rechtstreekse-verkiezing': {'stelt-samen': {':uri:': this.bestuursorgaan}}},
          'verkiezingsresultaten': {
//            'gevolg': { label: 'Effectief'}, TODO: filter on correct URI when codelist exists
//            'is-resultaat-voor': {'stelt-samen': {':uri:': this.bestuursorgaan}} TODO: add this filter when data exists
          }
        },
        // TODO sort on verkiezingsresultaat.plaatsRangorde
        page: {
          number: 0,
          size: 100
        }
      });
      const aantestellen = A();
      var orde = 1;
      verkozenen.forEach( (verkozene) =>  {
        aantestellen.pushObject(AanTeStellenMandataris.create({
          persoon: verkozene,
          rangorde: orde++,
          start: this.bestuursorgaan.bindingStart,
          einde: this.bestuursorgaan.bindingEinde,
          status: this.defaultStatus,
          mandaat: this.defaultMandaat
        }));
      });
      this.set('verkozenen', aantestellen);
    }
    catch(e){
      console.log(e);
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
    save(target) {
      console.log(this);
      const html = this.get('element').getElementsByClassName('output')[0].innerHTML;
      this.save(html);
    },
    remove(verkozene) {
      this.verkozenen.removeObject(verkozene);
      this.renumberVerkozenen();
    },
    edit(verkozene) {
      this.set('edit', true);
      this.set('currentVerkozene', verkozene);
    },
    closeEdit() {
      this.set('edit', false);
    },
    removeOldMandaat(mandaat) {
      this.currentVerkozene.oudeMandaten.removeObject(mandaat);
    },
    addOldMandaat(){
      this.currentVerkozene.oudeMandaten.pushObject(AanTeStellenMandataris.create({ einde: 'tot heden'}));
    }
  }
});
