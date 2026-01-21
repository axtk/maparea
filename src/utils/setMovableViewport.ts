export type ElementNavigationOptions = {
  onStart?: () => void;
  onMove?: (dx: number, dy: number) => void;
  onEnd?: () => void;
  wheel?: boolean;
};

export function setMovableViewport(
  element: HTMLElement,
  { onStart, onMove, onEnd, wheel }: ElementNavigationOptions = {},
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

  let mouseHandler: ((event: MouseEvent) => void) | null = null;
  let touchHandler: ((event: TouchEvent) => void) | null = null;

  element.addEventListener("mousedown", (event) => {
    if (mouseHandler) return;
    
    event.preventDefault();
    start(event.pageX, event.pageY);

    mouseHandler = (event) => {
      event.preventDefault();
      moveTo(event.pageX, event.pageY);
    };

    element.addEventListener("mousemove", mouseHandler);
  });

  element.addEventListener("mouseup", (event) => {
    if (!mouseHandler) return;

    event.preventDefault();
    end(event.pageX, event.pageY);

    element.removeEventListener("mousemove", mouseHandler);
    mouseHandler = null;
  });

  element.addEventListener("touchstart", (event) => {
    if (touchHandler) return;

    event.preventDefault();
    start(event.touches[0]?.pageX, event.touches[0]?.pageY);

    touchHandler = (event) => {
      event.preventDefault();
      moveTo(event.touches[0]?.pageX, event.touches[0]?.pageY);
    };

    element.addEventListener("touchmove", touchHandler);
  });

  element.addEventListener("touchend", (event) => {
    if (!touchHandler) return;

    event.preventDefault();
    end(event.touches[0]?.pageX, event.touches[0]?.pageY);

    element.removeEventListener("touchmove", touchHandler);
    touchHandler = null;
  });

  element.addEventListener("touchcancel", (event) => {
    if (!touchHandler) return;

    event.preventDefault();
    end(event.touches[0]?.pageX, event.touches[0]?.pageY);

    element.removeEventListener("touchmove", touchHandler);
    touchHandler = null;
  });

  if (wheel) {
    let dt = 10;

    element.addEventListener("wheel", (event) => {
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
