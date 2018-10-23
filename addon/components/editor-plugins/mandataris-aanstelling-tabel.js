import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/mandataris-aanstelling-tabel';
import { bool } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import { A } from '@ember/array';
import { warn } from '@ember/debug';
import AanTeStellenMandataris from '../../models/aan-te-stellen-mandataris';

export default Component.extend({
  layout,
  isEditing: bool('record'),
  store: service(),
  didReceiveAttrs() {
    this.set('record', null);
    if (isEmpty(this.mandatarissen)) {
      this.buildAanTeStellenMandatarissen();
    }
    else {
      this.set('verkozenen', this.mandatarissen);
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
      warn(e, 'gemeenteraadsleden-aanstelling-plugin.queryFailed');
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
      this.set('record', verkozene);
    }
  }
});
