import { SquarePlus, Save, Share2, ChevronDown } from "lucide-react";

interface HeaderProps {
  onReset: () => void;
  onSave: () => void;
  onShare: () => void;
}

export default function Header({ onReset, onSave, onShare }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-150 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm" id="tilevista-header">
      {/* Left: Brand Logo & Name */}
      <div className="flex items-center gap-2.5">
        {/* Crisp 2x2 colored tile logo */}
        <div className="grid grid-cols-2 gap-0.5 w-6 h-6 sm:w-7 sm:h-7 shrink-0" id="logo-icon-grid">
          <div className="bg-[#F19A3E] rounded-[1px]" /> {/* Orange */}
          <div className="bg-[#72AD9C] rounded-[1px]" /> {/* Cyan/Teal */}
          <div className="bg-[#566266] rounded-[1px]" /> {/* Grey */}
          <div className="bg-[#EAD2AC] rounded-[1px]" /> {/* Beige */}
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1D4A3F] font-sans" id="tiledit-logo-title">
          TileVista
        </h1>
      </div>

      {/* Right: English Actions Bar */}
      <div className="flex items-center gap-2 sm:gap-3" id="header-actions">
        {/* New Project Button */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 rounded-xl text-xs font-bold text-neutral-800 transition-all active:scale-95 cursor-pointer"
          id="new-project-btn"
          title="New Project"
        >
          <SquarePlus className="w-4 h-4 text-[#207868]" />
          <span className="hidden sm:inline">New Project</span>
        </button>

        {/* Save Button */}
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 rounded-xl text-xs font-bold text-neutral-800 transition-all active:scale-95 cursor-pointer"
          id="save-project-btn"
          title="Save"
        >
          <Save className="w-4 h-4 text-neutral-600" />
          <span className="hidden sm:inline">Save</span>
        </button>

        {/* Share Button (Teal filled) */}
        <button
          onClick={onShare}
          className="flex items-center gap-1.5 px-3 sm:px-5 py-2 bg-[#207868] hover:bg-[#196053] rounded-xl text-xs font-extrabold text-white transition-all shadow-sm active:scale-95 cursor-pointer"
          id="share-project-btn"
          title="Share"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-neutral-200 mx-0.5 sm:mx-1 hidden xs:block" />

        {/* Profile Dropdown */}
        <div className="flex items-center gap-0.5 cursor-pointer hover:opacity-80 transition-all" id="profile-dropdown">
          <div className="w-8 h-8 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center overflow-hidden" id="profile-avatar">
            <svg className="w-5 h-5 text-neutral-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <ChevronDown className="w-4 h-4 text-neutral-500" />
        </div>
      </div>
    </header>
  );
}

