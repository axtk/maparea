import type { MapArea } from "../../MapArea/index.ts";
import type { GeoCoords } from "../../types/GeoCoords.ts";
import type { PixelCoords } from "../../types/PixelCoords.ts";
import { initContextStyles } from "./initContextStyles.ts";
import type { RenderingProps } from "./RenderingProps.ts";
import { Shape, type ShapeAttributes } from "./Shape.ts";

export type PathAttributes = ShapeAttributes<
  {
    d?: GeoCoords[];
    /** @default false */
    close?: boolean;
  } & RenderingProps
>;

export class Path extends Shape<PathAttributes> {
  constructor(d?: PathAttributes["d"], attrs?: Omit<PathAttributes, "d">) {
    super("path", { d, ...attrs });
  }
  push(point: GeoCoords) {
    if (!this._attrs.d) this._attrs.d = [];
    this._attrs.d?.push(point);
  }
  render(ctx: CanvasRenderingContext2D, map: MapArea) {
    let { d, close, fillRule, ...props } = this._attrs;
    if (!d || d.length < 2) return;

    initContextStyles(ctx, props);

    let lw = props.lineWidth ?? 1;
    let p: PixelCoords[] = [];

    let xMin: number | null = null;
    let xMax: number | null = null;
    let yMin: number | null = null;
    let yMax: number | null = null;

    for (let di of d) {
      let pi = map.toViewportCoords(...di);
      p.push(pi);

      if (xMin === null || pi[0] < xMin) xMin = pi[0];
      if (xMax === null || pi[0] > xMax) xMax = pi[0];
      if (yMin === null || pi[1] < yMin) yMin = pi[1];
      if (yMax === null || pi[1] > yMax) yMax = pi[1];
    }

    let entirelyOffscreen = map.isOffscreenRegion(
      xMin,
      yMin,
      xMax,
      yMax,
      lw,
      lw,
    );

    if (!entirelyOffscreen) {
      ctx.beginPath();
      ctx.moveTo(p[0][0], p[0][1]);

      for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);

      if (close) ctx.closePath();
      if (props.fillStyle || fillRule) ctx.fill(fillRule);
      if (props.strokeStyle) ctx.stroke();
    }
  }
}
