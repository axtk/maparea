import { ExtendedCanvasStyles } from "./shapes/ExtendedCanvasStyles.ts";

const styleProps: (keyof ExtendedCanvasStyles)[] = [
  // CanvasPathDrawingStyles
  "lineCap",
  "lineDashOffset",
  "lineJoin",
  "lineWidth",
  "miterLimit",
  // CanvasTextDrawingStyles
  "direction",
  "font",
  "fontKerning",
  "fontStretch",
  "fontVariantCaps",
  "letterSpacing",
  "textAlign",
  "textBaseline",
  "textRendering",
  "wordSpacing",
  // CanvasFillStrokeStyles
  "fillStyle",
  "strokeStyle",
  // CanvasShadowStyles
  "shadowBlur",
  "shadowColor",
  "shadowOffsetX",
  "shadowOffsetY",
  // CanvasFilters
  "filter",
  // CanvasCompositing
  "globalAlpha",
  "globalCompositeOperation",
];

let initialStyle: ExtendedCanvasStyles | null = null;

export function setInitialStyle(ctx: CanvasRenderingContext2D | null) {
  if (!ctx) return;

  if (initialStyle === null) {
    let auxCanvas: HTMLCanvasElement | null = document.createElement("canvas");
    let auxCtx = auxCanvas.getContext("2d");
    
    initialStyle = {};

    if (auxCtx) {
      for (let k of styleProps) {
        if (k in auxCtx) {
          // @ts-ignore k of CanvasRenderingContext2D
          initialStyle[k] = auxCtx[k];
        }
      }
    }

    auxCanvas = null;
  }

  for (let [k, v] of Object.entries(initialStyle)) {
    // @ts-ignore k of CanvasRenderingContext2D
    ctx[k] = v;
  }

  ctx.setLineDash([]);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  let dpr = window.devicePixelRatio || 1;
  ctx.scale(dpr, dpr);
}
