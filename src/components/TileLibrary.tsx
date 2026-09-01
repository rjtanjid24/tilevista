import React, { useState, useRef } from "react";
import { TileData, TilePreset } from "../types";
import { Image as ImageIcon, Upload, Grid3X3, Plus } from "lucide-react";

interface TileLibraryProps {
  tiles: TileData[];
  selectedTileId: string;
  onSelectTile: (tileId: string) => void;
  onUploadCustomTile: (file: File, widthMm: number, heightMm: number) => void;
  onUpdateTileDimensions: (tileId: string, w: number, h: number) => void;
}

const TILE_PRESETS: TilePreset[] = [
  { id: "p1", name: "300 × 300 mm", widthMm: 300, heightMm: 300 },
  { id: "p2", name: "300 × 600 mm", widthMm: 300, heightMm: 600 },
  { id: "p3", name: "400 × 400 mm", widthMm: 400, heightMm: 400 },
  { id: "p4", name: "600 × 600 mm", widthMm: 600, heightMm: 600 },
  { id: "p5", name: "600 × 1200 mm", widthMm: 600, heightMm: 1200 },
];

export default function TileLibrary({
  tiles,
  selectedTileId,
  onSelectTile,
  onUploadCustomTile,
  onUpdateTileDimensions,
}: TileLibraryProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [customWidth, setCustomWidth] = useState<number>(600);
  const [customHeight, setCustomHeight] = useState<number>(600);
  const [customTileName, setCustomTileName] = useState<string>("My Custom Tile");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);

  const selectedTile = tiles.find((t) => t.id === selectedTileId);

  // Filter tiles based on categories
  const filteredTiles = tiles.filter(
    (tile) => activeTab === "all" || tile.category === activeTab
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.match("image.*")) {
      alert("Please upload an image file (JPG, PNG, WEBP).");
      return;
    }
    onUploadCustomTile(file, customWidth, customHeight);
  };

  // Adjust dimensions of the active selected tile
  const handlePresetSelect = (preset: TilePreset) => {
    setCustomWidth(preset.widthMm);
    setCustomHeight(preset.heightMm);
    if (selectedTileId) {
      onUpdateTileDimensions(selectedTileId, preset.widthMm, preset.heightMm);
    }
  };

  const handleWidthChange = (w: number) => {
    setCustomWidth(w);
    if (selectedTileId) {
      onUpdateTileDimensions(selectedTileId, w, customHeight);
    }
  };

  const handleHeightChange = (h: number) => {
    setCustomHeight(h);
    if (selectedTileId) {
      onUpdateTileDimensions(selectedTileId, customWidth, h);
    }
  };

  const categories = [
    { id: "all", label: "All Tiles" },
    { id: "marble", label: "Marble" },
    { id: "stone", label: "Stone" },
    { id: "ceramic", label: "Ceramic" },
    { id: "wood", label: "Wood Planks" },
    { id: "concrete", label: "Concrete" },
    { id: "pattern", label: "Patterned" },
    { id: "plain", label: "Plain Solid" },
  ];

  return (
    <div className="space-y-6" id="tile-library-container">
      {/* Category Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-2" id="tile-library-header">
        <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-neutral-500" />
          Step 3 — Select Tile Design
        </h3>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none" id="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === cat.id
                ? "bg-neutral-950 text-white shadow-sm"
                : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid of Tile Cards */}
      <div className="grid grid-cols-2 xs:grid-cols-3 gap-3.5 max-h-[300px] overflow-y-auto pr-1" id="tile-cards-grid">
        {/* Custom Upload Tile Selector Card */}
        <div
          id="upload-custom-tile-card"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`h-full aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-3 cursor-pointer transition-all ${
            dragOver
              ? "border-neutral-900 bg-neutral-50 text-neutral-900"
              : "border-neutral-200 hover:border-neutral-400 bg-white text-neutral-500"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/png, image/jpeg, image/jpg, image/webp"
          />
          <div className="w-9 h-9 rounded-full bg-neutral-50 flex items-center justify-center mb-2 shadow-inner">
            <Upload className="w-4 h-4 text-neutral-600" />
          </div>
          <span className="text-[11px] font-bold text-neutral-800 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Upload Tile
          </span>
          <span className="text-[9px] text-neutral-400 mt-1 block">JPG, PNG, WEBP</span>
        </div>

        {filteredTiles.map((tile) => (
          <button
            key={tile.id}
            id={`tile-card-${tile.id}`}
            onClick={() => onSelectTile(tile.id)}
            className={`relative rounded-xl border text-left p-2.5 bg-white transition-all overflow-hidden flex flex-col justify-between aspect-square group cursor-pointer ${
              selectedTileId === tile.id
                ? "border-neutral-900 ring-2 ring-neutral-900/10 shadow-md"
                : "border-neutral-200/80 hover:border-neutral-400 hover:shadow-sm"
            }`}
          >
            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-neutral-50 border border-neutral-100 shadow-sm" id={`tile-img-container-${tile.id}`}>
              <img
                src={tile.imageUrl}
                alt={tile.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute bottom-1 right-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold text-neutral-700 uppercase tracking-wide border border-neutral-200/40">
                {tile.widthMm}x{tile.heightMm} mm
              </span>
            </div>

            <div className="mt-2" id={`tile-details-${tile.id}`}>
              <span className="block text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{tile.category}</span>
              <h4 className="text-xs font-bold text-neutral-900 line-clamp-1 leading-tight">{tile.name}</h4>
              <p className="text-[9px] text-neutral-400 line-clamp-1 mt-0.5">{tile.colorStyle}</p>
            </div>

            {selectedTileId === tile.id && (
              <span className="absolute top-1 left-1 bg-neutral-950 text-white rounded-full p-1" id={`tile-check-${tile.id}`}>
                <CheckCircle className="w-3.5 h-3.5 fill-current text-white bg-neutral-950" />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Selected Tile Properties / Controls */}
      {selectedTile && (
        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/50 space-y-4" id="tile-dimension-adjustment">
          <div className="flex items-center justify-between" id="selected-tile-summary">
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-400">Active Tile Blueprint</span>
              <h5 className="text-xs font-bold text-neutral-900">{selectedTile.name}</h5>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold text-neutral-500">Dimensions</span>
              <span className="block text-xs font-bold text-neutral-900">{selectedTile.widthMm} × {selectedTile.heightMm} mm</span>
            </div>
          </div>

          {/* Size Presets */}
          <div className="space-y-1.5" id="tile-presets">
            <label className="block text-[10px] font-bold text-neutral-500 uppercase">Standard Size Presets</label>
            <div className="flex flex-wrap gap-1.5">
              {TILE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                    selectedTile.widthMm === preset.widthMm && selectedTile.heightMm === preset.heightMm
                      ? "bg-neutral-950 text-white border-neutral-950"
                      : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Dimension Inputs */}
          <div className="grid grid-cols-2 gap-3" id="tile-custom-dimensions">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase">Tile Width (mm)</label>
              <input
                type="number"
                min="50"
                max="3000"
                value={selectedTile.widthMm}
                onChange={(e) => handleWidthChange(parseInt(e.target.value) || 600)}
                className="w-full bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-neutral-900"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase">Tile Height (mm)</label>
              <input
                type="number"
                min="50"
                max="3000"
                value={selectedTile.heightMm}
                onChange={(e) => handleHeightChange(parseInt(e.target.value) || 600)}
                className="w-full bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-neutral-900"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Minimal icons wrapper for local React 19 safety
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
}
