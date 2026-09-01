import { SquarePlus, Save, Share2, ChevronDown } from "lucide-react";

interface HeaderProps {}

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-150 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-sm" id="tilevista-header">
      {/* Left: Brand Logo & Name */}
      <div className="flex items-center gap-2.5 mx-auto sm:mx-0">
        {/* Crisp 2x2 colored tile logo */}
        <div className="grid grid-cols-2 gap-0.5 w-7 h-7 shrink-0" id="logo-icon-grid">
          <div className="bg-[#F19A3E] rounded-[1px]" /> {/* Orange */}
          <div className="bg-[#72AD9C] rounded-[1px]" /> {/* Cyan/Teal */}
          <div className="bg-[#566266] rounded-[1px]" /> {/* Grey */}
          <div className="bg-[#EAD2AC] rounded-[1px]" /> {/* Beige */}
        </div>
        <h1 className="text-2xl font-black tracking-tight text-[#1D4A3F] font-sans" id="tilevista-logo-title">
          TileVista
        </h1>
      </div>
    </header>
  );
}

