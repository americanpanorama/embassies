// import node modules
import d3 from 'd3';
import * as React from 'react';
import ReactDOM from 'react-dom';

// utils
// TODO: refactor to use same structure as PanoramaDispatcher;
// Having `flux` as a dependency, and two different files, is overkill.
import { AppActions, AppActionTypes } from '../utils/AppActionCreator';
import AppDispatcher from '../utils/AppDispatcher';

import DataStore from '../stores/DataStore.js';
import DimensionsStore from '../stores/DimensionsStore.js';

// main app container
export default class DetailsOnRing extends React.Component {

  render() {
    return (
      <g>
        <circle
          cx={this.props.cx}
          cy={this.props.cy}
          r={4}
          fill='#fff'
        />

        <text
          x = { this.props.x }
          y = { this.props.y }
          fill= '#446'
          textAnchor={ (this.props.year <= 1898) ? 'start' : 'end'}
          fontSize={ DimensionsStore.getTimelineLabelSize() }
          alignmentBaseline='middle'
          //transform={'rotate(' + (this.state.yearData.startAngle/Math.PI * 180 + ((this.state.yearData.startAngle + DataStore.getTimelineRotationRadians()) % (Math.PI * 2) > Math.PI  ? 90 : 270)) + ' ' + DimensionsStore.getTimelineLabelX(this.state.yearData.startAngle) + ' ' + DimensionsStore.getTimelineLabelY(this.state.yearData.startAngle) + ')'}
        >
          { (this.props.year <= 1898) ? this.props.year + ' ' + this.props.event : this.props.event + ' ' + this.props.year  }
        </text>
      </g>
    );
  }

}