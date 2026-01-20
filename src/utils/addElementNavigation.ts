export type ElementNavigationOptions = {
  onStart?: () => void;
  onMove?: (dx: number, dy: number) => void;
  onEnd?: () => void;
  wheel?: boolean;
};

export function addElementNavigation(
  element: HTMLElement,
  { onStart, onMove, onEnd, wheel }: ElementNavigationOptions = {},
) {
  let x0: number | null = null;
  let y0: number | null = null;
  let t0 = Date.now();

  let nextMove: ReturnType<typeof requestAnimationFrame> | null = null;
  let wheelTimeout: ReturnType<typeof setTimeout> | null = null;

  let started = false;
  let wheelActive = false;

  function moveBy(dx: number, dy: number, dt = 100) {
    if (wheelTimeout !== null) {
      clearTimeout(wheelTimeout);
      wheelTimeout = null;
    }

    if (nextMove !== null) {
      cancelAnimationFrame(nextMove);
      nextMove = null;
    }

    let t = Date.now();

    if (t - t0 < dt) return;

    if (x0 !== null) x0 -= dx;
    if (y0 !== null) y0 -= dy;
    t0 = t;

    if (!wheelActive && !element.dataset.dragged)
      element.dataset.dragged = "true";

    nextMove = requestAnimationFrame(() => {
      nextMove = null;
      if (dx !== 0 || dy !== 0) onMove?.(dx, dy);
    });
  }

  function moveTo(x: number, y: number, dt?: number) {
    if (x0 !== null && y0 !== null) moveBy(x0 - x, y0 - y, dt);
  }

  function start(x?: number, y?: number) {
    started = true;
    onStart?.();

    if (x !== undefined) x0 = x;
    if (y !== undefined) y0 = y;

    t0 = Date.now();
  }

  function end(x?: number, y?: number) {
    started = false;
    wheelTimeout = null;

    if (x !== undefined && y !== undefined) moveTo(x, y);

    delete element.dataset.dragged;

    x0 = null;
    y0 = null;

    requestAnimationFrame(() => {
      onEnd?.();
    });
  }

  element.dataset.draggable = "true";

  let mouseHandler: ((event: MouseEvent) => void) | null = null;
  let touchHandler: ((event: TouchEvent) => void) | null = null;

  element.addEventListener("mousedown", (event) => {
    event.preventDefault();

    if (mouseHandler) return;

    start(event.clientX, event.clientY);
    mouseHandler = (event) => {
      event.preventDefault();
      moveTo(event.clientX, event.clientY);
    };
    element.addEventListener("mousemove", mouseHandler);
  });

  element.addEventListener("mouseup", (event) => {
    event.preventDefault();

    if (!mouseHandler) return;

    end(event.clientX, event.clientY);
    element.removeEventListener("mousemove", mouseHandler);
    mouseHandler = null;
  });

  element.addEventListener("touchstart", (event) => {
    event.preventDefault();

    if (touchHandler) return;

    start(event.touches[0]?.clientX, event.touches[0]?.clientY);
    touchHandler = (event) => {
      event.preventDefault();
      moveTo(event.touches[0]?.clientX, event.touches[0]?.clientY);
    };
    element.addEventListener("touchmove", touchHandler);
  });

  element.addEventListener("touchend", (event) => {
    event.preventDefault();

    if (!touchHandler) return;

    end(event.touches[0]?.clientX, event.touches[0]?.clientY);
    element.removeEventListener("touchmove", touchHandler);
    touchHandler = null;
  });

  element.addEventListener("touchcancel", (event) => {
    event.preventDefault();

    if (!touchHandler) return;

    end(event.touches[0]?.clientX, event.touches[0]?.clientY);
    element.removeEventListener("touchmove", touchHandler);
    touchHandler = null;
  });

  if (wheel) {
    let dt = 10;

    element.addEventListener("wheel", (event) => {
      event.preventDefault();

      if (!started) {
        wheelActive = true;
        start();
      }

      if (event.shiftKey) moveBy(event.deltaY, event.deltaX, dt);
      else moveBy(event.deltaX, event.deltaY, dt);

      wheelTimeout = setTimeout(() => {
        end();
        wheelActive = false;
      }, 200);
    });
  }
}
