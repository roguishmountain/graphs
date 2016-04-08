import { Component, createElement } from 'react';
import { scaleCategory10 } from 'd3-scale';

interface Data {
    width: number;
    height: number;
    colorBy: any;
    colorSpecific: Function;
    paths: any[];
    dataOrder: {}[];
}

export class CanvasDraw extends Component<Data, {}> {
    canvas: any;

    componentDidMount() {
        this.draw(this.canvas, this.props);
    }

    componentWillReceiveProps(nextProps: Data) {
        let ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.props.width, this.props.height);
        this.draw(this.canvas, nextProps);
    }

    draw(canvas, data: Data) {
        if (!canvas.getContext) return;

        let ctx = canvas.getContext("2d");
        let colorScale = scaleCategory10()
            .domain(data.dataOrder.map(data.colorBy));
        ctx.lineWidth = 2;

        data.paths.forEach((element, i) => {
            var p = new Path2D(element);
            ctx.fillStyle = data.colorSpecific(data.dataOrder[i]) ||
                colorScale(data.colorBy(data.dataOrder[i]));
            ctx.fill(p);
            ctx.strokeStyle = "black";
            ctx.stroke(p);
        });
    }

    handleClick(evt) {
        console.log("clicked");
    }

    render() {
        let ref = (c) => this.canvas = c;
        let width = this.props.width;
        let height = this.props.height;
        let style = {position: "absolute"};
        let click = {onClick: evt=>this.handleClick(evt)}

        return createElement
            ('canvas', { ref, width, height, style, click });
    }
}