import type { MapArea } from "../MapArea/index.ts";
import type { GeoVertex } from "../types/GeoVertex.ts";
import type { PixelVertex } from "../types/PixelVertex.ts";
import { ShapeOptions } from "../types/ShapeOptions.ts";
import { getLayer } from "./getLayer.ts";
import { toPrecision } from "./toPrecision.ts";

const svgNS = "http://www.w3.org/2000/svg";

function getStrokeWidth(path: SVGPathElement) {
  return parseFloat(
    window.getComputedStyle(path).strokeWidth ||
      path.getAttribute("stroke-width") ||
      "1",
  );
}

function renderShapePath(
  svg: SVGSVGElement,
  shape: PixelVertex[],
  options?: ShapeOptions,
) {
  if (shape.length === 0) {
    svg.innerHTML = "";
    return;
  }

  let path = svg.querySelector("path");

  if (!path) {
    path = document.createElementNS(svgNS, "path");
    svg.append(path);
  }

  let xMin = shape[0].coords[0];
  let xMax = xMin;
  let yMin = shape[0].coords[1];
  let yMax = yMin;
  let s = "";

  for (let {
    coords: [x, y],
  } of shape) {
    if (xMin > x) xMin = x;
    if (xMax < x) xMax = x;
    if (yMin > y) yMin = y;
    if (yMax < y) yMax = y;
  }

  xMin -= 10;
  xMax += 10;
  yMin -= 10;
  yMax += 10;

  let markers = Array.from(svg.querySelectorAll<SVGCircleElement>(".marker"));
  let k = 0;

  for (let {
    id,
    coords: [x, y],
  } of shape) {
    let px = toPrecision(x - xMin, 3);
    let py = toPrecision(y - yMin, 3);

    s += `${s ? " L" : "M"} ${px} ${py}`;

    if (options?.markers) {
      let marker = markers[k++];

      if (!marker) {
        marker = document.createElementNS(svgNS, "circle");
        marker.setAttribute("class", "marker");
        marker.setAttribute("r", String(1.5 * getStrokeWidth(path)));
        svg.append(marker);
      }

      marker.setAttribute("cx", px);
      marker.setAttribute("cy", py);
      marker.dataset.id = id;
    }
  }

  for (let i = k; i < markers.length; i++) markers[i].remove();

  path.setAttribute("d", s);

  return { xMin, xMax, yMin, yMax };
}

export function renderShape(
  map: MapArea,
  shape: GeoVertex[],
  options?: ShapeOptions,
) {
  let layer = options?.layer ?? getLayer(map, { className: "shape" });
  layer.toggleAttribute("hidden", shape.length === 0);

  let svg = layer.querySelector("svg");

  if (!svg) {
    svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    layer.append(svg);
  }

  let result = renderShapePath(
    svg,
    shape.map(({ id, coords: [lat, lon] }) => ({
      id,
      coords: map.toPixelCoords(lat, lon),
    })),
    options,
  );

  if (result) {
    let { xMin, xMax, yMin, yMax } = result;
    let {
      centerCoords: [cx, cy],
      box,
    } = map;

    let w = toPrecision(xMax - xMin, 3);
    let h = toPrecision(yMax - yMin, 3);

    let x = toPrecision(0.5 * box.w + xMin - cx, 2);
    let y = toPrecision(0.5 * box.h + yMin - cy, 2);

    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    svg.setAttribute(
      "style",
      `position: absolute; transform: translate3d(${x}px, ${y}px, 0);`,
    );
  }

  return layer;
}
