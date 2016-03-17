import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import * as _ from 'lodash';
import { ContinuousAxis } from './ContinuousAxis';

export class LinePlot extends React.Component<any, any> {

    constructor(props) {
        super();
    }

    renderArea() {
        let { xFunc, yFunc, xScale, yScale, padding } = this.calculate();
        let { data } = this.props;
        let newData = _.sortBy(data, (d) => xFunc(d));
        let graph = d3_shape.line()
            .x(i => xScale(xFunc(i)) + padding)
            .y(i => yScale(yFunc(i)));

        let path:any = graph(newData);
        return (
            <path
                d={path}
                stroke="black"
                strokeWidth="3"
                fill={"none"}>
                </path>
        )
    }

    renderPoints() {
        let { xFunc, yFunc, xScale, yScale, padding, gFunc } = this.calculate();
        let { data, scaleType } = this.props;
        let colorScale = undefined;

        // defaults to ordinal, change or keep?
        if(scaleType == "continuous") {
            colorScale = d3_scale.scaleCool()
            .domain([d3.min(data, gFunc), d3.max(data, gFunc)]);
        }
        else {
            colorScale = d3_scale.scaleCategory10()
            .domain(data.map((d, k) => {
                return gFunc(d);
            }));
        }

        return data.map((d, k) => {
            let x = xScale(xFunc(d)) + padding;
            let y = yScale(yFunc(d));
            return (
                <circle key={"c" + k}
                    cx={x}
                    cy={y}
                    r={5}
                    fill={colorScale(gFunc(d))}
                    onClick={this.handleClick.bind(this) }>
                    {k}
                    </circle>
            )
        })
    }

    handleClick(evt){
        let id = evt.target.innerHTML;
        console.log(id);
        console.log(this.props.data[id]);
    }

    calculate() {
        let { height, width, data } = this.props;

        let xFunc: any = new Function("entry", "return " + this.props.xFunction);
        let yFunc: any = new Function("entry", "return " + this.props.yFunction);
        let gFunc: any = new Function("entry", "return " + this.props.groupFunction);
        let lFunc: any = new Function("entry", this.props.labelFunction);

        let xScale = d3_scale.scaleLinear()
            .domain([d3.min(data, xFunc), d3.max(data, xFunc)])
            .range([20, height]);
        let yScale = d3_scale.scaleLinear()
            .domain([d3.min(data, yFunc), d3.max(data, yFunc)])
            .range([height, 20]);

        let padding = 45;

        return {
            xScale, yScale, xFunc, yFunc, padding, gFunc, lFunc
        };
    }

    render() {

        let { xScale, yScale } = this.calculate();
        let { xFunction, yFunction } = this.props;

        return (
            <div>
                <svg width="1024" height="700">
                    {this.renderArea() }
                    {this.renderPoints() }
                    <ContinuousAxis
                        title={xFunction + " vs. " + yFunction}
                        xLabel={xFunction}
                        yLabel={yFunction}
                        xScale={xScale}
                        yScale={yScale}>
                        </ContinuousAxis>
                    </svg>
                </div>
        )
    }
}