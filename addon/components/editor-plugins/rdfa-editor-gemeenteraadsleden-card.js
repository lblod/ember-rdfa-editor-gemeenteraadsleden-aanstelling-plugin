import { reads, filter, filterBy, bool, sort } from '@ember/object/computed';
import { computed } from '@ember/object';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import AanTeStellenMandataris from '../../models/aan-te-stellen-mandataris';
import { waarnemend, verhinderd, defaultStatus, afwezigZonderKennisname, afwezigMetKennisname, burgemeester, onverenigbaarheid, afstandMandaat } from '../../models/aan-te-stellen-mandataris';
import layout from '../../templates/components/editor-plugins/rdfa-editor-gemeenteraadsleden-card';
import { task } from 'ember-concurrency';
import { A } from '@ember/array';

/**
* Card displaying a hint of the gemeenteraadsleden plugin
*
* @module editor-ember-rdfa-editor-gemeenteraadsleden-plugin
* @class EmberRdfaEditorGemeenteraadsledenCard
* @extends Ember.Component
*/
export default Component.extend({
  layout,
  store: service(),
  isEditing: bool('record'),
  aanstelling: service('rdfa-editor-gemeenteraadsleden-aanstelling-plugin'),
  /**
   * Region on which the card applies
   * @property location
   * @type [number,number]
   * @private
  */
  location: reads('info.location'),

  /**
   * Unique identifier of the event in the hints registry
   * @property hrId
   * @type Object
   * @private
  */
  hrId: reads('info.hrId'),

  /**
   * The RDFa editor instance
   * @property editor
   * @type RdfaEditor
   * @private
  */
  editor: reads('info.editor'),

  /**
   * Hints registry storing the cards
   * @property hintsRegistry
   * @type HintsRegistry
   * @private
  */
  hintsRegistry: reads('info.hintsRegistry'),
  bestuursorgaan: reads('aanstelling.bestuursorgaan'),
  startDate: reads('aanstelling.startDate'),
  bestuursfunctie: reads('info.bestuursfunctie'),
  sortedMandatarissen: computed('mandatarissen', 'mandatarissen.@each.status', function(){
    return this.mandatarissen.sort((a,b) =>  a.persoon.get('achternaam').trim().localeCompare(b.persoon.get('achternaam').trim()));
  }),

  mandatarissenVoorGeloofsbrieven: filter('sortedMandatarissen', function(mandataris) {
    return [defaultStatus, verhinderd].includes(mandataris.status);
  }),
  aangesteldeMandatarissen: filter('sortedMandatarissen', function(mandataris) {
    return [verhinderd, waarnemend, defaultStatus].includes(mandataris.status);
  }),
  _zetelendeMandatarissen: filter('sortedMandatarissen', function(mandataris) {
    return [waarnemend, defaultStatus, burgemeester].includes(mandataris.status);
  }),
  rangordeSort: Object.freeze(['rangorde']),
  zetelendeMandatarissen: sort('_zetelendeMandatarissen','rangordeSort'),
  waarnemendeMandatarissen: filterBy('sortedMandatarissen', 'status', waarnemend),
  verhinderdeMandatarissen: filterBy('sortedMandatarissen', 'status', verhinderd),
  afstandenVanMandaat: filterBy('sortedMandatarissen', 'status', afstandMandaat),
  onverenigbaarheden: filterBy('sortedMandatarissen', 'status', onverenigbaarheid),
  afwezigenMetKennisGeving: filterBy('sortedMandatarissen', 'status', afwezigMetKennisname),
  afwezigen: filterBy('sortedMandatarissen', 'status', afwezigZonderKennisname),
  verhinderd: filterBy('sortedMandatarissen', 'status', verhinderd),
  outputId: computed('id', function() { return `output-mandataris-tabel-${this.id}`;}),
  async didReceiveAttrs() {
    this.fetchResources.perform();
    this.set('currentStep', null);
    this.set('record', null);
  },
  fetchResources: task( function * (flushTable = false) {
    if (this.bestuursorgaan && this.bestuursfunctie) {
      const mandaten = yield this.store.query('mandaat', {
        filter: {
          'bevat-in': {':uri:': this.bestuursorgaan },
          'bestuursfunctie': { ':uri:': this.bestuursfunctie }
        }
      });
      this.set('mandaat', mandaten.get('firstObject'));
    }
    if (this.info.node && !flushTable) {
      this.set('mandatarissen', yield this.info.data);
    }
    else {
      const verkozenen = yield this.store.query('verkiezingsresultaat', {
        filter: {
          'gevolg': { ':uri:': 'http://data.vlaanderen.be/id/concept/VerkiezingsresultaatGevolgCode/89498d89-6c68-4273-9609-b9c097727a0f'},
          'is-resultaat-voor': {'rechtstreekse-verkiezing': {'stelt-samen': {':uri:': this.bestuursorgaan}}
          }
        },
        include: 'is-resultaat-voor,is-resultaat-van',
        page: {
          number: 0,
          size: 100
        }
      });
    const aantestellen = A();
    verkozenen.forEach( (resultaat) =>  {
      aantestellen.pushObject(AanTeStellenMandataris.create({
        persoon: resultaat.isResultaatVan,
        start: this.startDate,
        einde: this.bestuursorgaan.bindingEinde,
        status: defaultStatus,
        mandaat: this.mandaat,
        resultaat: resultaat,
        lijst: resultaat.isResultaatVoor
      }));
    });
      this.set('mandatarissen', aantestellen.sortBy('resultaat.aantalNaamstemmen').reverse());
    }
  }),
  actions: {
    flushTable(){
      this.fetchResources.perform(true);
      this.set('currentStep', null);
      this.set('record', null);
    },
    insert(){
      const html = document.getElementById(this.outputId).innerHTML;
      if (this.info.node) {
        this.hintsRegistry.removeHintsAtLocation(this.location, this.hrId, this.info.who);
        this.get('editor').replaceNodeWithHTML(this.info.node, html);
      }
      else {
        let mappedLocation = this.hintsRegistry.updateLocationToCurrentIndex(this.hrId, this.location);
        this.hintsRegistry.removeHintsAtLocation(this.location, this.hrId, this.info.who);
        this.get('editor').replaceTextWithHTML(...mappedLocation, html);
      }
    },
    togglePopup() {
      this.toggleProperty('popup');
    },
    addMandataris(persoon) {
      const opvolger = AanTeStellenMandataris.create({
        persoon: persoon,
        start: this.startDate,
        status: defaultStatus,
        mandaat: this.mandaat,
        resultaat: persoon.verkiezingsresultaten.firstObject,
        lijst: persoon.isKandidaatVoor.firstObject
      });
      this.mandatarissen.insertAt(0,opvolger);
    },
    setRecord(record) {
      this.set('record', record);
    },
    toggleNieuweStijl(){
      this.toggleProperty('nieuweStijl');
    }
  }
});
