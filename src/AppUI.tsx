import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AreaGraph } from './areagraph';
import { BarGraph } from './BarGraph';
import { StackedBarGraph } from './StackedBarGraph';
import { LinePlot } from './LinePlot';

interface Data {
    value?: any;
    valid?: boolean;
    xFunction?: any;
    yFunction?: any;
    groupFunction?: any;
    colorFunction?: any;
    labelFunction?: any;
    scaleType?: any;
}

class Predicate extends React.Component<any, any> {

    handleSubmit(evt) {
        let { bind, name } = this.props;
        bind.setState({[name]: bind[name].value});
    }

    render() {
        let { bind, name } = this.props;

        return (
            <g>
                <textarea
                    ref={r => bind[name] = r}>
                </textarea>
                <button onClick={evt => this.handleSubmit(evt)}>
                    {this.props.children}
                </button>
           </g>
        );
    }
}

export class AppUI extends React.Component<any, Data> {
    /**
     * @constructor
     */
    constructor(props) {
        super(props);

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
    handleSubmit(name, evt) {
        try{
            let parsedVal = JSON.parse(this[name].value);
            this.setState({ value: parsedVal, valid: true });

        } catch (SyntaxError) {
            console.log("NO");
            this.setState({ value: [], valid: false });
        }
    }

    /**
     * sets if ordinal or continuous for color grouping
     */
    handleRadioSubmit(evt) {
        this.setState({ scaleType: evt.target.value });
    }

    /**
     * checks the state is valid and renders
     * data if valid or no data message if not valid
     *
     * @returns
     *      virtual DOM for graph or no data message
     */
    renderAreaGraph() {
        if (this.state.valid){
            return (
                <LinePlot width={1000}
                    height={500}
                    yLabel="yLabel"
                    xLabel="xLabel"
                    title="Title"
                    data={this.state.value}
                    xFunction={this.state.xFunction}
                    yFunction={this.state.yFunction}
                    groupFunction={this.state.groupFunction}
                    colorFunction={this.state.colorFunction}
                    labelFunction={this.state.labelFunction}
                    scaleType={this.state.scaleType}>
                </LinePlot>
            )
        }
        else {
            return (
                <h4>
                    no data or incorrectly formatted data!
                </h4>
            )
        }
    }

    /**
     * DOM of the UI to set values
     *
     * @returns
     *      virtual DOM for UI
     */
    renderUI() {
        return (
            <g>
                <Predicate name='xFunction' bind={this}>Use X Value Function</Predicate>
                <p></p>
                <Predicate name='yFunction' bind={this}>Use Y Value Function</Predicate>
                <p></p>
                <Predicate name='groupFunction' bind={this}>Use Color by Value Function</Predicate>
                <p></p>
                <br></br>
                <input type="radio" name="scale" value="ordinal"
                    onChange={this.handleRadioSubmit.bind(this)}>
                    </input><text>Ordinal</text>
                <input type="radio" name="scale" value="continuous"
                    onChange={this.handleRadioSubmit.bind(this)}>
                    </input><text>Continuous</text>
                <p></p>
                <Predicate name='colorFunction' bind={this}>Use Color Value Function</Predicate>
                <p></p>
                <Predicate name='labelFunction' bind={this}>Use Label Function</Predicate>
            </g>
        )
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
                rows={10} cols={75}
                ref={r => this["data"] = r}>
                </textarea>
                <button onClick={this.handleSubmit.bind(this, "data")}>
                    Parse
                    </button>
                {this.renderAreaGraph()}
                {this.renderUI()}
                </div>
        )
    }
}