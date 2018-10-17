import { A } from '@ember/array';
import EmberObject from '@ember/object';

export default EmberObject.extend({
  uri: null,
  rangorde: 0,
  persoon: null,
  mandaat: null,
  status: null,
  start: null,
  einde: null,
  oudeMandaten: null,
  init() {
    this._super(...arguments);
    this.set('oudeMandaten', A());
    this.set('uri', 'http://temp/');
  }
});
