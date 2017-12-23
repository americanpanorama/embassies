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
export default class DestinationTimeline extends React.Component {

  constructor (props) {
    super(props);
    this.state = {
      d: DimensionsStore.getDiplomacyArc(this.props.offset, this.props.startAngle, this.props.endAngle)
    };
  }

  componentWillEnter(callback) {
    d3.select(ReactDOM.findDOMNode(this))
      .transition()
      .duration(750)
      .attrTween('d', (d) => (t) => DimensionsStore.getDiplomacyArc(this.props.offset, d3.interpolate(this.props.originAngle, DataStore.getDateAngle(this.props.startAngle))(t), d3.interpolate(this.props.originAngle, DataStore.getDateAngle(this.props.destination.properties.end_date))(t)))
      .each('end', () => {
        this.setState({
          d: DimensionsStore.getDiplomacyArc(this.props.offset, DataStore.getDateAngle(this.props.startAngle), DataStore.getDateAngle(this.props.destination.properties.end_date))
        });
        callback();
      }); 
  }

  componentWillLeave(callback) { callback(); }

  // componentWillReceiveProps(nextProps) { 
  //   this.setState({
  //     d: DimensionsStore.getDiplomacyArc(this.props.offset, DataStore.getDateAngle(this.props.startAngle), DataStore.getDateAngle(this.props.destination.properties.end_date))
  //   });
  // }

  render() {
    const inspectedClass = (this.props.inspectedCountry && this.props.inspectedCountry ==  this.props.country.country) ? ' inspected ' :  (this.props.inspectedCountry && this.props.inspectedCountry !=  this.props.country.country) ? ' notInspected ' : '';

    return (
      <path
        d={ DimensionsStore.getDiplomacyArc(this.props.offset, this.props.startAngle, this.props.endAngle) }
        fillOpacity={ (this.props.selected) ? 1 : DataStore.hasVisibleLocation() ? 0.1 : 0.5 }
        strokeWidth={ (this.props.selected) ? DimensionsStore.getPointRadius() / 4 : 0 }
        className={ 'destination ' + this.props.region + inspectedClass }
        onClick={ this.props.onClick }
        onMouseEnter={ this.props.onHover }
        onMouseLeave={ this.props.onOut }
        id={ this.props.country.country }
        // onMouseLeave={ this.props.onMouseLeave }
        // onClick={ this.props.onClick }
        // id={ this.props.destination.properties.cartodb_id }
      />
    );
  }

}