import Component from '@ember/component';
import layout from '../../templates/components/mandataris-aanstelling-tabel/mandaat-status';
import { defaultStatus, afstandMandaat, waarnemend, verhinderd, afwezigZonderKennisname, afwezigMetKennisname, onverenigbaarheid, burgemeester } from '../../models/aan-te-stellen-mandataris';
export default Component.extend({
  layout,
  options: [
    defaultStatus,
    waarnemend,
    verhinderd,
    afstandMandaat,
    afwezigMetKennisname,
    afwezigZonderKennisname,
    onverenigbaarheid,
    burgemeester
  ],
  actions: {
    select(status) {
      this.verkozene.set('status', status);
    }
  }
});
