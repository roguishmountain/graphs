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

class DrawGraph extends React.Component<any, any> {
    canvas: any;

    componentDidMount() {
        this.drawLabels(this.canvas, this.props);
    }

    componentWillReceiveProps(nextProps) {
        let ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.props.width, this.props.height);
        this.drawLabels(this.canvas, nextProps);
    }

    drawLabels(canvas, props) {
        if (!canvas.getContext) return;

        let { data, xValues, yValues, xScale,
            yScale, padding, labelFunction } = props;
        let ctx = canvas.getContext("2d");
        ctx.lineWidth = 1;
        ctx.fillStyle = "black";

        data.forEach((element) => {
            ctx.fillText(labelFunction(element) || "",
                        xScale(xValues(element)) + padding,
                        yScale(yValues(element)));
        });
    }

    render() {
        let ref = (c) => this.canvas = c;
        let width = this.props.width;
        let height = this.props.height;
        let style = {position: "absolute"};

        return React.createElement
            ('canvas', { ref, width, height, style });
    }
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
        let result: any = groups.map((g, i) => g.map((d, k) => {
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

        console.log("bandwidth", xScale.bandwidth());
        console.log("bandwidth padding", xScale.paddingInner() * xScale.bandwidth() + padding);

        return {
            colorSpecific, xScale, yScale, padding
        };
    }

    handleClick(evt) {
        // let { canvasPaths, xScale, groups } = this.state;
        // let sp = Number(canvasPaths[0][0].replace(/\s*[A-Z]/g, "")
        //     .trim().split(/\s/)[0]);
        // let x = evt.clientX - this.margin() + window.scrollX;
        // if (x >= sp) {
        //     console.log(x);
            // let grouping = Math.floor((x-sp) /
            //     (xScale.bandwidth() + (xScale.bandwidth() * xScale.padding())));
            // console.log(grouping);
            // console.log(canvasPaths[grouping][0], "\n",
            //         canvasPaths[grouping][canvasPaths[grouping].length-1]);
            // let start = canvasPaths[grouping][0].replace(/\s*[A-Z]/g, "")
            //     .trim().split(/\s/);
            // let end = canvasPaths[grouping][canvasPaths[grouping].length-1]
            //     .replace(/\s*[A-Z]/g, "").trim().split(/\s/);
            // console.log(`${x} <= ${Number(end[end.length-2])} && ${x} >= ${Number(start[0])}`);
            // if (x <= Number(end[end.length-2]) && x >= Number(start[0])) {
            //     console.log("in bounds");
            // }
        let { canvasPaths, groups, xScale } = this.state;
        let sp = Number(canvasPaths[0][0].replace(/\s*[A-Z]/g, "")
            .trim().split(/\s/)[0]);
        let x = evt.clientX - this.margin() + window.scrollX;
        console.log(x);
        // let grouping = Math.floor((x) /
        //                     (xScale.bandwidth() + xScale.bandwidth() *
        //                     xScale.padding()));
        // console.log(grouping);
        // console.log(canvasPaths[grouping]);
        // // console.log(groups[Math.floor(x / xScale.bandwidth())]);
        // let start = canvasPaths[grouping][0].replace(/\s*[A-Z]/g, "")
        //     .trim().split(/\s/);
        // let end = canvasPaths[grouping][canvasPaths[grouping].length - 1]
        //     .replace(/\s*[A-Z]/g, "").trim().split(/\s/);
        // console.log(Number(start[0]), "\n", Number(end[end.length - 2]));
        // if (x <= (Number(end[end.length - 2])-sp) && x >= (Number(start[0])-sp)) {
        //         console.log("in bounds");
        // }
    }

    render() {
        let { xScale, yScale, groups, padding, canvasPaths } = this.state;
        let { labelFunction, data, xValues, yValues, width,
              height, colorBy, colorSpecific } = this.props;
        return (
            <div style={{ marginBottom: 45, position: "relative",
            height: height, width: width}} onMouseOver={this.handleClick.bind(this)}>
                <CanvasDraw width={width}
                    height={height}
                    paths={flattenDeep(canvasPaths)}
                    colorBy={colorBy}
                    colorSpecific={colorSpecific}
                    dataOrder={flattenDeep(groups)}>
                </CanvasDraw>
                <DrawGraph width={width} height={height} data={data}
                    xScale={xScale} yScale={yScale} xValues={xValues}
                    yValues={yValues} padding={padding}
                    labelFunction={labelFunction}>
                </DrawGraph>
                    <Axis
                        title={xValues.name + " vs. " + yValues.name}
                        xLabel={xValues.name}
                        yLabel={yValues.name}
                        xScale={xScale}
                        yScale={yScale}
                        padding={padding}
                        width={width}
                        height={height}
                        tickLen={15}>
                    </Axis>
            </div>
        )
    }
}