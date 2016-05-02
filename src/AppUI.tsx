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
        functionChanged(name, value);
        func(name, value);

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
        let valuesFromBox = this[name].value;
        let parsedVal = undefined;
        if (inputType == "url") {
            this.setState({ valid: true });
            parsedVal = JSON.parse(valuesFromBox);
            //console.log(parsedVal);
            let urls = parsedVal.data;
            this.loadUrls(urls);
        }
        else {
            try {
                parsedVal = JSON.parse(valuesFromBox);
                let { sample, filterreject } = this.props;
                this.setState({ valid: true });
                functionChanged("data", parsedVal.data);

            } catch (SyntaxError) {
                console.log("NO");
                this.setState({ valid: false });
            }
        }

        let params = parsedVal.param;
        if (params) {
            params.forEach((block) => {
            for (let title in block) {
                let fn = new Function('entry', `${block[title]}`);
                functionChanged(title, fn);
            }
        })
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
        let { sample, filterreject, data } = this.props;
        if (this.state.valid && data) {
            let newData = data;
            newData = this.filterRejectData("filterreject", filterreject,
                this.sampleData("sample", sample, newData));

            let s = { data: newData, height: 500, width: 5000, scaleType: this.state.scaleType};
            console.log("updated");
            //console.log(data);
            //console.log(newData);
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