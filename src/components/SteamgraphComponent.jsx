// import node modules
import d3 from 'd3';
import * as React from 'react';
import ReactDOM from 'react-dom';

import ReactTransitionGroup from 'react-addons-transition-group';

import DataStore from '../stores/DataStore.js';
import DimensionsStore from '../stores/DimensionsStore.js';

import AreaGraph from './AreaGraphComponent.jsx';
import SelectedTerm from './SelectedTermComponent.jsx';
import YearTick from './YearTickComponent.jsx';
import DestinationsTimeline from './DestinationsTimelineComponent.jsx';
import DestinationsMultiple from './DestinationsTimelineComponent2.jsx';
import TimelineTick from './TimelineTickComponent.jsx';

export default class SteamGraph extends React.Component {

  constructor (props) { 
    super(props); 
    this.state = {
      rotate: DataStore.getTimelineRotation()
    };
  }

  componentWillReceiveProps(nextProps) {
    d3.select(ReactDOM.findDOMNode(this)).select('g')
      .transition()
      .duration(750)
      .attrTween('transform', (d) => (t) => 'translate(' + DimensionsStore.getTimelineWidth() + ',' + DimensionsStore.getTimelineWidth() + ') rotate(' + d3.interpolate(this.state.rotate, DataStore.getTimelineRotation())(t) + ' ' + DimensionsStore.getRadius() + ',' + DimensionsStore.getRadius() + ')' )
      .each('end', () => this.setState({
        rotate: DataStore.getTimelineRotation()
      }));
  }

  render() {
    return (
      <svg
        width={ DimensionsStore.getWidthHeight() }
        height={ DimensionsStore.getWidthHeight() }
      > 
        <g transform={'translate(' + DimensionsStore.getTimelineWidth() + ',' + DimensionsStore.getTimelineWidth() + ') rotate(' + this.state.rotate + ' ' + DimensionsStore.getRadius() + ',' + DimensionsStore.getRadius() + ')'}>

            {/* masks to obscure details */}
            <circle
              cx={DimensionsStore.getRadius()}
              cy={DimensionsStore.getRadius()}
              r={ DimensionsStore.getRadius() + DimensionsStore.getTimelineWidth() / 2}
              strokeWidth={ DimensionsStore.getTimelineWidth() }
              className='timelineMask'
              fill='transparent'
            /> 

          {/* destination points */}

          <ReactTransitionGroup
            component='g' 
            className='destinationsRing' 
            transform={'translate(' + DimensionsStore.getRadius() + ',' + DimensionsStore.getRadius() + ')'}
          >

            { DataStore.getCountriesData().map((country, i) => {
              return (
                <g key={'countryRing' + i}>
                  { country.activePeriods.map((activePeriod, j) => {
                    return (
                      <DestinationsMultiple
                        offset={ i }
                        startAngle={ DataStore.getDateAngle(activePeriod[0]) }
                        endAngle={ DataStore.getDateAngle(activePeriod[1]) }
                        region={ country.region }
                        key={ 'activePeriod' + j }
                        // selected={ DataStore.isAVisibleLocation(destination.properties.cartodb_id) }
                        // unselected={ DataStore.hasVisibleLocation() && !DataStore.isAVisibleLocation(destination.properties.cartodb_id) }
                        // onClick={ this.props.onClick }
                        // onHover={ this.props.onHover }
                        // onMouseLeave={ this.props.onMouseLeave }
                      />
                    );
                  })}
                </g>
              );
            })}
            
          </ReactTransitionGroup> 

        </g>
      </svg>
    );
  }
}