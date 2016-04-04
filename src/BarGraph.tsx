import * as React from 'react';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import { Axis } from './Axis';
import { State } from './State';
import { concat, dropRight, isEmpty, isEqual,
         last, merge, reduce, split } from 'lodash';

interface Data {
    groups?: {}[][];
    paths?: any[];
    padding?: number;
    xScale?: any;
    yScale?: any;
}

export class BarGraph extends React.Component<State, Data> {

    /**
     * @constructor
     */
    constructor(props) {
        super(props);
        let { colorBy, data } = props;

        let scales = this.calculateScales(props, data);
        let groups = this.dataToGroups(data, colorBy);
        let paths = this.groupsToPaths(groups, scales, props);

        this.state = merge({ groups, paths }, scales);
    }

    componentWillReceiveProps(nextProps) {
        let { colorBy, data } = nextProps;

        let scales = this.calculateScales(nextProps, data);
        let groups = this.dataToGroups(data, nextProps.colorBy);
        let paths = this.groupsToPaths(groups, scales, nextProps);

        this.setState(merge({ groups, paths }, scales));
    }

    /**
     * Calculate x and y function, the x and y scales,
     * and sets the padding
     *
     * @returns
     *      xScale, yScale, xValues, yValues, padding, colorBy, colorSpecific, labelFunction
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
            xScale, yScale, padding
        };
    }

    groupsToPaths(groups: any[][], calc, props) {
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
        return groups.map((g, i) => g.map(path).join(' '));
    }

    dataToGroups(data: any[], colorBy: Function) {
        return reduce(data,
            (output: {}[][], cur) => {
                // empty case
                if (isEmpty(output)) return [[cur]];

                // append onto pending
                let pending = last(output);
                let prev = last(pending);
                let test = (f: Function, x, y) => f(x) !== f(y);

                if (test(colorBy, prev, cur)) {
                    return concat(output, [[cur]]);
                }
                // append after pending
                return concat(dropRight(output), [pending.concat(cur)]);
            }, []);
    }

    /**
     * Identify data area that was clicked on
     *
     * @parameter
     *      click event
     */
    handleClick(evt) {
        let id = evt.target.innerHTML;
        let arrPath = this.state.paths[id].replace(/\s*[A-Z]/g, "")
            .trim().split(/\s/);
        let margin = Number(document.getElementById("body")
            .style.margin.replace(/[a-zA-Z]/g, ""));
        let bar = Math.floor((evt.clientX - arrPath[0] - margin
            + window.scrollX) / (this.state.xScale.bandwidth()));
        console.log(this.state.groups[id][bar]);
    }

    /**
     * Calculate the extra labels for the graph
     *
     * @returns
     *      virtual DOM for text labels
     */
    renderLabel() {
        let { xScale, yScale, padding } = this.state;
        return this.props.data.map((d, k) => {
            return (
                <text key={"b" + k}
                    x={xScale(this.props.xValues(d)) + padding}
                    y={yScale(this.props.yValues(d)) - 2}>
                    {this.props.labelFunction(d)}
                    </text>
            )
        })
    }

    renderPath() {
        let { groups, paths } = this.state;
        let colorScale = d3_scale.scaleCategory10()
            .domain(groups.map((g) => {
                return this.props.colorBy((g[0]));
            }));

        return paths.map((d, i) => {
            let point = groups[i][0];
            return (
                <path key={"b" + i}
                    d={d}
                    fill={this.props.colorSpecific(point) || colorScale(this.props.colorBy(point))}
                    stroke="black"
                    strokeWidth={1}
                    onClick={this.handleClick.bind(this)}>
                    {i}
                </path>
            )
        })
    }

    /**
     * Renders the virtual DOM for the graph and labels
     *
     * @returns
     *      svg elements for the graph and labels
     */
    render() {
        let { xScale, yScale, padding } = this.state;
        return (
            <div>
                <svg width="5000" height="600">
                    {this.renderPath()}
                    {this.renderLabel()}
                    <Axis
                        title={this.props.xValues.name + " vs. " + this.props.yValues.name}
                        xLabel={this.props.xValues}
                        yLabel={this.props.yValues}
                        xScale={xScale}
                        yScale={yScale}
                        padding={padding}>
                        </Axis>
                    </svg>
                </div>
        )
    }
}