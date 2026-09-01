export type AppMode = "photo" | "dimension";

export type SurfaceType = "floor" | "wall" | "custom";

export type TilePattern = 
  | "straight" 
  | "brick" 
  | "running-bond" 
  | "stack" 
  | "herringbone" 
  | "diagonal" 
  | "random";

export interface Point2D {
  x: number; // normalized coordinate 0.0 to 1.0
  y: number; // normalized coordinate 0.0 to 1.0
  label?: string;
}

export interface TilePreset {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
}

export interface TileData {
  id: string;
  name: string;
  category: "marble" | "stone" | "ceramic" | "wood" | "concrete" | "pattern" | "plain" | "premium" | "custom";
  imageUrl: string; // can be base64, static url, or procedural canvas pattern
  widthMm: number;
  heightMm: number;
  colorStyle: string;
}

export interface EditorControlsState {
  surfaceType: SurfaceType;
  detectionMode: "auto" | "manual";
  
  // Tile params
  tileId: string;
  tileSizeScale: number; // 0.1 to 3.0 slider
  tileRotation: number;  // 0 to 360 degrees
  tilePattern: TilePattern;
  groutWidthMm: number;  // 0 to 20
  groutColor: string;    // HEX
  
  // Appearance params
  brightness: number;    // 0.5 to 1.5
  contrast: number;      // 0.5 to 1.5
  opacity: number;       // 0.0 to 1.0
  shadow: number;        // 0.0 to 1.0
  reflection: number;    // 0.0 to 1.0
  textureIntensity: number; // 0.0 to 1.0
  
  // Perspective params
  perspectiveStrength: number; // 0.0 to 1.0
  offsetX: number;       // -100 to 100
  offsetY: number;       // -100 to 100
  scale: number;         // 0.1 to 3.0
}

export interface DimensionState {
  roomLengthM: number;
  roomWidthM: number;
  tileLengthMm: number;
  tileWidthMm: number;
  wastagePercent: number;
  alignment: "center" | "edge" | "custom";
  customStartX: number; // percentage offset
  customStartY: number; // percentage offset
}

export interface EstimationResult {
  roomAreaSqM: number;
  tileAreaSqM: number;
  estimatedTilesCount: number;
  wastageCount: number;
  totalTilesCount: number;
  totalCoverageSqM: number;
}
