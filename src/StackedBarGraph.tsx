import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { scaleBand, scaleLinear, scaleCategory20 } from 'd3-scale';
import { max } from 'd3';
import { Axis } from './Axis';
import { YAxis } from './YAxis';
import { AbstractBarGraph } from './AbstractBarGraph';
import { CanvasDraw } from './CanvasDraw';
import { concat, dropRight, flattenDeep, groupBy, isEmpty, isEqual,
         last, merge, reduce, reverse, sortBy, split } from 'lodash';

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

export class StackedBarGraph extends AbstractBarGraph {

    constructor(props) {
        super(props);
    }

    dataToGroups() {
        let { xValues, yValues } = this.props;
        let data = this.state.sortedData;
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

    canvasGroupsToRects(groups: any[][], scales) {
        let { xScale, yScale } = scales;
        let { xValues, yValues, padding } = this.props;
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

    margin() {
        return parseInt(document.getElementById("body").style.margin);
    }

    handleClick(canvasPaths, groups, xScale) {
        return evt => {
            let sp = Number(canvasPaths[0].replace(/\s*[A-Z]/g, "")
                .trim().split(/\s/)[0]);
            let x = evt.clientX - this.margin() + window.scrollX - sp;
            let groupingClick = Math.floor(x / xScale.bandwidth());
            console.log(groups[Math.floor(x / xScale.bandwidth())]);
        }
    }

    calculateScales() {
        let { height, width, xValues, yValues, colorBy } = this.props;
        let data = this.state.sortedData;

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
           xScale, yScale, colorScale
        };
    }

    render() {
        let scales = this.calculateScales();
        let { xScale, yScale, colorScale } = scales;
        let data = this.state.sortedData;
        let { xValues, yValues, width, height, colorBy, colorSpecific, padding, labelFunction, borderColor, borderSize } = this.props;

        let groups: any[][] = this.dataToGroups();
        let rectPaths = this.canvasGroupsToRects(groups, scales);
        let canvasPaths = this.rectsToPaths(rectPaths);

        return (
            <div style={{ marginBottom: 45, position: "relative",
            height: height+200}} onClick={this.handleClick(canvasPaths, groups, xScale).bind(this)}>
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