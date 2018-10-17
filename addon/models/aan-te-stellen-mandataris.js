import { A } from '@ember/array';
import EmberObject from '@ember/object';

export default EmberObject.extend({
  rangorde: 0,
  persoon: null,
  mandaat: null,
  status: null,
  start: null,
  einde: null,
  oudeMandaten: A()
});
