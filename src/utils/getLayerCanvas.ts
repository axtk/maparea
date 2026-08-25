import { setCanvasSize } from "./setCanvasSize.ts";

export function getLayerCanvas(layer: HTMLElement) {
  let canvas = layer.querySelector("canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    layer.append(canvas);
  }

  let { width: w, height: h } = layer.getBoundingClientRect();
  setCanvasSize(canvas, { w, h });

  let ctx = canvas.getContext("2d");
  if (ctx) {
    let dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);
  }

  return { canvas, ctx };
}
