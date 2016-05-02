import { Component, createElement } from 'react';
import { uniqBy } from 'lodash';

interface AxisLines { yLabel: any,
                      xLabel: any,
                      title: any,
                      xScale: any,
                      yScale: any,
                      padding: number
                      width?: number;
                      height?: number
                      tickLen?: number;
                      colorScale?: any;
                      data?: any;
                      colorBy?: any;}

export class Axis extends Component<AxisLines, any> {
    canvas: any;

    componentDidMount() {
        this.drawAxisLines(this.canvas, this.props);
        this.drawXTicks(this.canvas, this.props);
        this.drawLabels(this.canvas, this.props);
        this.drawLegend(this.canvas, this.props);
    }

    componentWillReceiveProps(nextProps) {
        let ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.props.width + this.props.padding, this.props.height + 250);
        this.drawAxisLines(this.canvas, nextProps);
        this.drawXTicks(this.canvas, nextProps);
        this.drawLabels(this.canvas, nextProps);
        this.drawLegend(this.canvas, nextProps);
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
        ctx.textAlign = "center";

        if( typeof xScale.ticks === "function" ) {
            tickMap = xScale.ticks;
        }
        else {
            tickMap = xScale.domain;
        }

        tickMap().forEach((element) => {
            if (typeof xScale.bandwidth === "function") {
                x = xScale(element) + padding + xScale.bandwidth() / 2;
                // text
                ctx.fillText(element,
                    x, yScale.range()[0] + tickLen * 2, xScale.bandwidth());
            }
            else {
                x = xScale(element) + (padding);
                // text
                ctx.fillText(element,
                    x, yScale.range()[0] + tickLen * 2);
            }

            // tick
            this.createLine(ctx, x, yScale.range()[0], x,
                yScale.range()[0] + tickLen);
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

        // y label
        // TODO: fix rotation location
        ctx.save();
        var text = ctx.measureText(yLabel);
        ctx.translate(text.width/2, yScale.range()[0]/2);
        ctx.rotate(-(Math.PI/180)*90);
        ctx.translate(-text.width/2, -yScale.range()[0]/2);

        ctx.fillText(yLabel, yScale.range()[0]/2, 0);

        ctx.translate(xScale.range()[0], yScale.range()[0]/2);
        ctx.rotate(-(Math.PI/180)*90);
        ctx.translate(-xScale.range()[0], -yScale.range()[0]/2);
        var text = ctx.measureText(yLabel);
        ctx.fillText(yLabel, 250, 200);
        ctx.restore();
        // console.log(parseInt(ctx.font));

        // x label
        ctx.fillText(xLabel, (xScale.range()[1])/2,
                     yScale.range()[0] + tickLen * 3);

        // title
        ctx.fillText(title, xScale.range()[1]/2, yScale.range()[1]);
    }

    drawLegend(canvas, props) {
        let { colorScale, colorBy, data, xScale, yScale, tickLen, padding } = props;
        if (!canvas.getContext) return;

        let ctx = canvas.getContext("2d");
        ctx.textAllign = "start";
        let unique = uniqBy(data, colorBy).map(d => colorBy(d))
            .map((d) => {
                return { [d]: colorScale(d) };
            });
        let y = yScale.range()[0] + tickLen * 3;
        unique.forEach((d, i) => {
            for (let key in d) {
                ctx.fillStyle = d[key];
                ctx.fillText(key, (xScale.range()[0]) + padding, y + ((i + 1) * 20));
            }
        })
    }

    render() {
        let ref = (c) => this.canvas = c;
        let width = this.props.width + this.props.padding;
        let height = this.props.height + 200;
        let style = {position: "absolute"};

        return createElement
            ('canvas', { ref, width, height: height + 50, style });
    }
}