// import node modules
import d3 from 'd3';
import * as React from 'react';
import ReactDOM from 'react-dom';
import ReactTransitionGroup from 'react-addons-transition-group';

import Term from './TermComponent.jsx';
import YearTick from './YearTickComponent.jsx';

import DataStore from '../stores/DataStore.js';
import DimensionsStore from '../stores/DimensionsStore.js';

// main app container
export default class Timeline extends React.Component {

  constructor (props) { 
    super(props); 
  }

  componentWillReceiveProps(nextProps) {
    // d3.select(ReactDOM.findDOMNode(this)).select('g')
    //   .transition()
    //   .duration(750)
    //   .attrTween('transform', (d) => (t) => 'translate(' + DimensionsStore.getTimelineWidth() + ',' + DimensionsStore.getTimelineWidth() + ') rotate(' + d3.interpolate(this.state.rotate, DataStore.getTimelineRotation())(t) + ' ' + DimensionsStore.getRadius() + ',' + DimensionsStore.getRadius() + ')' )
    //   .each('end', () => this.setState({
    //     rotate: DataStore.getTimelineRotation()
    //   }));
  }

  render() {
    return (
      <svg
        width={ DimensionsStore.getWidthHeight() }
        height={ DimensionsStore.getWidthHeight() }
      > 
        <g transform={'translate(' + DimensionsStore.getTimelineWidth() + ',' + DimensionsStore.getTimelineWidth() + ')'}>
          { DataStore.getYearsWithAngles().map((yearData) => {
            return (
                <YearTick
                  yearData={ yearData }
                  label= { (yearData.year % 10 == 0) ? yearData.year : '' }
                  key={ 'year' + yearData.year }
                />
            );
          }) }
        </g>
      </svg>
    );
  }

}