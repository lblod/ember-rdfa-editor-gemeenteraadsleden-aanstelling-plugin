import Component from '@ember/component';
import layout from '../../../templates/components/mandataris-aanstelling-tabel/rangorde/output';
import { sort } from '@ember/object/computed';

export default Component.extend({
  layout,
  sort: Object.freeze(['rangorde']),
  sortedMandatarissen: sort('zetelendeMandatarissen', 'sort')
});
