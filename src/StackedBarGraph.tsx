import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { scaleBand, scaleLinear, scaleCategory20 } from 'd3-scale';
import { max } from 'd3';
import { Axis } from './Axis';
import { YAxis } from './YAxis';
import { State } from './State';
import { CanvasDraw } from './CanvasDraw';
import { concat, dropRight, flattenDeep, groupBy, isEmpty, isEqual,
         last, merge, reduce, reverse, sortBy, split } from 'lodash';

interface Data {
    padding?: number;
    groups?: any;
    paths?: string;
    xScale?: any;
    yScale?: any;
    canvasPaths?: any;
    rectPaths?: any[];
    sortedData?: any;
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

        ctx.textAlign = "center";
        data.forEach((element) => {
            ctx.fillText(labelFunction(element) || "",
                        xScale(xValues(element)) + padding + xScale.bandwidth() / 2,
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

export class StackedBarGraph extends React.Component<State, Data> {

    constructor(props) {
        super(props);
        let { data, xValues, yValues } = props;
        let sortedData = sortBy(data, xValues);
        let scales = this.calculateScales(props, sortedData);
        let groups: any[][] = this.dataToGroups(sortedData, xValues, yValues);
        let rectPaths = this.canvasGroupsToRects(groups, scales, props);
        let canvasPaths = this.rectsToPaths(rectPaths);
        this.state = merge({ sortedData, groups, canvasPaths, rectPaths }, scales);
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
        let rectPaths = this.canvasGroupsToRects(groups, scales, nextProps);
        let canvasPaths = this.rectsToPaths(rectPaths);
        this.state = merge({ sortedData, groups, canvasPaths, rectPaths }, scales);
    }

    canvasGroupsToRects(groups: any[][], calc, props) {
        let { xScale, yScale, padding } = calc;
        let { xValues, yValues } = props;
        let bandwidth = xScale.bandwidth();

        let result: any = groups.map((g, i) => g.map((d, k) => {
            return {"x": xScale(xValues(d)) + padding,
                "y": yScale(0),
                "w": (bandwidth),
                "h": yScale(yValues(d))
            };
        }));
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

        let result: any = groups.map((g, i) => g.map((d, k) => {
            return path(d);
        }));

        return flattenDeep(result);
    }

    margin() {
        return parseInt(document.getElementById("body").style.margin);
    }

    handleClick(evt) {
        let { canvasPaths, groups, xScale } = this.state;
        let sp = Number(canvasPaths[0].replace(/\s*[A-Z]/g, "")
            .trim().split(/\s/)[0]);
        let x = evt.clientX - this.margin() + window.scrollX - sp;
        let groupingClick = Math.floor(x / xScale.bandwidth());
        console.log(groups[Math.floor(x / xScale.bandwidth())]);
    }

    calculateScales(props, data) {
        let { height, width, xValues, yValues, colorBy } = props;
        let xScale = scaleBand()
            .domain(data.map((d, k) => {
                return xValues(d).toString();
            }))
            .range([20, width]);
        let yScale = scaleLinear()
            .domain([0, max(data, yValues)])
            .range([height, 20]);
        let padding = 45;

        let colorScale = scaleCategory20()
                         .domain(data.map(colorBy));

        return {
           xScale, yScale, padding, colorScale
        };
    }

    render() {
        let { paths, xScale, yScale, canvasPaths, groups, padding, colorScale } = this.state;
        let { xValues, yValues, width, height, colorBy,
              colorSpecific, data, labelFunction, borderColor, borderSize } = this.props;
        return (
            <div style={{ marginBottom: 45, position: "relative",
            height: height}} onClick={this.handleClick.bind(this)}>
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
                </div>
        )
    }
}