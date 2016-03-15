import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Axis } from './axis';
import { ScatterPlot } from './scatterplot';
import { AreaGraph } from './areagraph';
import { TextBox } from './textbox';
import * as d3_scale from 'd3-scale';
import * as d3_shape from 'd3-shape/shapes';

class Main extends React.Component<any, any> {
    render() {

        // let data = [
        //     {x: 480, y: 90, label: "label"},
        //     {x: 250, y: 50, label: "label"},
        //     {x: 100, y: 33, label: "label"},
        //     {x: 330, y: 95, label: "label"},
        //     {x: 410, y: 12, label: "label"},
        //     {x: 475, y: 44, label: "label"},
        //     {x: 25, y: 10, label: "label"},
        //     {x: 85, y: 21, label: "label"},
        //     {x: 220, y: 88, label: "label"},
        //     {x: 600, y: 150, label: "label"},
        // ];

        let data = [
            {x: 10, y: 400, label: "label"},
            {x: 20, y: 300, label: "label"},
            {x: 40, y: 500, label: "label"},
            {x: 50, y: 401, label: "label"},
            {x: 100, y: 33, label: "label"},
            {x: 330, y: 95, label: "label"},
            {x: 410, y: 12, label: "label"},
            {x: 475, y: 44, label: "label"},
            {x: 25, y: 10, label: "label"},
            {x: 85, y: 21, label: "label"},
            {x: 220, y: 88, label: "label"}
        ];

        // return (
        //     <ScatterPlot
        //         width={350}
        //         height={350}
        //         yLabel="yLabel"
        //         xLabel="xLabel"
        //         title="Title"
        //         data={data.map(([x, y, s], i) => ({ x, y, s }))}/>
        // );
        // return (
        //     < AreaGraph
        //         width={350}
        //         height={350}
        //         yLabel="yLabel"
        //         xLabel="xLabel"
        //         title="Title"
        //         data={data}/>
        // );

        return (
            <TextBox data={[]}/>
        );
    }
}

ReactDOM.render(<Main />, document.getElementById('content'));