import { Subject } from 'rx';
import { curry, eq, reduce, sampleSize, split } from 'lodash';
import { State } from './State';

export interface Action { (state: State): State };
export const Actions = new Subject<Action | State>();

export function functionChanged(fn, value) {
    Actions.onNext(changeFunction(fn, value));
}

export const changeFunction = curry((fn: string, value: any, state: State): State => {
    return Object.assign({}, state, { [fn]: value });
});

export function dataChanged(name, value, data) {
    Actions.onNext(changeData(name, value, data));
}

export const changeData = curry((name: string, value: any, data, state: State): State => {
    return Object.assign({}, state, { [name]: value, data: data });
});