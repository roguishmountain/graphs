export type Element = any;
export type Data = Element[];
export interface Cluster {
    data: Data | Cluster[];
};
export type Color = string | ((ele: Element) => string);
