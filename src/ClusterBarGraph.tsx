import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import { Axis } from './Axis';
import { State } from './State';
import { concat, dropRight, groupBy, isEmpty, isEqual,
         last, merge, reduce, sortBy, split } from 'lodash';

interface Data {
    padding?: number;
    groups?: any[][];
    paths?: string;
    xScale?: any;
    yScale?: any;
}

export class ClusterBarGraph extends React.Component<State, Data> {

    /**
     * @constructor
     */
    constructor(props) {
        super(props);
        let { data } = props;
        let sortedData = sortBy(data, props.xValues);
        let scales = this.calculateScales(props, sortedData);
        let groups: any[][] = this.dataToGroups(sortedData, props.xValues);
        let paths = this.groupsToPaths(groups, scales, props);

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

        let sortedData = sortBy(data, nextProps.xValues);
        let scales = this.calculateScales(nextProps, sortedData);
        let groups: any[][] = this.dataToGroups(sortedData, nextProps.xValues);
        let paths = this.groupsToPaths(groups, scales, nextProps);

        this.setState(merge({ groups, paths, sortedData }, scales));
    }

    dataToGroups(data, xValues) {
        return reduce(data,
            (output: any[][], cur) => {
                // empty case
                if (isEmpty(output)) return [[cur]];

                // append onto pending
                let pending = last(output);
                let prev = last(pending);
                let test = (f: Function, x, y) => f(x) !== f(y);

                if (test(xValues, prev, cur)) {
                    return concat(output, [[cur]]);
                }
                // append after pending
                return concat(dropRight(output), [pending.concat(cur)]);
            }, []);
    }

    groupsToPaths(groups: any[][], calc, props) {
        let { xScale, yScale, padding } = calc;
        let { xValues, yValues } = props;
        let bandwidth = xScale.bandwidth();

        function path(i, length, index): string {
            const V = y => ` V ${y}`;
            const H = x => `H ${x}`;
            const L = (x, y) => `L ${x} ${y}`;
            const M = (x, y) => ` M ${x} ${y}`;
            let result = [
                M(xScale(xValues(i)) + (bandwidth / length * index) + padding,
                    yScale(0)),
                V(yScale(yValues(i))),
                H(xScale(xValues(i)) + (bandwidth / length * (index + 1)) + padding),
                L(xScale(xValues(i)) + (bandwidth / length * (index + 1)) + padding,
                    yScale(0))].join(' ');

            return result;
        }
        return groups.map((g, i) => g.map((d, k) => {
            return path(d, g.length, k);
        }).join(' '));
    }

    renderLine(path) {
        return path.map((d, i) => {
            return (
                <path key={"b" + i}
                    d={d}
                    fill={"white"}
                    stroke="black"
                    strokeWidth={1}
                    onClick={this.handleClick.bind(this)}>
                    {i}
                </path>
            )
        })
    }

    /**
     * Identify data area that was clicked on
     *
     * @parameter
     *      click event
     */
    handleClick(evt) {
        let { groups, xScale, paths } = this.state;
        let id = evt.target.innerHTML;
        let groupsLen = groups[id].length;
        let margin = Number(document.getElementById("body")
            .style.margin.replace(/[a-zA-Z]/g, ""));
        let points = paths[id].replace(/\s*[A-Z]/g, "")
            .trim().split(/\s/);
        let x = evt.clientX - margin + window.scrollX - Number(points[0]);
        let bw = xScale.bandwidth() / groupsLen;
        let bar = Math.floor(x / bw);
        console.log(groups[id][bar]);
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
            .range([20, width])
            .paddingInner(0.25);
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