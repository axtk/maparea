export type RenderingStyles = Partial<
  Pick<CanvasPathDrawingStyles,
    | "lineCap"
    | "lineDashOffset"
    | "lineJoin"
    | "lineWidth"
    | "miterLimit"
  > &
  Pick<CanvasTextDrawingStyles,
    | "direction"
    | "font"
    | "fontKerning"
    | "fontStretch"
    | "fontVariantCaps"
    | "letterSpacing"
    | "textAlign"
    | "textBaseline"
    | "textRendering"
    | "wordSpacing"
  > &
  Pick<CanvasFillStrokeStyles,
    | "fillStyle"
    | "strokeStyle"
  > &
  Pick<CanvasShadowStyles,
    | "shadowBlur"
    | "shadowColor"
    | "shadowOffsetX"
    | "shadowOffsetY"
  > &
  Pick<CanvasFilters,
    | "filter"
  > &
  Pick<CanvasCompositing,
    | "globalAlpha"
    | "globalCompositeOperation"
  >
>;
