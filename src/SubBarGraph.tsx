import * as React from 'react';
import { reduce, first, map, range, zip, isFunction } from 'lodash';
import { Data, Color, Element, Cluster } from './Data';

export interface SubBarGraphProps {
    cluster: Cluster;
    x: (element: Element) => any;
    ys: ((element: Element) => number)[];
    yScale: d3.scale.Linear<number, number>;
    colors: Color[];
    top: number;
    left: number;
    height: number;
    width: number;
    clusterPadding: number;
    barPadding?: number;
    stackWidth: number;
}

export interface SubBarGraphState {
    canvasObj: any;
    canvasRef: HTMLCanvasElement;
}

export class SubBarGraph extends React.Component<SubBarGraphProps, SubBarGraphState> {
    static defaultProps = {
        barPadding: 10,
        clusterBy: []
    }

    componentWillReceiveProps() {
        if (!this.state.canvasRef) return;

        let context2D = this.state.canvasRef.getContext('2d');
        context2D.clearRect(0,0,this.props.width,this.props.height);
    }

    constructor(props) {
        super(props);
        let ref = (canvasRef) => this.setState({canvasRef, canvasObj: this.state.canvasObj});
        let { top, left, height, width } = props;
        let style = {position: 'absolute', top, left};
        this.state = {
            canvasRef: undefined,
            canvasObj: <canvas {...{ref, width, height, style}} />
        };
    }

    drawStack(stackInfo: any[]): void {
        if (!this.state.canvasRef) return;
        let context2D = this.state.canvasRef.getContext('2d');

        let element: Element = stackInfo[0];
        let left: number = stackInfo[1];

        // Reduce with Side Effects, yay!
        reduce(zip<any>(this.props.ys, this.props.colors), (yOffset: number, nextStack) => {
            let y = nextStack[0];
            let color = nextStack[1];

            let yValue = y(element);
            if (yValue === undefined || yValue === 0) {
                return yOffset;
            } else {
                let scaled = this.props.yScale(yValue);
                let top = (this.props.height - yOffset) - scaled;

                context2D.fillStyle = isFunction(color) ? color(element) : color;
                context2D.fillRect(left, top, this.props.stackWidth, scaled);
                return scaled + yOffset;
            }
        }, 0)
    }

    drawCluster(cluster: Cluster, xOffset: number, clusterPadding: number): number {
        if (cluster.data === []) {
            console.log('bad format?');
            return -1;
        } else if (first(cluster.data).data === undefined) {
            let barWidth = this.props.stackWidth + this.props.barPadding;
            let drawnBarsOffset = cluster.data.length * barWidth;
            map(zip(cluster.data, range(xOffset, xOffset + drawnBarsOffset, barWidth)), this.drawStack.bind(this));

            return xOffset + drawnBarsOffset + clusterPadding;
        } else {
            return reduce(cluster.data, (acc, c) => this.drawCluster(c, acc, clusterPadding / 2) + clusterPadding, xOffset);
        }
    }

    render() {
        this.drawCluster(this.props.cluster, 0, this.props.clusterPadding);

        return this.state.canvasObj;
    }
}
