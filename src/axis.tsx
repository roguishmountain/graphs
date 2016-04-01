import * as React from 'react';

interface AxisLines { yLabel: any,
                      xLabel: any,
                      title: any,
                      xScale: any,
                      yScale: any,
                      padding: number}

export class Axis extends React.Component<AxisLines, any> {
    tickLen: number;

    /**
     * Sets up the props, default tick length
     *
     * @constructor
     */
    constructor(props){
        super(props);
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
        let { xScale, yScale, padding } = this.props;
        return (
            <g>
                <line
                x1={xScale.range()[0] + (padding)}
                y1={yScale.range()[0]}
                x2={xScale.range()[1] + (padding)}
                y2={yScale.range()[0]}
                strokeWidth={sWidth}
                stroke="black" />

                <line
                x1={xScale.range()[0] + (padding)}
                y1={yScale.range()[0]}
                x2={xScale.range()[0] + (padding)}
                y2={yScale.range()[1]}
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
        // since y = 0 is at top of screen
        // the min y value would be down the screen
        let labelLenY = 10;
        let { yScale, xScale, xLabel, yLabel, title } = this.props;
        //transform for y axis label
        let transformY = "rotate(-90, " + labelLenY + ","
                    + (this.props.yScale.range()[0])/2 + ")";
        return (
            <g>
                <text
                x={(xScale.range()[1]) / 2}
                y={yScale.range()[0] + this.tickLen * 3}
                fill="black"
                style={{textAnchor: "middle"}}>
                {xLabel.name}
                </text>

                <text
                x={0}
                y={yScale.range()[0]/2}
                fill="black"
                transform={transformY}
                style={{textAnchor: "middle"}}>
                {yLabel.name}
                </text>

                <text
                x={(xScale.range()[1]) / 2}
                y={yScale.range()[1]}
                fill="black"
                style={{textAnchor: "middle"}}>
                {title}
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
        let x = undefined;
        let tickMap = undefined;

        let { xScale, yScale, padding } = this.props;
        if( typeof xScale.ticks === "function" ) {
            tickMap = xScale.ticks;
        }
        else {
            tickMap = xScale.domain;
        }

        return tickMap().map((d, k) => {
            if (typeof xScale.bandwidth === "function") {
                x = xScale(d) + (padding) + (xScale.bandwidth() / 2);
            }
            else {
                x = xScale(d) + (padding);
            }
            let sWidth = 1;
            return (
                <g key={"g"+k}>
                    <line key={"tick"+k}
                    x1={x}
                    y1={yScale.range()[0]}
                    x2={x}
                    y2={yScale.range()[0] + this.tickLen}
                    strokeWidth={sWidth}
                    stroke="black" />

                    <text key={"txt"+k}
                    x={x}
                    y={yScale.range()[0] + (this.tickLen * 2)}
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
        let { yScale, padding } = this.props;
        return yScale.ticks().map((d, k) => {

            let xCoord = (padding) + 20;
            let yCoord = yScale(d);
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