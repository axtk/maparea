export function getPointerPosition(event: MouseEvent | TouchEvent): [number, number] | null {
  let e = "touches" in event ? event.touches[0] : event;

  return e ? [e.clientX, e.clientY] : null;
}
