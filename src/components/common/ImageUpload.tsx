import React, { useState } from "react";
import { Upload, X, CheckCircle2, Loader2, Link as LinkIcon } from "lucide-react";
import { supabase } from "../../services/supabaseClient";

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  currentImage?: string;
  label?: string;
}

export default function ImageUpload({ onUploadSuccess, currentImage, label = "Upload Image" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;
      const bucketName = 'images';

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      setPreview(publicUrl);
      onUploadSuccess(publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      const bucketName = 'images';
      setError(`Upload to bucket '${bucketName}' failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!urlInput.trim()) return;
    
    if (!urlInput.startsWith('http')) {
      setError("Please enter a valid URL starting with http or https");
      return;
    }

    setPreview(urlInput);
    onUploadSuccess(urlInput);
    setError(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-600">{label}</label>
        {!preview && (
          <div className="flex bg-gray-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setMode('upload')}
              className={`px-3 py-1 rounded-md transition ${mode === 'upload' ? 'bg-white shadow-sm text-[#15b86c] font-bold' : 'text-gray-500'}`}
            >
              Upload
            </button>
            <button
              onClick={() => setMode('url')}
              className={`px-3 py-1 rounded-md transition ${mode === 'url' ? 'bg-white shadow-sm text-[#15b86c] font-bold' : 'text-gray-500'}`}
            >
              URL
            </button>
          </div>
        )}
      </div>

      <div className="relative border-2 border-dashed rounded-xl p-4 min-h-[150px] flex flex-col items-center justify-center bg-white">
        {preview ? (
          <div className="relative w-full flex flex-col items-center">
            <img src={preview} alt="Preview" className="max-h-48 rounded-lg mb-2 object-contain" referrerPolicy="no-referrer" />
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle2 size={16} /> Image Set Successfully
            </div>
            <button 
              onClick={() => { 
                setPreview(null); 
                onUploadSuccess(""); 
                setUrlInput("");
              }} 
              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            {mode === 'upload' ? (
              <label className="cursor-pointer flex flex-col items-center gap-2 w-full py-4">
                {uploading ? (
                  <Loader2 className="animate-spin text-[#15b86c]" size={32} />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-full text-gray-400">
                    <Upload size={24} />
                  </div>
                )}
                <span className="text-sm text-gray-500">{uploading ? "Uploading to Supabase..." : "Click to upload image"}</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
              </label>
            ) : (
              <div className="w-full space-y-3">
                <div className="flex flex-col items-center gap-2 text-gray-400 mb-2">
                  <LinkIcon size={24} />
                  <span className="text-sm text-gray-500">Enter Image URL</span>
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
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#15b86c] outline-none"
                  />
                  <button
                    type="button"
                    onClick={(e) => handleUrlSubmit(e)}
                    className="px-4 py-2 bg-[#15b86c] text-white rounded-lg text-sm font-medium hover:bg-[#12a35f] transition"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        {error && <p className="text-xs text-red-500 mt-2 font-medium">{error}</p>}
      </div>
    </div>
  );
}