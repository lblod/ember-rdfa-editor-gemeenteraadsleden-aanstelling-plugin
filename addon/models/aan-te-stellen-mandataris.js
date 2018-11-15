import { A } from '@ember/array';
import EmberObject from '@ember/object';
import { computed } from '@ember/object';
import uuid from 'uuid/v4';
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
    oudeMandaten: "http://mu.semte.ch/vocabularies/ext/oudMandaat"
  },
  ancieniteit: computed('oudeMandaten.[].{start,einde}', function () {
    var ancieniteit = 0;
    for (const mandaat of this.oudeMandaten) {
      if (mandaat.start && mandaat.einde) {
        var d2Y = mandaat.einde.getFullYear();
        var d1Y = mandaat.start.getFullYear();
        var d2M = mandaat.einde.getMonth();
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
