import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import { Axis } from './Axis';
import { State } from './State';
import { CanvasDraw } from './Canvas';
import { concat, dropRight, flattenDeep, groupBy, isEmpty, isEqual,
         last, merge, reduce, reverse, sortBy, split } from 'lodash';

interface Data {
    padding?: number;
    groups?: any;
    paths?: string;
    xScale?: any;
    yScale?: any;
    canvasPaths?: any;
    sortedData?: any;
}

export class StackedBarGraph extends React.Component<State, Data> {

    constructor(props) {
        super(props);
        let { data, xValues, yValues } = props;
        let sortedData = sortBy(data, xValues);
        let scales = this.calculateScales(props, sortedData);
        let groups: any[][] = this.dataToGroups(sortedData, xValues, yValues);
        let canvasPaths = this.canvasGroupsToPaths(groups, scales, props);

        this.state = merge({ sortedData, groups, canvasPaths }, scales);
    }

    /**
     * Calculate the extra labels for the graph
     *
     * @returns
     *      virtual DOM for text labels
     */
    renderLabel() {
        let { yScale, xScale, padding, sortedData } = this.state;
        let { xValues, yValues, labelFunction } = this.props;
        return sortedData.map((d, k) => {
            return (
                <text key={"b" + k}
                    x={xScale(xValues(d)) + padding}
                    y={yScale(yValues(d)) - 2}>
                    {labelFunction(d)}
                    </text>
            )
        })
    }

    dataToGroups(data, xValues, yValues) {
        let result = reduce(data,
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

            return result.map((d, k) => {
                return reverse(sortBy(d, yValues));
            });
    }

    componentWillReceiveProps(nextProps) {
        let { data, xValues, yValues } = nextProps;

        let sortedData = sortBy(data, xValues);
        let scales = this.calculateScales(nextProps, sortedData);
        let groups: any[][] = this.dataToGroups(sortedData, xValues,  yValues);
        let canvasPaths = this.canvasGroupsToPaths(groups, scales, nextProps);

        this.state = merge({ sortedData, groups, canvasPaths }, scales);
    }

    canvasGroupsToPaths(groups: any[][], calc, props) {
        let { xScale, yScale, padding } = calc;
        let { xValues, yValues } = props;
        let bandwidth = xScale.bandwidth();

        function path(i, length, index): string {
            const V = y => ` V ${y}`;
            const H = x => `H ${x}`;
            const L = (x, y) => `L ${x} ${y}`;
            const M = (x, y) => ` M ${x} ${y}`;
            let result = [
                M(xScale(xValues(i)) + padding, yScale(0)),
                V(yScale(yValues(i))),
                H(xScale(xValues(i)) + bandwidth + padding),
                L(xScale(xValues(i)) + bandwidth + padding,
                    yScale(0))].join(' ');

            return result;
        }
        let result: any =  groups.map((g, i) => g.map((d, k) => {
            return path(d, g.length, k);
        }));
        return flattenDeep(result);
    }

    margin() {
        return Number(document.getElementById("body")
            .style.margin.replace(/[a-zA-Z]/g, ""));
    }

    /**
     * Identify data area that was clicked on
     *
     * @parameter
     *      click event
     */
    handleClick(evt) {
        let { canvasPaths, groups, xScale } = this.state;
        let sp = Number(canvasPaths[0].replace(/\s*[A-Z]/g, "")
            .trim().split(/\s/)[0]);
        let x = evt.clientX - this.margin() + window.scrollX - sp;
        let groupingClick = Math.floor(x / xScale.bandwidth());
        console.log(groupingClick);
        console.log(groups[Math.floor(x / xScale.bandwidth())]);
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
        let { paths, xScale, yScale, canvasPaths, groups } = this.state;
        let { xValues, yValues, width, height, colorBy, colorSpecific } = this.props;
        return (
            <div style={{ marginBottom: 45, position: "relative",
            height: height}} onClick={this.handleClick.bind(this)}>
                <svg width="5000" height="550" style={{ position: "absolute" }}
                 onClick={this.handleClick.bind(this)}>
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
                    <CanvasDraw width={width + 100}
                    height={height}
                    paths={canvasPaths}
                    colorBy={colorBy}
                    colorSpecific={colorSpecific}
                    dataOrder={flattenDeep(groups)}>
                </CanvasDraw>
                </div>
        )
    }
}