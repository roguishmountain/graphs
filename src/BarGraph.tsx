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

    handleClick(evt) {
        let { canvasPaths, xScale, groups } = this.state;
        let sp = Number(canvasPaths[0].replace(/\s*[A-Z]/g, "")
            .trim().split(/\s/)[0]);
        let x = evt.clientX - this.margin() + window.scrollX - sp;
        console.log(groups[Math.floor(x / xScale.bandwidth())]);
    }

    render() {
        let { xScale, yScale, padding, groups, canvasPaths } = this.state;
        let { xValues, yValues, width, height, colorBy, colorSpecific,
            data, labelFunction } = this.props;
        return (
            <div style={{ marginBottom: 45, position: "relative",
            height: height }} onClick={this.handleClick.bind(this)}>
                <CanvasDraw width={width + 100}
                    height={height}
                    paths={canvasPaths}
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