export function toPrecision(x: number, n: number) {
  return x
    .toFixed(n)
    .replace(/\.(\d*[^0])0+$/, ".$1")
    .replace(/\.0+$/, "");
}
