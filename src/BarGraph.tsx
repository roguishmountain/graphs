import * as React from 'react';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import { Axis } from './Axis';
import { CanvasDraw } from './Canvas';
import { State } from './State';
import { concat, dropRight, flattenDeep, isEmpty, isEqual,
         last, merge, reduce, split } from 'lodash';

interface Data {
    groups?: {}[][];
    paths?: any[];
    padding?: number;
    xScale?: any;
    yScale?: any;
    canvasPaths?: any[];
}

export class BarGraph extends React.Component<State, Data> {

    constructor(props) {
        super(props);
        let { colorBy, data } = props;

        let scales = this.calculateScales(props, data);
        let groups = this.dataToGroups(data, colorBy);
        let canvasPaths = this.canvasGroupsToPaths(groups, scales, props);

        this.state = merge({ groups, canvasPaths }, scales);
    }

    componentWillReceiveProps(nextProps) {
        let { colorBy, data } = nextProps;

        let scales = this.calculateScales(nextProps, data);
        let groups = this.dataToGroups(data, colorBy);
        let canvasPaths = this.canvasGroupsToPaths(groups, scales, nextProps);

        this.setState(merge({ groups, canvasPaths }, scales));
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

    canvasGroupsToPaths(groups: any[][], calc, props) {
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
        let result: any = groups.map(path);
        return flattenDeep(result);
    }

    dataToGroups(data: any[], colorBy: Function) {
        let result = reduce(data,
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
         return flattenDeep(result);
    }

    margin() {
        return Number(document.getElementById("body")
            .style.margin.replace(/[a-zA-Z]/g, ""));
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

        /**
     * Identify data area that was clicked on
     *
     * @parameter
     *      click event
     */
    handleClick(evt) {
        let { canvasPaths, xScale, groups } = this.state;
        let sp = Number(canvasPaths[0].replace(/\s*[A-Z]/g, "")
            .trim().split(/\s/)[0]);
        let x = evt.clientX - this.margin() + window.scrollX - sp;
        console.log(groups[Math.floor(x / xScale.bandwidth())]);
    }

    /**
     * Renders the virtual DOM for the graph and labels
     *
     * @returns
     *      svg elements for the graph and labels
     */
    render() {
        let { xScale, yScale, padding, groups, canvasPaths } = this.state;
        let { xValues, yValues, width, height, colorBy, colorSpecific } = this.props;
        return (
            <div style={{ marginBottom: 45, position: "relative",
            height: height }} onClick={this.handleClick.bind(this)}>
                <svg width="5000" height="550" style={{ position: "absolute" }}>
                    {this.renderLabel()}
                    <Axis
                        title={xValues.name + " vs. " + yValues.name}
                        xLabel={xValues}
                        yLabel={yValues}
                        xScale={xScale}
                        yScale={yScale}
                        padding={padding}>
                        </Axis>
                    </svg>
                    <CanvasDraw width={width + 100}
                    height={height}
                    paths={canvasPaths}
                    colorBy={colorBy}
                    colorSpecific={colorSpecific}
                    dataOrder={flattenDeep(groups) }>
                </CanvasDraw>
                </div>
        )
    }
}