import type { BoxSize } from "../../types/BoxSize.ts";

export function setSize(canvas: HTMLCanvasElement, { w, h }: BoxSize) {
  let dpr = window.devicePixelRatio || 1;

  if (
    Math.abs(canvas.width - w * dpr) < 1 &&
    Math.abs(canvas.height - h * dpr) < 1
  )
    return;

  canvas.width = w * dpr;
  canvas.height = h * dpr;

  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
}
