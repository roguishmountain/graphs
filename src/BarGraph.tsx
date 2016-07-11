import * as React from 'react';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import { assign, reduce, sortBy, take, first, last, concat, dropRight, drop, map, floor} from 'lodash';
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
    clusters: Cluster;
    stackWidth: number;
    width: number;
    canvasRef: HTMLCanvasElement;
    canvasObj: any;
}

export class BarGraph extends React.Component<BarGraphProps, BarGraphState> {
    // Stylings for the canvas
    static AXES_PADDING = 30;
    static TITLE_PADDING = 30;
    static CLUSTER_PADDING = 50;
    static FRAME_PADDING = 10;
    static BAR_PADDING = 5;
    static MIN_BAR_WIDTH = 5;
    static TICK_LENGTH = 5;

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

        // Organize all the data, to make sure our canvas is big enough
        let sortedData = this.props.ordered ?
            this.props.data :
            sortBy(this.props.data, this.props.x);

        let clusters = this.cluster(sortedData, this.props.clusterBy);

        let drawableWidth = (this.props.width - BarGraph.AXES_PADDING) - BarGraph.AXES_PADDING - (2 * BarGraph.FRAME_PADDING);
        let {stackSpace, negSpace} = this.getUsedSpace(clusters, drawableWidth);

        let stackWidth = stackSpace / this.props.data.length;

