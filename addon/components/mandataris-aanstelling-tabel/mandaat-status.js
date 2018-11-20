import Component from '@ember/component';
import layout from '../../templates/components/mandataris-aanstelling-tabel/mandaat-status';
import { defaultStatus, afstandMandaat, afwezigZonderKennisname, afwezigMetKennisname, onverenigbaarheid } from '../../models/aan-te-stellen-mandataris';
export default Component.extend({
  layout,
  options: [ defaultStatus, afstandMandaat, afwezigMetKennisname, afwezigZonderKennisname, onverenigbaarheid ],
  actions: {
    select(status) {
      this.verkozene.set('status', status);
    }
  }
});
