import * as React from 'react';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import { Axis } from './Axis';
import { concat, dropRight, filter, reject, isEmpty, isEqual,
         last, reduce, sampleSize, split } from 'lodash';
import * as _ from 'lodash';

interface State {
    groups?: any;
    data?: any;
    paths?: any;
    xScale?: any;
    yScale?: any;
    sample?: number;
    scaleType?: any;
    padding?: number;
    colorBy?: Function;
    xValues?: any;
    yValues?: any;
    labelFunction?: Function;
    colorSpecific?: Function;
    filterreject?: any;
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
    filterreject: any;
    sample: number;
    scaleType: any;
}

export class BarGraph extends React.Component<Props, State> {

    /**
     * @constructor
     */
    constructor(props) {
        super(props);
        let data = this.filterRejectData(this.props.data, this.props.filterreject);
        data = this.sampleData(data, this.props.sample);
        let s = this.calculate(this.props, data);
        let groups = this.dataToGroups(data, this.props.colorBy);
        let paths = this.groupsToPaths(groups, s, this.props);
        let { sample, scaleType, colorBy, xValues,
              yValues, labelFunction, colorSpecific, filterreject } = this.props;

        this.state = Object.assign(s, { groups, paths, data,
                     sample, scaleType, colorBy, xValues,
                     yValues, labelFunction, colorSpecific, filterreject });
    }

    sampleData(data, sSize) {
        if(sSize > 0 && sSize) {
            return sampleSize(data, sSize);
        }
        else {
            return data;
        }
    }

    componentWillReceiveProps(nextProps) {
        let data = this.filterRejectData(nextProps.data, nextProps.filterreject);
        data = this.sampleData(data, nextProps.sample);
        let s = this.calculate(nextProps, data);
        let groups = this.dataToGroups(data, nextProps.colorBy);
        let paths = this.groupsToPaths(groups, s, nextProps);

        let { sample, scaleType, colorBy, xValues,
              yValues, labelFunction, colorSpecific, filterreject } = nextProps;

        this.setState(Object.assign(s, { groups, paths, data,
                      sample, scaleType, colorBy, xValues,
                      yValues, labelFunction, colorSpecific, filterreject }));
    }

    /**
     * Calculate x and y function, the x and y scales,
     * and sets the padding
     *
     * @returns
     *      xScale, yScale, xValues, yValues, padding, colorBy, colorSpecific, labelFunction
     */
    calculate(props, data) {
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

    filterRejectData(data, filterReject) {
        if (filterReject) {
            return reduce(split(filterReject, /\n/), (output, cur) => {
                let func = new Function("data", cur);
                return func(output);
            }, data);
        }
        else {
            return data;
        }
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
        let { data, labelFunction, xValues, yValues,
              xScale, yScale, padding } = this.state;
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

    renderPath() {
        let { groups, colorBy, colorSpecific, paths } = this.state;
        let colorScale = d3_scale.scaleCategory10()
            .domain(groups.map((g) => {
                return colorBy((g[0]));
            }));

        return paths.map((d, i) => {
            let point = groups[i][0];
            return (
                <path key={"b" + i}
                    d={d}
                    fill={colorSpecific(point) || colorScale(colorBy(point))}
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
        let { xValues, yValues, xScale, yScale, padding } = this.state;
        return (
            <div>
                <svg width="5000" height="600">
                    {this.renderPath()}
                    {this.renderLabel()}
                    <Axis
                        title={xValues + " vs. " + yValues}
                        xLabel={xValues}
                        yLabel={yValues}
                        xScale={xScale}
                        yScale={yScale}
                        padding={padding}>
                        </Axis>
                    </svg>
                </div>
        )
    }
}