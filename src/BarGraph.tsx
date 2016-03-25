import * as React from 'react';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import { Axis } from './Axis';
import { reduce, isEmpty, last, dropRight, concat } from 'lodash';

export class BarGraph extends React.Component<any, any> {
    dataSet;
    newPath;
    colorOptions;

    /**
     * @constructor
     */
    constructor(props) {
        super(props);
    }

    /**
     * Calculate the extra labels for the graph
     *
     * @returns
     *      virtual DOM for text labels
     */
    renderLabel() {
        let { xValues, yValues, xScale, yScale, padding, labelFunction } = this.calculate();
        return this.props.data.map((d, k) => {
            return (
                <text key={"b" + k}
                    x={xScale(xValues(d)) + padding}
                    y={yScale(yValues(d)) - 2}>
                    {labelFunction(d)}
                    </text>
            )
        })
    }

    /**
     * Calculate the svg path for the graph
     *
     * @returns
     *      virtual DOM for svg path
     */
    createPath(data: any[]) {
        let { xValues, yValues, xScale, yScale, padding, colorBy } = this.calculate();
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
        let prev = undefined;
        const result = reduce(data,
                (output: {"paths": string[], "data": {}[][]}, cur) => {
                // empty case
                if (isEmpty(output)) {
                    prev = cur;
                    return {"paths": [path(cur)], "data": [[cur]]};
                }

                // append onto pending
                let pending: string = last(output["paths"]);
                let pendingData: {} = last(output["data"]);
                let p: string = path(cur);
                let shouldAppend = (prev, curr) => colorBy(prev) !== colorBy(curr);

                if (shouldAppend(prev, cur)) {
                    prev = cur;
                    return {"paths": concat(output["paths"], p), "data": concat(output["data"], [[cur]])};
                }
                // append after pending
                prev = cur;

                return { "paths": concat(dropRight(output["paths"]), [pending.concat(p)]),
                         "data": concat(dropRight(output["data"]), [pendingData, cur]) };
            }, {});

            console.log(result);
        // let colorScale = d3_scale.scaleCategory10()
        //     .domain(data.map((d, k) => {
        //         return colorBy(d).toString();
        //     }))
        //  console.log(colorScale.domain());

        return result["paths"].map((d, k) => {
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
     * Identify data area that was clicked on
     *
     * @parameter
     *      click event
     */
    handleClick(evt) {
        let { xScale, padding } = this.calculate();
        let id = evt.target.innerHTML;
        let arrPath = this.newPath[id].replace(/\s*[A-Z]/g, "")
            .trim().split(/\s/);
        let margin = Number(document.getElementById("body")
            .style.margin.replace(/[a-zA-Z]/g, ""));
        let bar = Math.floor((evt.clientX - arrPath[0] - margin
            + window.scrollX) / (xScale.bandwidth()));
        console.log(this.dataSet[id][bar]);
    }

    /**
     * Calculate x and y function, the x and y scales,
     * and sets the padding
     *
     * @returns
     *      xScale, yScale, xValues, yValues, padding, colorBy, colorSpecific, labelFunction
     */
    calculate() {
        let { height, width, data } = this.props;
        let xValues: any = new Function("entry", "return " + this.props.xValues);
        let yValues: any = new Function("entry", "return " + this.props.yValues);
        let colorBy: any = new Function("entry", "return " + this.props.colorBy);
        let labelFunction: any = new Function("entry", this.props.labelFunction);
        let colorSpecific: any = new Function("entry", this.props.colorSpecific);
        let filter: any = new Function("entry", this.props.filter);
        let reject: any = new Function("entry", this.props.reject);
        let sample: any = this.props.sample;

        let xScale = d3_scale.scaleBand()
            .domain(this.props.data.map((d, k) => {
                return xValues(d).toString();
            }))
            .range([20, width]);

        let yScale = d3_scale.scaleLinear()
            .domain([0, d3.max(data, yValues)])
            .range([height, 20]);
        let padding = 45;

        this.colorOptions = [];
        let match = /return\s"(.*)"\s*/ig;
        let result = undefined;
        do {
            result = match.exec(this.props.colorSpecific);
            if(result != null){
                this.colorOptions = this.colorOptions.concat(result[1]);
            }
        } while(result != null);

        return {
            xScale, yScale, xValues, yValues, padding, colorBy, colorSpecific, labelFunction, reject, filter, sample
        };
    }

    /**
     * Renders the virtual DOM for the graph and labels
     *
     * @returns
     *      svg elements for the graph and labels
     */
    render() {
        let { xScale, yScale, padding } = this.calculate();
        let { xValues, yValues } = this.props;

        return (
            <div>
                <svg width="5000" height="600">
                    {this.createPath(this.props.data)}
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