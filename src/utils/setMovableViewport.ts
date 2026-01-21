import type { IgnoredElement } from "../types/IgnoredElement.ts";
import { shouldIgnore } from "./shouldIgnore.ts";

export type ElementNavigationOptions = {
  onStart?: () => void;
  onMove?: (dx: number, dy: number) => void;
  onEnd?: () => void;
  wheel?: boolean;
  ignore?: IgnoredElement;
};

export function setMovableViewport(
  element: HTMLElement,
  { onStart, onMove, onEnd, wheel, ignore }: ElementNavigationOptions = {},
) {
  let x0: number | null = null;
  let y0: number | null = null;
  let t0 = Date.now();

  let nextMove: ReturnType<typeof requestAnimationFrame> | null = null;
  let wheelEndTimeout: ReturnType<typeof setTimeout> | null = null;

  let started = false;
  let wheelActive = false;

  let dxTotal = 0;
  let dyTotal = 0;

  function moveBy(dx: number, dy: number, dt = 100) {
    // Accumulating shifts until the actual move from the rAF callback occurs
    dxTotal += dx;
    dyTotal += dy;

    // Updating `x0` and `y0` used by `moveTo()` to have updated `dx` and `dy`
    // at each move
    if (x0 !== null) x0 -= dx;
    if (y0 !== null) y0 -= dy;

    if (!wheelActive && !element.dataset.dragged)
      element.dataset.dragged = "true";

    let t = Date.now();

    if ((dxTotal !== 0 || dyTotal !== 0) && t - t0 >= dt) {
      if (nextMove) cancelAnimationFrame(nextMove);

      nextMove = requestAnimationFrame(() => {
        onMove?.(dxTotal, dyTotal);

        dxTotal = 0;
        dyTotal = 0;
        t0 = t;

        nextMove = null;
      });
    }
  }

  function moveTo(x: number, y: number, dt?: number) {
    if (x0 !== null && y0 !== null) moveBy(x0 - x, y0 - y, dt);
  }

  function start(x?: number, y?: number) {
    if (wheelEndTimeout !== null) {
      clearTimeout(wheelEndTimeout);
      wheelActive = false;
      wheelEndTimeout = null;
    }

    started = true;
    onStart?.();

    if (x !== undefined) x0 = x;
    if (y !== undefined) y0 = y;

    t0 = Date.now();

    dxTotal = 0;
    dyTotal = 0;
  }

  function end(x?: number, y?: number) {
    started = false;

    if (x !== undefined && y !== undefined) moveTo(x, y);

    delete element.dataset.dragged;

    x0 = null;
    y0 = null;

    onEnd?.();
  }

  element.dataset.draggable = "true";

  let pointerEventHandler: ((event: PointerEvent) => void) | null = null;

  function handlePointerDown(event: PointerEvent) {
    if (pointerEventHandler || shouldIgnore(event.target, ignore)) return;

    event.preventDefault();
    start(event.pageX, event.pageY);

    pointerEventHandler = (event) => {
      event.preventDefault();
      moveTo(event.pageX, event.pageY);
    };

    element.addEventListener("pointermove", pointerEventHandler);
  }

  function handlePointerUp(event: PointerEvent) {
    if (!pointerEventHandler || shouldIgnore(event.target, ignore)) return;

    event.preventDefault();
    end(event.pageX, event.pageY);

    element.removeEventListener("pointermove", pointerEventHandler);
    pointerEventHandler = null;
  }

  element.addEventListener("pointerdown", handlePointerDown);
  element.addEventListener("pointerup", handlePointerUp);
  element.addEventListener("pointercancel", handlePointerUp);

  if (wheel) {
    let dt = 10;

    element.addEventListener("wheel", (event) => {
      if (shouldIgnore(event.target, ignore)) return;

      event.preventDefault();

      if (!started) {
        start();
        wheelActive = true;
      }

      if (event.shiftKey) moveBy(event.deltaY, event.deltaX, dt);
      else moveBy(event.deltaX, event.deltaY, dt);

      if (wheelEndTimeout !== null) clearTimeout(wheelEndTimeout);

      wheelEndTimeout = setTimeout(() => {
        end();
        wheelActive = false;
        wheelEndTimeout = null;
      }, 200);
    });
  }
}
