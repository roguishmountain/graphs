import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AreaGraph } from './areagraph';
import { BarGraph } from './BarGraph';
import { StackedBarGraph } from './StackedBarGraph';
import { LinePlot } from './LinePlot';
import { State } from './State';
import { merge, reduce, sampleSize, split } from 'lodash';
import { functionChanged, dataChanged } from './Actions';

interface Data {
    valid?: boolean;
    scaleType?: string;
}

class Predicate extends React.Component<any, any> {

    handleDefaultSubmit(evt) {
        let { bind, name, func } = this.props;
        let value = bind[name].value;
        let oldData = bind.data.value;
        let submit = func || this.handleSubmit;
        submit(name, value, JSON.parse(oldData));
    }

    handleSubmit(name, value) {
        let fn = new Function('entry', `${value}`);
        Object.defineProperty(fn, 'name', { value });
        functionChanged(name, fn);
    }

    render() {
        let { bind, name } = this.props;

        return (
            <g>
                <textarea
                    ref={r => bind[name] = r} rows={5} cols={20}>
                </textarea>
                <button onClick={evt => this.handleDefaultSubmit(evt)}>
                    {this.props.children}
                </button>
            </g>
        );
    }
}

export class AppUI extends React.Component<State, Data> {
    /**
     * @constructor
     */
    constructor(props) {
        super(props);
        this.state = { valid: false };
    }

    /**
     * parse JSON and set state to objects
     *
     * @parameter
     *      click event
     */
    handleSubmit(name, evt) {
        try {
            let parsedVal = JSON.parse(this[name].value);
            let { sample, filterreject } = this.props;
            this.setState({ valid: true });
            parsedVal = this.filterRejectData("filterreject", filterreject,
                this.sampleData("sample", sample, parsedVal));
            functionChanged("data", parsedVal);

        } catch (SyntaxError) {
            console.log("NO");
            this.setState({ valid: false });
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
    renderGraph() {
        if (this.state.valid) {
            let s = { height: 500, width: 1000 };
            return (
                <StackedBarGraph
                    {...Object.assign(s, this.props, this.state.scaleType)}
                    />
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
                <Predicate name='xValues' bind={this}>Use X Value Function</Predicate>
                <Predicate name='yValues' bind={this}>Use Y Value Function</Predicate>
                <p></p>
                <Predicate name='colorBy' bind={this}>Use Color by Value Function</Predicate>
                <input type="radio" name="scale" value="ordinal"
                    onChange={this.handleRadioSubmit.bind(this)}>
                    </input><text>Ordinal</text>
                <input type="radio" name="scale" value="continuous"
                    onChange={this.handleRadioSubmit.bind(this)}>
                    </input><text>Continuous</text>
                <p></p>
                <Predicate name='colorSpecific' bind={this}>Use Color Value Function</Predicate>
                <Predicate name='labelFunction' bind={this}>Use Label Function</Predicate>
                <p></p>
                <Predicate name='filterreject' bind={this} func={this.filterRejectData}>Use filter/reject</Predicate>
                <Predicate name='sample' bind={this} func={this.sampleData}>Use Sample Size</Predicate>
            </g>
        )
    }

    sampleData(name, n, data) {
        let newData = (n && n > 0) ? sampleSize(data, n) : data;
        dataChanged(name, n, newData);
        return newData;
    }

    filterRejectData(name, filterReject, data) {
        let newData = undefined;
        if (filterReject) {
            newData = reduce(split(filterReject, /\n/), (output, cur) => {
                let func = new Function("data", cur);
                return func(output);
            }, data);
        }
        else {
            newData = data;
        }
        dataChanged(name, filterReject, newData);
        return newData;
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
                {this.renderGraph()}
                {this.renderUI()}
                </div>
        )
    }
}