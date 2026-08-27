import type { RenderingStyles } from "./RenderingStyles.ts";

export type RenderingProps = {
  lineDash?: number[];
  fillRule?: CanvasFillRule;
} & RenderingStyles;
