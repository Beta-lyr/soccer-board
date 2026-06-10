import * as fabric from "fabric";

/**
 * 将三层（SVG背景 + Fabric球员 + Canvas2D画线）合成为一张 PNG
 */
export async function exportCompositePng(params: {
  svgElement: SVGSVGElement;
  fabricCanvas: fabric.Canvas;
  drawingCanvas: HTMLCanvasElement;
  width: number;
  height: number;
  multiplier?: number;
}): Promise<string> {
  const { svgElement, fabricCanvas, drawingCanvas, width, height, multiplier = 2 } = params;

  const offscreen = document.createElement("canvas");
  offscreen.width = width * multiplier;
  offscreen.height = height * multiplier;
  const ctx = offscreen.getContext("2d")!;
  ctx.scale(multiplier, multiplier);

  // Layer 0: SVG 背景
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  const bgImg = new Image();
  await new Promise<void>((resolve, reject) => {
    bgImg.onload = () => resolve();
    bgImg.onerror = reject;
    bgImg.src = svgUrl;
  });
  ctx.drawImage(bgImg, 0, 0, width, height);
  URL.revokeObjectURL(svgUrl);

  // Layer 1: Fabric 球员
  const fabricImg = new Image();
  const fabricDataUrl = fabricCanvas.toDataURL({ format: "png", multiplier: 1 });
  await new Promise<void>((resolve, reject) => {
    fabricImg.onload = () => resolve();
    fabricImg.onerror = reject;
    fabricImg.src = fabricDataUrl;
  });
  ctx.drawImage(fabricImg, 0, 0, width, height);

  // Layer 2: Canvas2D 画线
  ctx.drawImage(drawingCanvas, 0, 0, width, height);

  return offscreen.toDataURL("image/png");
}
