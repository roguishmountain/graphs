import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import { Axis } from './Axis';
import { State } from './State';
import { CanvasDraw } from './CanvasDraw';
import { concat, dropRight, flattenDeep, groupBy, isEmpty, isEqual,
         last, merge, reduce, sortBy, split } from 'lodash';

interface Data {
    padding?: number;
    groups?: any[][];
    xScale?: any;
    yScale?: any;
    sortedData?: any[];
    rectPaths?: any[][];
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
            yScale, padding, labelFunction, rectPaths } = props;
        let bandwidth = xScale.bandwidth();
        let ctx = canvas.getContext("2d");
        ctx.lineWidth = 1;
        ctx.fillStyle = "black";

        let rects: any[] = flattenDeep(rectPaths);
        rects.forEach((element, i) => {
            let label = labelFunction(data[i]) || "";
            ctx.fillText(label,
                element.x, element.h);
        })
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
        let rectPaths = this.canvasGroupsToRects(groups, scales, props);
        let canvasPaths = this.rectsToPaths(rectPaths);
        this.state = merge({ groups, sortedData, canvasPaths, rectPaths }, scales);
    }

    componentWillReceiveProps(nextProps) {
        let { data, xValues } = nextProps;
        let sortedData = sortBy(data, xValues);
        let scales = this.calculateScales(nextProps, sortedData);
        let groups: any[][] = this.dataToGroups(sortedData, xValues);
        let rectPaths = this.canvasGroupsToRects(groups, scales, nextProps);
        let canvasPaths = this.rectsToPaths(rectPaths);
        this.setState(merge({ groups, sortedData, canvasPaths, rectPaths }, scales));
    }

    dataToGroups(data, xValues) {
        return reduce(data,
            (output: any[][], cur) => {
                // empty case
                if (isEmpty(output)) return [[cur]];

                // append onto pending
                let pending = last(output);
                let test = (f: Function, x, y) => f(x) !== f(y);

                if (test(xValues, last(pending), cur)) {
                    return concat(output, [[cur]]);
                }
                // append after pending
                return concat(dropRight(output), [pending.concat(cur)]);
            }, []);
    }

    canvasGroupsToRects(groups: any[][], calc, props) {
        let { xScale, yScale, padding } = calc;
        let { xValues, yValues } = props;
        let bandwidth = xScale.bandwidth();

        let result: any = groups.map((g, i) => g.map((d, k) => {
            return { "x": xScale(xValues(d)) + ((bandwidth / g.length) * k) + padding,
                "y": yScale(0), "w": (bandwidth / g.length),
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

    calculateScales(props, data) {
        let { height, width, xValues, yValues } = props;

        let padding = 45;
        let xScale = d3_scale.scaleBand()
            .domain(data.map((d) =>  xValues(d).toString()))
            .rangeRound([20, width])
            .paddingInner(0.1);
        let yScale = d3_scale.scaleLinear()
            .domain([0, d3.max(data, yValues)])
            .range([height, 20]);

        return {
            xScale, yScale, padding
        };
    }

    handleClick(evt) {
        let {xScale, rectPaths, groups } = this.state;
        let x = evt.clientX - this.margin() + window.scrollX;
        let sp = rectPaths[0][0].x;
        let groupingClick = (Math.floor((x - sp) / xScale.step()));
        if (x <= xScale.bandwidth() + rectPaths[groupingClick][0].x) {
            let cluster = groups[Math.floor(x / xScale.step())];
            let bar = Math.floor((x - rectPaths[groupingClick][0].x) /
                (xScale.bandwidth() / cluster.length));
            console.log(cluster[bar], bar);
        }
    }

    render() {
        let { xScale, yScale, groups, padding, canvasPaths, rectPaths } = this.state;
        let { labelFunction, data, xValues, yValues, width,
              height, colorBy, colorSpecific } = this.props;
        return (
            <div style={{ marginBottom: 45, position: "relative",
            height: height, width: width}} onClick={this.handleClick.bind(this)}>
                <CanvasDraw width={width}
                    height={height}
                    paths={canvasPaths}
                    colorBy={colorBy}
                    colorSpecific={colorSpecific}
                    dataOrder={flattenDeep(groups)}>
                </CanvasDraw>
                <DrawGraph width={width} height={height} data={data}
                    xScale={xScale} yScale={yScale} xValues={xValues}
                    yValues={yValues} padding={padding} rectPaths={rectPaths}
                    labelFunction={labelFunction}>
                </DrawGraph>
                <Axis title={xValues.name + " vs. " + yValues.name}
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