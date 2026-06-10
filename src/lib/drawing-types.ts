export type DrawingType = "run" | "pass" | "dribble" | "defend";

export interface Point {
  x: number;
  y: number;
}

interface DrawingBase {
  id: string;
  type: DrawingType;
}

export interface LineDrawing extends DrawingBase {
  type: "run" | "pass" | "dribble";
  start: Point;
  end: Point;
}

export interface DefendDrawing extends DrawingBase {
  type: "defend";
  topLeft: Point;
  bottomRight: Point;
}

export type Drawing = LineDrawing | DefendDrawing;

/** 判断旧数据是否为新格式 Drawing[] */
export function isDrawingArray(data: unknown): data is Drawing[] {
  return Array.isArray(data) && data.length > 0 && "id" in data[0] && "type" in data[0];
}
