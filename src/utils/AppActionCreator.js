import AppDispatcher from './AppDispatcher';

export const AppActionTypes = {

  parseData: 'parseData',
  storeChanged: 'storeChanged',
  officeholderSelected: 'officeholderSelected',
  visitsSelected: 'visitsSelected',
  countryInspected: 'countryInspected',
  windowResized: 'windowResized'

};

export const AppActions = {

  parseData: (id, office, visits, lat, lng) => {
    AppDispatcher.dispatch({
      type: AppActionTypes.parseData,
      id: id,
      office: office,
      visits: visits,
      lat: lat,
      lng: lng
    });
  },

  officeholderSelected: (id, office) => {
    AppDispatcher.dispatch({
      type: AppActionTypes.officeholderSelected,
      id: id,
      office: office
    });
  },

  visitsSelected: (ids) => {
    AppDispatcher.dispatch({
      type: AppActionTypes.visitsSelected,
      ids: ids
    });
  },

  countryInspected: (id) => {
    AppDispatcher.dispatch({
      type: AppActionTypes.countryInspected,
      id: id
    });
  },

  countrySelected: (id) => {
    AppDispatcher.dispatch({
      type: AppActionTypes.countrySelected,
      id: id
    });
  },

  windowResized: () => {
    AppDispatcher.dispatch({
      type: AppActionTypes.windowResized
    });
  }

};
