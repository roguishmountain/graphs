import * as React from 'react';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import { Axis } from './Axis';

export class BarGraph extends React.Component<any, any> {
    dataSet;
    newPath;
    colorOptions;

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
        let { xValues, yValues, xScale, yScale, padding, labelFunction } = this.calculate();
        return this.props.data.map((d, k) => {
            return (
                <text key={"b" + k}
                    x={xScale(xValues(d)) + padding}
                    y={yScale(yValues(d)) - 2}>
                    {labelFunction(d)}
                    </text>
            )
        })
    }

    VHLpath(index, xValues, yValues, xScale, yScale, padding) {
        return (" V " + yScale(yValues(this.props.data[index]))
            + " H " + (xScale(xValues(this.props.data[index])) + xScale.bandwidth() + padding)
            + " L " + (xScale(xValues(this.props.data[index])) + xScale.bandwidth() + padding)
            + " " + yScale(0)
        );
    }
    /**
     * Calculate the svg path for the graph
     *
     * @returns
     *      virtual DOM for svg path
     */
    renderTopline() {
        let { xValues, yValues, xScale, yScale, padding, colorBy, colorSpecific } = this.calculate();
        let path = "";
        let tempData = [];
        let color = [];
        this.newPath = [];
        this.dataSet = [];
        for (let i = 0; i < this.props.data.length; i++) {
            let fill = colorSpecific(this.props.data[i]) || colorBy(this.props.data[i]);

            if (i == 0) {
                color = color.concat([fill]);
                path += "M " + (xScale(xValues(this.props.data[i])) + padding) + " " + yScale(i)
                    + this.VHLpath(i, xValues, yValues, xScale, yScale, padding);
                tempData = tempData.concat(this.props.data[i]);
            }
            else if (colorBy(this.props.data[i]) == colorBy(this.props.data[i - 1])) {
                path += this.VHLpath(i, xValues, yValues, xScale, yScale, padding);
                tempData = tempData.concat(this.props.data[i]);
            }
            else {
                color = color.concat([fill]);
                this.dataSet = this.dataSet.concat([tempData]);
                tempData = [];
                tempData = tempData.concat(this.props.data[i]);
                this.newPath = this.newPath.concat(path);
                path = "";
                path += "M " + (xScale(xValues(this.props.data[i])) + padding) + " " + yScale(0)
                    + this.VHLpath(i, xValues, yValues, xScale, yScale, padding);
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
        console.log(this.dataSet[id][bar]);
    }

    /**
     * Calculate x and y function, the x and y scales,
     * and sets the padding
     *
     * @returns
     *      xScale, yScale, xValues, yValues, padding, colorBy, colorSpecific, labelFunction
     */
    calculate() {
        let { height, width, data } = this.props;
        let xValues: any = new Function("entry", "return " + this.props.xValues);
        let yValues: any = new Function("entry", "return " + this.props.yValues);
        let colorBy: any = new Function("entry", "return " + this.props.colorBy);
        let labelFunction: any = new Function("entry", this.props.labelFunction);
        let colorSpecific: any = new Function("entry", this.props.colorSpecific);
        let xScale = d3_scale.scaleBand()
            .domain(this.props.data.map((d, k) => {
                return xValues(d).toString();
            }))
            .range([20, width]);

        let yScale = d3_scale.scaleLinear()
            .domain([0, d3.max(data, yValues)])
            .range([height, 20]);
        let padding = 45;

        this.colorOptions = [];
        let match = /return\s"(.*)"\s*/ig;
        let result = undefined;
        do {
            result = match.exec(this.props.colorSpecific);
            if(result != null){
                this.colorOptions = this.colorOptions.concat(result[1]);
            }
        } while(result != null);

        return {
            xScale, yScale, xValues, yValues, padding, colorBy, colorSpecific, labelFunction
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
                <svg width="5000" height="600">
                    {this.renderTopline()}
                    {this.renderLabel()}
                    <Axis
                        title={xValues + " vs. " + yValues}
                        xLabel={xValues}
                        yLabel={yValues}
                        xScale={xScale}
                        yScale={yScale}
                        padding={padding}>
                        </Axis>
                    </svg>
                </div>
        )
    }
}