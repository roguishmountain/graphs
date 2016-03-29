import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import * as _ from 'lodash';
import { Axis } from './Axis';
import { filter, reject, reduce, sampleSize, split } from 'lodash';

interface State {
    data?: any;
    paths?: any;
    xScale?: any;
    yScale?: any;
    sample?: number;
    scaleType?: any;
    padding?: number;
    colorBy?: any;
    xValues?: any;
    yValues?: any;
    labelFunction?: Function;
    colorSpecific?: Function;
    filterreject?: any;
}

interface Props {
    height: number;
    width: number;
    colorBy: any;
    data: any[];
    xValues: any;
    yValues: any;
    labelFunction: Function;
    colorSpecific: Function;
    filterreject: any;
    sample: number;
    scaleType: any;
}

export class LinePlot extends React.Component<Props, State> {

    /**
     * Sets up the props
     *
     * @constructor
     */
    constructor(props) {
        super(props);
        let data = this.filterRejectData(this.props.data, this.props.filterreject);
        data = this.sampleData(data, this.props.sample);
        let s = this.calculate(props, data);
        let paths = this.createLine(data, s);
        let { sample, scaleType, colorBy, xValues,
              yValues, labelFunction, colorSpecific, filterreject } = this.props;

        this.state = Object.assign(s, { paths, data, sample, scaleType, colorBy,
                     xValues, yValues, labelFunction, colorSpecific, filterreject });
    }

    sampleData(data, sSize) {
        if(sSize > 0 && sSize) {
            return sampleSize(data, sSize);
        }
        else {
            return data;
        }
    }

    filterRejectData(data, filterReject) {
        if (filterReject) {
            return reduce(split(filterReject, /\n/), (output, cur) => {
                let func = new Function("data", cur);
                return func(output);
            }, data);
        }
        else {
            return data;
        }
    }

    componentWillReceiveProps(nextProps) {
        let data = this.filterRejectData(nextProps.data, nextProps.filterreject);
        data = this.sampleData(data, nextProps.sample);
        let s = this.calculate(nextProps, data);
        let paths = this.createLine(data, s);

        let { sample, scaleType, colorBy, xValues,
              yValues, labelFunction, colorSpecific, filterreject } = nextProps;

        this.setState(Object.assign(s, { paths, data,
                      sample, scaleType, colorBy, xValues,
                      yValues, labelFunction, colorSpecific, filterreject }));
    }

    /**
     * Creates a path based on the data
     *
     * @returns
     *      the line of the plotted data
     */
    createLine(data, calc) {
        let { xValues, yValues, xScale, yScale, padding } = calc;
        let graph = d3_shape.line()
            .x(i => xScale(xValues(i)) + padding)
            .y(i => yScale(yValues(i)));

        // data needs to be sorted to draw the path for the line
        let path: any = graph(_.sortBy(data, xValues));

        return path;
    }

    renderLine(path) {
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
        let { xValues, yValues, xScale, yScale, padding, colorBy,
              colorSpecific, data, scaleType } = this.state;
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
        let { xValues, yValues, xScale, yScale, padding, data, labelFunction } = this.state;
        return data.map((d, k) => {
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
        console.log(this.state.data[evt.target.innerHTML]);
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
    calculate(props, data) {
        let { height, width, xValues, yValues, colorSpecific } = props;

        let xScale = d3_scale.scaleLinear()
            .domain([d3.min(data, xValues), d3.max(data, xValues)])
            .range([20, width - 100]);
        let yScale = d3_scale.scaleLinear()
            .domain([d3.min(data, yValues), d3.max(data, yValues)])
            .range([height, 20]);

        let padding = 45;

        return {
            xScale, yScale, xValues, yValues, padding, colorSpecific
        };
    }

    /**
     * Renders the virtual DOM for the graph and labels
     *
     * @returns
     *      svg elements for the graph and labels
     */
    render() {

        let { xScale, yScale, padding, xValues, yValues } = this.state;

        return (
            <div>
                <svg width={this.props.width} height={700}>
                    {this.renderLine(this.state.paths)}
                    {this.renderPoints()}
                    {this.renderLabels()}
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