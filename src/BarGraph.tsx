import * as React from 'react';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import { Axis } from './Axis';
import { concat, dropRight, isEmpty, isEqual, last, reduce } from 'lodash';

interface State {
    groups?: any;
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
    xValues: Function;
    yValues: any;
    labelFunction: Function;
    colorSpecific: Function;
    filter: Function;
    reject: Function;
    sample: number;
    scaleType: any;
}

export class BarGraph extends React.Component<Props, State> {
    dataSet;
    newPath;
    colorOptions;

    /**
     * @constructor
     */
    constructor(props) {
        super(props);
        let s = this.calculate(this.props.data);

        let groups = this.dataToGroups(this.props.data, this.props.colorBy);

        this.state = Object.assign({ groups }, s);
    }

    groupsToPaths(groups: any[][]) {
        let { xScale, yScale, padding } = this.state;
        let { xValues, yValues } = this.props;
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
                let test = (f: Function, x, y) => f(x) === f(y);

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
        let arrPath = this.newPath[id].replace(/\s*[A-Z]/g, "")
            .trim().split(/\s/);
        let margin = Number(document.getElementById("body")
            .style.margin.replace(/[a-zA-Z]/g, ""));
        let bar = Math.floor((evt.clientX - arrPath[0] - margin
            + window.scrollX) / (this.state.xScale.bandwidth()));
        console.log(this.dataSet[id][bar]);
    }

    /**
     * Calculate x and y function, the x and y scales,
     * and sets the padding
     *
     * @returns
     *      xScale, yScale, xValues, yValues, padding, colorBy, colorSpecific, labelFunction
     */
    calculate(props) {
        let { height, width, data, xValues, yValues, colorSpecific } = this.props;

        let xScale = d3_scale.scaleBand()
            .domain(this.props.data.map((d, k) => {
                return xValues(d).toString();
            }))
            .range([20, width]);

        let yScale = d3_scale.scaleLinear()
            .domain([0, d3.max(data, yValues)])
            .range([height, 20]);

        let padding = 45;

        //TODO
        // this.colorOptions = [];
        // let match = /return\s"(.*)"\s*/ig;
        // let result = undefined;
        // do {
        //     result = match.exec(colorSpecific);
        //     if(result != null){
        //         this.colorOptions = this.colorOptions.concat(result[1]);
        //     }
        // } while(result != null);

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
        let paths = this.groupsToPaths(this.state.groups);

        return paths.map((d, k) => {
            return (
                <path key={"b" + k}
                    d={d}
                    fill={"white"}
                    stroke="black"
                    strokeWidth={1}
                    onClick={this.handleClick.bind(this) }>
                    {k}
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