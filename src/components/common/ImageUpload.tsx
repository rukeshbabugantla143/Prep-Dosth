import React, { useState } from "react";
import { X, CheckCircle2, Link as LinkIcon } from "lucide-react";

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  currentImage?: string;
  label?: string;
}

export default function ImageUpload({ onUploadSuccess, currentImage, label = "Upload Image" }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");

  const handleUrlSubmit = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) return;
    
    if (!trimmedUrl.startsWith('http')) {
      setError("Please enter a valid URL starting with http or https");
      return;
    }

    // Basic check to see if it looks like an image URL
    const isImageUrl = /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(trimmedUrl) || trimmedUrl.includes('picsum.photos') || trimmedUrl.includes('supabase.co');
    
    if (!isImageUrl) {
      console.warn("URL might not be a direct image link");
    }

    setPreview(trimmedUrl);
    onUploadSuccess(trimmedUrl);
    setError(null);
    setUrlInput(""); // Clear input after success
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-600">{label}</label>
      </div>

      <div className="relative border-2 border-dashed rounded-xl overflow-hidden min-h-[150px] flex flex-col items-center justify-center bg-white">
        {preview ? (
          <div className="relative w-full h-48 group">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                <CheckCircle2 size={16} /> Image Set
              </div>
              <button 
                type="button"
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  setPreview(null); 
                  onUploadSuccess(""); 
                  setUrlInput("");
                }} 
                className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg hover:bg-red-600 transition"
              >
                Remove Image
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full p-6 space-y-4">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <LinkIcon size={32} />
              <span className="text-sm font-medium text-gray-500">Add Image via URL</span>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleUrlSubmit(e);
                  }
                }}
                placeholder="Paste image URL here (https://...)"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#15b86c] focus:border-transparent outline-none transition-all"
              />
              <button
                type="button"
                onClick={(e) => handleUrlSubmit(e)}
                className="px-6 py-2 bg-[#15b86c] text-white rounded-xl text-sm font-bold hover:bg-[#12a35f] shadow-sm transition-all active:scale-95"
              >
                Add
              </button>
            </div>
            <p className="text-[10px] text-center text-gray-400 italic">
              * Manual file upload is disabled. Please provide a direct image link.
            </p>
          </div>
        )}
        {error && (
          <div className="absolute bottom-2 left-0 right-0 px-4">
            <p className="text-xs text-red-500 font-medium bg-red-50/90 py-1 px-2 rounded text-center border border-red-100">
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
