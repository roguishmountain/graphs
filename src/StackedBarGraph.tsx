import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import * as _ from 'lodash';
import { Axis } from './Axis';

export class StackedBarGraph extends React.Component<any, any> {
    xVals;
    /**
     * @constructor
     */
    constructor(props) {
        super(props);
    }

    /**
     * Calculate the extra labels for the graph
     *
     * @returns
     *      virtual DOM for text labels
     */
    renderLabel() {
        let { xFunc, yFunc, xScale, yScale, padding, lFunc } = this.calculate();
        return this.props.data.map((d, k) => {
            return (
                <text key={"b" + k}
                    x={xScale(xFunc(d)) + padding}
                    y={yScale(yFunc(d)) - 2}>
                    {lFunc(d)}
                    </text>
            )
        })
    }

    /**
     * Calculate the svg path for the graph
     *
     * @returns
     *      virtual DOM for svg path
     */
    renderLine() {
        let { xFunc, yFunc, xScale, yScale, padding, gFunc } = this.calculate();
        let path = "";
        this.xVals = {};
        for (let i = 0; i < this.props.data.length; i++) {
            if (i == 0) {
                path += "M " + (xScale(xFunc(this.props.data[i])) + padding) + " " + yScale(0)
                    + " V " + yScale(yFunc(this.props.data[i]))
                    + " H " + (xScale(xFunc(this.props.data[i])) + xScale.bandwidth() + padding)
                    + " V " + yScale(0);
                if (this.xVals[xFunc(this.props.data[i])]) {
                    this.xVals[xFunc(this.props.data[i])] = this.xVals[xFunc(this.props.data[i])].concat([this.props.data[i]]);
                }
                else {
                    this.xVals[xFunc(this.props.data[i])] = [this.props.data[i]];
                }
            }
            else {
                path += " L " + (xScale(xFunc(this.props.data[i])) + padding) + " " + yScale(0)
                    + " V " + yScale(yFunc(this.props.data[i]))
                    + " H " + (xScale(xFunc(this.props.data[i])) + xScale.bandwidth() + padding)
                    + " V " + yScale(0);
                if (this.xVals[xFunc(this.props.data[i])]) {
                    this.xVals[xFunc(this.props.data[i])] = this.xVals[xFunc(this.props.data[i])].concat([this.props.data[i]]);
                }
                else {
                    this.xVals[xFunc(this.props.data[i])] = [this.props.data[i]];
                }
            }
        }
        return (
            <path key={"b"}
                d={path}
                fill={"white"}
                stroke="black"
                strokeWidth={1}
                onClick={this.handleClick.bind(this)}>
                </path>
        )
    }

    renderBackground() {

        return (
            <canvas id="graph" width="150" height="150"></canvas>
        )
    }

    /**
     * Identify data area that was clicked on
     *
     * @parameter
     *      click event
     */
    handleClick(evt) {
        let { xScale, padding, xFunc, yFunc, yScale } = this.calculate();
        let margin = Number(document.getElementById("body")
            .style.margin.replace(/[a-zA-Z]/g, ""));
        let x = evt.clientX - margin + window.scrollX - xScale(xFunc(this.props.data[0])) - padding;
        let y = evt.clientY;
        let bar = Math.floor(x / xScale.bandwidth());
        let sortedYVal = _.sortBy(this.xVals[xScale.domain()[bar]], (d) => yFunc(d));
        console.log(evt.target.getBoundingClientRect().top);
        console.log(evt.clientY - evt.target.getBoundingClientRect().top + 30 - margin);
        console.log(yScale.invert(evt.clientY - evt.target.getBoundingClientRect().top + 30 - margin));
        console.log(document.getElementsByClassName("header"));
    }

    /**
     * Calculate x and y function, the x and y scales,
     * and sets the padding
     *
     * @returns
     *      x scale, y scale, x function, y function, padding
     */
    calculate() {
        let { height, width, data } = this.props;

        let xFunc: any = new Function("entry", "return " + this.props.xFunction);
        let yFunc: any = new Function("entry", "return " + this.props.yFunction);
        let gFunc: any = new Function("entry", "return " + this.props.groupFunction);
        let lFunc: any = new Function("entry", this.props.labelFunction);

        let xScale = d3_scale.scaleBand()
            .domain(this.props.data.map((d, k) => {
                return xFunc(d).toString();
            }))
            .range([20, width]);

        let yScale = d3_scale.scaleLinear()
            .domain([0, d3.max(data, yFunc)])
            .range([height, 20]);
        let padding = 45;
        return {
            xScale, yScale, xFunc, yFunc, padding, gFunc, lFunc
        };
    }

    /**
     * Renders the virtual DOM for the graph and labels
     *
     * @returns
     *      svg elements for the graph and labels
     */
    render() {
        let { xScale, yScale } = this.calculate();
        let { xFunction, yFunction } = this.props;

        return (
            <div>
                <svg width="5000" height="500">
                    {this.renderLine()}
                    {this.renderLabel()}
                    {this.renderBackground()}
                    <Axis
                        title={xFunction + " vs. " + yFunction}
                        xLabel={xFunction}
                        yLabel={yFunction}
                        xScale={xScale}
                        yScale={yScale}
                        padding={45}>
                        </Axis>
                    </svg>
                </div>
        )
    }
}