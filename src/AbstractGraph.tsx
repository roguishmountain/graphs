import * as React from 'react';
import * as d3 from 'd3';
import * as d3_scale from 'd3-scale';
import { sortBy, isEmpty } from 'lodash';
import { Observable } from 'rx';

import { retrieve } from './retrieve';

export interface GraphProps {
    height?: number;
    width?: number;
    padding?: number;

    colorBy?: any;
    xValues?: any; //Function
    yValues?: any; //Function;
    labelFunction?: Function;
    colorSpecific?: Function;
    filterreject?: string;
    sample?: number;
    scaleType?: string;
    borderColor?: Function;
    borderSize?: any;
    uris?: string[];
    data?: {}[];
}

export const DefaultProps: GraphProps = {
    height: 500,
    width: 1000,
    padding: 45,
    colorBy: new Function('entry', 'return entry.status'),
    xValues: Object.defineProperty(new Function('entry', 'return entry.id'), "name", {value: "Id"}),
    yValues: Object.defineProperty(new Function('entry', 'return entry.duration'), "name", {value: "Duration"}),
    labelFunction: new Function('entry', ''),
    colorSpecific: new Function('entry', ''),
    filterreject: "",
    sample: 0,
    scaleType: "continuous",
    borderColor: new Function('entry', 'return "black"'),
    borderSize: new Function('entry', 'return "1"'),
    uris: [],
}

export interface GraphState {
    sortedData: {}[];
}

export class AbstractGraph extends React.Component<GraphProps, GraphState> {
    // buffer for data pulled from URIs
    pulledData : {}[] = [];

    // set default props so they don't have to specified in JSX
    static defaultProps = DefaultProps;
    
    constructor(props) {
        super(props);

        // set initial state
        if (isEmpty(props.uris)) {
            this.state = { sortedData: sortBy(props.data, props.xValues) };
        } else {
            this.state = { sortedData: this.pulledData };

            // set up 
            Observable
                .from(props.uris)
                .flatMap(uri => retrieve<any>({ uri, withCredentials: false } as any))
                .bufferWithCount(100)
                .subscribe (
                    e => this.pulledData = this.pulledData.concat(e),
                    console.log,
                    () => {
                        let sortedData = sortBy(this.pulledData, props.xValues);
                        this.setState(Object.assign({}, this.state, {sortedData}))
                    }
                );
        }
    }

    calculateScales() {
        let { height, width, xValues, yValues } = this.props;
        let data = this.state.sortedData;
        let xScale = d3_scale.scaleLinear()
            .domain([d3.min(data, xValues), d3.max(data, xValues)])
            .range([20, width - 100]);
        let yScale = d3_scale.scaleLinear()
            .domain([d3.min(data, yValues), d3.max(data, yValues)])
            .range([height, 20]);

        return {
            xScale, yScale, colorScale: undefined
        };
    }

    render(): JSX.Element {
        throw "render not implemented";
    };
}