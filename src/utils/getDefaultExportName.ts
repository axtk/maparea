let p = (x: number) => String(x).padStart(2, "0");

export function getDefaultExportName() {
  let d = new Date();

  let Y = d.getFullYear();
  let M = d.getMonth() + 1;
  let D = d.getDate();

  let h = d.getHours();
  let m = d.getMinutes();
  let s = d.getSeconds();

  return `${p(Y)}${p(M)}${p(D)}_${p(h)}${p(m)}${p(s)}`;
}
