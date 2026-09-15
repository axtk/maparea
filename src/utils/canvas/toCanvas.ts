export async function toCanvas(element: HTMLElement) {
  if (element instanceof HTMLCanvasElement) return element;

  let m = await import("html2canvas");
  // @see https://github.com/microsoft/TypeScript/issues/59257
  let h2c = m.default.default || m.default || m;

  return await h2c(element, {
    backgroundColor: null,
    logging: false,
  });
}
