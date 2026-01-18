import "./index.css";
import {
  addClickListener,
  addNavigation,
  addPersistence,
  addResizeObserver,
  addShape,
  addShapeEditor,
  addTiles,
  addZoomControls,
  getCenter,
  MapArea,
  // getVicinity,
  toPrecision,
} from "../index.ts";
import { initTestForm } from "./form.ts";
import { shape } from "./shape.ts";

let formState = initTestForm();

let map = new MapArea({
  container: "#map",
  center: getCenter(shape),
  // bounds: getVicinity(shape),
  zoom: 13,
  minZoom: 1,
  maxZoom: 19,
  projection: "ellipsoidal",
  lang: "en_US",
});

// map.center = getCenter(shape);
// map.bounds = getVicinity(shape);

if (formState.apikey)
  addTiles(map, {
    url: `https://tiles.api-maps.yandex.ru/v1/tiles/?x={x}&y={y}&z={z}&lang={lang}&l=map&scale=${window.devicePixelRatio ?? 1}&maptype=future_map&apikey=${formState.apikey}`,
    attribution: ({ lang }) => {
      return lang.split("_")[0] === "ru"
        ? `<a href="https://yandex.ru/maps" target="_blank"><img src="/assets/yx_ru.svg" alt="Яндекс Карты"></a>`
        : `<a href="https://yandex.com/maps" target="_blank"><img src="/assets/yx_en.svg" alt="Yandex Maps"></a>`;
    },
    error: "/assets/blank.png",
    retries: 2,
    margin: 500,
  });

addClickListener(map, ({ x, y, lat, lon }) => {
  console.log({ x, y, lat, lon });
});

addResizeObserver(map, console.log);

addNavigation(map);
addShape(map, shape);

let shapeOutput = document.querySelector("pre")!;

addShapeEditor(map, {
  onUpdate: (shape) => {
    let coords = shape.map(({ coords: [lat, lon] }) => {
      return `  [${toPrecision(lat, 8)}, ${toPrecision(lon, 8)}],`;
    });

    let content =
      coords.length === 0
        ? "let shape = [];"
        : `let shape = [\n${coords.join("\n")}\n];`;

    if (shapeOutput.textContent !== content) shapeOutput.textContent = content;
  },
  ignoreClicks: "a, button",
});

addZoomControls(map);
addPersistence(map);

map.lang = formState.lang || "en_US";
