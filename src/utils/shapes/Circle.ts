import type { MapArea } from "../../MapArea/index.ts";
import type { GeoCoords } from "../../types/GeoCoords.ts";
import { isCoordsArray } from "../isCoordsArray.ts";
import { initContextStyles } from "./initContextStyles.ts";
import type { RenderingProps } from "./RenderingProps.ts";
import { Shape, type ShapeAttributes } from "./Shape.ts";

export type CircleAttributes = ShapeAttributes<
  {
    c?: GeoCoords;
    /** In pixels. */
    r?: number;
  } & RenderingProps
>;

export class Circle extends Shape<CircleAttributes> {
  constructor(c?: CircleAttributes["c"], r?: CircleAttributes["r"], attrs?: Omit<CircleAttributes, "c" | "r">);
  constructor(attrs?: CircleAttributes);
  constructor(
    c?: CircleAttributes["c"] | CircleAttributes,
    r?: CircleAttributes["r"],
    attrs?: Omit<CircleAttributes, "c" | "r">,
  ) {
    if (isCoordsArray(c)) super("circle", { c, r, ...attrs });
    else super("circle", c);
  }
  render(ctx: CanvasRenderingContext2D, map: MapArea) {
    let { c, r, fillRule, ...props } = this._attrs;
    if (!c || !r) return;

    initContextStyles(ctx, props);

    let lw = props.lineWidth ?? 1;
    let [cx, cy] = map.toViewportCoords(...c);

    let entirelyOffscreen = map.isOffscreenRegion(
      cx - r,
      cy - r,
      cx + r,
      cy + r,
      lw,
      lw,
    );

    if (!entirelyOffscreen) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);

      if (props.fillStyle || fillRule) ctx.fill(fillRule);
      if (props.strokeStyle) ctx.stroke();
    }
  }
}
