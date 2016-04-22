import { Component, createElement } from 'react';
import { scaleCategory20 } from 'd3-scale';
import { uniqBy } from 'lodash';

interface Data {
    width: number;
    height: number;
    colorBy: any;
    colorSpecific: Function;
    paths: any[];
    dataOrder: {}[];
    borderColor: any;
    borderSize: any;
    padding: any;
    colorScale: any;
}

export class CanvasDraw extends Component<Data, {}> {
    canvas: any;
    unique: any[];

    componentDidMount() {
        this.draw(this.canvas, this.props);
    }

    componentWillReceiveProps(nextProps: Data) {
        let ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.props.width + this.props.padding, this.props.height);
        this.draw(this.canvas, nextProps);
    }

    draw(canvas, data: Data) {
        if (!canvas.getContext) return;

        let ctx = canvas.getContext("2d");

        data.paths.forEach((element, i) => {
            let p = new Path2D(element);
            ctx.save();
            ctx.fillStyle = data.colorSpecific(data.dataOrder[i]) ||
                data.colorScale(data.colorBy(data.dataOrder[i]));
            ctx.fill(p);
            ctx.lineWidth = data.borderSize(data.dataOrder[i]);
            ctx.strokeStyle = data.borderColor(data.dataOrder[i]);
            ctx.stroke(p);
            ctx.restore();
        });
    }

    render() {
        let ref = (c) => this.canvas = c;
        let width = this.props.width + this.props.padding;
        let height = this.props.height;
        let style = {position: "absolute"};

        return createElement
            ('canvas', { ref, width, height, style });
    }
}