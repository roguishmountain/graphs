import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';

import { AbstractBarGraph } from './AbstractBarGraph'
import { Axis } from './Axis';
import { YAxis } from './YAxis';
import { CanvasDraw } from './CanvasDraw';
import { concat, dropRight, flattenDeep, isEmpty, last, reduce } from 'lodash';

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

export class ClusterBarGraph extends AbstractBarGraph {
    constructor(props) {
        super(props);
    }

    dataToGroups() {
        let data = this.state.sortedData;
        let xValues = this.props.xValues;
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

    canvasGroupsToRects(groups: any[][], scales) {
        let { xScale, yScale } = scales;
        let { xValues, yValues, padding } = this.props;
        let bandwidth = xScale.bandwidth();

        let result: any = groups.map((g, i) => g.map((d, k) => {
            return { "x": xScale(xValues(d)) + ((bandwidth / g.length) * k) + padding,
                "y": yScale(0), "w": (bandwidth / g.length),
                "h": yScale(yValues(d))
            };
        }));
        return result;
    }

    margin() {
        return parseInt(document.getElementById("body").style.margin);
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
        let scales = super.calculateScales();
        let { xScale, yScale, colorScale } = scales;
        let { labelFunction, xValues, yValues, width,
              height, colorBy, colorSpecific, borderColor, borderSize, padding } = this.props;

        let groups: any[][] = this.dataToGroups();
        let rectPaths = this.canvasGroupsToRects(groups, scales);
        let canvasPaths = this.rectsToPaths(rectPaths);

        return (
            <div style={{ marginBottom: 45, position: "relative",
            height: height+200, width: width}} onClick={this.handleClick(xScale, rectPaths, groups).bind(this)}>
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