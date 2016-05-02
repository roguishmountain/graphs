import * as React from 'react';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import { Axis } from './Axis';
import { YAxis } from './YAxis';
import { CanvasDraw } from './CanvasDraw';
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
    rectPaths?: any[];
    colorScale?: any;
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
        let rectPaths = this.canvasGroupsToRects(groups, scales, props);
        let canvasPaths = this.rectsToPaths(rectPaths);

        this.state = merge({ groups, canvasPaths, rectPaths }, scales);
    }

    componentWillReceiveProps(nextProps) {
        let { colorBy, data } = nextProps;

        let scales = this.calculateScales(nextProps, data);
        let groups = this.dataToGroups(data, colorBy);
        let rectPaths = this.canvasGroupsToRects(groups, scales, nextProps);
        let canvasPaths = this.rectsToPaths(rectPaths);

        this.setState(merge({ groups, canvasPaths, rectPaths }, scales));
    }

    // calculateScales(props, data) {
    //     let { height, width, xValues, yValues, colorBy } = props;

    //     let xScale = d3_scale.scaleBand()
    //         .domain(data.map((d, k) => {
    //             return xValues(d).toString();
    //         }))
    //         .range([20, width]);
    //     let yScale = d3_scale.scaleLinear()
    //         .domain([0, d3.max(data, yValues)])
    //         .range([height, 20]);
    //     let padding = 45;

    //     let colorScale = d3_scale.scaleCategory20()
    //                      .domain(data.map(colorBy));

    //     return {
    //         xScale, yScale, colorScale, padding
    //     };
    // }
    
    calculateScales(props, data) {
        let { height, width, xValues, yValues, colorBy } = props;

        let padding = 45;
        let xScale = d3_scale.scaleBand()
            .domain(data.map((d) =>  xValues(d).toString()))
            .rangeRound([20, width]);
        let yScale = d3_scale.scaleLinear()
            .domain([0, d3.max(data, yValues)])
            .range([height, 20]);

        let colorScale = d3_scale.scaleCategory20()
                         .domain(data.map(colorBy));

        return {
            xScale, yScale, colorScale, padding
        };
    }

    canvasGroupsToRects(groups: any[][], calc, props) {
        let { xScale, yScale, padding } = calc;
        let { xValues, yValues } = props;
        let bandwidth = xScale.bandwidth();

        let result: any = groups.map((g, i) => {
            return { "x": xScale(xValues(g)) + padding,
                "y": yScale(0),
                "w": bandwidth,
                "h": yScale(yValues(g))
            };
        });
        return result;
    }

    rectsToPaths(groups: any[][]) {
        function path(rect): string {
            const V = y => ` V ${y}`;
            const H = x => `H ${x}`;
            const L = (x, y) => `L ${x} ${y}`;
            const M = (x, y) => ` M ${x} ${y}`;
            let result = [
                M(rect.x, rect.y),
                V(rect.h),
                H(rect.x + rect.w),
                L(rect.x + rect.w, rect.y)
            ].join(' ');
            return result;
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
        return parseInt(document.getElementById("body").style.margin);
    }

    handleClick(evt) {
        let { canvasPaths, xScale, groups, rectPaths } = this.state;
        let sp = rectPaths[0].x;
        let x = evt.clientX - this.margin() + window.scrollX - sp;
        console.log(groups[Math.floor(x / xScale.bandwidth())]);
    }

    render() {
        let { xScale, yScale, padding, groups, canvasPaths, colorScale } = this.state;
        let { xValues, yValues, width, height, colorBy, colorSpecific,
            data, labelFunction, borderColor, borderSize } = this.props;
        return (
            <div style={{ marginBottom: 45, position: "relative",
            height: height+200 }} onClick={this.handleClick.bind(this)}>
                <CanvasDraw width={width + 100}
                    height={height}
                    paths={canvasPaths}
                    colorBy={colorBy}
                    colorSpecific={colorSpecific}
                    dataOrder={flattenDeep(groups)}
                    borderColor={borderColor}
                    borderSize={borderSize}
                    padding={padding}
                    colorScale={colorScale}>
                </CanvasDraw>
                <DrawGraph width={width} height={height} data={data}
                    xScale={xScale} yScale={yScale} xValues={xValues}
                    yValues={yValues} padding={padding}
                    labelFunction={labelFunction}>
                </DrawGraph>
                <Axis title={xValues.name + " vs. " + yValues.name}
                    xLabel={xValues.name} yLabel={yValues.name}
                    xScale={xScale} yScale={yScale}
                    padding={padding} width={width}
                    height={height} tickLen={15}
                    colorScale={colorScale}
                    data={data}
                    colorBy={colorBy}>
                </Axis>
                <YAxis xScale={xScale}
                    yScale={yScale}
                    padding={padding}
                    width={width}
                    height={height}
                    tickLen={15}>
                </YAxis>
            </div>
        )
    }
}