import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import * as _ from 'lodash';
import { ContinuousAxis } from './ContinuousAxis';

export class LinePlot extends React.Component<any, any> {

    /**
     * Sets up the props
     *
     * @constructor
     */
    constructor(props) {
        super();
    }

    /**
     * Creates a path based on the data
     *
     * @returns
     *      the line of the plotted data
     */
    renderLine() {
        let { xFunc, yFunc, xScale, yScale, padding } = this.calculate();
        let graph = d3_shape.line()
            .x(i => xScale(xFunc(i)) + padding)
            .y(i => yScale(yFunc(i)));

        // data needs to be sorted to draw the path for the line
        let path: any = graph(_.sortBy(this.props.data, (d) => xFunc(d)));
        return (
            <path
                d={path}
                stroke="black"
                strokeWidth="1"
                fill={"none"}>
                </path>
        )
    }

    /**
     * Creates a scatterplot based on the data
     *
     * @returns
     *      the scatterplot of the data
     */
    renderPoints() {
        let { xFunc, yFunc, xScale, yScale, padding, gFunc, cFunc } = this.calculate();
        let { data, scaleType } = this.props;
        let colorScale = undefined;

        // defaults to ordinal
        if (scaleType == "continuous") { //continuous color scale
            colorScale = d3_scale.scaleCool()
                .domain([d3.min(data, gFunc), d3.max(data, gFunc)]);
        }
        else { //ordinal color scale
            colorScale = d3_scale.scaleCategory20()
                .domain(data.map((d, k) => {
                    return gFunc(d);
                }));
        }

        return data.map((d, k) => {
            // if a color is specified for the data point
            if (cFunc(d)) {
                return (
                    <g key={"g" + k}>
                        <title>{this.objectString(d)}</title>
                            <circle key={"c" + k}
                                cx={xScale(xFunc(d)) + padding}
                                cy={yScale(yFunc(d)) }
                                r={5}
                                fill={cFunc(d) }
                                onClick={this.handleClick.bind(this)}
                                onMouseEnter={this.handleMouseEnter.bind(this)}
                                onMouseLeave={this.handleMouseLeave.bind(this, cFunc(d))}>
                                {k}
                            </circle>
                    </g>
                )
            }
            else {
                return (
                    <g key={"g" + k}>
                        <title>{this.objectString(d)}</title>
                            <circle key={"c" + k}
                                cx={xScale(xFunc(d)) + padding}
                                cy={yScale(yFunc(d)) }
                                r={5}
                                fill={colorScale(gFunc(d)) }
                                onClick={this.handleClick.bind(this) }
                                onMouseEnter={this.handleMouseEnter.bind(this)}
                                onMouseLeave={this.handleMouseLeave.bind(this, colorScale(gFunc(d)))}>
                                {k}
                            </circle>
                     </g>
                )
            }
        })
    }

    /**
     * Formatted string for the tooltip
     *
     * @returns
     *      the string to be used for the tooltip
     */
    objectString(d) {
        let str = "";
        for (let key in d) {
            str += key + ": " + d[key] + "\n";
        }
        return str.trim();
    }

    /**
     * Create labels based on the label function
     *
     * @returns
     *      labels for data points
     */
    renderLabels() {
        let { xFunc, yFunc, xScale, yScale, padding, lFunc } = this.calculate();
        return this.props.data.map((d, k) => {
            return (
                <text key={"b" + k}
                    fill={"red"}
                    x={xScale(xFunc(d)) + padding}
                    y={yScale(yFunc(d)) - 2}>
                    {lFunc(d) }
                    </text>
            )
        })
    }

    /**
     * Prints data for element on click
     *
     * @parameter
     *      click event
     */
    handleClick(evt) {
        console.log(this.props.data[evt.target.innerHTML]);
    }

    /**
     * changes color of element on mouse enter
     *
     * @parameter
     *      mouse enter event
     */
    handleMouseEnter(evt) {
        evt.target.setAttribute("fill", "gray");
    }

    /**
     * changes color element on mouse leave
     *
     * @parameter
     *      mouse leave event
     */
    handleMouseLeave(str, evt) {
        evt.target.setAttribute("fill", str);
    }

    /**
     * Calculate x and y function, the x and y scales,
     * and sets the padding
     *
     * @returns
     *      xScale, yScale, xFunc, yFunc, padding, gFunc, lFunc, cFunc
     */
    calculate() {
        let { height, width, data } = this.props;

        let xFunc: any = new Function("entry", "return " + this.props.xFunction);
        let yFunc: any = new Function("entry", "return " + this.props.yFunction);
        let gFunc: any = new Function("entry", "return " + this.props.groupFunction);
        let lFunc: any = new Function("entry", this.props.labelFunction);
        let cFunc: any = new Function("entry", this.props.colorFunction);

        let xScale = d3_scale.scaleLinear()
            .domain([d3.min(data, xFunc), d3.max(data, xFunc)])
            .range([20, width - 100]);
        let yScale = d3_scale.scaleLinear()
            .domain([d3.min(data, yFunc), d3.max(data, yFunc)])
            .range([height, 20]);

        let padding = 45;

        yScale.nice();
        xScale.nice();

        return {
            xScale, yScale, xFunc, yFunc, padding, gFunc, lFunc, cFunc
        };
    }

    /**
     * Renders the virtual DOM for the graph and labels
     *
     * @returns
     *      svg elements for the graph and labels
     */
    render() {

        let { xScale, yScale, padding } = this.calculate();
        let { xFunction, yFunction } = this.props;

        return (
            <div>
                <svg width={this.props.width} height={700}>
                    {this.renderLine() }
                    {this.renderPoints() }
                    {this.renderLabels() }
                    <ContinuousAxis
                        title={xFunction + " vs. " + yFunction}
                        xLabel={xFunction}
                        yLabel={yFunction}
                        xScale={xScale}
                        yScale={yScale}
                        padding={padding}>
                        </ContinuousAxis>
                    </svg>
                </div>
        )
    }
}