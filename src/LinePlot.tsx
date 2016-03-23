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
        super(props);
    }

    /**
     * Creates a path based on the data
     *
     * @returns
     *      the line of the plotted data
     */
    renderLine() {
        let { xValues, yValues, xScale, yScale, padding } = this.calculate();
        let graph = d3_shape.line()
            .x(i => xScale(xValues(i)) + padding)
            .y(i => yScale(yValues(i)));

        // data needs to be sorted to draw the path for the line
        let path: any = graph(_.sortBy(this.props.data, xValues));
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
        let { xValues, yValues, xScale, yScale, padding, colorBy, colorSpecific } = this.calculate();
        let { data, scaleType } = this.props;
        let colorScale = undefined;

        // defaults to ordinal
        if (scaleType == "continuous") { //continuous color scale
            colorScale = d3_scale.scaleCool()
                .domain([d3.min(data, colorBy), d3.max(data, colorBy)]);
        }
        else { //ordinal color scale
            colorScale = d3_scale.scaleCategory20()
                .domain(data.map((d, k) => {
                    return colorBy(d);
                }));
        }

        return data.map((d, k) => {
            let fillColor = colorSpecific(d) || colorScale(colorBy(d));

            return (<g key={"g" + k}>
                <title>{JSON.stringify(d)}</title>
                <circle
                    key={"c" + k}
                    cx={xScale(xValues(d)) + padding}
                    cy={yScale(yValues(d))}
                    r={5}
                    fill={fillColor}
                    onClick={this.handleClick.bind(this)}
                    onMouseEnter={this.handleMouseEnter.bind(this)}
                    onMouseLeave={this.handleMouseLeave.bind(this, fillColor)}>
                    {k}
                </circle>
            </g>);
        });
    }

    /**
     * Create labels based on the label function
     *
     * @returns
     *      labels for data points
     */
    renderLabels() {
        let { xValues, yValues, xScale, yScale, padding, labelFunction } = this.calculate();
        return this.props.data.map((d, k) => {
            return (
                <text key={"b" + k}
                    fill={"red"}
                    x={xScale(xValues(d)) + padding}
                    y={yScale(yValues(d)) - 2}>
                    {labelFunction(d)}
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
     *      xScale, yScale, xFunc, yFunc, padding, colorBy, labelFunction, colorSpecific
     */
    calculate() {
        let { height, width, data } = this.props;

        let xValues: any = new Function("entry", "return " + this.props.xValues);
        let yValues: any = new Function("entry", "return " + this.props.yValues);
        let colorBy: any = new Function("entry", "return " + this.props.colorBy);
        let labelFunction: any = new Function("entry", this.props.labelFunction);
        let colorSpecific: any = new Function("entry", this.props.colorSpecific);

        let xScale = d3_scale.scaleLinear()
            .domain([d3.min(data, xValues), d3.max(data, xValues)])
            .range([20, width - 100]);
        let yScale = d3_scale.scaleLinear()
            .domain([d3.min(data, yValues), d3.max(data, yValues)])
            .range([height, 20]);

        let padding = 45;

        yScale.nice();
        xScale.nice();

        return {
            xScale, yScale, xValues, yValues, padding, colorBy, labelFunction, colorSpecific
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
        let { xValues, yValues } = this.props;

        return (
            <div>
                <svg width={this.props.width} height={700}>
                    {this.renderLine()}
                    {this.renderPoints()}
                    {this.renderLabels()}
                    <ContinuousAxis
                        title={xValues + " vs. " + yValues}
                        xLabel={xValues}
                        yLabel={yValues}
                        xScale={xScale}
                        yScale={yScale}
                        padding={padding}>
                        </ContinuousAxis>
                    </svg>
                </div>
        )
    }
}