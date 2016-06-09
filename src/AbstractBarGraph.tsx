import * as d3_scale from 'd3-scale';
import { flattenDeep, reduce, isEmpty, last, concat, dropRight } from 'lodash';

import { AbstractGraph } from './AbstractGraph';

export class AbstractBarGraph extends AbstractGraph {
    constructor(props) {
        super(props);
    }

    calculateScales(): {xScale: any; yScale: any; colorScale: any} {
       let data = this.state.sortedData;

        let { height, width, xValues, yValues, colorBy } = this.props;

        let xScale = d3_scale.scaleBand()
            .domain(data.map((d) =>  xValues(d).toString()))
            .rangeRound([20, width])
            .paddingInner(0.1);
        let yScale = d3_scale.scaleLinear()
            .domain([0, d3.max(data, yValues)])
            .range([height, 20]);

        let colorScale = d3_scale.scaleCategory20()
                         .domain(data.map(colorBy));

        return {
            xScale, yScale, colorScale
        };
    };

    dataToGroups() {
        let data = this.state.sortedData;
        let { colorBy } = this.props;
        let result = reduce(data,
            (output: {}[][], cur) => {
                // empty case
                if (isEmpty(output)) return [[cur]];

                // append onto pending
                let pending = last(output);
                let prev = last(pending);
                let test = (f: Function, x, y) => f(x) !== f(y);

                if (test(colorBy, prev, cur)) {
                    return concat(output, [[cur]]);
                }
                // append after pending
                return concat(dropRight(output), [pending.concat(cur)]);
            }, []);
         return flattenDeep(result);
    }

    canvasGroupsToRects(groups: any[][], scales): any {
        throw 'canvasGroupsToRects not implemented';
    }

    // This is for clustered graphs
    rectsToPaths(groups: any[][]) {
        function path(rect): string {
            const V = y => ` V ${y}`;
            const H = x => `H ${x}`;
            const L = (x, y) => `L ${x} ${y}`;
            const M = (x, y) => ` M ${x} ${y}`;
            let result = [
                M(rect.x, rect.y),
                V(rect.h),
                H(rect.x + rect.w),
                L(rect.x + rect.w, rect.y)
            ].join(' ');
            return result;
        }
        let result: any = groups.map((g, i) => g.map((d, k) => {
            return path(d);
        }));
        return flattenDeep(result);
    }
}