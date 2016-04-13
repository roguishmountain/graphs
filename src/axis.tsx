import { Component, createElement } from 'react';

interface AxisLines { yLabel: any,
                      xLabel: any,
                      title: any,
                      xScale: any,
                      yScale: any,
                      padding: number
                      width?: number;
                      height?: number
                      tickLen?: number;}

export class Axis extends Component<AxisLines, any> {
    canvas: any;

    componentDidMount() {
        this.drawAxisLines(this.canvas, this.props);
        this.drawXTicks(this.canvas, this.props);
        this.drawYTicks(this.canvas, this.props);
        this.drawLabels(this.canvas, this.props);
    }

    componentWillReceiveProps(nextProps) {
        let ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.props.width, this.props.height + 50);
        this.drawAxisLines(this.canvas, nextProps);
        this.drawXTicks(this.canvas, nextProps);
        this.drawYTicks(this.canvas, nextProps);
        this.drawLabels(this.canvas, nextProps);
    }

    drawAxisLines(canvas, props) {
        if (!canvas.getContext) return;

        let { data, xValues, yValues, xScale,
            yScale, padding, labelFunction } = props;
        let ctx = canvas.getContext("2d");
        ctx.lineWidth = 1;
        ctx.fillStyle = "black";

        this.createLine(ctx, xScale(xScale.domain()[0]) + padding,  yScale.range()[0],
                xScale.range()[1] + padding, yScale.range()[0]);
        this.createLine(ctx, xScale(xScale.domain()[0]) + padding,  yScale.range()[0],
                xScale(xScale.domain()[0]) + padding, yScale.range()[1]);
    }

    createLine(ctx, x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.stroke();
    }

    drawXTicks(canvas, props) {
        if (!canvas.getContext) return;

        let { xScale, yScale, padding, tickLen } = props;
        let ctx = canvas.getContext("2d");
        let x = undefined;
        let tickMap = undefined;
        ctx.lineWidth = 1;
        ctx.fillStyle = "black";


        if( typeof xScale.ticks === "function" ) {
            tickMap = xScale.ticks;
        }
        else {
            tickMap = xScale.domain;
        }

        tickMap().forEach((element) => {
            if (typeof xScale.bandwidth === "function") {
                x = xScale(element) + padding + xScale.bandwidth() / 2;
            }
            else {
                x = xScale(element) + (padding);
            }

            // tick
            this.createLine(ctx, x, yScale.range()[0], x,
                           yScale.range()[0] + tickLen);

            // text
            ctx.fillText(element,
                         x, yScale.range()[0] + tickLen * 2);
        });
    }

    drawYTicks(canvas, props) {
        if (!canvas.getContext) return;

        let { xScale, yScale, padding, tickLen } = props;
        let ctx = canvas.getContext("2d");
        ctx.lineWidth = 1;
        ctx.fillStyle = "black";

        yScale.ticks().forEach((element) => {
            // let x = (padding) + 20;
            let x = xScale(xScale.domain()[0]) + padding;
            let y = yScale(element);

            // tick
            this.createLine(ctx, x, y, x - tickLen, y);

            // text
            ctx.fillText(element,
                         x - tickLen * 2, y);
        });
    }

    drawLabels(canvas, props) {
        if (!canvas.getContext) return;

        let { xScale, xLabel, yLabel, title,
            yScale, tickLen, padding } = props;
        let ctx = canvas.getContext("2d");
        ctx.lineWidth = 1;
        ctx.font = "16px serif";
        ctx.fillStyle = "black";

        ctx.fillText(xLabel,
            (xScale.range()[1]) / 2,
            yScale.range()[0] + tickLen * 3);

        // TODO: fix rotation location
        ctx.save();
        ctx.translate(padding, yScale.range()[0] / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = "center";
        ctx.fillText(yLabel, padding, yScale.range()[0] / 2);
        ctx.restore();

        ctx.fillText(title,
            (xScale.range()[1]) / 2,
            yScale.range()[1]);
    }

    render() {
        let ref = (c) => this.canvas = c;
        let width = this.props.width;
        let height = this.props.height;
        let style = {position: "absolute"};

        return createElement
            ('canvas', { ref, width, height: height + 50, style });
    }
}