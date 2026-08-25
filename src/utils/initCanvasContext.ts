export function initCanvasContext(canvas: HTMLCanvasElement) {
  let ctx = canvas.getContext("2d");
  if (ctx) {
    let dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);
  }
  return ctx;
}
