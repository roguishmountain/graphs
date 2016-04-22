import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import { Axis } from './Axis';
import { YAxis } from './YAxis';
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
            yScale, padding, labelFunction, rectPaths } = props;
        let bandwidth = xScale.bandwidth();
        let ctx = canvas.getContext("2d");
        ctx.lineWidth = 1;
        ctx.font = "12px Arial"
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
        let { data, xValues, colorBy } = nextProps;
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
        let { height, width, xValues, yValues, colorBy } = props;

        let padding = 45;
        let xScale = d3_scale.scaleBand()
            .domain(data.map((d) =>  xValues(d).toString()))
            .rangeRound([20, width])
            .paddingInner(0.1);
        let yScale = d3_scale.scaleLinear()
            .domain([0, d3.max(data, yValues)])
            .range([height, 20]);

        let colorScale = d3_scale.scaleCategory20()
                         .domain(data.map(colorBy));

        return {
            xScale, yScale, colorScale, padding
        };
    }

    handleClick(evt) {
        let {xScale, rectPaths, groups } = this.state;
        let x = evt.clientX - this.margin() + window.scrollX;
        let y = evt.clientY - window.scrollY;
        console.log(y);
        let sp = rectPaths[0][0].x;
        let groupingClick = (Math.floor((x - sp) / xScale.step()));
        if (rectPaths[groupingClick] && x <= xScale.bandwidth() + rectPaths[groupingClick][0].x) {
            let cluster = groups[groupingClick];
            let bar = Math.floor((x - rectPaths[groupingClick][0].x) /
                (xScale.bandwidth() / cluster.length));
            console.log(cluster[bar]);
        }
    }

    render() {
        let { xScale, yScale, groups, padding, canvasPaths, rectPaths,
            colorScale, sortedData } = this.state;
        let { labelFunction, xValues, yValues, width,
              height, colorBy, colorSpecific, borderColor, borderSize } = this.props;
        return (
            <div style={{ marginBottom: 45, position: "relative",
            height: height+200, width: width}} onClick={this.handleClick.bind(this)}>
                <CanvasDraw width={width}
                    height={height}
                    paths={canvasPaths}
                    colorBy={colorBy}
                    colorSpecific={colorSpecific}
                    borderColor={borderColor}
                    borderSize={borderSize}
                    dataOrder={flattenDeep(groups)}
                    padding={padding}
                    colorScale={colorScale}>
                </CanvasDraw>
                <DrawGraph width={width} height={height} data={sortedData}
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
                    tickLen={15}
                    colorScale={colorScale}
                    data={sortedData}
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