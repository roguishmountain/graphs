import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import * as _ from 'lodash';
import { AbstractGraph } from './AbstractGraph';
import { Axis } from './Axis';

export class AreaGraph extends AbstractGraph {

    constructor(props) {
        super(props);
    }

    renderArea(scales) {
        let { xScale, yScale} = scales;
        let { xValues, yValues, padding } = this.props;
        let { sortedData } = this.state;
        let graph = d3_shape.area()
            .x(i => xScale(xValues(i)) + padding)
            .y1(i => yScale(yValues(i)))
            .y0(this.props.height);

        let path = graph(sortedData);

        return (
            <path
                d={path}
                stroke="green"
                strokeWidth="1"
                fill="green">
                </path>
        )
    }

    render() {

        let scales = super.calculateScales();
        let { xScale, yScale } = scales;

        return (
            <div>
                <svg width="1024" height="700">
                    {this.renderArea(scales)}
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