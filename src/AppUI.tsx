import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AreaGraph } from './areagraph';
import { BarGraph } from './BarGraph';
import { StackedBarGraph } from './StackedBarGraph';
import { LinePlot } from './LinePlot';
import { ClusterBarGraph } from './ClusterBarGraph';
import { State } from './State';
import { reduce, sampleSize, split, take } from 'lodash';
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
            <div>
                <textarea
                    ref={r => bind[name] = r} rows={5} cols={20}>
                </textarea>
                <button onClick={evt => this.handleDefaultSubmit(evt)}>
                    {this.props.children}
                </button>
            </div>
        );
    }
}

export class AppUI extends React.Component<State, Data> {

    constructor(props) {
        super(props);
        this.state = { valid: false };
    }

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

    handleRadioSubmit(evt) {
        this.setState({ scaleType: evt.target.value });
    }

    renderGraph() {
        if (this.state.valid) {
            let s = { height: 500, width: 5000, scaleType: this.state.scaleType};
            return (
                <ClusterBarGraph
                    {...Object.assign({}, this.props, s, this.state.scaleType)}
                    />
            )
        }
        <h4>
            no data or incorrectly formatted data!
        </h4>
    }

    renderUI() {
        return (
            <div>
                <Predicate name='xValues' bind={this}>Use X Value Function</Predicate>
                <Predicate name='yValues' bind={this}>Use Y Value Function</Predicate>
                <Predicate name='colorBy' bind={this}>Use Color by Value Function</Predicate>
                <input type="radio" name="scale" value="ordinal"
                    onChange={this.handleRadioSubmit.bind(this)}>
                    </input><text>Ordinal</text>
                <input type="radio" name="scale" value="continuous"
                    onChange={this.handleRadioSubmit.bind(this)}>
                    </input><text>Continuous</text>
                <Predicate name='colorSpecific' bind={this}>Use Color Value Function</Predicate>
                <Predicate name='labelFunction' bind={this}>Use Label Function</Predicate>
                <Predicate name='filterreject' bind={this} func={this.filterRejectData}>Use filter/reject</Predicate>
                <Predicate name='sample' bind={this} func={this.sampleData}>Use Sample Size</Predicate>
            </div>
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