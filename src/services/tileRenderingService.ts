import { TilePattern } from "../types";

/**
 * Creates an offscreen canvas containing a tiled repeating sheet
 * based on the uploaded tile image, scaled sizes, grout parameters, and specific layout patterns.
 */
export function createTilePatternSheet(
  tileImg: HTMLImageElement | HTMLCanvasElement,
  pattern: TilePattern,
  baseTileWidth: number, // width in pixels
  baseTileHeight: number, // height in pixels
  groutWidthPx: number,
  groutColor: string,
  tileRotation: number // Custom rotation degrees
): HTMLCanvasElement {
  const sheetCanvas = document.createElement("canvas");
  const size = 2048; // Generous size to handle high-resolution perspective warping without pixelation
  sheetCanvas.width = size;
  sheetCanvas.height = size;
  const ctx = sheetCanvas.getContext("2d");

  if (!ctx) return sheetCanvas;

  // 1. Fill entire sheet background with the Grout color
  ctx.fillStyle = groutColor;
  ctx.fillRect(0, 0, size, size);

  // Apply general tile rotation if requested (independent of pattern diagonal rotation)
  ctx.save();
  if (tileRotation !== 0) {
    ctx.translate(size / 2, size / 2);
    ctx.rotate((tileRotation * Math.PI) / 180);
    ctx.translate(-size / 2, -size / 2);
  }

  const w = baseTileWidth;
  const h = baseTileHeight;
  const g = groutWidthPx;

  // Ensure dimensions are positive
  if (w <= 1 || h <= 1) {
    ctx.restore();
    return sheetCanvas;
  }

  if (pattern === "diagonal") {
    // Rotating offscreen drawing context 45 degrees
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(Math.PI / 4);
    ctx.translate(-size / 2, -size / 2);

    // Draw straight grid on the rotated coordinate system
    // We expand boundaries to ensure coverage when rotated
    for (let y = -h * 3; y < size + h * 3; y += h + g) {
      for (let x = -w * 3; x < size + w * 3; x += w + g) {
        ctx.drawImage(tileImg, x, y, w, h);
      }
    }
    ctx.restore();

  } else if (pattern === "brick" || pattern === "running-bond") {
    // Staggered rows
    let rowIndex = 0;
    const offsetRatio = pattern === "brick" ? 0.5 : 0.33;
    const stepY = h + g;
    const stepX = w + g;

    for (let y = -h * 2; y < size + h * 2; y += stepY) {
      const offset = (rowIndex % 2 !== 0) ? stepX * offsetRatio : 0;
      for (let x = -w * 3; x < size + w * 2; x += stepX) {
        ctx.drawImage(tileImg, x + offset, y, w, h);
      }
      rowIndex++;
    }

  } else if (pattern === "herringbone") {
    // Standard interlocking L-shape herringbone pattern
    // Works best with elongated tiles (e.g., wood planks or brick shapes)
    // We can simulate herringbone by rotating tiles or drawing interlocking rows.
    // Let's create a clean grid of interlocking 45/135-deg pairs or a beautiful 90-degree interlocking herringbone.
    // An interlocking 90-degree herringbone uses tiles of size w x h where w is a ratio of h (e.g. h = 4 * w)
    // To make it robust and fit any tile, we draw interlocking horizontal and vertical blocks
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(Math.PI / 4); // Standard herringbone is diagonal
    ctx.translate(-size / 2, -size / 2);

    const step = h + w + g * 2;
    // Expanded limits
    for (let y = -step * 2; y < size + step * 2; y += step / 2) {
      for (let x = -step * 2; x < size + step * 2; x += step) {
        // We draw vertical plank
        ctx.save();
        ctx.translate(x, y);
        ctx.drawImage(tileImg, 0, 0, w, h);
        ctx.restore();

        // Draw horizontal plank locked next to it
        ctx.save();
        ctx.translate(x + w + g, y + w + g);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(tileImg, 0, 0, w, h);
        ctx.restore();
      }
    }
    ctx.restore();

  } else if (pattern === "random") {
    // Straight grid but with slightly offset rows/cols and randomized tile rotations/flips
    let rowIndex = 0;
    const stepY = h + g;
    const stepX = w + g;

    for (let y = -h * 2; y < size + h * 2; y += stepY) {
      // Small randomized shift per row
      const randomShift = (Math.sin(rowIndex) * 0.15) * stepX;
      for (let x = -w * 2; x < size + w * 2; x += stepX) {
        ctx.save();
        ctx.translate(x + randomShift + w / 2, y + h / 2);
        
        // Random flip (180 deg or scales) to make textures look natural and non-repeating
        const hash = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 4;
        if (hash < 1) {
          ctx.scale(-1, 1);
        } else if (hash < 2) {
          ctx.scale(1, -1);
        } else if (hash < 3) {
          ctx.rotate(Math.PI);
        }
        
        ctx.drawImage(tileImg, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
      rowIndex++;
    }

  } else {
    // "straight" or "stack" - Classic grid pattern
    const stepY = h + g;
    const stepX = w + g;

    for (let y = -h; y < size + h; y += stepY) {
      for (let x = -w; x < size + w; x += stepX) {
        ctx.drawImage(tileImg, x, y, w, h);
      }
    }
  }

  ctx.restore(); // Restore overall tile rotation
  return sheetCanvas;
}
