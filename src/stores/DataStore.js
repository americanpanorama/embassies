import { EventEmitter } from 'events';
import AppDispatcher from '../utils/AppDispatcher';
import { AppActionTypes } from '../utils/AppActionCreator';
import OceansJson from '../../data/oceans.json';
import DestinationsJson from '../../data/destinations.json';
//import PresidentialTerms from '../../data/terms.json';
import travels from '../../data/presTerms.json';
import diplomaticEvents from '../../data/events.json';
//import SOSTerms from '../../data/termsSOS.json';
import RegionsMetadata from '../../data/regionsMetadata.json';
import PresYearData from '../../data/presYearData.json';
import SOSYearData from '../../data/sosYearData.json';

import d3 from 'd3';

const DataStore = {

  data: {
    events: diplomaticEvents,
    firstYear: 1778,
    lastYear: 2017,
    startDate: '1905-04-03',
    endDate: '2016-12-31',
    years: [...Array(2017-1778).keys()].map(num => num+1777),
    tau: 2 * Math.PI,
    zoomFactor: 10,
    daysDuration: 40837, // this._dateDiff('1905-01-01', '2016-12-31'),
    selectedId: null,
    selectedLocationIds: [],
    inspectedCountryId: null,
    selectedCountryId: null,
    detailText: null
  },

  _dateDiff: function (date1, date2) {
    let d1 = date1.split('-').map(num => parseInt(num)),
      d2 = date2.split('-').map(num => parseInt(num)),
      dO1 = new Date(d1[0], d1[1]-1, d1[2], 0, 0, 0, 0),
      dO2 = new Date(d2[0], d2[1]-1, d2[2]),
      timeDiff = Math.abs(dO2.getTime() - dO1.getTime()),
      diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return diffDays;
  },

  _inside: function(point, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    var x = point[0], 
      y = point[1];

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      var xi = vs[i][0], 
        yi = vs[i][1];
      var xj = vs[j][0], 
        yj = vs[j][1];

      var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  },

  _parseDestinationsByYear: function(office) {
    let theData = [];
    DestinationsJson.features.filter(destination => destination.properties.position.toLowerCase() == office).forEach(destination => {
      let year = parseInt(destination.properties.date_convert.substring(0,4)),
        region = destination.properties.new_region.replace(/ /g,'').toLowerCase(),
        continentData = theData.filter(continent => continent.key == region);
      if (continentData.length == 0) {
        theData.push({
          key: region,
          values: [ { 
            region: destination.properties.new_region,
            year: year,
            visits: 1
          } ]
        });
      } else {
        let continentYearData = continentData[0].values.filter(yearData => yearData.year == year);
        if (continentYearData.length == 0) {
          continentData[0].values.push({ 
            region: destination.properties.new_region,
            year: year,
            visits: 1
          });
        } else {
          continentYearData[0].visits += 1;
        }
      }
    });

    // add missing dates
    theData.forEach(regionData => {
      let region = regionData.values[0].region;
      this.data.years.forEach(year => {
        let regionYearData = regionData.values.filter(yearData => yearData.year == year);
        if (regionYearData.length == 0) {
          regionData.values.push({ 
            region: region,
            year: year,
            visits: 0
          });
        }
      });

      // sort
      regionData.values.sort((a,b) => a.year - b.year);      
    });
    // drop the US
    theData = theData.filter(regionData => regionData.key !== 'u.s');
    // sort by region 
    let theOrdering = ['canada', 'latinamerica', 'westerneurope', 'easterneuropeandcentralasia', 'middleeast', 'africa', 'southasia', 'eastasia', 'oceania'];
    theData.sort((a,b) => theOrdering.indexOf(a.key) - theOrdering.indexOf(b.key));

    return theData;
  },

  _getMaxVisits: function() {
    let yearCounts = [],
      max;
    travels
      .filter(o => o.office == 'p')
      .forEach(o => {
        o.visits.forEach(v => {
          let year = parseInt(v.properties.start_date.substring(0,4));
          yearCounts[year] = (yearCounts[year]) ? yearCounts[year] + 1 : 1;
        });
      });
    let counts = Object.keys(yearCounts).map(year => yearCounts[year]);
    return Math.max(...counts);
  },



  _parseDestinationsByLocation: function() {
    let destinations = (this.data.selectedId) ? this.getSimplifiedDestinationsForSelected() : this.getAllDestinations(),
      theData = [];

    destinations.forEach(destination => {
      let lng = destination.geometry.coordinates[0],
        lat = destination.geometry.coordinates[1],
        cityId = destination.properties.city_id,
        dataForLocation = theData.filter(location => (lat == location.lat && lng == location.lng));

      if (dataForLocation.length == 0) {
        theData.push({
          lat: lat,
          lng: lng,
          cityId: cityId,
          regionClass: destination.properties.new_region.replace(/ /g,'').toLowerCase(),
          displayName: destination.properties.city + ', ' + destination.properties.country,
          searchName: [destination.properties.city, destination.properties.country, destination.properties.new_region].join(' '),
          visits: [
            destination.properties
          ]
        });
      } else {
        dataForLocation[0].visits.push(destination.properties);
      }
    });

    return theData;
  },

  _constrainedDate(date) {
    date = (date.substring(0,10) > this.data.startDate) ? date.substring(0,10) : this.data.startDate;
    date = (date.substring(0,10) < this.data.endDate) ? date.substring(0,10) : this.data.endDate;
    return date;
  },

  setSelected: function(id, office, visits, lat, lng) {
    if (this.hasSelectedLocation()) {
      [lng, lat] = this.getLatLng([this.data.selectedLocationIds[0]]);
    }

    this.data.selectedId = id;
    this.data.selectedOffice = office;

    // if there are selected visits, see if the new selection visited the same place
    if (this.hasSelectedLocation()) {
      this.setSelectedVisitsFromLatLng(lat, lng);
    }

    // set selected visits if specified
    if (lat && lng) {
      this.setSelectedVisitsFromLatLng(lat, lng);
    } else if (visits) {
      this.setSelectedVisits(visits);
    }

    this.emit(AppActionTypes.storeChanged);
  },

  setSelectedVisits: function(ids) {
    ids = ids.map(id => parseInt(id));
    this.data.inspectedLocationIds = [];
    this.data.selectedLocationIds = ids;
    this.emit(AppActionTypes.storeChanged);
  },

  setInspectingCountry: function(id) {
    this.data.inspectedCountryId = id;
    this.emit(AppActionTypes.storeChanged);
  },

  setSelectedCountry: function(id) {
    this.data.selectedCountryId = id;
    this.emit(AppActionTypes.storeChanged);
  },

  setSelectedVisitsFromLatLng: function(lat, lng) {
    let destinationIds = this.getSimplifiedDestinationsForSelected()
      .filter(v => v.geometry.coordinates[0] == lng && v.geometry.coordinates[1] == lat)
      .map(v => v.properties.cartodb_id);
    this.setSelectedVisits(destinationIds);
  },

  // GETS

  allPresidentsShown: function() { return !this.data.selectedId && this.data.selectedOffice == 'president'; },

  allSOSsShown: function() { return !this.data.selectedId && this.data.selectedOffice == 'sos'; },

  getSelectedId: function() { return this.data.selectedId; },

  getSelectedOffice: function() { return this.data.selectedOffice; },

  getInspectedCountry: function() { return this.data.inspectedCountryId; },

  getSelectedCountry: function() { return this.data.selectedCountryId; },

  getVisibleCountry: function() { return this.getInspectedCountry() || this.getSelectedCountry(); },

  hasInspectedCountry: function() { return this.data.inspectedCountryId; },

  getSelectedLocationIds: function() { return this.data.selectedLocationIds; },

  hasSelectedLocation: function() { return this.data.selectedLocationIds.length > 0; },

  getVisibleLocationIds: function() { return (this.hasInspectedCountry()) ? this.hasInspectedCountry() : (this.hasSelectedLocation()) ? this.getSelectedLocationIds() : []; },

  hasVisibleLocation: function() { return this.getInspectedCountry() || this.getSelectedCountry(); },

  isSelectedLocation: function() { return this.getVisibleLocationIds() == this.getSelectedLocationIds(); },

  isAVisibleLocation: function(id) { return DataStore.getVisibleLocationIds().indexOf(id) !== -1; },
  
  getOceanPolygons: function() { return OceansJson.features; },

  getDestinationsByYear: function() { return (this.data.selectedOffice == 'president') ? this.data.presidentialDestinationsByYear : this.data.sosDestinationsByYear; },

  getDestinationDetails: function(ids) { return (!ids) ? [] : ids.map(id => this.getSelectedData().visits.filter(v => v.properties.cartodb_id == parseInt(id))[0]).sort((a,b) => (a.properties.start_date < b.properties.start_date) ? -1 : 1); },

  getPresidentialTerms: function() { return this.getTermsForOffice('p'); },

  getSOSTerms: function() { return this.getTermsForOffice('s'); },

  getTermsForOffice: function(office) {
    return travels
      .filter(officeholder => officeholder.office == office)
      .map((officeholder, i) => {
        officeholder.startAngle = this.getDateAngle(this._constrainedDate(officeholder.took_office));
        officeholder.endAngle = this.getDateAngle(this._constrainedDate(officeholder.left_office));
        return officeholder;
      });
  },

  getDateAngle: function(year) {
    let duration = this.data.lastYear - this.data.firstYear,
      legendAngle = this.data.tau * 0.075,
      nonlegendAngle = this.data.tau - legendAngle;

    return legendAngle/2 + (year - this.data.firstYear) / duration * nonlegendAngle;
  },

  getTermsRingAngles: function() { return [this.data.tau * 0.075, this.data.tau - this.data.tau * 0.075]; },

  dateBeforeSelected: function(date) { return (!this.data.selectedId) ? true : date.substring(0,10) <= this._constrainedDate(this.getOfficeholderData(this.data.selectedId, this.data.selectedOffice).took_office); },

  dateDuringSelected: function(date) { return (!this.data.selectedId) ? false : date > this._constrainedDate(this.getOfficeholderData(this.data.selectedId, this.data.selectedOffice).took_office) && date <= this._constrainedDate(this.getOfficeholderData(this.data.selectedId, this.data.selectedOffice).left_office); },

  dateAfterSelected: function(date) { return (!this.data.selectedId) ? false : date > this._constrainedDate(this.getOfficeholderData(this.data.selectedId, this.data.selectedOffice).left_office);  },

  yearsForSelected: function() {
    if (!this.data.selectedId) return [];
    let years = [];
    for(let year = parseInt(this.getOfficeholderData(this.data.selectedId, this.data.selectedOffice).took_office.substring(0,4)); year <= parseInt(this.getOfficeholderData(this.data.selectedId, this.data.selectedOffice).left_office.substring(0,4)); year++) {
      years.push(year);
    }
    return years;
  },

  monthsForSelected: function() {
    let months = [];
    for (let year = this.yearsForSelected()[0]; year <= this.yearsForSelected()[this.yearsForSelected().length - 1]; year++) {
      for (let monthNum=1; monthNum <= 12; monthNum++) {
        let month = ('0' + monthNum).slice(-2),
          firstDate = year + '-' + month + '-01',
          lastDate = year + '-' + month + '-' + (new Date(2016, monthNum - 1, 0)).getDate();
        if (this.dateDuringSelected(firstDate) || this.dateDuringSelected(lastDate)) {
          months.push(year + '-' + month);
        }
      }
    }
    return months;
  },

  isSelectedYear(year) { return this.yearsForSelected().indexOf(year) !== -1; },

  getDuration: function(id, office) { return (!id) ? 0 : this._dateDiff(...this.getTerm(id, office)); },

  getTerm: function(id, office) { return [this._constrainedDate(this.getOfficeholderData(id,office).took_office), this._constrainedDate(this.getOfficeholderData(id,office).left_office)]; },

  getDestinationsForSelected: function() { return this._parseDestinationsByLocation(); },

  getSimplifiedDestinationsForSelected: function() { return this.getSimplifiedDestinationsForOfficeholder(this.data.selectedId, this.data.selectedOffice); },

  getAllDestinations: function() { 
    let visits=[];
    travels
      .filter(o => o.office == this.data.selectedOffice.substring(0,1))
      .forEach(o => {
        visits = visits.concat(o.visits.map(v => {
          v.properties.pres_sos = o.name;
          return v;
        }));
      });
    return visits;
  },

  getSimplifiedDestinationsForOfficeholder: function(id, office) {
    return (!id) ? this.getAllDestinations() :
      travels
        .filter(officeholder => officeholder.number == id && officeholder.office == office.substring(0,1))[0]
        .visits;
  },

  getNextDestinationIdSelected: function() {
    let destinations = this.getSimplifiedDestinationsForSelected(),
      nextId = destinations.findIndex(destination => destination.properties.cartodb_id == this.data.selectedLocationIds[0]) + 1;
    return (destinations[nextId]) ? destinations[nextId].properties.cartodb_id : null;
  },

  getPreviousDestinationIdSelected: function() {
    let destinations = this.getSimplifiedDestinationsForSelected(),
      previousId = destinations.findIndex(destination => destination.properties.cartodb_id == this.data.selectedLocationIds[0]) - 1;
    return (destinations[previousId]) ? destinations[previousId].properties.cartodb_id : null;
  },

  getRegionsVisited() { return this.getSimplifiedDestinationsForSelected().map(destination => destination.properties.new_region.replace(/ /g,'').toLowerCase()).filter((region, pos, self) => self.indexOf(region) == pos && region !== 'u.s'); },

  getYearsWithAngles() {
    return this.data.years.filter(year => year % 10 == 0).map(year => {
      return {
        year: year,
        startAngle: this.getDateAngle(year),
        endAngle: this.getDateAngle(year+1)
      };
    });
  },

  // getVisitsWithAngles() {
  //   return this.getDestinationDetails(this.getVisibleLocationIds()).map(d=> {
  //     return {        startDate: d.properties.start_date,
  //       angle: d.properties.start_date),
  //       endAngle: this.getDateAngle(d.properties.start_date)
  //     }
  //   });
  // },

  getMonthsSelectedWithAngles() {
    return this.monthsForSelected().map(month => {
      return {
        year: parseInt(month.split('-')[0]),
        month: parseInt(month.split('-')[1]),
        monthName: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][parseInt(month.split('-')[1]) -1],
        startAngle: this.getDateAngle(month + '-01'),
        endAngle: this.getDateAngle(month + '-' + (new Date(2015, parseInt(month.split('-')[1]) - 1, 0)).getDate())
      };
    });
  },

  getMaxDistance() { return this.data.maxDistance; },

  getMaxVisits: function() { return (this.data.selectedOffice == 'president') ? this.data.maxVisitsPresidents : this.data.maxVisits; },

  getOfficeholderData(id, office) { return travels.filter(officeholder => officeholder.number == id && officeholder.office == office.substring(0,1))[0]; },

  getSelectedData() { 
    if (this.data.selectedId) {
      return this.getOfficeholderData(this.data.selectedId, this.data.selectedOffice); 
    }
    else {
      return { visits: this.getAllDestinations() };
    }
  },

  getOfficeholderStartAngle(id, office) { return (!id) ? 0 : this.getDateAngle(this._constrainedDate(this.getOfficeholderData(id, office).took_office)); },

  getOfficeholderEndAngle(id, office) { return (!id) ? 0 : this.getDateAngle(this._constrainedDate(this.getOfficeholderData(id, office).left_office)); },

  getOfficeholderAdjustedStartAngle(id, office) { return (!id) ? 0 :this.getDateAngle(this._constrainedDate(this.getOfficeholderData(id, office).start_date)); },

  getOfficeholderAdjustedEndAngle(id, office) { return (!id) ? 0 : this.getDateAngle(this._constrainedDate(this.getOfficeholderData(id, office).end_date)); },

  getRegionMetadata(slug) { return RegionsMetadata.filter(region => region.slug == slug)[0]; },

  getTimelineRotation: function() { return 360 - (this.getOfficeholderEndAngle(this.getSelectedId(), this.getSelectedOffice()) + this.getOfficeholderStartAngle(this.getSelectedId(), this.getSelectedOffice())) / 2 / Math.PI * 180; }, 

  getTimelineRotationRadians: function() { return Math.PI * 2 - (this.getOfficeholderEndAngle(this.getSelectedId(), this.getSelectedOffice()) + this.getOfficeholderStartAngle(this.getSelectedId(), this.getSelectedOffice())) / 2; }, 

  getVisitsTicks: function() { return (this.data.selectedOffice == 'president') ? [10,20,30,41] : [30,60,91]; },

  visitedLocation: function(id, office) {
    let destinationIds = [];
    if (this.hasVisibleLocation()) {
      var [lat, lng] = this.getDestinationDetails([this.getVisibleLocationIds()[0]])[0].geometry.coordinates;
      destinationIds = this.getSimplifiedDestinationsForOfficeholder(id, office)
        .filter(v => v.geometry.coordinates[0] == lat && v.geometry.coordinates[1] == lng);
    }
    return destinationIds.length > 0;
  },

  getLatLng: function(id) { return this.getDestinationDetails([id])[0].geometry.coordinates; },

  getDiplomaticEvents: function() { return this.data.events; },

  getRegionForCountry: function(country) { 
    let region;
    RegionsMetadata.forEach(d => {
      if (d.countries.includes(country)) {
        region = d.slug;
      }
    });
    return region;
  },

  getCountryData(country) {
    return this.getCountriesData().filter(aCountry => aCountry.country == country)[0];
  },

  getCountriesData: function() {
    let countriesData = [],
      regionOrder = ["westerneurope", "latinamerica", "middleeast", "easterneuropeandcentralasia", "canada", "eastasia", "southasia", "oceania", "africa"];
    Object.keys(this.data.events).forEach(year => {
      this.data.events[year].forEach(event => {
        let i = countriesData.findIndex(d => d.country == event.country);
        if (i == -1) {
          countriesData.push({
            country: event.country,
            region: this.getRegionForCountry(event.country),
            events: [{ 
              year: year, 
              event: event.event, 
              endDate: event.endDate,
              latLng: event.latLng
            }]
          });
        } else {
          countriesData[i].events.push({ year: year, event: event.event, endDate: event.endDate });
        }
      });
    });

    countriesData.map(d => {
      let breakpoints = [];
      d.events.forEach(e => {
        if (e.event == 'Establishment of Legation' || e.event == 'Diplomatic Relations Resumed' ||  e.event == 'Establishment of Embassy') {
          breakpoints.push({year: parseInt(e.year), status: 'active'});
        }
        else if (e.event == 'Diplomatic Relations Interrupted') {
          breakpoints.push({year: parseInt(e.year), status: 'interrupted'});
        }
      });

      let active = false;
      d.activePeriods = [];
      breakpoints.forEach(breakpoint => {
        if (!active && breakpoint.status == 'active') {
          d.activePeriods.push([breakpoint.year, 2017]);
          active = true;
        } else if (active && breakpoint.status == 'interrupted') {
          d.activePeriods[d.activePeriods.length - 1][1] = breakpoint.year;
          active = false;
        }
      });
      return d;
    });
    ;

    return countriesData.sort((a,b) => { 
      if (a.region !== b.region) {
        return regionOrder.indexOf(a.region) - regionOrder.indexOf(b.region); 
      }
      if (a.activePeriods[0] && b.activePeriods[0] && a.activePeriods[0][0] !== b.activePeriods[0][0]) {
        return a.activePeriods[0][0] - b.activePeriods[0][0];
      }
      return 0;
    });
  },

  getVisibleCountryData() {
    let cd = this.getCountriesData();

    if (this.getVisibleCountry()) {
      cd = cd.filter(c => c.country == this.getVisibleCountry());
    }

    return cd;
  },

};

// Mixin EventEmitter functionality
Object.assign(DataStore, EventEmitter.prototype);

// Register callback to handle all updates
DataStore.dispatchToken = AppDispatcher.register((action) => {
  switch (action.type) {
  case AppActionTypes.parseData:
    DataStore.setSelected(action.id, action.office, action.visits, action.lat, action.lng);
    break;
  case AppActionTypes.officeholderSelected:
    DataStore.setSelected(action.id, action.office);
    break;
  case AppActionTypes.visitsSelected:
    DataStore.setSelectedVisits(action.ids);
    break;
  case AppActionTypes.countryInspected:
    DataStore.setInspectingCountry(action.id);
    break;
  case AppActionTypes.countrySelected:
    DataStore.setSelectedCountry(action.id);
    break;
  }
  return true;
});

export default DataStore;