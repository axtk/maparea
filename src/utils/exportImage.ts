import { MapArea } from "../MapArea/index.ts";
import { getCompositeImage } from "./getCompositeImage.ts";
import { getDefaultExportName } from "./getDefaultExportName.ts";

export async function exportImage(map: MapArea, fileName?: string | null, type?: string, quality?: number) {
  let image = await getCompositeImage(map, type, quality);
  if (image === null) return;

  let link = document.createElement('a');
  link.download = fileName || getDefaultExportName();

  let url = URL.createObjectURL(image);
  link.href = url;
  link.click();

  URL.revokeObjectURL(url);
}
