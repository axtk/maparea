import type { MapArea } from "../MapArea/index.ts";
import { getSnapshot, GetSnapshotOptions } from "./getSnapshot.ts";
import { getDefaultExportName } from "./getDefaultExportName.ts";

export type ExportImageOptions = GetSnapshotOptions & {
  fileName?: string;
};

export async function exportImage(map: MapArea, options: ExportImageOptions = {}) {
  let image = await getSnapshot(map, options);
  if (image === null) return;

  let link = document.createElement("a");
  link.download = options.fileName || getDefaultExportName();

  let url = URL.createObjectURL(image);
  link.href = url;
  link.click();

  URL.revokeObjectURL(url);
}
