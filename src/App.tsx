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
  const [activeMobileStepTab, setActiveMobileStepTab] = useState<number>(1);

  // UI state overlays
  const [showNotification, setShowNotification] = useState<string | null>(null);

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
        <section className="lg:col-span-4 space-y-4 flex flex-col" id="col-design-panel">
          
          <div className="flex items-center justify-between px-1" id="panel-title-bar">
            <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
              Design Panel
            </h2>
          </div>

          {/* Quick Step Switcher Tab bar for Mobiles (hidden on Desktop) */}
          <div className="lg:hidden flex bg-[#FAF9F6] p-1 rounded-2xl border border-neutral-200/60 gap-1.5" id="mobile-step-tabs">
            <button
              onClick={() => setActiveMobileStepTab(1)}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer ${
                activeMobileStepTab === 1 ? "bg-[#1D4A3F] text-white shadow-md" : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              📐 Size
            </button>
            <button
              onClick={() => setActiveMobileStepTab(2)}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer ${
                activeMobileStepTab === 2 ? "bg-[#1D4A3F] text-white shadow-md" : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              🎨 Tile
            </button>
            <button
              onClick={() => setActiveMobileStepTab(3)}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer ${
                activeMobileStepTab === 3 ? "bg-[#1D4A3F] text-white shadow-md" : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              ⚙️ Tune
            </button>
          </div>

          {/* Step 1: Define Space */}
          <div className={`${activeMobileStepTab === 1 ? "block" : "hidden lg:block"} bg-[#FAF9F6] rounded-2xl p-5 shadow-sm border border-neutral-200/40 space-y-4`} id="step-1-card">
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
          <div className={`${activeMobileStepTab === 2 ? "block" : "hidden lg:block"} bg-[#FAF9F6] rounded-2xl p-5 shadow-sm border border-neutral-200/40 space-y-4`} id="step-2-card">
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
          <div className={`${activeMobileStepTab === 3 ? "block" : "hidden lg:block"} bg-[#FAF9F6] rounded-2xl p-5 shadow-sm border border-neutral-200/40 space-y-4`} id="step-3-card">
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

            {/* Elegant 4-Column Project Estimation & Layout Specs Dashboard (fills empty PC space perfectly) */}
            <div className="mt-5 pt-4 border-t border-neutral-200/80 text-left" id="results-footer-bar">
              <span className="block text-[10px] font-black uppercase text-neutral-400 tracking-wider mb-2.5 px-1">
                📊 Estimated Material Requirements & Technical Specifications
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5" id="metrics-summary">
                {/* 1. Room Size Display */}
                <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="block text-[9px] font-extrabold text-neutral-400 uppercase tracking-wider">Total Area</span>
                    <p className="text-sm sm:text-base font-black text-neutral-900 mt-0.5 truncate" id="size-metric-display">
                      {totalAreaSqFt} sq ft
                    </p>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-bold mt-1.5 block">
                    {roomLengthFt}′ × {roomWidthFt}′ Room
                  </span>
                </div>

                {/* 2. Required Tiles Count Display */}
                <div className="bg-[#207868]/5 p-3.5 rounded-xl border border-[#207868]/15 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="block text-[9px] font-extrabold text-[#207868] uppercase tracking-wider">Required Tiles</span>
                    <p className="text-sm sm:text-base font-black text-[#196053] mt-0.5" id="tiles-count-display">
                      {requiredTilesCount} pcs
                    </p>
                  </div>
                  <span className="text-[10px] text-[#207868] font-black mt-1.5 block">
                    Net Count Estimator
                  </span>
                </div>

                {/* 3. Wastage Buffer (10%) */}
                <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="block text-[9px] font-extrabold text-neutral-400 uppercase tracking-wider">With +10% Waste</span>
                    <p className="text-sm sm:text-base font-black text-neutral-900 mt-0.5">
                      {Math.ceil(requiredTilesCount * 1.1)} pcs
                    </p>
                  </div>
                  <span className="text-[10px] text-amber-600 font-extrabold mt-1.5 block">
                    Recommended Buffer
                  </span>
                </div>

                {/* 4. Aspect Ratio & Texture Type */}
                <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="block text-[9px] font-extrabold text-neutral-400 uppercase tracking-wider">Tile Spec</span>
                    <p className="text-sm sm:text-base font-black text-neutral-900 mt-0.5 truncate">
                      {selectedTileSize === "2x2" ? "2′ × 2′ Standard" : "1′ × 2′ Subway"}
                    </p>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-bold mt-1.5 block truncate">
                    {(selectedTile?.category || "pattern").toUpperCase()} · {selectedTileSize === "2x2" ? "60×60 cm" : "30×60 cm"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Built-in Preset Tile Catalog (highly readable cards with full names & descriptions) */}
          <div className="bg-[#FAF9F6] rounded-2xl p-5 shadow-sm border border-neutral-200/40 space-y-4" id="visualizer-catalog-panel">
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
                <Check className="w-4 h-4 text-[#207868]" />
                Choose Built-in Presets
              </h3>
              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                Select a traditional or modern pre-designed layout texture to visualise perspective surfaces instantly.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" id="expanded-tile-grid">
              {tiles.map((tile) => (
                <button
                  key={tile.id}
                  onClick={() => setSelectedTileId(tile.id)}
                  className={`relative p-3 rounded-2xl border text-left bg-white transition-all hover:shadow-md flex flex-col justify-between gap-3 group cursor-pointer ${
                    selectedTileId === tile.id
                      ? "border-[#1D4A3F] ring-2 ring-[#207868]/15 shadow-md"
                      : "border-neutral-200/80 hover:border-neutral-350"
                  }`}
                  id={`expanded-tile-${tile.id}`}
                >
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-100 border border-neutral-150 shrink-0">
                    <img
                      src={tile.imageUrl}
                      alt={tile.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-2 right-2 bg-[#121824]/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[9px] font-black text-white border border-neutral-700/35">
                      {tile.widthMm === 600 && tile.heightMm === 600 ? "60x60 cm" : tile.widthMm === 200 ? "20x120 cm" : "30x60 cm"}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <span className="inline-block text-[9px] bg-[#1D4A3F]/10 text-[#196053] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                        {tile.category}
                      </span>
                      <h4 className="text-[12.5px] font-black text-neutral-900 leading-tight mt-1 group-hover:text-[#196053] transition-colors">{tile.name}</h4>
                      <p className="text-[10.5px] text-neutral-500 font-semibold leading-normal mt-1 italic">
                        Style: {tile.colorStyle}
                      </p>
                    </div>
                  </div>

                  {selectedTileId === tile.id && (
                    <div className="absolute top-4 left-4 bg-[#1D4A3F] text-white rounded-full p-1 shadow-md z-10 border border-white/20">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* 3. Premium Elegant Device-Friendly Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-800/80 px-6 py-10 text-neutral-400 text-xs mt-auto relative overflow-hidden" id="tilevista-footer">
        {/* Subtle decorative premium gradient bar at the top */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-600 to-amber-500 opacity-80" />

        <div className="max-w-xl mx-auto flex flex-col items-center justify-center gap-6 text-center animate-fade-in" id="footer-container">
          {/* Brand: uses exact same logo icon grid and typography from header */}
          <div className="flex items-center gap-2.5 justify-center" id="footer-brand">
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

          {/* Academic Portfolio Credit & Link */}
          <div className="flex flex-col items-center text-center space-y-1.5" id="footer-academic">
            <p className="text-neutral-300 text-[13px] sm:text-sm font-bold tracking-wide">
              A project by{" "}
              <a
                href="https://saimabiva.pro.bd/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FFAA47] hover:text-[#ffbe73] underline decoration-wavy decoration-[#FFAA47]/40 underline-offset-4 transition-all font-black"
                id="saima-portfolio-link"
              >
                Saima Biva
              </a>
            </p>
            <p className="text-neutral-500 text-[10px] sm:text-xs font-semibold tracking-wider uppercase">
              Department of Ceramics & Sculpture · University of Rajshahi
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
