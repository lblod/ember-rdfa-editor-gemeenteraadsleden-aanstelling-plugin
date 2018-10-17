import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo, hasMany } from 'ember-data/relationships';

export default Model.extend({
  lijstnaam: attr(),
  lijstnummer: attr(),
  rechtstreekseVerkiezing: belongsTo('rechtstreekse-verkiezing', { inverse: null }),
  kandidaten: hasMany('persoon', { inverse: 'isKandidaatVoor' })
});
