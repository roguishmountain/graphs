import * as React from 'react';
import { forEach, reduce, last, first, dropRight, concat,
         uniq, map, range, zip, merge, drop, assign } from 'lodash';
import { Data, Color, Element } from './Data';

export interface SubBarGraphProps {
    data: Data;
    x: (element: Element) => any;
    ys: ((element: Element) => number)[];
    yScale: d3.scale.Linear<number, number>;
    clusterBy: ((data: Data) => any)[];
    colors: Color[];
    top: number;
    left: number;
    height: number;
    width: number;
    clusterPadding: number;
    barPadding?: number;
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

    cluster(): Data[] {
        let clusterBy = first(this.props.clusterBy);
        return reduce<Element, Data[]>(this.props.data, (clusters, element) => {
            let lastCluster = last(clusters);
            if (lastCluster) {
                let clusterX = clusterBy(first(lastCluster));
                if (clusterX === clusterBy(element)) {
                    return concat(dropRight(clusters, 1), [concat(lastCluster, [element])]);
                } else {
                    return concat(clusters, [[element]]);
                }
            } else {
                // first iteration
                return [[element]]
            }
        }, [])
    }

    drawStack = (stackWidth: number) => (stackInfo: any[]) => {
        if (!this.state.canvasRef) return;
        let context2D = this.state.canvasRef.getContext('2d');

        let stackNum: number = stackInfo[0];
        let element: Element = stackInfo[1];

        let left = stackNum * (stackWidth + this.props.barPadding);

        // Reduce with Side Effects, yay!
        reduce(zip<any>(this.props.ys, this.props.colors), (yOffset: number, stackColor) => {
            let y = stackColor[0];
            let color = stackColor[1];

            let yValue = y(element);
            if (yValue === undefined || yValue === 0) {
                return yOffset;
            } else {
                let scaled = this.props.yScale(yValue);
                let top = (this.props.height - yOffset) - scaled;

                context2D.fillStyle = color;
                context2D.fillRect(left, top, stackWidth, scaled);
                return scaled + yOffset;
            }
        }, 0)
    }

    render() {
        if (this.props.clusterBy.length > 0) {
            let clusters = this.cluster();
            let numClusters = clusters.length;
            let width = this.props.width / numClusters - this.props.clusterPadding;
            let clusterBy = drop(this.props.clusterBy, 1);
            let clusterPadding = this.props.clusterPadding / 2;

            let children = map(zip<any>(clusters, range(numClusters)), (clusterInfo, key) => {
                let cluster = clusterInfo[0];
                let clusterNum = clusterInfo[1];

                let left = clusterNum * (width + this.props.clusterPadding) + this.props.left;
                let newProps = assign({}, this.props, {data: cluster, width, left, clusterBy, clusterPadding, key}) as any;

                return <SubBarGraph {...newProps}/>;
            });

            return <div>{children}</div>;
        } else {
            let numStacks = this.props.data.length;
            let stackWidth = (this.props.width - ((numStacks - 1) * this.props.barPadding)) / numStacks;
            
            forEach(zip<any>(range(0, numStacks), this.props.data), this.drawStack(stackWidth));
            return this.state.canvasObj;
        }
    }
}