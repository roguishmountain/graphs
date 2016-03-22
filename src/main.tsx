import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { TextBox } from './textbox';

class Main extends React.Component<any, any> {
    render() {
        return (
            <TextBox data={[]}/>
        );
    }
}
ReactDOM.render(<Main />, document.getElementById('content'));