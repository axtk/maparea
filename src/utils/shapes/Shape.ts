import type { MapArea } from "../../MapArea/index.ts";

export type BaseShapeAttributes = {
  id?: string;
};

export type ShapeAttributes<
  T extends Record<string, unknown> = Record<string, unknown>,
> = BaseShapeAttributes & T;

export class Shape<A extends ShapeAttributes = ShapeAttributes> {
  _type: string;
  _attrs = {} as A;
  constructor(type: string, attrs?: A) {
    this._type = type;
    if (attrs) this._attrs = attrs;
  }
  get id(): string | null {
    return this._attrs.id ?? null;
  }
  set id(value: string) {
    this._attrs.id = value;
  }
  is(type: string) {
    return this._type === type;
  }
  getAttribute<N extends keyof A>(name: N) {
    return this._attrs[name] ?? null;
  }
  setAttribute<N extends keyof A>(name: N, value: A[N]) {
    this._attrs[name] = value;
  }
  render(_ctx: CanvasRenderingContext2D, _map: MapArea) {}
}
