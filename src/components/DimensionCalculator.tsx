import { DimensionState, EstimationResult } from "../types";
import { calculateTiles } from "../services/calculationService";
import { Calculator, Info, Compass, HelpCircle } from "lucide-react";

interface DimensionCalculatorProps {
  state: DimensionState;
  onChangeState: (state: DimensionState) => void;
}

export default function DimensionCalculator({ state, onChangeState }: DimensionCalculatorProps) {
  // Compute metrics reactively
  const metrics = calculateTiles(state);

  const updateParam = <K extends keyof DimensionState>(key: K, value: DimensionState[K]) => {
    onChangeState({
      ...state,
      [key]: value,
    });
  };

  const alignOptions: { value: DimensionState["alignment"]; label: string; desc: string }[] = [
    { value: "center", label: "Center Align", desc: "Aligns tile center at the absolute middle of the room." },
    { value: "edge", label: "Corner Align", desc: "Aligns first tile flush with the top-left room boundaries." },
    { value: "custom", label: "Custom Shift", desc: "Slide individual offsets manually to adjust starting seams." },
  ];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-sm space-y-6" id="dimension-calculator-panel">
      {/* Panel Header */}
      <div className="flex items-center gap-2 border-b border-neutral-100 pb-3" id="calc-header">
        <Calculator className="w-5 h-5 text-neutral-800" />
        <h3 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">Dimension & Quantity Estimator</h3>
      </div>

      {/* Grid Inputs */}
      <div className="space-y-4" id="calculator-inputs-group">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-neutral-500 uppercase">Room Length (meters)</label>
            <input
              type="number"
              min="0.5"
              max="100"
              step="0.1"
              value={state.roomLengthM}
              onChange={(e) => updateParam("roomLengthM", parseFloat(e.target.value) || 4.0)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-neutral-900 focus:bg-white"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-neutral-500 uppercase">Room Width (meters)</label>
            <input
              type="number"
              min="0.5"
              max="100"
              step="0.1"
              value={state.roomWidthM}
              onChange={(e) => updateParam("roomWidthM", parseFloat(e.target.value) || 5.0)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-neutral-900 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-neutral-500 uppercase">Tile Length (mm)</label>
            <input
              type="number"
              min="50"
              max="3000"
              value={state.tileLengthMm}
              onChange={(e) => updateParam("tileLengthMm", parseInt(e.target.value) || 600)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-neutral-900 focus:bg-white"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-neutral-500 uppercase">Tile Width (mm)</label>
            <input
              type="number"
              min="50"
              max="3000"
              value={state.tileWidthMm}
              onChange={(e) => updateParam("tileWidthMm", parseInt(e.target.value) || 600)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-neutral-900 focus:bg-white"
            />
          </div>
        </div>

        {/* Wastage Multiplier */}
        <div className="space-y-1.5" id="wastage-multiplier-group">
          <div className="flex justify-between items-center text-[10px] font-bold text-neutral-500 uppercase">
            <span>Recommended Wastage Percentage</span>
            <span className="text-neutral-900 font-extrabold text-[11px]">{state.wastagePercent}%</span>
          </div>
          <div className="flex items-center gap-3 bg-neutral-50 px-3 py-2.5 rounded-lg border border-neutral-200/50">
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={state.wastagePercent}
              onChange={(e) => updateParam("wastagePercent", parseInt(e.target.value))}
              className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
            />
            <span className="text-[10px] font-bold text-neutral-400">0% - 30%</span>
          </div>
        </div>
      </div>

      {/* RENDER DYNAMIC ESTIMATES METRICS */}
      <div className="bg-neutral-50 rounded-2xl p-4.5 border border-neutral-150 space-y-4 shadow-inner" id="calc-metrics-dashboard">
        <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Coverage & Quantities Dashboard</h4>

        <div className="grid grid-cols-2 gap-3.5 text-xs" id="metrics-details-grid">
          <div className="bg-white p-3 rounded-xl border border-neutral-200/60 shadow-sm" id="metric-room-area">
            <span className="block text-[9px] font-bold text-neutral-400 uppercase leading-none">Room Surface Area</span>
            <span className="block text-base font-extrabold text-neutral-900 mt-1.5">{metrics.roomAreaSqM.toFixed(2)} m²</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-neutral-200/60 shadow-sm" id="metric-tile-area">
            <span className="block text-[9px] font-bold text-neutral-400 uppercase leading-none">Individual Tile Area</span>
            <span className="block text-base font-extrabold text-neutral-900 mt-1.5">{metrics.tileAreaSqM.toFixed(4)} m²</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-neutral-200/60 shadow-sm" id="metric-gross-tiles">
            <span className="block text-[9px] font-bold text-neutral-400 uppercase leading-none">Pure Net Tiles</span>
            <span className="block text-base font-extrabold text-neutral-900 mt-1.5">{metrics.estimatedTilesCount} <span className="text-[10px] text-neutral-400 font-bold">units</span></span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-neutral-200/60 shadow-sm" id="metric-gross-wastage">
            <span className="block text-[9px] font-bold text-neutral-400 uppercase leading-none">Wastage Buffer ({state.wastagePercent}%)</span>
            <span className="block text-base font-extrabold text-amber-600 mt-1.5">+{metrics.wastageCount} <span className="text-[10px] text-amber-500 font-bold">units</span></span>
          </div>
        </div>

        {/* Total recommended units highlighted */}
        <div className="bg-neutral-900 text-white rounded-xl p-4 flex items-center justify-between" id="metric-highlight-card">
          <div>
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Gross Required Order</span>
            <span className="block text-2xl font-extrabold tracking-tight mt-0.5">{metrics.totalTilesCount} <span className="text-xs text-neutral-400 font-semibold">Tiles</span></span>
          </div>
          <div className="text-right">
            <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Total Coverage</span>
            <span className="block text-sm font-bold text-neutral-200 mt-0.5">{metrics.totalCoverageSqM.toFixed(2)} m²</span>
          </div>
        </div>
      </div>

      {/* SEAM GRID ALIGNMENT */}
      <div className="space-y-3 border-t border-neutral-100 pt-5" id="alignment-settings">
        <label className="block text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-neutral-500" />
          Grid Grout Line Seam Alignment
        </label>

        <div className="space-y-2">
          {alignOptions.map((opt) => (
            <button
              key={opt.value}
              id={`alignment-option-${opt.value}`}
              onClick={() => updateParam("alignment", opt.value)}
              className={`w-full text-left p-3 rounded-xl border flex flex-col transition-all cursor-pointer ${
                state.alignment === opt.value
                  ? "bg-neutral-950 text-white border-neutral-950 shadow-md"
                  : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <span className="font-bold text-xs">{opt.label}</span>
              <span className={`text-[10px] mt-0.5 leading-normal ${state.alignment === opt.value ? "text-neutral-300" : "text-neutral-400"}`}>
                {opt.desc}
              </span>
            </button>
          ))}
        </div>

        {/* Custom Start Offset Sliders */}
        {state.alignment === "custom" && (
          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-100 space-y-3 mt-2" id="custom-alignment-offsets">
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-bold text-neutral-500 uppercase">
                <span>Horizontal Seam Shift</span>
                <span>{state.customStartX}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={state.customStartX}
                onChange={(e) => updateParam("customStartX", parseInt(e.target.value))}
                className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-bold text-neutral-500 uppercase">
                <span>Vertical Seam Shift</span>
                <span>{state.customStartY}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={state.customStartY}
                onChange={(e) => updateParam("customStartY", parseInt(e.target.value))}
                className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
              />
            </div>
          </div>
        )}
      </div>

      {/* Safety Legal Disclaimer notice */}
      <div className="bg-amber-50/50 rounded-xl p-3.5 border border-amber-200/50 flex items-start gap-2.5 text-xs text-amber-800 leading-normal" id="calculator-disclaimer">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-900 block mb-0.5">Calculation Disclaimer</span>
          All computed totals are architectural estimates. Actual quantities may vary based on exact cut angles, layout breaks, installer technique, grout widths, and job-site conditions. Always consult a certified professional installer before purchase.
        </div>
      </div>
    </div>
  );
}
