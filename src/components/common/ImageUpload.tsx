import React, { useState } from "react";
import { X, CheckCircle2, Link as LinkIcon, Upload, Loader2 } from "lucide-react";
import { supabase } from "../../services/supabaseClient";

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  currentImage?: string;
  label?: string;
  bucket?: string;
}

export default function ImageUpload({ onUploadSuccess, currentImage, label = "Upload Image", bucket = "test-series" }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

    setPreview(trimmedUrl);
    onUploadSuccess(trimmedUrl);
    setError(null);
    setUrlInput("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      setError("File size must be less than 2MB");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setPreview(publicUrl);
      onUploadSuccess(publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Failed to upload image: " + err.message);
    } finally {
      setIsUploading(false);
    }
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
              className="w-full h-full object-contain bg-gray-50" 
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
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File Upload Option */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
              >
                {isUploading ? (
                  <Loader2 size={32} className="text-blue-500 animate-spin" />
                ) : (
                  <Upload size={32} className="text-gray-400 group-hover:text-blue-500" />
                )}
                <span className="text-xs font-bold text-gray-500 group-hover:text-blue-700">
                  {isUploading ? "Uploading..." : "Click to Upload File"}
                </span>
              </button>

              {/* URL Option */}
              <div className="flex flex-col gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <LinkIcon size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Or via URL</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Paste link..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleUrlSubmit}
                    className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black shadow-sm transition-all active:scale-95"
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-center text-gray-400 font-medium">
              Supports: JPG, PNG, WEBP (Max 2MB)
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
