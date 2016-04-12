import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import { Axis } from './Axis';
import { State } from './State';
import { merge, reject, reduce,
         sortBy, split } from 'lodash';

interface Data {
    xScale?: any;
    yScale?: any;
    padding?: number;
}

class DrawGraph extends React.Component<any, any> {
    canvas: any;

    componentDidMount() {
        this.drawLine(this.canvas, this.props);
        this.drawCircles(this.canvas, this.props);
        this.drawLabels(this.canvas, this.props);
    }

    componentWillReceiveProps(nextProps) {
        let ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.props.width, this.props.height);
        this.drawLine(this.canvas, nextProps);
        this.drawCircles(this.canvas, nextProps);
        this.drawLabels(this.canvas, nextProps);
    }

    drawCircles(canvas, props){
        let { data, xScale, yScale, xValues, yValues, padding,
            colorSpecific, colorBy, scaleType } = props;
        let colorScale = undefined;

        // defaults to ordinal
        if (scaleType == "continuous") { //continuous color scale
            colorScale = d3_scale.scaleCool()
                .domain([d3.min(data, colorBy), d3.max(data, colorBy)]);
        }
        else { //ordinal color scale
            colorScale = d3_scale.scaleCategory20()
                .domain(data.map((d, k) => {
                    return colorBy(d);
                }));
        }

        if (!canvas.getContext) return;

        let ctx = canvas.getContext("2d");

        data.forEach((element) => {
            let fillColor = colorSpecific(element) || colorScale(colorBy(element));
            ctx.beginPath();
            ctx.arc(xScale(xValues(element)) + padding,
                    yScale(yValues(element)),
                    5, 0, 2 * Math.PI);
            ctx.fillStyle = fillColor;
            ctx.fill();
        });
    }

    drawLine(canvas, props) {
        let { data, xValues, yValues, xScale, yScale, padding } = props;
        let ctx = canvas.getContext("2d");
        ctx.lineWidth = 1;

        let graph = d3_shape.line()
            .x(i => xScale(xValues(i)) + padding)
            .y(i => yScale(yValues(i)));

        // data needs to be sorted to draw the path for the line
        let path: any = graph(sortBy(data, xValues));
        let p = new Path2D(path);
        ctx.strokeStyle = "black";
        ctx.stroke(p);
    }

    drawLabels(canvas, props) {
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

export class LinePlot extends React.Component<State, Data> {

    constructor(props) {
        super(props);
        let { colorBy, data, filterreject, sample } = props;

        let scales = this.calculate(props, data);
        this.state = scales;
    }

    componentWillReceiveProps(nextProps) {
        let { data } = nextProps;
        let scales = this.calculate(nextProps, data);
        this.setState(scales);
    }

    calculate(props, data) {
        let { height, width, xValues, yValues } = props;
        let xScale = d3_scale.scaleLinear()
            .domain([d3.min(data, xValues), d3.max(data, xValues)])
            .range([20, width - 100]);
        let yScale = d3_scale.scaleLinear()
            .domain([d3.min(data, yValues), d3.max(data, yValues)])
            .range([height, 20]);
        let padding = 45;

        return {
            xScale, yScale, padding
        };
    }

    render() {
        let { xScale, yScale, padding } = this.state;
        let { xValues, yValues, width, height, data,
            colorBy, colorSpecific, scaleType, labelFunction } = this.props;

        return (
            <div style={{ marginBottom: 45, position: "relative",
            height: height, width: width}}>
                <DrawGraph width={width} height={height} data={data}
                    xScale={xScale} yScale={yScale} xValues={xValues}
                    yValues={yValues} padding={padding} colorBy={colorBy}
                    colorSpecific={colorSpecific} scaleType={scaleType}
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