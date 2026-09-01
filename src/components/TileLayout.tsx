import { useEffect, useRef } from "react";
import { DimensionState, TileData } from "../types";

interface TileLayoutProps {
  state: DimensionState;
  activeTile: TileData | null;
}

export default function TileLayout({ state, activeTile }: TileLayoutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    roomLengthM,
    roomWidthM,
    tileLengthMm,
    tileWidthMm,
    alignment,
    customStartX,
    customStartY,
  } = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas size
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // 1. Calculate display scales to fit room in canvas with padding
    const padding = 40;
    const displayWidth = width - padding * 2;
    const displayHeight = height - padding * 2;

    const roomAspect = roomLengthM / roomWidthM; // Height / Width
    const displayAspect = displayHeight / displayWidth;

    let scale = 1; // Pixels per physical meter
    let renderWidth = 0;
    let renderHeight = 0;

    if (roomAspect > displayAspect) {
      // Room is taller than display box
      renderHeight = displayHeight;
      scale = renderHeight / roomLengthM;
      renderWidth = roomWidthM * scale;
    } else {
      // Room is wider than display box
      renderWidth = displayWidth;
      scale = renderWidth / roomWidthM;
      renderHeight = roomLengthM * scale;
    }

    // Center the room inside the canvas
    const offsetX = (width - renderWidth) / 2;
    const offsetY = (height - renderHeight) / 2;

    // 2. Draw outer grid/background representation
    ctx.fillStyle = "#FAF9F6";
    ctx.fillRect(0, 0, width, height);

    // Draw Room Floor background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(offsetX, offsetY, renderWidth, renderHeight);

    // Save context for clipping inside the room boundaries
    ctx.save();
    ctx.beginPath();
    ctx.rect(offsetX, offsetY, renderWidth, renderHeight);
    ctx.clip();

    // 3. Tile drawing dimensions in pixels
    const tileW = (tileWidthMm / 1000) * scale;
    const tileH = (tileLengthMm / 1000) * scale;
    const groutW = 1.5; // Fixed small pixel size for blueprint representation

    // Ensure parameters are valid
    if (tileW <= 2 || tileH <= 2) {
      ctx.restore();
      return;
    }

    // Calculate starting offset based on Alignment selections
    let startX = 0;
    let startY = 0;

    if (alignment === "center") {
      // Center-align: Grout lines cross exactly at the center of the room,
      // or tiles are centered. Let's align tile centers at room center.
      const roomCenterX = renderWidth / 2;
      const roomCenterY = renderHeight / 2;

      // Find the starting coordinates far to the left/top
      const tilesLeft = Math.ceil(roomCenterX / (tileW + groutW));
      const tilesTop = Math.ceil(roomCenterY / (tileH + groutW));

      startX = roomCenterX - tilesLeft * (tileW + groutW) + groutW / 2;
      startY = roomCenterY - tilesTop * (tileH + groutW) + groutW / 2;

    } else if (alignment === "edge") {
      // Corner alignment: start flush from top-left (0,0) of the room
      startX = 0;
      startY = 0;
    } else {
      // Custom alignment using offsets percentages [0, 100]
      startX = ((customStartX % 100) / 100) * (tileW + groutW);
      startY = ((customStartY % 100) / 100) * (tileH + groutW);
    }

    // Accumulate metrics
    let fullTiles = 0;
    let cutTiles = 0;

    // Draw tile sheet repeating across the room
    // Loop far enough to ensure full room bounds coverage
    const minCol = -2;
    const maxCol = Math.ceil(renderWidth / (tileW + groutW)) + 2;
    const minRow = -2;
    const maxRow = Math.ceil(renderHeight / (tileH + groutW)) + 2;

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tx = offsetX + startX + c * (tileW + groutW);
        const ty = offsetY + startY + r * (tileH + groutW);

        // Calculate tile boundaries relative to room bounds (0 to renderWidth/Height)
        const rx = startX + c * (tileW + groutW);
        const ry = startY + r * (tileH + groutW);

        // Check if the tile is completely inside, partially cut, or fully outside
        const isOutside =
          rx + tileW <= 0 ||
          ry + tileH <= 0 ||
          rx >= renderWidth ||
          ry >= renderHeight;

        if (isOutside) continue;

        const isCut =
          rx < 0 ||
          ry < 0 ||
          rx + tileW > renderWidth ||
          ry + tileH > renderHeight;

        if (isCut) {
          cutTiles++;
          ctx.fillStyle = "rgba(254, 226, 226, 0.65)"; // Rose red for cut tiles
          ctx.strokeStyle = "rgba(185, 28, 28, 0.7)";
        } else {
          fullTiles++;
          ctx.fillStyle = "rgba(224, 242, 254, 0.7)"; // Sky blue for full tiles
          ctx.strokeStyle = "rgba(3, 105, 161, 0.7)";
        }

        ctx.lineWidth = 1;
        // Draw tile block
        ctx.fillRect(tx, ty, tileW, tileH);
        ctx.strokeRect(tx, ty, tileW, tileH);

        // Draw sub-patterns if the active tile has nice features
        if (activeTile && !isCut && tileW > 25) {
          ctx.save();
          ctx.globalAlpha = 0.15;
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 0.5;
          // Soft diagonals to show tile texture direction
          ctx.beginPath();
          ctx.moveTo(tx + 4, ty + 4);
          ctx.lineTo(tx + tileW - 4, ty + tileH - 4);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Restore clipped room boundary context
    ctx.restore();

    // 4. Draw outer room boundary walls (dark outline)
    ctx.strokeStyle = "#171717";
    ctx.lineWidth = 4.5;
    ctx.strokeRect(offsetX, offsetY, renderWidth, renderHeight);

    // 5. Draw dimensions arrows and text labels
    ctx.save();
    ctx.fillStyle = "#404040";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Room Length label (Right side vertically)
    const labelX = offsetX + renderWidth + 18;
    const labelY = offsetY + renderHeight / 2;
    ctx.translate(labelX, labelY);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(`${roomLengthM.toFixed(1)} m`, 0, 0);
    ctx.restore();

    // Room Width label (Bottom side horizontally)
    ctx.save();
    ctx.fillStyle = "#404040";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${roomWidthM.toFixed(1)} m`, offsetX + renderWidth / 2, offsetY + renderHeight + 18);
    ctx.restore();

    // 6. Draw Legend (Full vs Cut tiles)
    ctx.font = "bold 10px sans-serif";
    ctx.fillStyle = "#525252";
    
    // Full tiles marker
    ctx.fillStyle = "rgba(224, 242, 254, 0.9)";
    ctx.fillRect(20, height - 25, 12, 12);
    ctx.strokeStyle = "rgba(3, 105, 161, 0.9)";
    ctx.strokeRect(20, height - 25, 12, 12);
    ctx.fillStyle = "#404040";
    ctx.fillText(`Full Tiles: ~${fullTiles}`, 38, height - 19);

    // Cut tiles marker
    ctx.fillStyle = "rgba(254, 226, 226, 0.9)";
    ctx.fillRect(160, height - 25, 12, 12);
    ctx.strokeStyle = "rgba(185, 28, 28, 0.9)";
    ctx.strokeRect(160, height - 25, 12, 12);
    ctx.fillStyle = "#404040";
    ctx.fillText(`Edge Cut Tiles: ~${cutTiles}`, 178, height - 19);

  }, [roomLengthM, roomWidthM, tileLengthMm, tileWidthMm, alignment, customStartX, customStartY, activeTile]);

  return (
    <div className="flex flex-col items-center justify-center w-full bg-neutral-900 rounded-2xl p-4 md:p-6 shadow-xl border border-neutral-800" id="tile-simulator-canvas-wrapper">
      <div className="flex items-center justify-between w-full pb-3 border-b border-neutral-800/80 mb-4 text-white">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">Top-Down Layout Simulator</span>
        </div>
        <span className="text-[10px] bg-neutral-800 px-2.5 py-1 rounded border border-neutral-700 text-neutral-300">
          Scale Blueprint View
        </span>
      </div>

      <div className="relative w-full overflow-hidden flex items-center justify-center bg-white rounded-xl shadow-inner border border-neutral-200" id="blueprint-parent">
        <canvas
          ref={canvasRef}
          width={500}
          height={380}
          className="max-w-full rounded-lg"
          id="tilevista-blueprint-canvas"
        />
      </div>
    </div>
  );
}