        let ref = (canvasRef) => this.setState(assign({}, this.state, {canvasRef, canvasObj: this.state.canvasObj}) as any);
        let { width, height } = this.props;
        if (stackWidth < BarGraph.MIN_BAR_WIDTH) {
            width = (this.props.data.length * BarGraph.MIN_BAR_WIDTH) + negSpace;
            stackWidth = BarGraph.MIN_BAR_WIDTH;
        }
        let style = {position: 'absolute'};
        this.state = {
            clusters,
            stackWidth,
            width,
            canvasRef: undefined,
            canvasObj: <canvas {...{ref, width, height, style}} />
        };
    }

    componentWillReceiveProps(nextProps) {
        // Organize all the data, to make sure our canvas is big enough
        let sortedData = this.props.ordered ?
            this.props.data :
            sortBy(this.props.data, this.props.x);

        let clusters = this.cluster(sortedData, this.props.clusterBy);
        let drawableWidth = (this.props.width - BarGraph.AXES_PADDING) - BarGraph.AXES_PADDING - (2 * BarGraph.FRAME_PADDING);

        let {stackSpace, negSpace} = this.getUsedSpace(clusters, drawableWidth);

        let stackWidth = stackSpace / this.props.data.length;

        let ref = (canvasRef) => this.setState(assign({}, this.state, {canvasRef, canvasObj: this.state.canvasObj}) as any);
        let { width, height } = this.props;
        if (stackWidth < BarGraph.MIN_BAR_WIDTH) {
            width = (this.props.data.length * BarGraph.MIN_BAR_WIDTH) + negSpace;
            stackWidth = BarGraph.MIN_BAR_WIDTH;
        }
        let style = {position: 'absolute'};
        this.state = {
            clusters,
            stackWidth,
            width,
            canvasRef: undefined,
            canvasObj: <canvas {...{ref, width, height, style}} />
        };
    }

    bottom() {
        return this.props.height - BarGraph.AXES_PADDING;
    }

    right() {
        return this.state.width - BarGraph.AXES_PADDING;
    }

    drawableWidth() {
        return this.right() - BarGraph.AXES_PADDING - (2 * BarGraph.FRAME_PADDING);
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

    accumulateUsedSpace(cluster: Cluster, width: number, clusterPadding: number, paddingAcc: number): {stackSpace: number, negSpace: number} {
        if (cluster.data === []) {
            return {stackSpace: width, negSpace: paddingAcc};
        } else if (first(cluster.data).data === undefined) {
            // No type inspection :( This should be a Data, not a Cluster[]
            let paddingSpace = (cluster.data.length * BarGraph.BAR_PADDING);
            return {stackSpace: width - paddingSpace, negSpace: paddingAcc + paddingSpace};
        } else {
            let padding = cluster.data.length * clusterPadding;
            return reduce(cluster.data, (acc, c) => {
                let {stackSpace, negSpace} = acc;
                return this.accumulateUsedSpace(c, stackSpace, clusterPadding / 2, negSpace + padding);
            }, {stackSpace: width, negSpace: paddingAcc});
        }
    }

    // get the number of stacks at each level of the cluster
    getUsedSpace(cluster: Cluster, width: number): {stackSpace: number, negSpace: number} {
        let drawingWidth = width - BarGraph.AXES_PADDING - (2*BarGraph.FRAME_PADDING);

        return this.accumulateUsedSpace(cluster, drawingWidth, BarGraph.CLUSTER_PADDING, 0);
    }

    makeYScale(): {yScale: d3.scale.Linear<number, number>, maxY: number} {
        // get the maximum y value by summing up all the numbers returned by each stack function
        let maxY = d3.max(this.props.data, 
            (d: Element) => reduce(this.props.ys, (res, y) => res + y(d) , 0));

        let yScale = d3.scale.linear()
            .domain([0, maxY])
            .range([0, this.bottom() - BarGraph.TITLE_PADDING]);

        return {yScale, maxY};
    }

    drawAxes(maxY: number) {
        if (!this.state.canvasRef) return;

        let context2D = this.state.canvasRef.getContext("2d");
        context2D.strokeStyle = '#000';

        context2D.beginPath();
        context2D.moveTo(BarGraph.AXES_PADDING, BarGraph.TITLE_PADDING);
        context2D.lineTo(BarGraph.AXES_PADDING, this.bottom());
        context2D.moveTo(BarGraph.AXES_PADDING - 1, this.bottom());
        context2D.lineTo(this.right(), this.bottom());
        context2D.closePath();

        context2D.stroke();

        let canvasHeight = this.bottom() - BarGraph.TITLE_PADDING;
        let numTicks = floor(canvasHeight / 70) || 1;
        let tickStartX = BarGraph.AXES_PADDING - floor(BarGraph.TICK_LENGTH / 2);
        context2D.textBaseline = 'middle';
        context2D.textAlign = 'start';
        context2D.font = '10px sans-serif';

        for (var tick = 1; tick <= numTicks; ++tick) {
            let interpolateBy = tick / numTicks;
            let yHeight = (interpolateBy * canvasHeight);
            let yVal = interpolateBy * maxY;
            let tickY = this.bottom() - yHeight;

            let text = floor(yVal) + '';
            let textWidth = context2D.measureText(text).width;
            let textStart = BarGraph.AXES_PADDING - textWidth - 4;
            context2D.fillText(text, textStart, tickY)

            context2D.beginPath();
            context2D.moveTo(tickStartX, tickY);
            context2D.lineTo(tickStartX + BarGraph.TICK_LENGTH, tickY);
            context2D.closePath();

            context2D.stroke();
        }
    }

    drawTitle() {
        if (!this.state.canvasRef) return;

        let context2D = this.state.canvasRef.getContext("2d");
        context2D.strokeStyle = '#000';

        let yNames = map(this.props.ys, y => y.name).join(", ");
        let title = this.props.title || `${this.props.x.name} vs ${yNames}`;

        context2D.textAlign = 'center';
        context2D.textBaseline = 'middle';
        context2D.font = '24px serif';
        context2D.fillText(title, floor(this.props.width / 2), floor(BarGraph.TITLE_PADDING / 2));
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

        let { yScale, maxY } = this.makeYScale();

        // Draw everything in the background
        this.drawTitle();
        this.drawAxes(maxY);

        let topMargin = parseInt(window.getComputedStyle(document.body).marginTop);
        let leftMargin = parseInt(window.getComputedStyle(document.body).marginLeft);

        let top = BarGraph.TITLE_PADDING;
        let left = BarGraph.AXES_PADDING + BarGraph.FRAME_PADDING;
        let height = this.bottom() - BarGraph.TITLE_PADDING - 1;
        let width = this.drawableWidth();

        let props = assign({}, this.props, { cluster: this.state.clusters, colors, yScale, top, left, stackWidth: this.state.stackWidth,
                                            width, height, clusterPadding: BarGraph.CLUSTER_PADDING}) as any;
        return  <div height={this.props.height} width={this.props.width} style={{position: 'relative'}}>
                    {this.state.canvasObj}
                    <SubBarGraph {...props}/>
                </div>;
    }
}
