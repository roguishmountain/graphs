import * as React from 'react';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import { Axis } from './Axis';
import { YAxis } from './YAxis';
import { CanvasDraw } from './CanvasDraw';
import { concat, dropRight, flattenDeep, isEmpty, isEqual,
         last, merge, reduce, split, sortBy } from 'lodash';
import { Element, Color, Data } from './Data';
import { SubBarGraph } from './SubBarGraph';

export interface BarGraphProps {
    data: Data;
    x: (element: Element) => any;
    ys: ((element: Element) => number)[];
    clusterBy?: ((data: Data) => any)[];
    colors?: Color[];
    ordered?: boolean;
    height?: number;
    width?: number;
}

export interface BarGraphState {
}

export class BarGraph extends React.Component<BarGraphProps, BarGraphState> {
    static defaultColor = '#ffffff';

    static defaultProps: BarGraphProps = {
        data: [],
        x: undefined,
        ys: [],
        clusterBy: [],
        colors: [BarGraph.defaultColor],
        ordered: false,
        height: 400,
        width: 1000
    }

    constructor(props) {
        super(props);
        this.state = {};
    }

    makeScale(): d3.scale.Linear<number, number> {
        // get the maximum y value by summing up all the numbers returned by each stack function
        let maxY = d3.max(this.props.data, 
            (d: Element) => reduce(this.props.ys, (res, y) => res + y(d) , 0));

        return d3.scale.linear().domain([0, maxY]).rangeRound([0, this.props.height]);
    }

    render() {
        // do some input checking!
        let numColors = this.props.colors.length;
        let numStacks = this.props.ys.length;
        if (numColors < numStacks) {
            throw new Error(`There should be at least as many colors as stacks. There are ${numColors} colors and ${numStacks} stacks.`)
        }

        // generate everything shared by all subgraphs
        let sortedData = this.props.ordered ? 
            this.props.data : 
            sortBy(this.props.data, this.props.x);
        let yScale = this.makeScale();

        let props = merge({}, this.props, { data: sortedData, yScale });
        return <SubBarGraph {...props} />;
    }
}