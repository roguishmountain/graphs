import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import * as _ from 'lodash';
import { Axis } from './axis';

export class AreaGraph extends React.Component<any, any> {

    constructor(props) {
        super();
    }

    renderArea() {
        let { xFunc, yFunc, xScale, yScale, padding } = this.calculate();
        let graph = d3_shape.area()
            .x(i => xScale(xFunc(i)) + padding)
            .y1(i => yScale(yFunc(i)))
            .y0(this.props.height);

        let path = graph(this.props.data);

        return (
            <path
                d={path}
                stroke="green"
                strokeWidth="1"
                fill="green">
                </path>
        )
    }

    calculate() {
        let { height, width, data } = this.props;

        let xFunc: any = new Function("entry", "return " + this.props.xFunction);
        let yFunc: any = new Function("entry", "return " + this.props.yFunction);

        let xScale = d3_scale.scaleLinear()
            .domain([0, d3.max(data, xFunc)])
            .range([20, height]);
        let yScale = d3_scale.scaleLinear()
            .domain([0, d3.max(data, yFunc)])
            .range([height, 20]);

        let padding = xScale(0) * 4;

        return {
            xScale, yScale, xFunc, yFunc, padding
        };
    }

    render() {

        let { xScale, yScale } = this.calculate();

        return (
            <div>
                <svg width="1024" height="700">
                    {this.renderArea() }
                    <Axis
                        title={"Title"}
                        xLabel={"xLabel"}
                        yLabel={"yLabel"}
                        xScale={xScale}
                        yScale={yScale}
                        padding={45}>
                        </Axis>
                    </svg>
                </div>
        )
    }
}