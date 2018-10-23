import { A } from '@ember/array';
import EmberObject from '@ember/object';
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
    persoon: "http://data.vlaanderen.be/ns/mandaat#isBestuurlijkeAliasVan"
  },
  init() {
    this._super(...arguments);
    this.set('oudeMandaten', A());
    if (! this.uri)
      this.set('uri', `http://data.lblod.info/id/mandaten/${uuid()}`);
  }
});
