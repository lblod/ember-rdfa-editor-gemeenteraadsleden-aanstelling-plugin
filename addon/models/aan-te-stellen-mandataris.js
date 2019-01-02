import { A } from '@ember/array';
import EmberObject from '@ember/object';
import { computed } from '@ember/object';
import { equal } from '@ember/object/computed';
import uuid from 'uuid/v4';
import moment from 'moment';

const defaultStatus = 'opname mandaat';
const afstandMandaat = 'afstand mandaat';
const afwezigMetKennisname = 'afwezig met kennisgeving';
const afwezigZonderKennisname = 'afwezig zonder kennisgeving';
const onverenigbaarheid = 'situatie van onverenigbaarheid';
const verhinderd = 'verhinderd';
const waarnemend = 'waarnemend';
const burgemeester = 'benoemd als burgemeester';
export default EmberObject.extend({
  uri: null,
  rangorde: null,
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
  isBurgemeester: equal('status', burgemeester),
  ancieniteit: computed('oudeMandaten.[]','oudeMandaten.@each.{start,einde}', function () {

   /*
    * De regels: elke (kalender)dag dat ze raadslid zijn (dus de startdatum meetellen en volgens mij ook de einddatum);
    * als er een periode tussen zit dat ze geen raadslid zijn, moeten ze een nieuwe regel invoeren, dus het aantal dagen van elke periode
    * (elke lijn) moeten samengeteld worden.
    * (...)
    * Is dat niet makkelijker als wat er nu staat? Dus dat je enkel het aantal dagen toont (en dus niet moet afronden)?
   */
    var ancieniteit = 0;
    for (const mandaat of this.oudeMandaten) {
      if (mandaat.start && mandaat.start instanceof Date && mandaat.einde && mandaat.einde instanceof Date) {
        let days = moment(mandaat.einde).diff(mandaat.start, 'days') + 1; //inclusief end date
        ancieniteit = ancieniteit + days;
      }
    }
    return `${ancieniteit} dagen`;
  }),

  init() {
    this._super(...arguments);
    this.set('oudeMandaten', A());
    this.set('rangorde', 1);
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
  waarnemend,
  burgemeester
};
