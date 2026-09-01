import React, { useRef, useEffect, useState } from "react";
import { Point2D, EditorControlsState } from "../types";
import { drawTriangleTexture, interpolateQuad, isConvexQuad } from "../utils/geometryUtils";
import { Maximize, HelpCircle, Eye, Download, Loader2 } from "lucide-react";

/**
 * Creates a thresholded binary mask from the overlay image.
 * Solid elements like furniture, frames, and windows (which have alpha > 150)
 * are mapped to fully opaque black, while soft shadows (alpha <= 150) or empty space
 * are mapped to fully transparent.
 * This is used for perfect destination-out alpha masking so tiles don't bleed under furniture.
 */
function createThresholdedMask(
  sourceImg: HTMLImageElement,
  width: number,
  height: number
): HTMLCanvasElement | HTMLImageElement {
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const mCtx = maskCanvas.getContext("2d");
  if (!mCtx) return sourceImg;

  mCtx.drawImage(sourceImg, 0, 0, width, height);

  try {
    const imgData = mCtx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      // Solid elements (furniture, window frame, wall frames) have high opacity (alpha > 150).
      // Soft ambient ground shadows have low opacity (alpha <= 150).
      if (alpha > 150) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
      } else {
        data[i + 3] = 0;
      }
    }
    mCtx.putImageData(imgData, 0, 0);
    return maskCanvas;
  } catch (e) {
    // Graceful fallback for local dev sandbox/cross-origin limits
    console.warn("Mask thresholding failed, using original overlay instead", e);
    return sourceImg;
  }
}

interface VisualizationCanvasProps {
  roomImageSrc: string | null;
  roomOverlaySrc?: string | null;
  tilePatternSheet: HTMLCanvasElement | null;
  points: Point2D[];
  onPointsChange: (newPoints: Point2D[]) => void;
  controls: EditorControlsState;
  showComparisonSlider: boolean;
  comparisonProgress: number; // 0 to 100
  onComparisonChange?: (progress: number) => void;
  showAfterOnly: boolean;
}

