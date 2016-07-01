import * as React from 'react';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import { assign, reduce, sortBy, take, first, last, concat, dropRight, drop, map } from 'lodash';
import { Element, Color, Data, Cluster } from './Data';
import { SubBarGraph } from './SubBarGraph';

export interface BarGraphProps {
    data: Data;
    x: (element: Element) => any;
    ys: ((element: Element) => number)[];
    clusterBy?: ((data: Data) => any)[];
    title?: string;
    colors?: Color[];
    ordered?: boolean;
    height?: number;
    width?: number;
}

export interface BarGraphState {
    canvasRef: HTMLCanvasElement;
    canvasObj: any;
}

export default class BarGraph extends React.Component<BarGraphProps, BarGraphState> {
    // Stylings for the canvas
    static AXES_PADDING = 30;
    static TITLE_PADDING = 30;
    static CLUSTER_PADDING = 50;
    static FRAME_PADDING = 10;
    static BAR_PADDING = 10;

    bottom() {
        return this.props.height - BarGraph.AXES_PADDING;
    }

    right() {
        return this.props.width - BarGraph.AXES_PADDING;
    }

    cluster(data: Data, clusterFuncs: ((data: Data) => any)[]): Cluster {
        if (clusterFuncs.length === 0 || data.length === 0) {
            return { data }
        } else {
            let clusterBy = first(clusterFuncs);
            let groupedData = reduce<Element, Data[]>(data, (clusters, element) => {
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
            }, []);

            let newClusterFuncs = drop(clusterFuncs, 1);
            let clusters = map(groupedData, (group) => this.cluster(group, newClusterFuncs));
            return { data: clusters }
        }
    }

    decreaseStackWidth(cluster: Cluster, width: number, clusterPadding: number): number {
        if (cluster.data === []) {
            return width;
        } else if (first(cluster.data).data === undefined) {
            // No type inspection :( This should be a Data, not a Cluster[]
            return width - (cluster.data.length * BarGraph.BAR_PADDING);
        } else {
            let padding = cluster.data.length * clusterPadding;
            return reduce(cluster.data, (acc, c) => this.decreaseStackWidth(c, acc, clusterPadding / 2), width - padding);
        }
    }

    // get the number of stacks at each level of the cluster
    getStackWidth(cluster: Cluster, width: number): number {
        let drawingWidth = width - BarGraph.AXES_PADDING - (2*BarGraph.FRAME_PADDING);

        return this.decreaseStackWidth(cluster, drawingWidth, BarGraph.CLUSTER_PADDING);
    }

    // Defaults for Component Creation
    static defaultProps: BarGraphProps = {
        data: [],
        x: undefined,
        ys: [],
        clusterBy: [],
        colors: d3_scale.schemeCategory20b,
        ordered: false,
        height: 400,
        width: 1000
    }

    constructor(props) {
        super(props);
        let ref = (canvasRef) => this.setState({canvasRef, canvasObj: this.state.canvasObj});
        let { width, height } = this.props;
        let style = {position: 'absolute'};
        this.state = {
            canvasRef: undefined,
            canvasObj: <canvas {...{ref, width, height, style}} />
        };
    }

    makeYScale(): d3.scale.Linear<number, number> {
        // get the maximum y value by summing up all the numbers returned by each stack function
        let maxY = d3.max(this.props.data, 
            (d: Element) => reduce(this.props.ys, (res, y) => res + y(d) , 0));

        return d3.scale.linear()
            .domain([0, maxY])
            .range([0, this.bottom() - BarGraph.TITLE_PADDING])
    }

    drawAxes() {
        if (!this.state.canvasRef) return;

        let context2D = this.state.canvasRef.getContext("2d");
        context2D.strokeStyle = '#000';
        let bottom = this.props.height - BarGraph.AXES_PADDING;
        let right = this.props.width - BarGraph.AXES_PADDING;

        context2D.beginPath();
        context2D.moveTo(BarGraph.AXES_PADDING, 0);
        context2D.lineTo(BarGraph.AXES_PADDING, bottom);
        context2D.moveTo(BarGraph.AXES_PADDING - 1, bottom);
        context2D.lineTo(right, bottom);
        context2D.closePath();

        context2D.stroke();
    }

    render() {
        // do some input checking!
        let numColors = this.props.colors.length;
        let numLevels = this.props.ys.length;
        if (numColors < numLevels) {
            throw new Error('There should be at least as many colors as stacks. ' +
                             `There are ${numColors} colors and ${numLevels} stacks.`)
        }

        let colors = take(this.props.colors, numLevels);

        // generate everything shared by all subgraphs -- data should only need to be sorted once
        let sortedData = this.props.ordered ? 
            this.props.data : 
            sortBy(this.props.data, this.props.x);

        let cluster = this.cluster(sortedData, this.props.clusterBy);
        let stackWidth = this.getStackWidth(cluster, this.props.width) / this.props.data.length;

        console.log(stackWidth);

        let yScale = this.makeYScale();

        // Draw everything in the background
        this.drawAxes();

        let topMargin = parseInt(window.getComputedStyle(document.body).marginTop);
        let leftMargin = parseInt(window.getComputedStyle(document.body).marginLeft);

        let top = BarGraph.TITLE_PADDING;
        let left = BarGraph.AXES_PADDING + BarGraph.FRAME_PADDING;
        let height = this.bottom() - BarGraph.TITLE_PADDING - 1;
        let width = this.right() - BarGraph.AXES_PADDING - (2 * BarGraph.FRAME_PADDING);

        let props = assign({}, this.props, {cluster, colors, yScale, top, left, stackWidth,
                                            width, height, clusterPadding: BarGraph.CLUSTER_PADDING}) as any;
        return  <div height={this.props.height} width={this.props.width} style={{position: 'relative'}}>
                    {this.state.canvasObj}
                    <SubBarGraph {...props}/>
                </div>;
    }
}
