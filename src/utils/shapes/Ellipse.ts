import type { MapArea } from "../../MapArea/index.ts";
import type { GeoCoords } from "../../types/GeoCoords.ts";
import { initContextStyles } from "./initContextStyles.ts";
import type { RenderingProps } from "./RenderingProps.ts";
import { Shape, type ShapeAttributes } from "./Shape.ts";

export type EllipseAttributes = ShapeAttributes<
  {
    c?: GeoCoords;
    /** In pixels. */
    rx?: number;
    /** In pixels. */
    ry?: number;
    rotation?: number;
    startAngle?: number;
    endAngle?: number;
    counterclockwise?: boolean;
  } & RenderingProps
>;

export class Ellipse extends Shape<EllipseAttributes> {
  constructor(
    c: EllipseAttributes["c"],
    rx: EllipseAttributes["rx"],
    ry: EllipseAttributes["ry"],
    attrs?: Omit<EllipseAttributes, "c" | "rx" | "ry">,
  ) {
    super("ellipse", { c, rx, ry, ...attrs });
  }
  render(ctx: CanvasRenderingContext2D, map: MapArea) {
    let {
      c,
      rx,
      ry,
      rotation = 0,
      startAngle = 0,
      endAngle = 0,
      counterclockwise,
      fillRule,
      ...props
    } = this._attrs;
    if (!c || !rx || !ry) return;

    initContextStyles(ctx, props);

    let lw = props.lineWidth ?? 1;
    let [cx, cy] = map.toViewportCoords(...c);

    let entirelyOffscreen = map.isOffscreenRegion(
      cx - rx,
      cy - ry,
      cx + rx,
      cy + ry,
      lw,
      lw,
    );

    if (!entirelyOffscreen) {
      ctx.beginPath();
      ctx.ellipse(
        cx,
        cy,
        rx,
        ry,
        rotation,
        startAngle,
        endAngle,
        counterclockwise,
      );

      if (props.fillStyle || fillRule) ctx.fill(fillRule);
      if (props.strokeStyle) ctx.stroke();
    }
  }
}
