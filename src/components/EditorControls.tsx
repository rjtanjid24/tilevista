import { useState } from "react";
import { EditorControlsState, SurfaceType, TilePattern } from "../types";
import { Sliders, Eye, Sparkles, Move, FileDown, RotateCcw, AlertCircle, Settings } from "lucide-react";

interface EditorControlsProps {
  controls: EditorControlsState;
  onChangeControls: (controls: EditorControlsState) => void;
  onRunAIDetection: () => void;
  isAIDetecting: boolean;
  aiError: string | null;
  onExport: () => void;
  onReset: () => void;
  showComparisonSlider: boolean;
  onToggleComparisonSlider: (val: boolean) => void;
  hasRoom: boolean;
}

export default function EditorControls({
  controls,
  onChangeControls,
  onRunAIDetection,
  isAIDetecting,
  aiError,
  onExport,
  onReset,
  showComparisonSlider,
  onToggleComparisonSlider,
  hasRoom,
}: EditorControlsProps) {
  // Collapsible Accordion states
  const [openSection, setOpenSection] = useState<string>("room");

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? "" : section);
  };

  const updateControl = <K extends keyof EditorControlsState>(key: K, value: EditorControlsState[K]) => {
    onChangeControls({
      ...controls,
      [key]: value,
    });
  };

  const surfaceOptions: { value: SurfaceType; label: string }[] = [
    { value: "floor", label: "Floor" },
    { value: "wall", label: "Wall" },
    { value: "custom", label: "Custom Area" },
  ];

  const patternOptions: { value: TilePattern; label: string }[] = [
    { value: "straight", label: "Straight Grid" },
    { value: "brick", label: "Brick / Offset" },
    { value: "running-bond", label: "Running Bond" },
    { value: "stack", label: "Stack Bond" },
    { value: "herringbone", label: "Herringbone" },
    { value: "diagonal", label: "Diagonal (45°)" },
    { value: "random", label: "Natural Variation" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-sm space-y-5" id="editor-controls-panel">
      {/* Sidebar Header */}
      <div className="flex items-center gap-2 border-b border-neutral-100 pb-3" id="controls-header">
        <Settings className="w-5 h-5 text-neutral-800" />
        <h3 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">Visualization Studio</h3>
      </div>

      <div className="space-y-3" id="controls-accordion-container">
        {/* SECTION 1: ROOM & SURFACE DETECTION */}
        <div className="border border-neutral-100 rounded-xl overflow-hidden shadow-sm" id="accordion-section-room">
          <button
            onClick={() => toggleSection("room")}
            className="w-full bg-neutral-50 px-4 py-3 flex items-center justify-between text-left font-bold text-xs text-neutral-800 hover:bg-neutral-100/70 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-neutral-600" />
              1. ROOM & BOUNDARY MAPPING
            </span>
            <span className="text-neutral-400">{openSection === "room" ? "▲" : "▼"}</span>
          </button>

          {openSection === "room" && (
            <div className="p-4 space-y-4 bg-white text-xs">
              {/* Surface type selector */}
              <div className="space-y-1.5">
                <label className="block font-bold text-neutral-500 uppercase text-[10px]">Apply Tiles To</label>
                <div className="grid grid-cols-3 gap-2">
                  {surfaceOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateControl("surfaceType", opt.value)}
                      className={`py-2 px-1 rounded-lg border font-semibold text-[11px] text-center transition-all cursor-pointer ${
                        controls.surfaceType === opt.value
                          ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                          : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Boundary Mode Toggles */}
              <div className="space-y-1.5">
                <label className="block font-bold text-neutral-500 uppercase text-[10px]">Boundary Anchors Selection</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateControl("detectionMode", "auto")}
                    className={`py-2 px-1 rounded-lg border font-semibold text-[11px] text-center transition-all cursor-pointer ${
                      controls.detectionMode === "auto"
                        ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    AI Automatic
                  </button>
                  <button
                    onClick={() => updateControl("detectionMode", "manual")}
                    className={`py-2 px-1 rounded-lg border font-semibold text-[11px] text-center transition-all cursor-pointer ${
                      controls.detectionMode === "manual"
                        ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    Manual Editor
                  </button>
                </div>
              </div>

              {/* AI Auto Trigger Button */}
              {controls.detectionMode === "auto" && (
                <div className="space-y-2 pt-1">
                  <button
                    onClick={onRunAIDetection}
                    disabled={isAIDetecting || !hasRoom}
                    className="w-full flex items-center justify-center gap-1.5 bg-neutral-900 text-white disabled:bg-neutral-200 disabled:text-neutral-400 py-2.5 rounded-lg font-bold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    {isAIDetecting ? "AI Identifying Surface..." : "Identify Floor with AI"}
                  </button>
                  
                  {aiError && (
                    <div className="flex items-start gap-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-700">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div>{aiError}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: TILING LAYOUT PARAMETERS */}
        <div className="border border-neutral-100 rounded-xl overflow-hidden shadow-sm" id="accordion-section-tile">
          <button
            onClick={() => toggleSection("tile")}
            className="w-full bg-neutral-50 px-4 py-3 flex items-center justify-between text-left font-bold text-xs text-neutral-800 hover:bg-neutral-100/70 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-neutral-600" />
              2. TILING LAYOUT STYLE
            </span>
            <span className="text-neutral-400">{openSection === "tile" ? "▲" : "▼"}</span>
          </button>

          {openSection === "tile" && (
            <div className="p-4 space-y-4 bg-white text-xs">
              {/* Pattern options selection */}
              <div className="space-y-1.5">
                <label className="block font-bold text-neutral-500 uppercase text-[10px]">Tiling Pattern</label>
                <select
                  value={controls.tilePattern}
                  onChange={(e) => updateControl("tilePattern", e.target.value as TilePattern)}
                  className="w-full bg-white border border-neutral-200 hover:border-neutral-300 rounded-lg px-2.5 py-2 font-semibold text-neutral-800 focus:outline-none focus:border-neutral-950"
                >
                  {patternOptions.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tile Grout Width and Color */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-neutral-500 uppercase text-[10px]">Grout Width</label>
                  <div className="flex items-center gap-2 bg-neutral-50 px-2 py-1.5 rounded-lg border border-neutral-200/50">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={controls.groutWidthMm}
                      onChange={(e) => updateControl("groutWidthMm", parseInt(e.target.value))}
                      className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                    />
                    <span className="font-bold text-[11px] text-neutral-700 min-w-[30px] text-right">
                      {controls.groutWidthMm}mm
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-neutral-500 uppercase text-[10px]">Grout Color</label>
                  <div className="flex items-center gap-2 bg-neutral-50 px-2 py-1.5 rounded-lg border border-neutral-200/50">
                    <input
                      type="color"
                      value={controls.groutColor}
                      onChange={(e) => updateControl("groutColor", e.target.value)}
                      className="w-7 h-5 border-0 rounded cursor-pointer p-0 bg-transparent"
                    />
                    <span className="font-bold text-[10px] text-neutral-700 uppercase">
                      {controls.groutColor}
                    </span>
                  </div>
                </div>
              </div>

              {/* General Rotation slider */}
              <div className="space-y-1.5">
                <label className="block font-bold text-neutral-500 uppercase text-[10px]">Custom Pattern Rotation</label>
                <div className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200/50">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={controls.tileRotation}
                    onChange={(e) => updateControl("tileRotation", parseInt(e.target.value))}
                    className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                  />
                  <span className="font-bold text-[11px] text-neutral-700 min-w-[35px] text-right">
                    {controls.tileRotation}°
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: HOMOGRAPHY & PERSPECTIVE ALIGNMENTS */}
        <div className="border border-neutral-100 rounded-xl overflow-hidden shadow-sm" id="accordion-section-perspective">
          <button
            onClick={() => toggleSection("perspective")}
            className="w-full bg-neutral-50 px-4 py-3 flex items-center justify-between text-left font-bold text-xs text-neutral-800 hover:bg-neutral-100/70 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Move className="w-4 h-4 text-neutral-600" />
              3. TEXTURE SCALE & SHIFTS
            </span>
            <span className="text-neutral-400">{openSection === "perspective" ? "▲" : "▼"}</span>
          </button>

          {openSection === "perspective" && (
            <div className="p-4 space-y-4 bg-white text-xs">
              {/* Tile Size Scale Modifier */}
              <div className="space-y-1.5">
                <label className="block font-bold text-neutral-500 uppercase text-[10px]">Texture Scale Ratio</label>
                <div className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200/50">
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.05"
                    value={controls.scale}
                    onChange={(e) => updateControl("scale", parseFloat(e.target.value))}
                    className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                  />
                  <span className="font-bold text-[11px] text-neutral-700 min-w-[30px] text-right">
                    {Math.round(controls.scale * 100)}%
                  </span>
                </div>
              </div>

              {/* Offset X and Offset Y for aligning tiles */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-neutral-500 uppercase text-[10px]">Align X (Shift)</label>
                  <input
                    type="range"
                    min="-150"
                    max="150"
                    value={controls.offsetX}
                    onChange={(e) => updateControl("offsetX", parseInt(e.target.value))}
                    className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-neutral-500 uppercase text-[10px]">Align Y (Shift)</label>
                  <input
                    type="range"
                    min="-150"
                    max="150"
                    value={controls.offsetY}
                    onChange={(e) => updateControl("offsetY", parseInt(e.target.value))}
                    className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: APPEARANCE & RENDERING BLENDS */}
        <div className="border border-neutral-100 rounded-xl overflow-hidden shadow-sm" id="accordion-section-appearance">
          <button
            onClick={() => toggleSection("appearance")}
            className="w-full bg-neutral-50 px-4 py-3 flex items-center justify-between text-left font-bold text-xs text-neutral-800 hover:bg-neutral-100/70 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neutral-600" />
              4. APPEARANCE & RENDERING BLENDS
            </span>
            <span className="text-neutral-400">{openSection === "appearance" ? "▲" : "▼"}</span>
          </button>

          {openSection === "appearance" && (
            <div className="p-4 space-y-4 bg-white text-xs">
              {/* Opacity slider */}
              <div className="space-y-1.5">
                <label className="block font-bold text-neutral-500 uppercase text-[10px]">Tile Layer Opacity</label>
                <div className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200/50">
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={controls.opacity}
                    onChange={(e) => updateControl("opacity", parseFloat(e.target.value))}
                    className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                  />
                  <span className="font-bold text-[11px] text-neutral-700 min-w-[30px] text-right">
                    {Math.round(controls.opacity * 100)}%
                  </span>
                </div>
              </div>

              {/* Surface Shadows Blend (Multiply) */}
              <div className="space-y-1.5">
                <label className="block font-bold text-neutral-500 uppercase text-[10px]">Ambient Room Shadows Blend</label>
                <div className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200/50">
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={controls.shadow}
                    onChange={(e) => updateControl("shadow", parseFloat(e.target.value))}
                    className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                  />
                  <span className="font-bold text-[11px] text-neutral-700 min-w-[30px] text-right">
                    {Math.round(controls.shadow * 100)}%
                  </span>
                </div>
              </div>

              {/* Specular Reflection Blend (Screen) */}
              <div className="space-y-1.5">
                <label className="block font-bold text-neutral-500 uppercase text-[10px]">Light Reflection / Gloss Sheen</label>
                <div className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200/50">
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={controls.reflection}
                    onChange={(e) => updateControl("reflection", parseFloat(e.target.value))}
                    className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                  />
                  <span className="font-bold text-[11px] text-neutral-700 min-w-[30px] text-right">
                    {Math.round(controls.reflection * 100)}%
                  </span>
                </div>
              </div>

              {/* Brightness Adjustment overlay */}
              <div className="space-y-1.5">
                <label className="block font-bold text-neutral-500 uppercase text-[10px]">Brightness Shift</label>
                <div className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200/50">
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={controls.brightness}
                    onChange={(e) => updateControl("brightness", parseFloat(e.target.value))}
                    className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                  />
                  <span className="font-bold text-[11px] text-neutral-700 min-w-[30px] text-right">
                    {Math.round((controls.brightness - 1.0) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* COMPARATIVE BEFORE/AFTER SPLIT SLIDER CONTROL */}
      <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-150 space-y-2.5 shadow-inner" id="split-slider-widget">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Before / After Slider View</span>
          <button
            id="toggle-slider-btn"
            onClick={() => onToggleComparisonSlider(!showComparisonSlider)}
            className={`px-3 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
              showComparisonSlider
                ? "bg-neutral-950 text-white border-neutral-950"
                : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
            }`}
          >
            {showComparisonSlider ? "Disable Split" : "Enable Split"}
          </button>
        </div>
        <p className="text-[10px] text-neutral-400 leading-relaxed">
          Splits your render view in half. Drag the vertical line horizontally to compare your raw room image directly with the tiled visualization layer.
        </p>
      </div>

      {/* FOOTER ACTION PANEL (EXPORT PNG, RESET) */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-100" id="controls-footer-actions">
        <button
          id="export-visualization-btn"
          onClick={onExport}
          disabled={!hasRoom}
          className="w-full flex items-center justify-center gap-2 bg-neutral-950 text-white hover:bg-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-400 py-3.5 rounded-xl font-bold text-xs shadow-md active:scale-[0.98] transition-all cursor-pointer"
        >
          <FileDown className="w-4 h-4" />
          Export PNG
        </button>
        <button
          id="controls-reset-btn"
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 py-3.5 rounded-xl font-bold text-xs active:scale-[0.98] transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Start Over
        </button>
      </div>
    </div>
  );
}
