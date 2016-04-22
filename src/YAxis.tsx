import { Component, createElement } from 'react';

interface AxisLines { xScale: any,
                      yScale: any,
                      padding: number
                      width?: number;
                      height?: number
                      tickLen?: number;}

export class YAxis extends Component<AxisLines, any> {
    canvas: any;

    componentDidMount() {
        this.drawAxisLines(this.canvas, this.props);
        this.drawYTicks(this.canvas, this.props);
    }

    componentWillReceiveProps(nextProps) {
        let ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.props.width, this.props.height + 50);
        this.drawAxisLines(this.canvas, nextProps);
        this.drawYTicks(this.canvas, nextProps);
    }

    drawAxisLines(canvas, props) {
        if (!canvas.getContext) return;

        let { xScale, yScale, padding } = props;
        let ctx = canvas.getContext("2d");
        ctx.lineWidth = 1;
        ctx.fillStyle = "black";

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

    drawYTicks(canvas, props) {
        if (!canvas.getContext) return;

        let { xScale, yScale, padding, tickLen } = props;
        let ctx = canvas.getContext("2d");
        ctx.lineWidth = 1;
        ctx.fillStyle = "black";

        yScale.ticks().forEach((element) => {
            let x = xScale(xScale.domain()[0]) + padding;
            let y = yScale(element);

            // tick
            this.createLine(ctx, x, y, x - tickLen, y);

            // text
            ctx.fillText(element,
                         x - tickLen * 2, y);
        });
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