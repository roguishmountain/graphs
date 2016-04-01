import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import * as _ from 'lodash';
import { Axis } from './Axis';
import { State } from './State';
import { concat, dropRight, isEmpty, isEqual,
         last, merge, reduce, split } from 'lodash';

interface Data {
    padding?: number;
    groups?: {}[];
    paths?: string;
    xScale?: any;
    yScale?: any;
}

export class StackedBarGraph extends React.Component<State, Data> {

    /**
     * @constructor
     */
    constructor(props) {
        super(props);
        let { data } = props;
        let scales = this.calculateScales(props, data);
        let groups = this.dataToGroups(data, props.xValues);
        let paths = this.dataToPaths(data, scales, props);

        const defaultFn = (x) => undefined;
        this.state = merge({ groups, paths }, scales);
    }

    /**
     * Calculate the extra labels for the graph
     *
     * @returns
     *      virtual DOM for text labels
     */
    renderLabel() {
        let { yScale, xScale, padding } = this.state;
        let { data, xValues, yValues, labelFunction } = this.props;
        return data.map((d, k) => {
            return (
                <text key={"b" + k}
                    x={xScale(xValues(d)) + padding}
                    y={yScale(yValues(d)) - 2}>
                    {labelFunction(d)}
                    </text>
            )
        })
    }

    componentWillReceiveProps(nextProps) {
        let { data } = nextProps;

        let scales = this.calculateScales(nextProps, data);
        let groups = this.dataToGroups(data, nextProps.xValues);
        let paths = this.dataToPaths(data, scales, nextProps);
        const defaultFn = (x) => undefined;

        this.setState(merge({ groups, paths }, scales));
    }

    dataToGroups(data, xValues) {
        return _.groupBy(data, xValues);
    }

    /**
     * Calculate the svg path for the graph
     *
     * @returns
     *      virtual DOM for svg path
     */
    dataToPaths(data, calc, props) {
        let { xScale, yScale, padding } = calc;
        let { xValues, yValues } = props;
        let bandwidth = xScale.bandwidth();

        function path(i): string {
            const V = y => ` V ${y}`;
            const H = x => `H ${x}`;
            const L = (x, y) => `L ${x} ${y}`;
            const M = (x, y) => ` M ${x} ${y}`;
            return [
                M(xScale(xValues(i)) + padding, yScale(0)),
                V(yScale(yValues(i))),
                H(xScale(xValues(i)) + bandwidth + padding),
                L(xScale(xValues(i)) + bandwidth + padding, yScale(0))].join(' ');
        }
        return data.map((g, i) => path(g)).join(' ');
    }

    renderLine(path) {
        return (
            <path key={"b"}
                d={path}
                fill={"white"}
                stroke="black"
                strokeWidth={1}
                onClick={this.handleClick.bind(this) }>
            </path>
        )
    }

    // renderBackground() {

    //     return (
    //         <canvas id="graph" width="150" height="150"></canvas>
    //     )
    // }

    /**
     * Identify data area that was clicked on
     *
     * @parameter
     *      click event
     */
    handleClick(evt) {
        let { groups, xScale, padding, yScale } = this.state;
        let { xValues, data } = this.props;
        let margin = Number(document.getElementById("body")
            .style.margin.replace(/[a-zA-Z]/g, ""));
        let x = evt.clientX - margin + window.scrollX - xScale(xValues(data[0])) - padding;
        let y = evt.clientY;
        let bar = Math.floor(x / xScale.bandwidth());
        console.log(groups[xScale.domain()[bar]]);

        // console.log(evt.target.getBoundingClientRect().top);
        // console.log(evt.clientY - evt.target.getBoundingClientRect().top + 30 - margin);
        // console.log(yScale.invert(evt.clientY - evt.target.getBoundingClientRect().top + 30 - margin));
        // console.log(document.getElementsByClassName("header"));
    }

    /**
     * Calculate x and y function, the x and y scales,
     * and sets the padding
     *
     * @returns
     *      x scale, y scale, x function, y function, padding
     */
    calculateScales(props, data) {
        let { height, width, xValues, yValues, colorSpecific } = props;
        let xScale = d3_scale.scaleBand()
            .domain(data.map((d, k) => {
                return xValues(d).toString();
            }))
            .range([20, width]);
        let yScale = d3_scale.scaleLinear()
            .domain([0, d3.max(data, yValues)])
            .range([height, 20]);
        let padding = 45;

        return {
            xValues, yValues, colorSpecific, xScale, yScale, padding
        };
    }

    /**
     * Renders the virtual DOM for the graph and labels
     *
     * @returns
     *      svg elements for the graph and labels
     */
    render() {
        let { paths, xScale, yScale } = this.state;
        let { xValues, yValues } = this.props;
        return (
            <div>
                <svg width="5000" height="600">
                    {this.renderLine(paths)}
                    {this.renderLabel()}
                    <Axis
                        title={xValues.name + " vs. " + yValues.name}
                        xLabel={xValues}
                        yLabel={yValues}
                        xScale={xScale}
                        yScale={yScale}
                        padding={45}>
                        </Axis>
                    </svg>
                </div>
        )
    }
}