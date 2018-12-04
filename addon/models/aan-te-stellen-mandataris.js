import { A } from '@ember/array';
import EmberObject from '@ember/object';
import { computed } from '@ember/object';
import { equal } from '@ember/object/computed';
import uuid from 'uuid/v4';

const defaultStatus = 'opname mandaat';
const afstandMandaat = 'afstand mandaat';
const afwezigMetKennisname = 'afwezig met kennisgeving';
const afwezigZonderKennisname = 'afwezig zonder kennisgeving';
const onverenigbaarheid = 'situatie van onverenigbaarheid';
const verhinderd = 'verhinderd';
const waarnemend = 'waarnemend';

export default EmberObject.extend({
  uri: null,
  rangorde: 0,
  persoon: null,
  mandaat: null,
  status: null,
  start: null,
  einde: null,
  oudeMandaten: null,
  rdfaBindings: { // eslint-disable-line ember/avoid-leaking-state-in-ember-objects
    class: "http://data.vlaanderen.be/ns/mandaat#Mandataris",
    rangorde: "http://data.vlaanderen.be/ns/mandaat#rangorde",
    start: "http://data.vlaanderen.be/ns/mandaat#start",
    einde: "http://data.vlaanderen.be/ns/mandaat#einde",
    mandaat: "http://www.w3.org/ns/org#holds",
    persoon: "http://data.vlaanderen.be/ns/mandaat#isBestuurlijkeAliasVan",
    oudeMandaten: "http://mu.semte.ch/vocabularies/ext/oudMandaat",
    status: "http://data.vlaanderen.be/ns/mandaat#status"
  },
  isVerhinderd: equal('status', verhinderd ),
  isEffectief: equal('status', defaultStatus),
  isWaarnemend: equal('status', waarnemend),
  ancieniteit: computed('oudeMandaten.[].{start,einde}', function () {
    var ancieniteit = 0;
    for (const mandaat of this.oudeMandaten) {
      if (mandaat.start && mandaat.start instanceof Date && mandaat.einde && mandaat.einde instanceof Date) {
        const nextDay = new Date(mandaat.einde);
        nextDay.setDate(mandaat.einde.getDate() + 1);
        var d2Y = nextDay.getFullYear();
        var d1Y = mandaat.start.getFullYear();
        var d2M = nextDay.getMonth();
        var d1M = mandaat.start.getMonth();
        ancieniteit = ancieniteit + (d2M - d1M + 12*(d2Y - d1Y));
      }
    }
    const years = Math.floor(ancieniteit / 12);
    const months = ancieniteit % 12;
    return `${years} jaar ${months} maanden`;
  }),
  init() {
    this._super(...arguments);
    this.set('oudeMandaten', A());
    if (! this.uri)
      this.set('uri', `http://data.lblod.info/id/mandatarissen/${uuid()}`);
  }
});

export {
  defaultStatus,
  afstandMandaat,
  afwezigZonderKennisname,
  afwezigMetKennisname,
  onverenigbaarheid,
  verhinderd,
  waarnemend
};
