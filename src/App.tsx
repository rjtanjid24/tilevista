import { useState, useEffect, ChangeEvent } from "react";
import { EditorControlsState, DimensionState, TileData, Point2D } from "./types";
import { getSampleTiles } from "./data/sampleTiles";
import { generateProceduralRoomImage, generateProceduralRoomOverlay } from "./data/sampleRoom";
import { createTilePatternSheet } from "./services/tileRenderingService";
import Header from "./components/Header";
import VisualizationCanvas from "./components/VisualizationCanvas";
import { Upload, Plus, Heart, HelpCircle, Check, Sparkles } from "lucide-react";

const FLOOR_POINTS: Point2D[] = [
  { x: 0.18, y: 0.62, label: "floor-TL" },
  { x: 0.82, y: 0.62, label: "floor-TR" },
  { x: 0.98, y: 0.95, label: "floor-BR" },
  { x: 0.02, y: 0.95, label: "floor-BL" },
];

const WALL_POINTS: Point2D[] = [
  { x: 0.18, y: 0.01, label: "wall-TL" },
  { x: 0.82, y: 0.01, label: "wall-TR" },
  { x: 0.82, y: 0.61, label: "wall-BR" },
  { x: 0.18, y: 0.61, label: "wall-BL" },
];

const DEFAULT_CONTROLS: EditorControlsState = {
  surfaceType: "floor",
  detectionMode: "manual",
  tileId: "majolica-blue",
  tileSizeScale: 1.0,
  tileRotation: 0,
  tilePattern: "straight",
  groutWidthMm: 3,
  groutColor: "#E2E8F0",
  brightness: 1.0,
  contrast: 1.0,
  opacity: 0.88,
  shadow: 0.7,
  reflection: 0.4,
  textureIntensity: 1.0,
  perspectiveStrength: 1.0,
  offsetX: 0,
  offsetY: 0,
  scale: 1.0,
};

