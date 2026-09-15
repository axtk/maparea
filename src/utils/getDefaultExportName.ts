export function getDefaultExportName() {
  let d = new Date();

  let Y = d.getFullYear();
  let M = d.getMonth() + 1;
  let D = d.getDate();

  let h = d.getHours();
  let m = d.getMinutes();
  let s = d.getSeconds();

  return `${Y}${M}${D}_${h}${m}${s}`;
}