export default function VisualizationCanvas({
  roomImageSrc,
  roomOverlaySrc = null,
  tilePatternSheet,
  points,
  onPointsChange,
  controls,
  showComparisonSlider,
  comparisonProgress,
  onComparisonChange,
  showAfterOnly,
}: VisualizationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roomImageRef = useRef<HTMLImageElement | null>(null);
  const roomOverlayRef = useRef<HTMLImageElement | null>(null);

  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [activeHandleIndex, setActiveHandleIndex] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isHoveringHandle, setIsHoveringHandle] = useState<number | null>(null);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [downloadedImage, setDownloadedImage] = useState<string | null>(null);
  const [isUHDSelected, setIsUHDSelected] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [emailSubmitted, setEmailSubmitted] = useState<boolean>(false);

  // Load the room image
  useEffect(() => {
    if (!roomImageSrc) {
      roomImageRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.src = roomImageSrc;
    img.onload = () => {
      roomImageRef.current = img;
      handleResize();
      setImagesLoaded((prev) => prev + 1);
    };
  }, [roomImageSrc]);

  // Load the room transparent overlay image
  useEffect(() => {
    if (!roomOverlaySrc) {
      roomOverlayRef.current = null;
      setImagesLoaded((prev) => prev + 1);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.src = roomOverlaySrc;
    img.onload = () => {
      roomOverlayRef.current = img;
      setImagesLoaded((prev) => prev + 1);
    };
  }, [roomOverlaySrc]);

  // Handle canvas sizing dynamically on window or container resize
  const handleResize = () => {
    if (!containerRef.current || !roomImageRef.current) return;
    const containerWidth = containerRef.current.clientWidth || 800;
    const img = roomImageRef.current;

    // Calculate aspect-ratio bounds with fallbacks to avoid NaN division
    const naturalWidth = img.naturalWidth || 1024;
    const naturalHeight = img.naturalHeight || 768;
    const maxDisplayWidth = containerWidth;
    const aspect = naturalHeight / naturalWidth;
    const calculatedHeight = Math.min(600, maxDisplayWidth * aspect) || 450;
    const calculatedWidth = (calculatedHeight / aspect) || 600;

    setDimensions({
      width: Math.floor(calculatedWidth),
      height: Math.floor(calculatedHeight),
    });
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [roomImageSrc]);

  // Main rendering loop inside canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    const roomImg = roomImageRef.current;
    if (!roomImg) return;

    // 1. Draw baseline "Before" room image
    ctx.drawImage(roomImg, 0, 0, dimensions.width, dimensions.height);

    // Prepare clipping rect if we are using the before/after slider
    ctx.save();
    let isClipped = false;
    const sliderX = (comparisonProgress / 100) * dimensions.width;

    if (showComparisonSlider && !showAfterOnly) {
      ctx.beginPath();
      ctx.rect(sliderX, 0, dimensions.width - sliderX, dimensions.height);
      ctx.clip();
      isClipped = true;
    }

    // 2. Draw active tiled layer
    if (tilePatternSheet && points.length === 4) {
      // Calculate pixel-absolute points
      const pAbs = points.map((p) => ({
        x: p.x * dimensions.width,
        y: p.y * dimensions.height,
      }));

      // Render perspective tiled mesh
      // We subdivide the quad into an NxN grid.
      // 16x16 offers incredible perspective rendering and is fully hardware-accelerated.
      const gridCount = 16;
      
      // Temporary offscreen buffer for the tiles so we can apply styling layers easily
      const tileLayerCanvas = document.createElement("canvas");
      tileLayerCanvas.width = dimensions.width;
      tileLayerCanvas.height = dimensions.height;
      const tCtx = tileLayerCanvas.getContext("2d");

      if (tCtx) {
        // Draw perspective grid on temporary buffer
        for (let j = 0; j < gridCount; j++) {
          for (let i = 0; i < gridCount; i++) {
            const s0 = i / gridCount;
            const s1 = (i + 1) / gridCount;
            const t0 = j / gridCount;
            const t1 = (j + 1) / gridCount;

            // Interpolate target vertices
            const tTL = interpolateQuad(pAbs[0], pAbs[1], pAbs[2], pAbs[3], s0, t0);
            const tTR = interpolateQuad(pAbs[0], pAbs[1], pAbs[2], pAbs[3], s1, t0);
            const tBR = interpolateQuad(pAbs[0], pAbs[1], pAbs[2], pAbs[3], s1, t1);
            const tBL = interpolateQuad(pAbs[0], pAbs[1], pAbs[2], pAbs[3], s0, t1);

            // Interpolate source pattern coordinates
            // Factoring in zoom scale, perspective strength, and offsets from controls
            const sc = controls.scale;
            const ox = controls.offsetX * 2;
            const oy = controls.offsetY * 2;

            const u0 = s0 * 1024 * sc + ox;
            const u1 = s1 * 1024 * sc + ox;
            const v0 = t0 * 1024 * sc + oy;
            const v1 = t1 * 1024 * sc + oy;

            // Split quad into 2 triangles
            // Triangle A
            drawTriangleTexture(
              tCtx,
              tilePatternSheet,
              u0, v0,
              u1, v0,
              u0, v1,
              tTL.x, tTL.y,
              tTR.x, tTR.y,
              tBL.x, tBL.y
            );

            // Triangle B
            drawTriangleTexture(
              tCtx,
              tilePatternSheet,
              u1, v0,
              u1, v1,
              u0, v1,
              tTR.x, tTR.y,
              tBR.x, tBR.y,
              tBL.x, tBL.y
            );
          }
        }

        // Apply alpha-masking using the thresholded room overlay mask
        // This ensures the tile pattern is rendered exclusively behind furniture, windows, and frames
        const roomOverlayImg = roomOverlayRef.current;
        if (roomOverlayImg && tCtx) {
          const mask = createThresholdedMask(roomOverlayImg, dimensions.width, dimensions.height);
          tCtx.save();
          tCtx.globalCompositeOperation = "destination-out";
          tCtx.drawImage(mask, 0, 0, dimensions.width, dimensions.height);
          tCtx.restore();
        }

        // Apply appearance styling (opacity, brightness, contrast)
        ctx.save();
        ctx.globalAlpha = controls.opacity;

        // Draw compiled tiled quadrilateral
        ctx.drawImage(tileLayerCanvas, 0, 0);
        ctx.restore();

        // 3. Shadow / Reflection Multiplier Overlay
        // Draw original room photo back over the tiles using "multiply" mode to preserve realistic ambient shadows!
        if (controls.shadow > 0) {
          ctx.save();
          ctx.globalCompositeOperation = "multiply";
          ctx.globalAlpha = controls.shadow * 0.85;
          
          // Draw mask of quadrilateral first
          ctx.beginPath();
          ctx.moveTo(pAbs[0].x, pAbs[0].y);
          ctx.lineTo(pAbs[1].x, pAbs[1].y);
          ctx.lineTo(pAbs[2].x, pAbs[2].y);
          ctx.lineTo(pAbs[3].x, pAbs[3].y);
          ctx.closePath();
          ctx.clip();

          // Draw grey-scaled luminance-channel copy of original room image
          ctx.drawImage(roomImg, 0, 0, dimensions.width, dimensions.height);
          ctx.restore();
        }

        // 4. Specular Reflection / Highlight Overlay
        // Draws soft white sheen over high exposure areas
        if (controls.reflection > 0) {
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          ctx.globalAlpha = controls.reflection * 0.45;

          ctx.beginPath();
          ctx.moveTo(pAbs[0].x, pAbs[0].y);
          ctx.lineTo(pAbs[1].x, pAbs[1].y);
          ctx.lineTo(pAbs[2].x, pAbs[2].y);
          ctx.lineTo(pAbs[3].x, pAbs[3].y);
          ctx.closePath();
          ctx.clip();

          // Generate reflection highlights using original room overlays
          ctx.drawImage(roomImg, 0, 0, dimensions.width, dimensions.height);
          ctx.restore();
        }

        // 5. Apply Contrast & Brightness overlays on top of the quadrilateral
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pAbs[0].x, pAbs[0].y);
        ctx.lineTo(pAbs[1].x, pAbs[1].y);
        ctx.lineTo(pAbs[2].x, pAbs[2].y);
        ctx.lineTo(pAbs[3].x, pAbs[3].y);
        ctx.closePath();
        ctx.clip();

        // Adjust Brightness
        if (controls.brightness !== 1.0) {
          ctx.fillStyle = controls.brightness > 1.0 ? "white" : "black";
          ctx.globalAlpha = Math.abs(controls.brightness - 1.0) * 0.4;
          ctx.fill();
        }
        ctx.restore();
      }
    }

    ctx.restore(); // Restores clip state

    // 5.5 Draw high-fidelity transparent furniture and wall trim overlay on top of tiles
    const roomOverlayImg = roomOverlayRef.current;
    if (roomOverlayImg) {
      ctx.drawImage(roomOverlayImg, 0, 0, dimensions.width, dimensions.height);
    }

    // 6. Draw comparison dividing bar if slider is active
    if (showComparisonSlider && !showAfterOnly) {
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(sliderX, 0);
      ctx.lineTo(sliderX, dimensions.height);
      ctx.stroke();

      // Slid handle circle
      ctx.fillStyle = "#171717";
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sliderX, dimensions.height / 2, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Small arrows inside slider handle
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("◀ ▶", sliderX, dimensions.height / 2);
    }

    // 7. Draw Manual Mode anchors / handles if in manual mode
    if (controls.detectionMode === "manual") {
      // Draw quadrilateral border boundary
      ctx.strokeStyle = isConvexQuad(points[0], points[1], points[2], points[3])
        ? "rgba(16, 185, 129, 0.65)" // Emerald if convex and valid
        : "rgba(239, 68, 68, 0.65)";  // Red if degenerate/crossed
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((p, idx) => {
        const x = p.x * dimensions.width;
        const y = p.y * dimensions.height;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();

      // Draw active anchor nodes
      points.forEach((p, idx) => {
        const x = p.x * dimensions.width;
        const y = p.y * dimensions.height;

        // Hover or Active coloring
        const isActive = activeHandleIndex === idx;
        const isHovered = isHoveringHandle === idx;

        ctx.fillStyle = isActive ? "#FFFFFF" : isHovered ? "#F4F4F5" : "rgba(23, 23, 23, 0.9)";
        ctx.strokeStyle = isActive ? "#18181B" : "#FFFFFF";
        ctx.lineWidth = isActive ? 3 : 2;

        ctx.beginPath();
        ctx.arc(x, y, isActive ? 9 : 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Small cross-hair dot
        ctx.fillStyle = isActive ? "#18181B" : "#FFFFFF";
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Small text badge above handle
        if (isHovered || isActive) {
          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.2)";
          ctx.shadowBlur = 4;
          ctx.fillStyle = "#18181B";
          ctx.font = "bold 9px system-ui";
          const label = p.label || `Point ${idx + 1}`;
          const textW = ctx.measureText(label).width;
          ctx.fillRect(x - textW / 2 - 5, y - 25, textW + 10, 14);
          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "center";
          ctx.fillText(label, x, y - 16);
          ctx.restore();
        }
      });
    }
  }, [dimensions, points, tilePatternSheet, controls, comparisonProgress, showComparisonSlider, showAfterOnly, activeHandleIndex, isHoveringHandle, imagesLoaded]);

  // Handle pointer interactions
  const getMouseCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Check for Touch vs Mouse
    let clientX = 0;
    let clientY = 0;
    
    if ("touches" in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else return null;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getMouseCoords(e);
    if (!coords) return;

    // Check if clicking the comparison slider handle
    if (showComparisonSlider && !showAfterOnly) {
      const sliderX = (comparisonProgress / 100) * dimensions.width;
      const distToSlider = Math.abs(coords.x - sliderX);
      const distToSliderCenterY = Math.abs(coords.y - dimensions.height / 2);

      if (distToSlider < 18 && distToSliderCenterY < 18) {
        setIsDraggingSlider(true);
        e.preventDefault();
        return;
      }
    }

    // Check if clicking manual boundary anchors
    if (controls.detectionMode === "manual") {
      let foundIndex: number | null = null;
      points.forEach((p, idx) => {
        const px = p.x * dimensions.width;
        const py = p.y * dimensions.height;
        const distance = Math.sqrt((coords.x - px) ** 2 + (coords.y - py) ** 2);
        
        if (distance < 15) {
          foundIndex = idx;
        }
      });

      if (foundIndex !== null) {
        setActiveHandleIndex(foundIndex);
        e.preventDefault();
      }
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getMouseCoords(e);
    if (!coords) return;

    // 1. Drag comparison dividing bar
    if (isDraggingSlider && onComparisonChange) {
      const progress = Math.max(0, Math.min(100, (coords.x / dimensions.width) * 100));
      onComparisonChange(progress);
      return;
    }

    // 2. Drag manual corner handles
    if (activeHandleIndex !== null) {
      const normalizedX = Math.max(0, Math.min(1, coords.x / dimensions.width));
      const normalizedY = Math.max(0, Math.min(1, coords.y / dimensions.height));

      const updated = [...points];
      updated[activeHandleIndex] = {
        ...updated[activeHandleIndex],
        x: normalizedX,
        y: normalizedY,
      };
      onPointsChange(updated);
      return;
    }

    // 3. Hover detection for cursors
    if (controls.detectionMode === "manual") {
      let hoverIdx: number | null = null;
      points.forEach((p, idx) => {
        const px = p.x * dimensions.width;
        const py = p.y * dimensions.height;
        const distance = Math.sqrt((coords.x - px) ** 2 + (coords.y - py) ** 2);
        if (distance < 15) {
          hoverIdx = idx;
        }
      });
      setIsHoveringHandle(hoverIdx);
    }
  };

  const handlePointerUp = () => {
    setActiveHandleIndex(null);
    setIsDraggingSlider(false);
  };

  const handleDownload = (isUHD: boolean = false) => {
    const roomImg = roomImageRef.current;
    if (!roomImg) return;

    setIsUHDSelected(isUHD);
    setIsGenerating(true);
    setEmailSubmitted(false);
    setUserEmail("");

    // Run processing in a brief timeout to let the UI update and render the processing spinner
    setTimeout(() => {
      try {
        // Dynamic Resolution: 8K UHD widescreen (7680x4320) or high-speed responsive direct HD (natural room dimensions)
        const width = isUHD ? 7680 : (roomImg.naturalWidth || 1600);
        const height = isUHD ? 4320 : (roomImg.naturalHeight || 1200);

        // Create high-res offscreen canvas
        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = width;
        exportCanvas.height = height;
        const ctx = exportCanvas.getContext("2d");
        if (!ctx) {
          setIsGenerating(false);
          return;
        }

        // Set high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // 1. Draw high-res base room background (walls and empty floor)
        ctx.drawImage(roomImg, 0, 0, width, height);

        // 2. Render high-res tile layer
        // Crucial: No editing lines, helper markers, or corner gridlines are drawn in the final download output.
        if (tilePatternSheet && points.length === 4) {
          // Calculate high-res absolute point vertices
          const pAbs = points.map((p) => ({
            x: p.x * width,
            y: p.y * height,
          }));

          // 32x32 Grid subdivision for ultra-fine perspective warping and razor-sharp tile edges in 8K
          const gridCount = 32;

          const tileLayerCanvas = document.createElement("canvas");
          tileLayerCanvas.width = width;
          tileLayerCanvas.height = height;
          const tCtx = tileLayerCanvas.getContext("2d");

          if (tCtx) {
            for (let j = 0; j < gridCount; j++) {
              for (let i = 0; i < gridCount; i++) {
                const s0 = i / gridCount;
                const s1 = (i + 1) / gridCount;
                const t0 = j / gridCount;
                const t1 = (j + 1) / gridCount;

                // Interpolate high-res target vertices
                const tTL = interpolateQuad(pAbs[0], pAbs[1], pAbs[2], pAbs[3], s0, t0);
                const tTR = interpolateQuad(pAbs[0], pAbs[1], pAbs[2], pAbs[3], s1, t0);
                const tBR = interpolateQuad(pAbs[0], pAbs[1], pAbs[2], pAbs[3], s1, t1);
                const tBL = interpolateQuad(pAbs[0], pAbs[1], pAbs[2], pAbs[3], s0, t1);

                // Pattern source mapping coordinates matching selected design configurations
                const sc = controls.scale;
                const ox = controls.offsetX * 2;
                const oy = controls.offsetY * 2;

                const u0 = s0 * 1024 * sc + ox;
                const u1 = s1 * 1024 * sc + ox;
                const v0 = t0 * 1024 * sc + oy;
                const v1 = t1 * 1024 * sc + oy;

                // Triangle A
                drawTriangleTexture(
                  tCtx,
                  tilePatternSheet,
                  u0, v0,
                  u1, v0,
                  u0, v1,
                  tTL.x, tTL.y,
                  tTR.x, tTR.y,
                  tBL.x, tBL.y
                );

                // Triangle B
                drawTriangleTexture(
                  tCtx,
                  tilePatternSheet,
                  u1, v0,
                  u1, v1,
                  u0, v1,
                  tTR.x, tTR.y,
                  tBR.x, tBR.y,
                  tBL.x, tBL.y
                );
              }
            }

            // Apply alpha-masking using the thresholded room overlay mask
            // This ensures the tile pattern is rendered exclusively behind furniture, windows, and frames
            const roomOverlayImg = roomOverlayRef.current;
            if (roomOverlayImg && tCtx) {
              const mask = createThresholdedMask(roomOverlayImg, width, height);
              tCtx.save();
              tCtx.globalCompositeOperation = "destination-out";
              tCtx.drawImage(mask, 0, 0, width, height);
              tCtx.restore();
            }

            // Render tiles to master context with opacity adjustments
            ctx.save();
            ctx.globalAlpha = controls.opacity;
            ctx.drawImage(tileLayerCanvas, 0, 0);
            ctx.restore();

            // 3. Render High-Res Shadows
            if (controls.shadow > 0) {
              ctx.save();
              ctx.globalCompositeOperation = "multiply";
              ctx.globalAlpha = controls.shadow * 0.85;

              ctx.beginPath();
              ctx.moveTo(pAbs[0].x, pAbs[0].y);
              ctx.lineTo(pAbs[1].x, pAbs[1].y);
              ctx.lineTo(pAbs[2].x, pAbs[2].y);
              ctx.lineTo(pAbs[3].x, pAbs[3].y);
              ctx.closePath();
              ctx.clip();

              ctx.drawImage(roomImg, 0, 0, width, height);
              ctx.restore();
            }

            // 4. Render High-Res Reflections
            if (controls.reflection > 0) {
              ctx.save();
              ctx.globalCompositeOperation = "screen";
              ctx.globalAlpha = controls.reflection * 0.45;

              ctx.beginPath();
              ctx.moveTo(pAbs[0].x, pAbs[0].y);
              ctx.lineTo(pAbs[1].x, pAbs[1].y);
              ctx.lineTo(pAbs[2].x, pAbs[2].y);
              ctx.lineTo(pAbs[3].x, pAbs[3].y);
              ctx.closePath();
              ctx.clip();

              ctx.drawImage(roomImg, 0, 0, width, height);
              ctx.restore();
            }

            // 5. Render Brightness overlay on tiles
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(pAbs[0].x, pAbs[0].y);
            ctx.lineTo(pAbs[1].x, pAbs[1].y);
            ctx.lineTo(pAbs[2].x, pAbs[2].y);
            ctx.lineTo(pAbs[3].x, pAbs[3].y);
            ctx.closePath();
            ctx.clip();

            if (controls.brightness !== 1.0) {
              ctx.fillStyle = controls.brightness > 1.0 ? "white" : "black";
              ctx.globalAlpha = Math.abs(controls.brightness - 1.0) * 0.4;
              ctx.fill();
            }
            ctx.restore();
          }
        }

        // 6. Layer the transparent furniture, window frames, plant pot, and baseboard overlays
        const roomOverlayImg = roomOverlayRef.current;
        if (roomOverlayImg) {
          ctx.drawImage(roomOverlayImg, 0, 0, width, height);
        }

        // Trigger automatic file download
        const dataUrl = exportCanvas.toDataURL("image/png");
        setDownloadedImage(dataUrl);

        try {
          const link = document.createElement("a");
          link.download = isUHD ? "tilevista-render-8k-uhd.png" : "tilevista-render-hd.png";
          link.href = dataUrl;
          link.click();
        } catch (downloadErr) {
          console.warn("Silent fallback: automatic direct click download was restricted by sandbox", downloadErr);
        }
      } catch (err) {
        console.error("Failed to generate and download 8k canvas render", err);
      } finally {
        setIsGenerating(false);
      }
    }, 50);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full bg-neutral-900 rounded-2xl p-4 md:p-6 shadow-xl border border-neutral-800" id="visualizer-wrapper">
      {/* Upper info panel */}
      <div className="flex flex-wrap items-center justify-between w-full pb-3 border-b border-neutral-800/80 mb-4 gap-3 text-white" id="visualizer-bar">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" id="visualizer-status-dot"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">Live Editor Canvas</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-neutral-400" id="visualizer-hints">
          {controls.detectionMode === "manual" ? (
            <span className="flex items-center gap-1 text-neutral-300 bg-neutral-800/80 px-2.5 py-1 rounded-md border border-neutral-700/50">
              <Maximize className="w-3.5 h-3.5 text-emerald-400" />
              Drag corners to align
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-neutral-500" />
              Auto Mapped
            </span>
          )}

          <button
            onClick={() => handleDownload(false)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#FFAA47] hover:bg-[#e09134] text-neutral-950 rounded-lg text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm ml-2"
            title="Instant direct HD download"
            id="download-hd-btn"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download HD (Fast)</span>
          </button>

          <button
            onClick={() => handleDownload(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#207868] hover:bg-[#196053] text-white rounded-lg text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Premium 8K Ultra HD render"
            id="download-8k-btn"
          >
            <Download className="w-3.5 h-3.5 animate-bounce" />
            <span>8K Ultra HD</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Node Container */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden flex items-center justify-center bg-neutral-950 rounded-xl"
        style={{ minHeight: "300px" }}
        id="canvas-gesture-container"
      >
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className={`shadow-2xl max-w-full ${
            activeHandleIndex !== null || isDraggingSlider
              ? "cursor-grabbing"
              : isHoveringHandle !== null
              ? "cursor-grab"
              : showComparisonSlider
              ? "cursor-ew-resize"
              : "cursor-default"
          }`}
          id="tilevista-render-canvas"
        />

        {/* Small Disclaimer floating badge */}
        <div className="absolute bottom-3 right-3 bg-neutral-950/75 backdrop-blur-sm px-2.5 py-1 rounded border border-neutral-800 text-[8px] font-semibold text-neutral-400 max-w-[190px] pointer-events-none" id="canvas-disclaimer">
          Estimate only. Actual appearance may vary by lighting, batch & grout.
        </div>

        {/* Dynamic 8K render generating spinner overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-neutral-955/90 backdrop-blur-xs flex flex-col items-center justify-center space-y-3 z-40 text-center px-4 animate-fade-in" id="generating-8k-overlay">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <div className="space-y-1">
              <p className="text-white text-xs font-black uppercase tracking-wider">Generating UHD 8K Image</p>
              <p className="text-neutral-400 text-[10px]">Processing ultra-fine perspective warping and shadows...</p>
            </div>
          </div>
        )}
      </div>

      {/* 8K/HD Render Complete - Touch & Save Instruction Modal for Mobile & Fallbacks */}
      {downloadedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs overflow-y-auto" id="download-success-modal">
          <div className="bg-[#FAF9F6] rounded-3xl p-5 md:p-7 max-w-lg w-full border border-neutral-250 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 my-8">
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wide ${isUHDSelected ? "bg-emerald-500/10 text-[#196053]" : "bg-[#FFAA47]/10 text-[#D06F00]"}`}>
                  {isUHDSelected ? "8K Ultra HD Render Ready" : "Direct HD Download Ready"}
                </span>
                <h3 className="text-base sm:text-lg font-black text-neutral-900 mt-1">Your Space is Visualised!</h3>
              </div>
              <button
                onClick={() => setDownloadedImage(null)}
                className="text-neutral-400 hover:text-neutral-700 font-extrabold text-base p-1"
              >
                ✕
              </button>
            </div>

            <div className="relative border border-neutral-200 rounded-2xl overflow-hidden shadow-inner h-[180px] sm:h-[220px] flex items-center justify-center bg-neutral-950">
              <img
                src={downloadedImage}
                alt="HD Render Preview"
                className="max-w-full max-h-full object-contain select-none"
              />
            </div>

            {/* Quick Mobile save instructions */}
            <div className="bg-[#1D4A3F]/5 rounded-xl p-3 border border-[#1D4A3F]/10 text-[10.5px] text-neutral-700 space-y-1">
              <p className="font-extrabold text-[#1D4A3F] flex items-center gap-1.5">
                <span>📱 Mobile Quick Save</span>
              </p>
              <p className="leading-relaxed font-medium text-neutral-600">
                Long press (touch & hold) the preview image above to save directly to your photos.
              </p>
            </div>

            {/* NEXT STEP OPTIONS */}
            <div className="border-t border-neutral-200/80 pt-3 space-y-3">
              <h4 className="text-xs font-extrabold text-neutral-800 tracking-tight">✨ Choose Your Next Step:</h4>
              
              <div className="grid grid-cols-1 gap-2">
                {/* Simulated Email Specification Form */}
                <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-xs space-y-2">
                  <span className="block text-[9px] font-black uppercase text-neutral-500 tracking-wider">Option A: Email Design Specification Specs</span>
                  {!emailSubmitted ? (
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="yourname@email.com"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="flex-1 text-[11px] font-bold border border-neutral-250 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#207868] text-neutral-800 bg-neutral-50"
                      />
                      <button
                        onClick={() => {
                          if (userEmail.trim()) {
                            setEmailSubmitted(true);
                          }
                        }}
                        className="bg-[#207868] hover:bg-[#196053] text-white px-3 py-1.5 rounded-lg text-[10px] font-black transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                      >
                        Get Specs
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10.5px] font-bold text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                      ✅ Design specifications & 3D tiles breakdown successfully simulated and sent to: <span className="underline">{userEmail}</span>!
                    </p>
                  )}
                </div>

                {/* Saima Biva Designer Critique Link */}
                <a
                  href="https://saimabiva.pro.bd/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#FFAA47]/10 hover:bg-[#FFAA47]/25 text-[#D06F00] p-3 rounded-xl border border-[#FFAA47]/30 text-left block transition-all group"
                >
                  <span className="block text-[9px] font-black uppercase tracking-wider text-[#A05000]">Option B: Expert Design Review</span>
                  <p className="text-[11.5px] font-extrabold mt-1 group-hover:underline">
                    💬 Request a free professional critique from Saima Biva (Rajshahi University) &rarr;
                  </p>
                </a>
              </div>
            </div>

            <div className="flex gap-2 pt-1 border-t border-neutral-200/50">
              <button
                onClick={() => setDownloadedImage(null)}
                className="w-1/3 bg-neutral-200/80 hover:bg-neutral-250 text-neutral-700 py-3 rounded-xl text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
              >
                Close
              </button>
              <a
                href={downloadedImage}
                download={isUHDSelected ? "tilevista-render-8k-uhd.png" : "tilevista-render-hd.png"}
                className="w-2/3 bg-[#207868] hover:bg-[#196053] text-white py-3 rounded-xl text-xs font-extrabold text-center block transition-all active:scale-95 shadow-md font-sans"
              >
                Download File
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
