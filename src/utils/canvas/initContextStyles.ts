import type { RenderingProps } from "./RenderingProps.ts";
import { setInitialStyle } from "./setInitialStyle.ts";

export function initContextStyles(
  ctx: CanvasRenderingContext2D,
  props: RenderingProps,
) {
  let { lineDash, fillStyle, ...p } = props;

  setInitialStyle(ctx);

  if (lineDash !== undefined) ctx.setLineDash(lineDash);

  if (fillStyle !== undefined && fillStyle !== "none")
    ctx.fillStyle = fillStyle;

  for (let [k, v] of Object.entries(p)) {
    if (typeof v !== "function") {
      // @ts-expect-error [k, v] of CanvasStyles
      ctx[k] = v;
    }
  }
}
