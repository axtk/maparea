export type RenderingProps = {
  lineDash?: number[];
  fillRule?: CanvasFillRule;
} & Partial<
  CanvasPathDrawingStyles &
    CanvasTextDrawingStyles &
    CanvasFillStrokeStyles &
    CanvasShadowStyles &
    CanvasFilters
>;
