import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AppUI } from './AppUI';

class Main extends React.Component<any, any> {
    render() {
        return (
            <AppUI data={[]}/>
        );
    }
}
ReactDOM.render(<Main />, document.getElementById('content'));