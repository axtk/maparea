import "./index.css";
import {
  addDragPan,
  addElement,
  addPersistence,
  addPinchToZoom,
  addPointerListener,
  addResizeObserver,
  addShape,
  addShapeEditor,
  addTiles,
  addZoomControl,
  fitGeoBounds,
  // getCenter,
  getVicinity,
  MapArea,
  toPrecision,
} from "../index.ts";
import { initTestForm, initTestFormReset } from "./form.ts";
import { shape } from "./shape.ts";

let formState = initTestForm();

let map = new MapArea({
  container: "#map",
  center: [59.94607, 30.33476],
  projection: "ellipsoidal",
  zoom: 10,
  lang: formState.lang || "en_US",
});

if (formState.apikey) {
  addTiles(map, {
    url: `https://tiles.api-maps.yandex.ru/v1/tiles/?x={x}&y={y}&z={z}&lang={lang}&l=map&scale=${window.devicePixelRatio ?? 1}&maptype=future_map&apikey=${formState.apikey}`,
    attribution: ({ lang }) => {
      return lang.split("_")[0] === "ru"
        ? `<a href="https://yandex.ru/maps" target="_blank"><img src="/assets/yx_ru.svg" alt="Яндекс Карты"></a>`
        : `<a href="https://yandex.com/maps" target="_blank"><img src="/assets/yx_en.svg" alt="Yandex Maps"></a>`;
    },
    error: "/assets/blank.png",
    retries: 1,
    margin: 500,
  });
}

addDragPan(map, { ignore: "a, button" });
addZoomControl(map);

// map.center = getCenter(shape);
// map.bounds = getVicinity(shape);

fitGeoBounds(map, getVicinity(shape));

addElement(map, document.createElement("div"), {
  className: "marker",
  coords: [59.94589, 30.33479],
  content: ({ lang }) =>
    `<span>${lang.split("_")[0] === "ru" ? "Летний сад" : "Letní sad"}</span>`,
});

addShape(map, shape);

let shapeOutput = document.querySelector("pre")!;

let { reset: resetShapeEditor } = addShapeEditor(map, {
  onUpdate: (shape) => {
    let coords = shape.map(({ coords: [lat, lon] }) => {
      return `  [${toPrecision(lat, 8)}, ${toPrecision(lon, 8)}],`;
    });

    let content =
      coords.length === 0
        ? "shape: [/* From clicks on the map */];"
        : `shape: [\n${coords.join("\n")}\n];`;

    if (shapeOutput.textContent !== content) shapeOutput.textContent = content;
  },
  ignore: "a, button",
});

addPointerListener(map, ({ x, y, lat, lon }) => {
  console.log({ x, y, lat, lon });
});

addPinchToZoom(map);

addResizeObserver(map, console.log);

let { reset: resetMapOptions } = addPersistence(map);

initTestFormReset(() => {
  resetMapOptions();
  resetShapeEditor();
});

map.lang = formState.lang || "en_US";
