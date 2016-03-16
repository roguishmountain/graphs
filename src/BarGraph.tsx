import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import * as _ from 'lodash';
import { Axis } from './axis';

export class BarGraph extends React.Component<any, any> {
    dataSet;
    newPath;
    colorOptions;

    /**
     * @constructor
     */
    constructor(props) {
        super();
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
    renderTopline() {
        let { xFunc, yFunc, xScale, yScale, padding, gFunc, cFunc } = this.calculate();
        let path = "";
        let tempData = [];
        let color = [];
        this.newPath = [];
        this.dataSet = [];
        for (let i = 0; i < this.props.data.length; i++) {
            if (i == 0) {
                if (cFunc(this.props.data[i]) == "undefined" || cFunc(this.props.data[i]) == undefined) {
                    color = color.concat([gFunc(this.props.data[i])]);
                }
                else {
                    color = color.concat([cFunc(this.props.data[i])]);
                }
                path += "M " + (xScale(xFunc(this.props.data[i]))
                    + padding) + " " + yScale(i)
                    + " V " + yScale(yFunc(this.props.data[i]))
                    + " H " + (xScale(xFunc(this.props.data[i])) + xScale.bandwidth() + padding)
                    + " L " + (xScale(xFunc(this.props.data[i])) + xScale.bandwidth() + padding)
                    + " " + yScale(0);
                tempData = tempData.concat(this.props.data[i]);
            }
            else if (i > 0 && gFunc(this.props.data[i]) == gFunc(this.props.data[i - 1])) {
                path += " V " + yScale(yFunc(this.props.data[i]))
                    + " H " + (xScale(xFunc(this.props.data[i])) + xScale.bandwidth() + padding)
                    + " L " + (xScale(xFunc(this.props.data[i])) + xScale.bandwidth() + padding)
                    + " " + yScale(0);
                tempData = tempData.concat(this.props.data[i]);
            }
            else {
                if (cFunc(this.props.data[i]) == "undefined" || cFunc(this.props.data[i]) == undefined) {
                    color = color.concat([gFunc(this.props.data[i])]);
                }
                else {
                    color = color.concat([cFunc(this.props.data[i])]);
                }
                this.dataSet = this.dataSet.concat([tempData]);
                tempData = [];
                tempData = tempData.concat(this.props.data[i]);
                this.newPath = this.newPath.concat(path);
                path = "";
                path += "M " + (xScale(xFunc(this.props.data[i])) + padding) + " " + yScale(0)
                    + " V " + yScale(yFunc(this.props.data[i]))
                    + " H " + (xScale(xFunc(this.props.data[i])) + xScale.bandwidth() + padding)
                    + " L " + (xScale(xFunc(this.props.data[i])) + xScale.bandwidth() + padding)
                    + " " + yScale(0);
            }
        }

        let colorScale = d3_scale.scaleCategory10()
            .domain(color.map((d, k) => {
                return d;
            }));
        color = color.map((d, k) => {
            if (this.colorOptions.indexOf(d) > -1) {
                return d;
            }
            else {
                return colorScale(d);
            }
        });

        this.dataSet = this.dataSet.concat([tempData]);
        this.newPath = this.newPath.concat(path);
        return this.newPath.map((d, k) => {
            return (
                <path key={"b" + k}
                    d={d}
                    fill={color[k]}
                    stroke="black"
                    strokeWidth={1}
                    onClick={this.handleClick.bind(this)}>
                    {k}
                    </path>
            )
        })
    }

    /**
     * Identify data area that was clicked on
     *
     * @parameter
     *      click event
     */
    handleClick(evt) {
        let { xScale, padding } = this.calculate();
        let id = evt.target.innerHTML;
        let arrPath = this.newPath[id].replace(/\s*[A-Z]/g, "")
            .trim().split(/\s/);
        let margin = Number(document.getElementById("body")
            .style.margin.replace(/[a-zA-Z]/g, ""));
        let bar = Math.floor((evt.clientX - arrPath[0] - margin
            + window.scrollX) / (xScale.bandwidth()));
        console.log("data", this.dataSet[id][bar]);
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

        let colorChoices = this.props.colorFunction.split("\n");
        this.colorOptions = [];
        colorChoices = colorChoices.map((d, k) => {
            let splt = d.split(/\s*->\s*/);
            this.colorOptions = this.colorOptions.concat(splt[1]);
            if (splt[0] != "else") {
                return "if(" + this.props.groupFunction + "=='" + splt[0]
                    + "') return '" + splt[1] + "';";
            }
            else {
                return "else return '" + splt[1] + "';";
            }
        });
        let cFunc: any = new Function("entry", colorChoices.join("\n"));
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
            xScale, yScale, xFunc, yFunc, padding, gFunc, cFunc, lFunc
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
                    {this.renderTopline()}
                    {this.renderLabel()}
                    <Axis
                        title={xFunction + " vs. " + yFunction}
                        xLabel={xFunction}
                        yLabel={yFunction}
                        xScale={xScale}
                        yScale={yScale}>
                        </Axis>
                    </svg>
                </div>
        )
    }
}