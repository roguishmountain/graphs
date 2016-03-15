import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape';
import * as d3 from 'd3';
import * as _ from 'lodash';
import { Axis } from './axis';
import { AreaGraph } from './areagraph';
import { BarGraph } from './BarGraph';

interface Data {
    value?: any;
    valid?: boolean;
    xFunction?: any;
    yFunction?: any;
    groupFunction?: any;
    colorFunction?: any;
    labelFunction?: any;
}

export class TextBox extends React.Component<any, Data> {
    /**
     * @constructor
     */
    constructor(props) {
        super();

        let { data } = props;
        this.state = { value: [], valid: false,
                       xFunction: "entry.id",
                       yFunction: "entry.duration",
                       groupFunction: "entry.status",
                       colorFunction: "" };
    }

    /**
     * parse JSON and set state to objects
     *
     * @parameter
     *      click event
     */
    handleSubmit(evt) {
        let textArea: any = ReactDOM.findDOMNode(this.refs['textArea']);
        let val = textArea.value;
        try{
            let parsedVal = JSON.parse(val);
            this.setState({ value: parsedVal, valid: true });

        } catch (SyntaxError) {
            console.log("NO");
            this.setState({ value: [], valid: false });
        }
    }

    /**
     * sets function for x values
     */
    handleXSubmit() {
        let textArea: any = ReactDOM.findDOMNode(this.refs['textArea1']);
        if (textArea.value) {
            this.setState({ xFunction: textArea.value });
        }
    }

    /**
     * sets function for y values
     */
    handleYSubmit() {
        let textArea: any = ReactDOM.findDOMNode(this.refs['textArea2']);
        if (textArea.value) {
            this.setState({ yFunction: textArea.value });
        }
    }

    /**
     * sets function for group by values
     */
    handleGroupSubmit() {
        let textArea: any = ReactDOM.findDOMNode(this.refs['textArea3']);
        if (textArea.value) {
            this.setState({ groupFunction: textArea.value });
        }
    }

    /**
     * sets function for color values
     */
    handleColorSubmit() {
        let textArea: any = ReactDOM.findDOMNode(this.refs['textArea4']);
        this.setState({ colorFunction: textArea.value });
    }

    /**
     * sets function for labels
     */
    handleLabelSubmit() {
        let textArea: any = ReactDOM.findDOMNode(this.refs['textArea5']);
        this.setState({ labelFunction: textArea.value });
    }

    /**
     * checks the state is valid and renders
     * data if valid or no data message if not valid
     *
     * @returns
     *      virtual DOM for Curvegraph or no data message
     */
    renderAreaGraph() {
        if (this.state.valid){
            // return (
            //     <AreaGraph width={400}
            //         height={400}
            //         yLabel="yLabel"
            //         xLabel="xLabel"
            //         title="Title"
            //         data={this.state.value}
            //         xFunction={this.state.xFunction}
            //         yFunction={this.state.yFunction}>
            //         </AreaGraph>
            // )
            return (
                <BarGraph width={5000}
                    height={400}
                    yLabel="yLabel"
                    xLabel="xLabel"
                    title="Title"
                    data={this.state.value}
                    xFunction={this.state.xFunction}
                    yFunction={this.state.yFunction}
                    groupFunction={this.state.groupFunction}
                    colorFunction={this.state.colorFunction}
                    labelFunction={this.state.labelFunction}>
                </BarGraph>
            )

        }
        else{
            return (
                <h4>
                    no data or incorrectly formatted data!
                </h4>
            )
        }
    }

    /**
     * Renders the virtual DOM for the text areas
     *
     * @returns
     *      svg elements for data, x value, and y value text areas
     */
    render() {
        return (
            <div>
            <textarea
                ref="textArea"
                rows={10} cols={75}
                type="text">
                </textarea>
                <button type="button" onClick={this.handleSubmit.bind(this)}>
                    Parse
                </button>
                {this.renderAreaGraph()}
                <textarea
                ref="textArea1"
                type="text">
                </textarea>
                <button type="button" onClick={this.handleXSubmit.bind(this)}>
                    Use X Value Function
                </button>
                <p></p>
                <textarea
                ref="textArea2"
                type="text">
                </textarea>
                <button type="button" onClick={this.handleYSubmit.bind(this)}>
                    Use Y Value Function
                </button>
                <p></p>
                <textarea
                ref="textArea3"
                type="text">
                </textarea>
                <button type="button" onClick={this.handleGroupSubmit.bind(this)}>
                    Use Group By Value Function
                </button>
                <p></p>
                <textarea
                ref="textArea4"
                rows={5} cols={50}
                type="text">
                </textarea>
                <button type="button" onClick={this.handleColorSubmit.bind(this)}>
                    Use Color Value Function
                </button>
                <p></p>
                <textarea
                ref="textArea5"
                rows={5} cols={50}
                type="text">
                </textarea>
                <button type="button" onClick={this.handleLabelSubmit.bind(this)}>
                    Use Label Function
                </button>
            </div>
        )
    }
}