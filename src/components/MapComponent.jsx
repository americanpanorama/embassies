// import node modules
import d3 from 'd3';
import * as React from 'react';
import ReactDOM from 'react-dom';

import ReactTransitionGroup from 'react-addons-transition-group';

import DataStore from '../stores/DataStore.js';
import DimensionsStore from '../stores/DimensionsStore.js';

// utils
// TODO: refactor to use same structure as PanoramaDispatcher;
// Having `flux` as a dependency, and two different files, is overkill.
import { AppActions, AppActionTypes } from '../utils/AppActionCreator';
import AppDispatcher from '../utils/AppDispatcher';

import Regions from '../../data/regions.json';


// main app container
export default class Map extends React.Component {

  constructor (props) {
    super(props);
  }

  render() {
    let tau = 2 * Math.PI,
      DC = [-77.0365, 38.8977];

    var projection = d3.geo.azimuthalEquidistant()
      .scale(DimensionsStore.getRadius() * .318)
      .rotate(DC.map(latlng => latlng * -1))
      .clipAngle(180 - 1e-3)
      .translate([DimensionsStore.getRadius(),DimensionsStore.getRadius()])
      .precision(.1);

    var path = d3.geo.path()
      .projection(projection);

    var eventTypes = [];
    Object.keys(DataStore.getDiplomaticEvents()).forEach(year => {
      DataStore.getDiplomaticEvents()[year].forEach(event => {
        if (!eventTypes.includes(event.event)) {
          eventTypes.push(event.event);
        }
      });
    });

    // var countries = [];
    // Object.keys(DataStore.getDiplomaticEvents()).forEach(year => {
    //   DataStore.getDiplomaticEvents()[year].forEach(event => {
    //     if (!countries.includes(event.country)) {
    //       countries.push(event.country);
    //     }
    //   });
    // });
    // console.log(countries);

    // Object.keys(DataStore.getDiplomaticEvents()).forEach(year => {
    //   DataStore.getDiplomaticEvents()[year].forEach(event => {
    //     let point = projection([event.latLng[1], event.latLng[0]]);
    //     Regions.features.forEach(region => {
    //       let polygon = path(region.geometry);
    //       //console.log(polygon);
    //     });
    //   });
    // });

    return (
        <svg
          width={ DimensionsStore.getWidthHeight() }
          height={ DimensionsStore.getWidthHeight() }
        > 
          <g transform={'translate(' + DimensionsStore.getTimelineWidth() + ',' + DimensionsStore.getTimelineWidth() + ')' }>
            { DataStore.getOceanPolygons().map((polygon,i) => {
              return (
                <path
                  key={ 'country' + i }
                  d={ path(polygon.geometry) }
                  strokeWidth={ 0.2 }
                  fillOpacity={0.5}
                  className='ocean'
                />
              );
            })}



            {/* map labels */}

            <circle
              cx={ DimensionsStore.getRadius() }
              cy={ DimensionsStore.getRadius() }
              r={ DimensionsStore.getPointRadius() * 2/3 }
              fill='#eee'
              fillOpacity={1}
            />

            <text
              x={ DimensionsStore.getRadius() * 1.02 }
              y={ DimensionsStore.getRadius() }
              fill='#eee'
              fillOpacity={0.7}
              fontSize={ DimensionsStore.getRegionLabelSize() }
              alignmentBaseline='hanging'

            >
              Washington DC
            </text>

            <g>
              { DataStore.getRegionsVisited().map(slug => {
                return (
                  <text
                    x={ projection(DataStore.getRegionMetadata(slug).latlng)[0] }
                    y={ projection(DataStore.getRegionMetadata(slug).latlng)[1] }
                    fontSize={ DimensionsStore.getRegionLabelSize() }
                    textAnchor={ DataStore.getRegionMetadata(slug).textAnchor }
                    alignmentBaseline={ DataStore.getRegionMetadata(slug).alignmentBaseline }
                    className={ slug }
                    key={ 'label' + slug }
                  >
                    { DataStore.getRegionMetadata(slug).name }
                  </text>
                );
              })} 
            </g>


            { DataStore.getVisibleCountryData().map((c, i) => 
              <g key={ 'eventsFor' + c.country } >
                { c.events.map((event, j) => {
                  if (event.latLng && event.latLng[0]) {
                    return (
                      <circle
                        cx={ projection([event.latLng[1], event.latLng[0]])[0] }
                        cy={ projection([event.latLng[1], event.latLng[0]])[1] }
                        r={3}
                        fillOpacity={ 1 }
                        className={ DataStore.getRegionForCountry(c.country) }
                        id={ event.country }
                        onMouseEnter={ this.props.onHover }
                        key={ 'eventsFor' + event.country + j + j }
                      />
                    );
                  }
                })}
              </g>
            )}
        </g>
      </svg>
    );
  }

}