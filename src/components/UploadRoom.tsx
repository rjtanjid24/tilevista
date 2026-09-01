import React, { useState, useRef } from "react";
import { Upload, X, RefreshCw, Camera, ShieldAlert } from "lucide-react";

interface UploadRoomProps {
  roomImage: string | null;
  onUploadRoomImage: (file: File) => void;
  onRemoveRoomImage: () => void;
}

export default function UploadRoom({
  roomImage,
  onUploadRoomImage,
  onRemoveRoomImage,
}: UploadRoomProps) {
  const [dragOver, setDragOver] = useState(false);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.match("image.*")) {
      alert("Please select a valid image file (JPG, JPEG, PNG, WEBP).");
      return;
    }

    // Capture dimensions
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImageMeta({
          width: img.width,
          height: img.height,
          name: file.name,
        });
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);

    onUploadRoomImage(file);
  };

  return (
    <div className="space-y-4" id="upload-room-section">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-2" id="upload-room-header">
        <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-2">
          <Camera className="w-4 h-4 text-neutral-500" />
          Step 2 — Upload Room Image
        </h3>
      </div>

      {!roomImage ? (
        /* Unloaded / Drag-drop active */
        <div
          id="room-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[220px] ${
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
          <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4 text-neutral-700 shadow-sm" id="dropzone-icon-container">
            <Upload className="w-5 h-5" />
          </div>

          <p className="text-sm font-bold text-neutral-800" id="dropzone-text-primary">
            Drag & Drop Room Photo
          </p>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed" id="dropzone-text-secondary">
            or <span className="text-neutral-900 underline font-semibold">browse files</span> from your local device.
          </p>

          <span className="text-[10px] text-neutral-400 mt-6 block uppercase font-semibold bg-neutral-50 border border-neutral-200/50 px-2.5 py-1 rounded-full">
            JPG, JPEG, PNG, WEBP
          </span>
        </div>
      ) : (
        /* Image loaded preview & replacement options */
        <div className="bg-white rounded-xl border border-neutral-200 p-3.5 space-y-3 shadow-sm" id="room-loaded-details">
          <div className="relative aspect-video rounded-lg overflow-hidden border border-neutral-100 bg-neutral-50" id="room-loaded-preview-container">
            <img
              src={roomImage}
              alt="Uploaded Room View"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {imageMeta && (
              <span className="absolute bottom-2 left-2 bg-neutral-950/85 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] font-bold text-white shadow-md">
                {imageMeta.width} × {imageMeta.height} px
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2" id="room-image-actions">
            <div className="overflow-hidden mr-2">
              <span className="block text-[9px] uppercase tracking-wider font-bold text-neutral-400">Selected Photo</span>
              <p className="text-xs font-semibold text-neutral-800 truncate">
                {imageMeta?.name || "room-photograph.jpg"}
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                id="replace-room-btn"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50 text-xs font-semibold rounded-lg text-neutral-700 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Replace
              </button>
              <button
                id="remove-room-btn"
                onClick={onRemoveRoomImage}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 text-xs font-semibold rounded-lg text-red-700 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/png, image/jpeg, image/jpg, image/webp"
            />
          </div>
        </div>
      )}

      {/* Instructional Reminder */}
      <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-100 flex items-start gap-2.5 text-xs text-neutral-500 leading-relaxed" id="upload-reminder">
        <ShieldAlert className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-neutral-800 block mb-0.5">Photography Guideline</span>
          For high-accuracy AI alignment, use a clear, well-lit photo where the floor surface or wall boundaries are fully visible.
        </div>
      </div>
    </div>
  );
}
