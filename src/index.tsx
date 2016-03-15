import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as d3 from 'd3';
import * as _ from 'lodash';

import { Axis } from './axis';
import { ScatterPlot } from './scatterplot';


class World extends React.Component<any, any> {
    constructor(props) {
        super();
        this.state = {
            color: "green",
            count: 0,
            radius: 5,
            data: [
                {x: 1, y: 2},
                {x: 4, y: 7},
                {x: 3, y: 5},
            ]
        };
    }
    onEnter() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.setState({color: "red", radius: this.state.radius + 10 }), 500 * i);
        }
    }
    onLeave() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.setState({color: "blue", radius: this.state.radius - 10 }), 500 * i);
        }
    }
    render() {
        return (
            <div>
                <p>{this.state.data}</p>
                <svg width="1024" height="768">
                    <circle
                        onMouseEnter={this.onEnter.bind(this)}
                        onMouseLeave={this.onLeave.bind(this)}
                        cx="240" cy="240" r={this.state.radius} fill={this.state.color} />
                </svg>

            </div>
        );
    }
}

interface Count { count: number }

class Counter extends React.Component<Count, Count> {
    constructor(props) {
        super();
        this.state = { count: props.count };
    }

    renderCount() {
        return <h2>{this.state.count}</h2>;
    }

    renderButton(label, onClick) {
        return <button onClick={onClick}>{label}</button>;
    }

    incrementCount() {
        this.setState({count: this.state.count + 1});
    }

    decrementCount() {
        this.setState({count: this.state.count - 1});
    }

    render() {
        return (
            <div>
                {this.renderButton('+', this.incrementCount.bind(this))}
                {this.renderButton('-', this.decrementCount.bind(this))}
                {this.renderCount()}
           </div>
        );
    }
}