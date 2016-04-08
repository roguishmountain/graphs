import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import { Axis } from './Axis';
import { State } from './State';
import { CanvasDraw } from './Canvas';
import { concat, dropRight, flattenDeep, groupBy, isEmpty, isEqual,
         last, merge, reduce, sortBy, split } from 'lodash';

interface Data {
    padding?: number;
    groups?: any[][];
    xScale?: any;
    yScale?: any;
    sortedData?: any[];
    canvasPaths?: any;
}

export class ClusterBarGraph extends React.Component<State, Data> {
    constructor(props) {
        super(props);
        let { data, xValues } = props;
        let sortedData = sortBy(data, xValues);
        let scales = this.calculateScales(props, sortedData);
        let groups: any[][] = this.dataToGroups(sortedData, xValues);
        let canvasPaths = this.canvasGroupsToPaths(groups, scales, props);

        this.state = merge({ groups, sortedData, canvasPaths }, scales);
    }

    componentWillReceiveProps(nextProps) {
        let { data, xValues } = nextProps;
        let sortedData = sortBy(data, xValues);
        let scales = this.calculateScales(nextProps, sortedData);
        let groups: any[][] = this.dataToGroups(sortedData, xValues);
        let canvasPaths = this.canvasGroupsToPaths(groups, scales, nextProps);

        this.setState(merge({ groups, sortedData, canvasPaths }, scales));
    }

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
                M(xScale(xValues(i)) + (bandwidth / length * index) + padding,
                    yScale(0)),
                V(yScale(yValues(i))),
                H(xScale(xValues(i)) + (bandwidth / length * (index + 1)) + padding),
                L(xScale(xValues(i)) + (bandwidth / length * (index + 1)) + padding,
                    yScale(0))].join(' ');

            return result;
        }
        let result: any =  groups.map((g, i) => g.map((d, k) => {
            return path(d, g.length, k);
        }));
        return result;
    }

    margin() {
        return Number(document.getElementById("body")
            .style.margin.replace(/[a-zA-Z]/g, ""));
    }

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

    handleClick(evt) {
        let { canvasPaths, xScale, groups } = this.state;
        let sp = canvasPaths[0][0].replace(/\s*[A-Z]/g, "")
            .trim().split(/\s/)[0];
        let x = evt.clientX - this.margin() + window.scrollX;
        let barPadding = xScale.padding() * xScale.bandwidth();
        let groupingClick = Math.floor((x - sp) /
            (barPadding + xScale.bandwidth()));
        let start = canvasPaths[groupingClick][0];
        start = start.replace(/\s*[A-Z]/g, "")
            .trim().split(/\s/)[0];
        let end = canvasPaths[groupingClick][canvasPaths[groupingClick].length - 1];
        end = end.replace(/\s*[A-Z]/g, "")
            .trim().split(/\s/)
        end = end[end.length - 2]
        if (x >= start && x <= end) {
            let bar = Math.floor((x - start) / (xScale.bandwidth() / groups[groupingClick].length));
            console.log(groups[groupingClick][bar]);
        }
    }

    render() {
        let { xScale, yScale, groups, padding, canvasPaths } = this.state;
        let { xValues, yValues, width, height, colorBy, colorSpecific } = this.props;
        return (
            <div style={{ marginBottom: 45, position: "relative",
            height: height, width: width}} onClick={this.handleClick.bind(this)}>
            <svg width={width} height={height+50}
                 style={{ position: "absolute" }}>
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
                <CanvasDraw width={width}
                    height={height}
                    paths={flattenDeep(canvasPaths)}
                    colorBy={colorBy}
                    colorSpecific={colorSpecific}
                    dataOrder={flattenDeep(groups)}>
                </CanvasDraw>
            </div>
        )
    }
}