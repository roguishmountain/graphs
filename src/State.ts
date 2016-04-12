export interface State {
    height: number;
    width: number;
    colorBy: any;
    xValues: Function;
    yValues: Function;
    labelFunction: Function;
    colorSpecific: Function;
    filterreject: string;
    sample: number;
    scaleType: string;
    data: {}[];
}

export const InitialState: State = {
    height: 500,
    width: 1000,
    colorBy: new Function('entry', 'return entry.status'),
    xValues: new Function('entry', 'return entry.id'),
    yValues: new Function('entry', 'return entry.duration'),
    labelFunction: new Function('entry', ''),
    colorSpecific: new Function('entry', ''),
    filterreject: "return _.filter(data, d=>d.duration > 0)",
    sample: 0,
    scaleType: "continuous",
    data: undefined
}