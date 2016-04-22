import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Observable } from 'rx';
import { retrieve } from './retrieve';
import { AreaGraph } from './areagraph';
import { BarGraph } from './BarGraph';
import { StackedBarGraph } from './StackedBarGraph';
import { LinePlot } from './LinePlot';
import { ClusterBarGraph } from './ClusterBarGraph';
import { State } from './State';
import { flatten, reduce, sampleSize, split, take } from 'lodash';
import { functionChanged, dataChanged } from './Actions';

interface Data {
    valid?: boolean;
    scaleType?: string;
}

class Predicate extends React.Component<any, any> {

    handleDefaultSubmit(evt) {
        let { bind, name, func } = this.props;
        let value = bind[name].value;
        if (func) {
            functionChanged(name, value);
            func(name, value);
        }
        else {
            this.handleSubmit(name, value);
        }
    }

    handleSubmit(name, value) {
        let colorBorder = JSON.parse(value);
        colorBorder.forEach((block) => {
            for (let title in block) {
                let fn = new Function('entry', `${block[title]}`);
                functionChanged(title, fn);
            }
        })
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
        let inputType = window.location.href.split("#")[1];
        if (inputType == "url") {
            this.setState({ valid: true });
            let urls = this[name].value.split("\n");
            this.loadUrls(urls);
        }
        else if (inputType == "data") {
            try {
                let parsedVal = JSON.parse(this[name].value);
                let { sample, filterreject } = this.props;
                this.setState({ valid: true });
                functionChanged("data", parsedVal);

            } catch (SyntaxError) {
                console.log("NO");
                this.setState({ valid: false });
            }
        }
        else {
            console.log("set default");
        }
    }

    loadUrls(urls: string[]) {
        let data = [];

        // let headers = {
        //     'User-Agent': 'node',
        //     'Authorization': `Basic ${btoa(`${username}:${token}`)}`
        // } as any;

        function handleChange(data) {
            functionChanged("data", data);
        }

        Observable
            .from(urls)
            // .flatMap(uri => retrieve<any>({ uri, headers, withCredentials: false } as any, ['allBuilds', true]))
            .flatMap(uri => retrieve<any>({ uri, withCredentials: false } as any))
            .bufferWithCount(100)
            .subscribe(
                e => data.push(e),
                err => console.log(err),
                () => handleChange(flatten(data)) // look inside 'data'
            );
    }

    handleRadioSubmit(evt) {
        this.setState({ scaleType: evt.target.value });
    }

    renderGraph() {
        if (this.state.valid) {
            let { sample, filterreject } = this.props;

            let newData = this.props.data;
            newData = this.filterRejectData("filterreject", filterreject,
                this.sampleData("sample", sample, newData));

            let s = { data: newData, height: 500, width: 5000, scaleType: this.state.scaleType};
            console.log("updated");
            return (
                <ClusterBarGraph
                    {...Object.assign({}, this.props, s)}
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
                <Predicate name='dataFormat' bind={this}>Specify Data Format</Predicate>
                <input type="radio" name="scale" value="ordinal"
                    onChange={this.handleRadioSubmit.bind(this)}>
                    </input><text>Ordinal</text>
                <input type="radio" name="scale" value="continuous"
                    onChange={this.handleRadioSubmit.bind(this)}>
                    </input><text>Continuous</text>
                <Predicate name='filterreject' bind={this} func={this.filterRejectData}>Use filter/reject</Predicate>
                <Predicate name='sample' bind={this} func={this.sampleData}>Use Sample Size</Predicate>
            </div>
        )
    }

    sampleData(name, n, data) {
        let newData = (n && n > 0) ? sampleSize(data, n) : data;
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
        return newData;
    }

    render() {
        return (
            <div>
            <div style={{backgroundColor: "#CCC"}}>
                <div>
                    <div id="url" style={{ padding: "15px", border: "1px solid #CCC",
                    backgroundColor: "#DDD", width: "30px", height: "20px", margin: "5px",
                    display: "inline-block", boxShadow:"0 0 5px -1px rgba(0,0,0,0.2)" }}>
                        <a href="#url">URL</a>
                    </div>
                    <div id="url" style={{ padding: "15px", border: "1px solid #CCC",
                    backgroundColor: "#DDD", width: "30px", height: "20px", margin: "5px",
                    display: "inline-block", boxShadow:"0 0 5px -1px rgba(0,0,0,0.2)" }}>
                        <a href="#data">Data</a>
                    </div>
                </div>
                <textarea style={{ padding: "25px"}}
                    rows={10} cols={75}
                    ref={r => this["data"] = r}>
                </textarea>
                <button onClick={this.handleSubmit.bind(this, "data")}>
                    Parse
                </button>
                </div>
                {this.renderGraph()}
                {this.renderUI()}
            </div>
        )
    }
}