export default function App() {
  // Main states
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [roomOverlay, setRoomOverlay] = useState<string | null>(null);
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string>("majolica-blue");
  const [points, setPoints] = useState<Point2D[]>(FLOOR_POINTS);
  const [controls, setControls] = useState<EditorControlsState>(DEFAULT_CONTROLS);

  // Layout states
  const [roomWidthFt, setRoomWidthFt] = useState<number>(15);
  const [roomLengthFt, setRoomLengthFt] = useState<number>(12);
  const [selectedTileSize, setSelectedTileSize] = useState<"2x2" | "1x2">("2x2");
  const [groutColorIndex, setGroutColorIndex] = useState<number>(30); // mapped to slider
  const [isWall, setIsWall] = useState<boolean>(false);

  // UI state overlays
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);

  // Offscreen rendering caching
  const [tilePatternSheet, setTilePatternSheet] = useState<HTMLCanvasElement | null>(null);

  // Populate tiles and pre-load Scandinavian sofa room with Majolica blue tiles by default
  useEffect(() => {
    const initializedTiles = getSampleTiles();
    setTiles(initializedTiles);

    const demoRoom = generateProceduralRoomImage();
    const demoOverlay = generateProceduralRoomOverlay();
    setRoomImage(demoRoom);
    setRoomOverlay(demoOverlay);
    setSelectedTileId("majolica-blue");
    setPoints(FLOOR_POINTS);
  }, []);

  const selectedTile = tiles.find((t) => t.id === selectedTileId) || null;

  // React to grout color index slider changes and update grout HEX
  useEffect(() => {
    // Map index 0-100 to an elegant greyscale range from dark carbon to light grey/white
    const brightnessValue = Math.floor(255 - (groutColorIndex * 1.8));
    const hexSegment = brightnessValue.toString(16).padStart(2, "0");
    const hexColor = `#${hexSegment}${hexSegment}${hexSegment}`;
    setControls((prev) => ({
      ...prev,
      groutColor: hexColor,
    }));
  }, [groutColorIndex]);

  // Sync surfaceType with toggle and reset perspective coordinate anchors
  useEffect(() => {
    setControls((prev) => ({
      ...prev,
      surfaceType: isWall ? "wall" : "floor",
    }));
    setPoints(isWall ? WALL_POINTS : FLOOR_POINTS);
  }, [isWall]);

  // Sync tile sizes inside visualization engine
  useEffect(() => {
    if (selectedTileSize === "2x2") {
      setControls((prev) => ({ ...prev, scale: 0.95 }));
    } else {
      setControls((prev) => ({ ...prev, scale: 0.75 }));
    }
  }, [selectedTileSize]);

  // Compute offscreen flat seamless tile sheet
  useEffect(() => {
    if (!selectedTile) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.src = selectedTile.imageUrl;
    img.onload = () => {
      // Scale standard physical sizes (mm) to pixels
      const basePxWidth = (selectedTile.widthMm / 100) * 15;
      const basePxHeight = (selectedTile.heightMm / 100) * 15;

      const sheet = createTilePatternSheet(
        img,
        controls.tilePattern,
        basePxWidth,
        basePxHeight,
        controls.groutWidthMm,
        controls.groutColor,
        controls.tileRotation
      );
      setTilePatternSheet(sheet);
    };
  }, [selectedTile, controls.tilePattern, controls.groutWidthMm, controls.groutColor, controls.tileRotation]);

  // Handle uploaded room photograph
  const handleUploadRoomImage = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setRoomImage(event.target.result as string);
          setRoomOverlay(null); // Clear transparent overlay for user custom rooms
          setPoints(FLOOR_POINTS);
          triggerNotification("Room image uploaded successfully!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle uploaded custom tile
  const handleUploadCustomTile = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newTile: TileData = {
            id: `custom-${Date.now()}`,
            name: file.name.split(".")[0] || "Custom Uploaded",
            category: "custom",
            imageUrl: event.target.result as string,
            widthMm: selectedTileSize === "2x2" ? 600 : 300,
            heightMm: 600,
            colorStyle: "User uploaded custom design",
          };
          setTiles((prev) => [newTile, ...prev]);
          setSelectedTileId(newTile.id);
          triggerNotification("Custom tile pattern added successfully!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerNotification = (message: string) => {
    setShowNotification(message);
    setTimeout(() => {
      setShowNotification(null);
    }, 4000);
  };

  // Mathematical tile calculations
  const totalAreaSqFt = roomWidthFt * roomLengthFt;
  const tileCoverageSqFt = selectedTileSize === "2x2" ? 4 : 2; // 2x2 = 4 sqft, 1x2 = 2 sqft
  const requiredTilesCount = Math.ceil(totalAreaSqFt / tileCoverageSqFt);

  // App-level resets matching 'New Project'
  const handleResetWorkspace = () => {
    const demoRoom = generateProceduralRoomImage();
    const demoOverlay = generateProceduralRoomOverlay();
    setRoomImage(demoRoom);
    setRoomOverlay(demoOverlay);
    setSelectedTileId("majolica-blue");
    setRoomWidthFt(15);
    setRoomLengthFt(12);
    setSelectedTileSize("2x2");
    setGroutColorIndex(30);
    setIsWall(false);
    setPoints(FLOOR_POINTS);
    setControls(DEFAULT_CONTROLS);
    triggerNotification("New workspace initialized!");
  };

  const handleSaveWorkspace = () => {
    triggerNotification("Workspace configuration saved successfully!");
  };

  const handleShareWorkspace = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      triggerNotification("Share link copied to clipboard!");
    } else {
      triggerNotification("Share configuration generated!");
    }
  };

  return (
    <div className="bg-[#B1D4CC] min-h-screen flex flex-col font-sans selection:bg-[#1D4A3F] selection:text-white" id="tilevista-app">
      {/* 1. Header with English Navigation & Custom Branding */}
      <Header />

      {/* Floating alert notifications */}
      {showNotification && (
        <div className="fixed top-20 right-6 z-50 bg-[#1D4A3F] text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 animate-bounce text-xs font-bold border border-emerald-500/30">
          <Sparkles className="w-4 h-4 text-[#F19A3E]" />
          <span>{showNotification}</span>
        </div>
      )}

      {/* 2. Responsive 2-Column Studio Workspace Grid */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-5 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start" id="tilevista-editor-stage">
        
        {/* ================= COLUMN 1: DESIGN PANEL (Sidebar Controls - spans 4 cols on lg screens) ================= */}
        <section className="lg:col-span-4 space-y-5 flex flex-col" id="col-design-panel">
          
          <div className="flex items-center justify-between px-1" id="panel-title-bar">
            <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
              Design Panel
            </h2>
          </div>

          {/* Step 1: Define Space */}
          <div className="bg-[#FAF9F6] rounded-2xl p-5 shadow-sm border border-neutral-200/40 space-y-4" id="step-1-card">
            <div className="bg-[#FFAA47]/15 text-[#D06F00] px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5" id="step-1-eyebrow">
              <span className="w-2 h-2 rounded-full bg-[#FFAA47]" />
              Step 1: Room Dimensions
            </div>

            {/* Room dimension fields (Width in feet, Length in feet) */}
            <div className="grid grid-cols-2 gap-3" id="dimension-inputs-grid">
              <div className="space-y-1">
                <label className="block text-[9px] font-extrabold text-neutral-500 uppercase">Width (ft)</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={roomWidthFt}
                  onChange={(e) => setRoomWidthFt(parseInt(e.target.value) || 15)}
                  className="w-full bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-neutral-800 focus:outline-none focus:border-[#207868]"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-extrabold text-neutral-500 uppercase">Length (ft)</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={roomLengthFt}
                  onChange={(e) => setRoomLengthFt(parseInt(e.target.value) || 12)}
                  className="w-full bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-neutral-800 focus:outline-none focus:border-[#207868]"
                />
              </div>
            </div>

            {/* Room update trigger button */}
            <button
              onClick={() => triggerNotification("Room dimensions updated successfully!")}
              className="w-full bg-[#2A7B6B] hover:bg-[#1D5E51] text-white py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-95 cursor-pointer"
              id="room-update-btn"
            >
              Update Dimensions
            </button>
          </div>

          {/* Step 2: Tile Selection & Upload */}
          <div className="bg-[#FAF9F6] rounded-2xl p-5 shadow-sm border border-neutral-200/40 space-y-4" id="step-2-card">
            <div className="bg-[#FFAA47]/15 text-[#D06F00] px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FFAA47]" />
              Step 2: Upload Custom Design
            </div>

            {/* Dash block for custom upload */}
            <label className="border-2 border-dashed border-neutral-300 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-neutral-400 bg-white transition-all text-neutral-500" id="tile-upload-box">
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadCustomTile}
                className="hidden"
              />
              <Upload className="w-5 h-5 text-neutral-400 mb-1.5" />
              <span className="text-xs font-bold text-neutral-700">Upload Custom Tile</span>
            </label>

            {/* Tile size selector buttons "2x2" and "1x2 feet" */}
            <div className="space-y-1.5" id="tile-size-selector">
              <label className="block text-[9px] font-extrabold text-neutral-500 uppercase">Tile Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedTileSize("2x2")}
                  className={`py-2 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                    selectedTileSize === "2x2"
                      ? "bg-[#1D4A3F] text-white border-[#1D4A3F]"
                      : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300"
                  }`}
                  id="size-2x2-btn"
                >
                  2x2 ft (60x60)
                </button>
                <button
                  onClick={() => setSelectedTileSize("1x2")}
                  className={`py-2 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                    selectedTileSize === "1x2"
                      ? "bg-[#1D4A3F] text-white border-[#1D4A3F]"
                      : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300"
                  }`}
                  id="size-1x2-btn"
                >
                  1x2 ft (30x60)
                </button>
              </div>
            </div>
          </div>

          {/* Step 3: Alignments & Grout settings */}
          <div className="bg-[#FAF9F6] rounded-2xl p-5 shadow-sm border border-neutral-200/40 space-y-4" id="step-3-card">
            <div className="bg-[#FFAA47]/15 text-[#D06F00] px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FFAA47]" />
              Step 3: Setup & Adjustments
            </div>

            {/* Wall vs Floor Radio buttons (explicit separate selectors) */}
            <div className="space-y-1.5" id="surface-type-selector">
              <label className="block text-[9px] font-extrabold text-neutral-500 uppercase">Surface Type</label>
              <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border border-neutral-200/60">
                <label className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all ${!isWall ? "bg-[#1D4A3F] text-white" : "text-neutral-600 hover:bg-neutral-100"}`}>
                  <input
                    type="radio"
                    name="surface-type"
                    checked={!isWall}
                    onChange={() => setIsWall(false)}
                    className="sr-only"
                  />
                  Floor Pattern
                </label>
                <label className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all ${isWall ? "bg-[#1D4A3F] text-white" : "text-neutral-600 hover:bg-neutral-100"}`}>
                  <input
                    type="radio"
                    name="surface-type"
                    checked={isWall}
                    onChange={() => setIsWall(true)}
                    className="sr-only"
                  />
                  Wall Pattern
                </label>
              </div>
            </div>

            {/* Grout color slider "Grout Color" */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-extrabold text-neutral-500 uppercase">
                <span>Grout Color</span>
                <span className="text-neutral-900 font-extrabold text-[10px]">{controls.groutColor}</span>
              </div>
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-neutral-200/60">
                <input
                  type="range"
                  min="5"
                  max="90"
                  value={groutColorIndex}
                  onChange={(e) => setGroutColorIndex(parseInt(e.target.value))}
                  className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-[#1D4A3F]"
                />
              </div>
            </div>

            {/* Tile rotation slider "Tile Angle" */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-extrabold text-neutral-500 uppercase">
                <span>Tile Angle</span>
                <span className="text-neutral-900 font-extrabold text-[10px]">{controls.tileRotation}°</span>
              </div>
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-neutral-200/60">
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={controls.tileRotation}
                  onChange={(e) => setControls((prev) => ({ ...prev, tileRotation: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-[#1D4A3F]"
                />
              </div>
            </div>

            {/* Button Apply Visuals */}
            <button
              onClick={() => triggerNotification("Visual calculations applied successfully!")}
              className="w-full bg-[#1F7464] hover:bg-[#165549] text-white py-3 rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-95 cursor-pointer"
              id="see-results-btn"
            >
              Apply Visuals
            </button>
          </div>
        </section>

        {/* ================= COLUMN 2: LIVE VISUALIZER & CATALOG (spans 8 cols on lg screens) ================= */}
        <section className="lg:col-span-8 space-y-6 flex flex-col" id="col-results-panel">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Live Visualizer</h2>
          </div>

          <div className="bg-[#FAF9F6] rounded-2xl p-5 shadow-sm border border-neutral-200/40 flex flex-col justify-between min-h-[500px]" id="visualization-canvas-card">
            
            {/* Embedded interactive perspective canvas */}
            <div className="flex-1 w-full bg-neutral-950 rounded-xl overflow-hidden shadow-inner relative flex items-center justify-center min-h-[350px] sm:min-h-[400px]">
              {roomImage ? (
                <VisualizationCanvas
                  roomImageSrc={roomImage}
                  roomOverlaySrc={roomOverlay}
                  tilePatternSheet={tilePatternSheet}
                  points={points}
                  onPointsChange={setPoints}
                  controls={controls}
                  showComparisonSlider={false}
                  comparisonProgress={50}
                  showAfterOnly={false}
                />
              ) : (
                <div className="text-center text-neutral-400 p-8 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-4 text-neutral-300">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold">Default room image loading...</p>
                </div>
              )}
            </div>

            {/* Bottom calculation bar containing dimensions and order actions */}
            <div className="mt-4 pt-4 border-t border-neutral-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 px-2" id="results-footer-bar">
              <div className="flex items-center gap-10" id="metrics-summary">
                {/* Room Size Display */}
                <div className="bg-white px-4 py-2.5 rounded-xl border border-neutral-200/60 shadow-xs">
                  <span className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Room Area</span>
                  <p className="text-lg font-black text-neutral-800 mt-0.5" id="size-metric-display">
                    {totalAreaSqFt} sq ft ({roomLengthFt} x {roomWidthFt} ft)
                  </p>
                </div>
                {/* Required Tiles Count Display */}
                <div className="bg-white px-4 py-2.5 rounded-xl border border-neutral-200/60 shadow-xs">
                  <span className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Estimated Tiles</span>
                  <p className="text-lg font-black text-[#1D4A3F] mt-0.5" id="tiles-count-display">
                    {requiredTilesCount} pcs
                  </p>
                </div>
              </div>

              {/* Order action button */}
              <button
                onClick={() => setShowOrderModal(true)}
                className="w-full sm:w-auto px-8 py-3 bg-[#1D4A3F] hover:bg-[#165549] rounded-xl text-sm font-extrabold text-white transition-all shadow-md active:scale-95 cursor-pointer"
                id="order-now-btn"
              >
                Generate Order Quotation
              </button>
            </div>
          </div>

          {/* Built-in Preset Tile Catalog (convenient selection underneath visualizer) */}
          <div className="bg-[#FAF9F6] rounded-2xl p-5 shadow-sm border border-neutral-200/40 space-y-4" id="visualizer-catalog-panel">
            <h3 className="text-sm font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
              <Check className="w-4 h-4 text-[#207868]" />
              Choose Built-in Presets
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" id="expanded-tile-grid">
              {tiles.map((tile) => (
                <button
                  key={tile.id}
                  onClick={() => setSelectedTileId(tile.id)}
                  className={`relative p-2 rounded-xl border text-left bg-white transition-all overflow-hidden flex flex-col justify-between aspect-square group cursor-pointer ${
                    selectedTileId === tile.id
                      ? "border-[#1D4A3F] ring-2 ring-[#207868]/15 shadow-md"
                      : "border-neutral-200/80 hover:border-neutral-350"
                  }`}
                  id={`expanded-tile-${tile.id}`}
                >
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-neutral-50 border border-neutral-100">
                    <img
                      src={tile.imageUrl}
                      alt={tile.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1 right-1 bg-white/95 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold text-neutral-700 border border-neutral-150">
                      {tile.widthMm === 600 && tile.heightMm === 600 ? "60x60 cm" : "30x60 cm"}
                    </span>
                  </div>
                  <div className="mt-1.5 overflow-hidden">
                    <span className="block text-[8px] text-[#207868] font-bold uppercase tracking-wider">{tile.category}</span>
                    <h4 className="text-[10px] font-bold text-neutral-900 truncate leading-none mt-0.5">{tile.name}</h4>
                  </div>
                  {selectedTileId === tile.id && (
                    <div className="absolute top-1.5 left-1.5 bg-[#1D4A3F] text-white rounded-full p-0.5 shadow-md">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ================= ORDER QUOTATION MODAL ================= */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" id="order-modal-overlay">
          <div className="bg-[#FAF9F6] rounded-3xl p-6 md:p-8 max-w-md w-full border border-neutral-200 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9px] bg-[#207868]/10 text-[#207868] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Tile Quotation</span>
                <h3 className="text-lg font-black text-neutral-900 mt-2">Order Confirmation</h3>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-neutral-400 hover:text-neutral-700 font-extrabold text-xl p-1 shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="bg-white rounded-2xl p-4.5 border border-neutral-200/60 space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-500 font-medium">Selected Tile Pattern:</span>
                <span className="font-extrabold text-neutral-800 truncate max-w-[200px]">
                  {selectedTile?.name || "Majolica Portuguese"}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-500 font-medium">Room Total Space:</span>
                <span className="font-extrabold text-neutral-800">
                  {totalAreaSqFt} sq ft ({roomLengthFt} x {roomWidthFt} ft)
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-500 font-medium">Tile Size:</span>
                <span className="font-extrabold text-neutral-800">
                  {selectedTileSize === "2x2" ? "2x2 ft (60x60 cm)" : "1x2 ft (30x60 cm)"}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span className="text-neutral-900 font-extrabold">Total Required Tiles:</span>
                <span className="font-black text-[#207868] text-base">{requiredTilesCount} pcs</span>
              </div>
            </div>

            <p className="text-[10.5px] text-neutral-400 leading-normal">
              * Note: This is an estimated layout calculation. Actual field cutting wastage buffers might vary based on your room corners. Powered by traditional craftsmanship from the Rajshahi Ceramics & Sculpture community.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowOrderModal(false)}
                className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-3 rounded-xl text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowOrderModal(false);
                  triggerNotification("Your quotation request was submitted successfully!");
                }}
                className="w-full bg-[#207868] hover:bg-[#196053] text-white py-3 rounded-xl text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
              >
                Submit Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Premium Elegant Device-Friendly Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-800/80 px-6 py-10 text-neutral-400 text-xs mt-auto relative overflow-hidden" id="tilevista-footer">
        {/* Subtle decorative premium gradient bar at the top */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-600 to-amber-500 opacity-80" />

        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left animate-fade-in" id="footer-container">
          {/* Brand - Left Column: uses exact same logo icon grid and typography from header */}
          <div className="flex items-center gap-2.5" id="footer-brand">
            <div className="grid grid-cols-2 gap-0.5 w-6 h-6 shrink-0" id="footer-logo-icon-grid">
              <div className="bg-[#F19A3E] rounded-[1px]" /> {/* Orange */}
              <div className="bg-[#72AD9C] rounded-[1px]" /> {/* Teal */}
              <div className="bg-[#566266] rounded-[1px]" /> {/* Grey */}
              <div className="bg-[#EAD2AC] rounded-[1px]" /> {/* Beige */}
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white font-sans" id="footer-tilevista-title">
              TileVista
            </h3>
          </div>

          {/* Academic Portfolio Credit & Link - Right Column */}
          <div className="flex flex-col items-center md:items-end" id="footer-academic">
            <p className="text-neutral-300 text-[13px] sm:text-sm font-bold tracking-wide">
              A project by{" "}
              <a
                href="https://saimabiva.pro.bd/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3ab39c] hover:text-[#52cbb4] underline underline-offset-4 decoration-2 decoration-[#207868]/40 hover:decoration-[#3ab39c] transition-all font-black"
                id="saima-portfolio-link"
              >
                Saima Biva
              </a>{" "}
              | RU
            </p>
          </div>
        </div>

        {/* Extended, elegant Copyright border top */}
        <div className="max-w-4xl mx-auto mt-8 pt-6 border-t border-neutral-900 text-center text-xs text-neutral-500 tracking-wide">
          © 2026 TileVista. Visualise with Absolute Precision. Decide with Certainty. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
