import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';

interface AxisLines { yLabel: any,
                      xLabel: any,
                      title: any,
                      xScale: any,
                      yScale: any }

export class ContinuousAxis extends React.Component<AxisLines, any> {
    padding: number;
    tickLen: number;

    /**
     * Sets up the props, default padding and tick length
     *
     * @constructor
     */
    constructor(props){
        super();
        let { xScale, yScale } = props;

        this.padding = 45;
        this.tickLen = 15;
    }


    /**
     * Calculate the length of the x and y axis
     * using the maximum scaled values
     *
     * @returns
     *      virtual DOM for two lines
     */
    renderAxis() {
        // finds the range that the axis will span
        let sWidth = 1;
        // padding is to allow room for axis labels and tick marks
        return (
            <g>
                <line
                x1={this.props.xScale.range()[0] + (this.padding)}
                y1={this.props.yScale.range()[0]}
                x2={this.props.xScale.range()[1] + (this.padding)}
                y2={this.props.yScale.range()[0]}
                strokeWidth={sWidth}
                stroke="black" />

                <line
                x1={(this.padding) + this.props.xScale.range()[0]}
                y1={this.props.xScale.range()[0]}
                x2={(this.padding) + this.props.xScale.range()[0]}
                y2={this.props.yScale.range()[0]}
                strokeWidth={sWidth}
                stroke="black" />
            </g>
        )
    }

    /**
     * Creates the labels and title for the axis and graph
     *
     *
     * @returns
     *      virtual DOM for three text elements
     *      x axis label, y axis label, and title
     */
    renderLabels() {
        let xMax2 = this.props.xScale.range()[1] / 2;
        // since y = 0 is at top of screen
        // the min y value would be down the screen
        let labelLenY = 20;

        //transform for y axis label
        let transformY = "rotate(-90, " + labelLenY + ","
            + (this.props.yScale.range()[0])/2 + ")";

        // padding is to allow room for axis labels and tick marks
        // scaling 0 because 0 != 0 after it's scaled
        return (
            <g>
                <text
                x={(this.padding) + this.props.xScale(0) + xMax2}
                y={this.props.yScale.range()[0] + this.tickLen * 3}
                fill="black"
                style={{textAnchor: "middle"}}>
                {this.props.xLabel}
                </text>

                <text
                x={0}
                y={this.props.yScale.range()[0]/2}
                fill="black"
                transform={transformY}
                style={{textAnchor: "middle"}}>
                {this.props.yLabel}
                </text>

                <text
                x={(this.padding) + this.props.xScale(0) + xMax2}
                y={this.props.yScale.range()[1]}
                fill="black"
                style={{textAnchor: "middle"}}>
                {this.props.title}
                </text>
            </g>
        )
    }

    /**
     * Gets the tick suggested tick values for the x axis from the
     * prop of number of tick marks, finds the location of
     * the tick mark with the scaled value
     * and labels the tick with the actual value
     *
     * @returns
     *      virtual DOM for a line (the tick mark) and
     *      text (the label of the value)
     */
    renderXTicks() {
        return this.props.xScale.ticks().map((d, k) => {
            let sWidth = 1;

            return (
                <g key={"g"+k}>
                    <line key={"tick"+k}
                    x1={this.props.xScale(d) + (this.padding)}
                    y1={this.props.yScale.range()[0]}
                    x2={this.props.xScale(d) + (this.padding)}
                    y2={this.props.yScale.range()[0] + this.tickLen}
                    strokeWidth={sWidth}
                    stroke="black" />

                    <text key={"txt"+k}
                    x={this.props.xScale(d) + (this.padding)}
                    y={this.props.yScale.range()[0] + (this.tickLen * 2)}
                    style={{textAnchor: "middle"}}
                    fill="black">
                    {d}
                    </text>
                </g>
            )
        })
    }

    /**
     * Gets the tick suggested tick values for the y axis from the
     * prop of number of tick marks, finds the location of
     * the tick mark with the scaled value
     * and labels the tick with the actual value
     *
     * @returns
     *      virtual DOM for a line (the tick mark) and
     *      text (the label of the value)
     */
    renderYTicks() {

        return this.props.yScale.ticks().map((d, k) => {

            let xCoord = (this.padding) + 20;
            let yCoord = this.props.yScale(d);
            let sWidth = 1;

            return (
                <g key={"g"+k}>
                    <line key={"tick"+k}
                    x1={xCoord}
                    y1={yCoord}
                    x2={xCoord - this.tickLen}
                    y2={yCoord}
                    strokeWidth={sWidth}
                    stroke="black" />

                    <text key={"txt"+k}
                    x={xCoord - this.tickLen}
                    y={yCoord}
                    style={{textAnchor: "end"}}
                    fill="black">
                    {d}
                    </text>
                </g>
            )
        })
    }

    /**
     * Renders the virtual DOM for the x and y axis
     *
     * @returns
     *      svg elements for the x and y axis
     */
    render() {
        return (
            <svg>
                {this.renderAxis()}
                {this.renderLabels()}
                {this.renderXTicks()}
                {this.renderYTicks()}
            </svg>
        );
    }
}