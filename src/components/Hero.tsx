import { Upload, ChevronRight, Play, CheckCircle, Shield, SlidersHorizontal, RefreshCcw } from "lucide-react";

interface HeroProps {
  onStartPhoto: () => void;
  onStartDimension: () => void;
  onStartDemo: () => void;
}

export default function Hero({ onStartPhoto, onStartDimension, onStartDemo }: HeroProps) {
  return (
    <div className="bg-neutral-50/50 min-h-[calc(100vh-80px)] py-12 px-6 sm:px-12 flex flex-col justify-center items-center" id="tilevista-landing">
      {/* Hero Header */}
      <div className="max-w-4xl text-center space-y-6 mb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-900 text-white rounded-full text-xs font-semibold uppercase tracking-wider" id="hero-badge">
          TileVista Experience
        </span>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-neutral-900 tracking-tight font-display leading-[1.1]" id="hero-title">
          Visualize Your Dream Floor <br />
          <span className="text-neutral-500">Before You Build It.</span>
        </h2>
        <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed" id="hero-desc">
          Upload your room, choose from our premium tile catalog, and instantly preview how your space could look. Perfect layout planning with smart quantity estimations.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4" id="hero-ctas">
          <button
            id="cta-start-btn"
            onClick={onStartPhoto}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-900 text-white hover:bg-neutral-800 px-8 py-4 rounded-xl font-bold shadow-lg shadow-neutral-900/10 hover:shadow-neutral-900/20 active:scale-95 transition-all cursor-pointer"
          >
            <Upload className="w-5 h-5" />
            Start Visualizing
          </button>
          <button
            id="cta-demo-btn"
            onClick={onStartDemo}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-neutral-300 hover:border-neutral-400 text-neutral-800 hover:bg-neutral-50 px-8 py-4 rounded-xl font-bold active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            Explore Demo Room
          </button>
        </div>
      </div>

      {/* Visual Side-by-Side Comparison Mockup */}
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-neutral-200/80 shadow-xl overflow-hidden mb-16 p-4 group" id="hero-visual-card">
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-neutral-100 flex items-center justify-center" id="hero-visual-container">
          {/* Left Side: Original Room */}
          <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden border-r-2 border-white z-10" id="before-side">
            <div className="absolute inset-0 bg-neutral-800/20 flex items-center justify-center p-4">
              <span className="absolute top-4 left-4 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                Before
              </span>
              {/* Artistic geometric floor layout representing an un-tiled wood/concrete room */}
              <div className="absolute bottom-0 inset-x-0 h-2/3 bg-neutral-300 border-t border-neutral-400 transform -skew-x-12 origin-bottom flex items-center justify-center">
                <span className="text-neutral-500 font-semibold text-sm">Dull Concrete Surface</span>
              </div>
            </div>
          </div>

          {/* Right Side: Visualized Tiles */}
          <div className="absolute inset-0 w-full h-full" id="after-side">
            <div className="absolute inset-0 bg-neutral-800/10 flex items-center justify-center p-4">
              <span className="absolute top-4 right-4 bg-neutral-900 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                After (Visualized)
              </span>
              {/* Perspective grid representing elegant premium tile textures */}
              <div className="absolute bottom-0 inset-x-0 h-2/3 bg-white/95 transform -skew-x-12 origin-bottom grid grid-cols-6 grid-rows-4 border-t border-neutral-200 divide-x divide-y divide-neutral-200">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="bg-neutral-50/70 hover:bg-neutral-100 transition-colors"></div>
                ))}
              </div>
              <div className="absolute bottom-12 right-12 z-20 bg-white/95 px-4 py-2 rounded-lg border border-neutral-100 shadow-md text-xs font-bold text-neutral-800">
                Carrara Gold Marble Grid
              </div>
            </div>
          </div>

          {/* Slider line accent */}
          <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white z-20 shadow-lg pointer-events-none group-hover:scale-y-105 transition-transform duration-300"></div>
        </div>
      </div>

      {/* Choose Visualization Mode Selection Segment */}
      <div className="w-full max-w-4xl mb-16 space-y-6" id="visualization-mode-select">
        <h3 className="text-2xl font-bold text-neutral-900 text-center font-display">Step 1 — Choose Visualization Mode</h3>
        
        <div className="grid md:grid-cols-2 gap-6" id="options-grid">
          {/* Option A: Upload Room Photo */}
          <div
            id="card-option-photo"
            onClick={onStartPhoto}
            className="bg-white hover:bg-neutral-50/50 p-8 rounded-2xl border-2 border-neutral-200 hover:border-neutral-900 shadow-sm transition-all duration-300 cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 bg-neutral-100 text-neutral-900 rounded-xl flex items-center justify-center mb-6 group-hover:bg-neutral-900 group-hover:text-white transition-colors duration-300">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-neutral-950 mb-2">Option A: Upload Room Photo</h4>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Take a real photograph of your own living room, kitchen, bathroom, or outdoor patio. Map tiles directly onto the walls or floor with intelligent AI perspective alignment.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 mt-6">
              Use Photo Mode <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Option B: Enter Room Dimensions */}
          <div
            id="card-option-dimensions"
            onClick={onStartDimension}
            className="bg-white hover:bg-neutral-50/50 p-8 rounded-2xl border-2 border-neutral-200 hover:border-neutral-900 shadow-sm transition-all duration-300 cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 bg-neutral-100 text-neutral-900 rounded-xl flex items-center justify-center mb-6 group-hover:bg-neutral-900 group-hover:text-white transition-colors duration-300">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-neutral-950 mb-2">Option B: Enter Room Dimensions</h4>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Don't have a photograph? Simply type in your room's wall or floor dimensions to compute tile counts and render a highly accurate top-down grid blueprint.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 mt-6">
              Use Dimension Mode <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Features Showcase Section */}
      <div className="w-full max-w-5xl py-12 border-t border-neutral-200/70" id="features-showcase">
        <h3 className="text-2xl font-bold text-neutral-900 text-center mb-10 font-display">Crafted with Complete Features</h3>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" id="features-grid">
          {/* Feature 1 */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-3">
            <h4 className="font-bold text-neutral-900">Realistic Room Preview</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Drapes the tile texture across original room pictures with active lighting reflections and surface depth adjustments.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-3">
            <h4 className="font-bold text-neutral-900">AI Surface Detection</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Powered by advanced Gemini vision processing to automatically detect room boundaries, floors, and walls in seconds.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-3">
            <h4 className="font-bold text-neutral-900">Custom Tile Upload</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Found a tile elsewhere? Capture its photograph, upload it here, define its real-world dimensions, and watch it tile.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-3">
            <h4 className="font-bold text-neutral-900">Tile Layout Planner</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Top-down 2D simulation that lets you align grout grids from the center, corners, or custom coordinates.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-3">
            <h4 className="font-bold text-neutral-900">Smart Quantity Estimate</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Calculates structural square-meterage coverage, estimates gross numbers, and adds customizable installation wastage.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-3">
            <h4 className="font-bold text-neutral-900">Before & After Slider</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Slide a interactive dividing bar side-to-side to inspect the visual contrast between raw rooms and newly-styled tiles.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="text-center text-xs text-neutral-400 mt-12 max-w-lg flex flex-col items-center gap-1.5" id="landing-privacy">
        <span className="flex items-center gap-1 text-neutral-500 font-semibold">
          <Shield className="w-3.5 h-3.5" />
          100% Secure & Client-Side Privacy
        </span>
        <p className="leading-relaxed">
          Your uploaded room pictures remain securely processed inside your browser cache. They are never sent to external servers unless you actively request AI automatic surface detection.
        </p>
      </div>
    </div>
  );
}
