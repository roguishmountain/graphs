import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as d3 from 'd3';
import * as _ from 'lodash';

import { Axis } from './Axis';

interface Point { x: any,
                  y: any,
                  s: any }
interface Plot { width: number,
                  height: number,
                  data: Point[],
                  yLabel: any,
                  xLabel: any,
                  title: any }

export class ScatterPlot extends React.Component<Plot, any> {
    xScale;
    yScale;
    rScale;
    padding;
    tickLen;

    /**
     * Sets up the props and default padding and tick length
     *
     * @constructor
     */
    constructor(props) {
        super(props);

        let { data, width, height,
              yLabel, xLabel, title } = props;

        this.xScale = d3.scale.linear()
            .domain([0, d3.max(data, (d: Point) => d.x)])
            .range([20, width + 150]);

        this.yScale = d3.scale.linear()
            .domain([0, d3.max(data, (d: Point) => d.y)])
            .range([height + 150, 20]);

        this.rScale = d3.scale.linear()
            .domain([0, d3.max(data, (d: Point) => d.y)])
            .range([2, 5]);

        let xAxis = d3.svg.axis()
            .scale(this.xScale)
            .orient("bottom")
            .ticks(5);

        this.padding = this.xScale(0) * 4;
        this.tickLen = 15;
    }

    /**
     * Scales the x and y values and bases the size
     * of the radius on the y value
     *
     * @returns
     *      virtual DOM for a circle that is located at the data point
     */
    renderCircles() {
        return this.props.data.map(({x, y, s}, k) => {
            // scales the coords to be drawn
            let cx = this.xScale(x);
            let cy = this.yScale(y);
            // makes the radius based on the y coord
            let r  = this.rScale(y);

            // draw the points
            return (
                <circle key={k}
                        cx={cx + (this.padding)}
                        cy={cy}
                        r={r}
                        onClick={ ()=>this.clicked(s) }>
                </circle>
            )
        })
    }

    clicked( source: string ) {
        window.open(
            'http://www.google.com',
            '_blank'
        );
        console.log(source);
    }

    /**
     * Scales the x and y values and creates a label with
     * the actual values
     *
     * @returns
     *      virtual DOM for text of the data values
     *      located at the data point
     */
    renderCoords() {
        // label the points with the acutal values
        // not the scaled values
        return this.props.data.map((d, k) => {
            let x = this.xScale(d.x);
            let y = this.yScale(d.y);

            return (
                <text key={k}
                      x={x+(this.padding)}
                      y={y}
                      fill="red"
                      fontSize="10px">
                      {`${d.x}, ${d.y}`}
                </text>
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
            <div>
                <svg width="1024" height="768">
                    {this.renderCircles()}
                    {this.renderCoords()}
                    <Axis
                        title={"Title"}
                        xLabel={"xLabel"}
                        yLabel={"yLabel"}
                        xScale={this.xScale}
                        yScale={this.yScale}
                        padding={45}>
                    </Axis>
                </svg>
           </div>
        );
    }
}