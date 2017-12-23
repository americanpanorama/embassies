// import node modules
import * as React from 'react';
import ReactDOM from 'react-dom';

import DataStore from '../stores/DataStore.js';
import DimensionsStore from '../stores/DimensionsStore.js';

// main app container
export default class Details extends React.Component {

  constructor (props) { super(props); }

  render() {
    return (
      <div 
        className='details'
        
        //key={ 'visits' + DataStore.getVisibleLocationIds().join('-') }
      >
        <div className='events' style= { DimensionsStore.getDetailsStyle() }>
          <div
            className='inner'
            style= { DimensionsStore.getDetailsInnerStyle() }
          >
            <h2>{this.props.country.country}</h2>
            <ul>
            { this.props.country.events.map((event, i) => 
              <li key={ 'detail' + this.props.country.country + i }>{event.year + ' - ' + event.event}</li>
            )}
            </ul>
          </div>
        </div>
      </div>
    );
  }

}