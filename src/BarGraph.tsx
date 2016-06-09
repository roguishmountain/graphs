import * as React from 'react';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import { Axis } from './Axis';
import { YAxis } from './YAxis';
import { CanvasDraw } from './CanvasDraw';
import { State } from './State';
import { AbstractBarGraph } from './AbstractBarGraph';
import { concat, dropRight, flattenDeep, isEmpty, isEqual,
         last, merge, reduce, split } from 'lodash';

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

export class BarGraph extends AbstractBarGraph {

    constructor(props) {
        super(props);
    }

    margin() {
        return parseInt(document.getElementById("body").style.margin);
    }

    canvasGroupsToRects(groups: any[][], scales) {
        let { xScale, yScale } = scales;
        let { xValues, yValues, padding } = this.props;
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

    // TODO: get y
    handleClick(xScale, rectPaths, groups) {
        return evt => {
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
    }

    render() {
        let { sortedData } = this.state;
        let { xValues, yValues, width, height, colorBy, colorSpecific, labelFunction, borderColor, borderSize, padding } = this.props;
        let scales = super.calculateScales();
        let { xScale, yScale, colorScale } = scales;

        let groups: any[][] = super.dataToGroups();
        let rectPaths = this.canvasGroupsToRects(groups, scales);
        let canvasPaths = this.rectsToPaths(rectPaths);

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
                <DrawGraph width={width} height={height} data={sortedData}
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