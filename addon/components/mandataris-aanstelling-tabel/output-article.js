import Component from '@ember/component';
import layout from '../../templates/components/mandataris-aanstelling-tabel/output-article';
import { computed } from '@ember/object';
import uuid from 'uuid/v4';
export default Component.extend({
  layout,
  uuid: computed('', function() {
    return uuid();
  })
});
