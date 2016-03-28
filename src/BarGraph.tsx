import * as React from 'react';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import { Axis } from './Axis';
import { concat, dropRight, isEmpty, isEqual, last, reduce, sampleSize } from 'lodash';

interface State {
    groups?: any;
    data?: any;
    paths?: any;
    xScale?: any;
    yScale?: any;
    sample?: number;
    scaleType?: any;
    padding?: number;
    colorOptions?: any;
}

interface Props {
    height: number;
    width: number;
    colorBy: Function;
    data: any[];
    xValues: any;
    yValues: any;
    labelFunction: Function;
    colorSpecific: Function;
    filter: Function;
    reject: Function;
    sample: number;
    scaleType: any;
}

export class BarGraph extends React.Component<Props, State> {

    /**
     * @constructor
     */
    constructor(props) {
        super(props);
        let data = this.sampleData(this.props.data, this.props.sample);
        let s = this.calculate(this.props);
        let groups = this.dataToGroups(data, this.props.colorBy);
        let paths = this.groupsToPaths(groups, s, this.props);

        this.state = Object.assign(s, { groups, paths, data });
    }

    sampleData(data, sSize) {
        if( sSize > 0 && sSize) {
            return sampleSize(data, sSize);
        }
        else {
            return data;
        }
    }

    componentWillReceiveProps(nextProps) {
        let s = this.calculate(nextProps);
        let data = this.sampleData(nextProps.data, nextProps.sample);
        let groups = this.dataToGroups(data, nextProps.colorBy);
        let paths = this.groupsToPaths(groups, s, nextProps);

        this.setState(Object.assign(s, { groups, paths, data }));
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
            const line = (x) => x.join(" ");
            return line([
                M(xScale(xValues(i)) + padding, yScale(0)),
                V(yScale(yValues(i))),
                H(xScale(xValues(i)) + bandwidth + padding),
                L(xScale(xValues(i)) + bandwidth + padding, yScale(0))]);
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
     * Calculate x and y function, the x and y scales,
     * and sets the padding
     *
     * @returns
     *      xScale, yScale, xValues, yValues, padding, colorBy, colorSpecific, labelFunction
     */
    calculate(props) {
        let { height, width, data, xValues, yValues, colorSpecific } = props;

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
     * Calculate the extra labels for the graph
     *
     * @returns
     *      virtual DOM for text labels
     */
    renderLabel() {
        let { data, labelFunction, xValues, yValues } = this.props;
        return data.map((d, k) => {
            return (
                <text key={"b" + k}
                    x={this.state.xScale(xValues(d)) + this.state.padding}
                    y={this.state.yScale(yValues(d)) - 2}>
                    {this.props.labelFunction(d)}
                    </text>
            )
        })
    }

    renderPath() {
        let colorScale = d3_scale.scaleCategory10()
            .domain(this.state.groups.map((g) => {
                return this.props.colorBy((g[0]));
            }));

        return this.state.paths.map((d, i) => {
            let point = this.state.groups[i][0];
            return (
                <path key={"b" + i}
                    d={d}
                    fill={this.props.colorSpecific(point) || colorScale(this.props.colorBy(point))}
                    stroke="black"
                    strokeWidth={1}
                    onClick={this.handleClick.bind(this) }>
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
        let { xValues, yValues } = this.props;
        return (
            <div>
                <svg width="5000" height="600">
                    {this.renderPath()}
                    {this.renderLabel()}
                    <Axis
                        title={xValues + " vs. " + yValues}
                        xLabel={xValues}
                        yLabel={yValues}
                        xScale={this.state.xScale}
                        yScale={this.state.yScale}
                        padding={this.state.padding}>
                        </Axis>
                    </svg>
                </div>
        )
    }
}