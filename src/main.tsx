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
        return (
            <TextBox data={[]}/>
        );
    }
}

ReactDOM.render(<Main />, document.getElementById('content'));