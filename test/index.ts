import "./index.css";
import {
  addDragPan,
  addElement,
  addPathEditor,
  addPersistence,
  addPinchToZoom,
  addPointerListener,
  addResizeObserver,
  addShapes,
  addTiles,
  addZoomControl,
  fitGeoBounds,
  type GeoCoords,
  // getCenter,
  getVicinity,
  MapArea,
} from "../index.ts";
import { Circle } from "../src/utils/shapes/Circle.ts";
import { Path } from "../src/utils/shapes/Path.ts";
import { toPrecision } from "../src/utils/toPrecision.ts";
import { initTestForm, initTestFormReset } from "./form.ts";
import { shape } from "./shape.ts";

let formState = initTestForm();
let lang = formState.lang || "en_US";

let map = new MapArea({
  container: "#map",
  center: [59.94607, 30.33476],
  projection: "ellipsoidal",
  zoom: 10,
  lang,
});

// map.center = getCenter(shape);
// map.bounds = getVicinity(shape);

fitGeoBounds(map, getVicinity(shape));

addDragPan(map, { ignore: "a, button" });
addZoomControl(map);

if (formState.apikey) {
  addTiles(map, {
    url: `https://tiles.api-maps.yandex.ru/v1/tiles/?x={x}&y={y}&z={z}&lang={lang}&l=map&scale=${window.devicePixelRatio ?? 1}&maptype=future_map&apikey=${formState.apikey}`,
    attribution: ({ lang }) => {
      return lang.split("_")[0] === "ru"
        ? `<a href="https://yandex.ru/maps" target="_blank"><img src="/assets/yx_ru.svg" alt="Яндекс Карты"></a>`
        : `<a href="https://yandex.com/maps" target="_blank"><img src="/assets/yx_en.svg" alt="Yandex Maps"></a>`;
    },
    error: "/assets/blank.png",
    retries: 3,
    // labels: true,
  });
}

let marker = document.createElement("div");
marker.className = "marker";
marker.innerHTML = `<span>${lang.split("_")[0] === "ru" ? "Летний сад" : "Letní sad"}</span>`;

addElement(map, marker, {
  position: [59.94589, 30.33479],
});

let markers: GeoCoords[] = [];
while (markers.length < 3)
  markers.push(shape[Math.floor(shape.length * Math.random())]);

addShapes(map, [
  new Path(shape, {
    strokeStyle: "#c71585b0",
    lineWidth: 5,
  }),
  ...markers.map(
    (c) =>
      new Circle(c, 5, {
        strokeStyle: "#c71585b0",
        fillStyle: "#fff",
        lineWidth: 2,
      }),
  ),
]);

let pathEditorOutput = document.querySelector("pre")!;

let { clear: clearPathEditor } = addPathEditor(map, {
  onUpdate: (points) => {
    let lines = points.map(([lat, lon]) => {
      return `  [${toPrecision(lat, 8)}, ${toPrecision(lon, 8)}],`;
    });

    let content =
      points.length === 0
        ? "points: [/* From clicks on the map */];"
        : `points: [\n${lines.join("\n")}\n];`;

    if (pathEditorOutput.textContent !== content)
      pathEditorOutput.textContent = content;
  },
  path: {
    strokeStyle: "#c71585b0",
    lineWidth: 5,
  },
  markers: {
    r: 5,
    strokeStyle: "#c71585b0",
    fillStyle: "#fff",
    lineWidth: 2,
  },
  ignore: "a, button",
});

addPointerListener(map, ({ x, y, lat, lon }) => {
  console.log({ x, y, lat, lon });
});

addPinchToZoom(map);

addResizeObserver(map, console.log);

let { clear: clearMapState } = addPersistence(map);

initTestFormReset(() => {
  clearMapState();
  clearPathEditor();
});
