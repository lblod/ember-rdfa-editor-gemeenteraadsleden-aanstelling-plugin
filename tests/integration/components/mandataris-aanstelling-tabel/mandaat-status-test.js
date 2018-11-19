import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | mandataris-aanstelling-tabel/mandaat-status', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`{{mandataris-aanstelling-tabel/mandaat-status}}`);

    assert.equal(this.element.textContent.trim(), '');

    // Template block usage:
    await render(hbs`
      {{#mandataris-aanstelling-tabel/mandaat-status}}
        template block text
      {{/mandataris-aanstelling-tabel/mandaat-status}}
    `);

    assert.equal(this.element.textContent.trim(), 'template block text');
  });
});
