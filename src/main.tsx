import 'babel-polyfill';
import { render } from 'react-dom';
import { BarGraph } from './BarGraph';
import * as React from 'react';
import { Data, Element } from './Data';

const content = document.getElementById('content');
const data: Data = [
  {
    "id": 35218980,
    "author": "Aaron Bockover",
    "workhost_id": 217,
    "workhost": "inspector-1",
    "start": "2016-06-22T21:54:56.705285Z",
    "duration": 124,
    "duration_string": "00:02:04",
    "lane": "inspector-mac-master",
    "revision_id": 776737,
    "revision": "10a22fbe8c5aea907f32e2e7df29b5112a208dfa",
    "status": "success",
    "summary": "-"
  },
  {
    "id": 35217253,
    "author": "Aaron Bockover",
    "workhost_id": 217,
    "workhost": "inspector-1",
    "start": "2016-06-22T15:11:41.571769Z",
    "duration": 125,
    "duration_string": "00:02:05",
    "lane": "inspector-mac-master",
    "revision_id": 776668,
    "revision": "a49da5d77cc9182a83bfd584a22ba95906201630",
    "status": "success",
    "summary": "-"
  },
  {
    "id": 35190524,
    "author": "Aaron",
    "workhost_id": 217,
    "workhost": "inspector-1",
    "start": "2016-06-20T21:30:26.56735Z",
    "duration": 2,
    "duration_string": "00:00:02",
    "lane": "inspector-mac-master",
    "revision_id": 775252,
    "revision": "e61603c06c5026a8cf149ef1ce6bb604e25768ed",
    "status": "failure",
    "summary": "-"
  }
];

function commit(ele: Element) {
    return ele.revision;
}

function duration(ele: Element) {
    return ele.duration;
}

const ys = [
    duration,
    duration
];

function author(ele: Element) {
    return ele.author;
}

function status(ele: Element) {
    return ele.status
}

function id(ele: Element) {
    return ele.id;
}

function run() {
    render(<BarGraph clusterBy={[author, id]} data={data} x={commit} ys={ys} />, content);
}

window.onload = run;
