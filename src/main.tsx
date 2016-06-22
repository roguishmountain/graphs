import 'babel-polyfill';
import { render } from 'react-dom';
import { createElement } from 'react';
import { Action, Actions } from './Actions';
import { InitialState, State } from './State';
import { AppUI } from './AppUI';

const content = document.getElementById('content');
async function view(state) {
    render(createElement(AppUI, state), content);
}
function run() {
    Actions
        .startWith(InitialState)
        .scan((s: State, action: Action) => action(s))
        .subscribe(view);
}
window.onload = run;