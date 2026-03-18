import React, { useState } from "react";
import { Upload, X, CheckCircle2, Loader2 } from "lucide-react";
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    // Validate file size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size should be less than 5MB.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `hero-images/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setPreview(publicUrl);
      onUploadSuccess(publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(`Failed to upload image: ${err.message || "Please try again."}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-600">{label}</label>
      <div className="relative group">
        <div className={`border-2 border-dashed rounded-xl p-4 transition-all flex flex-col items-center justify-center min-h-[150px] ${preview ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-[#15b86c] hover:bg-gray-50'}`}>
          {preview ? (
            <div className="relative w-full flex flex-col items-center">
              <img 
                src={preview} 
                alt="Preview" 
                className="max-h-32 rounded-lg object-contain mb-2" 
                referrerPolicy="no-referrer"
              />
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle2 size={16} /> Uploaded Successfully
              </div>
              <button 
                onClick={() => { setPreview(null); onUploadSuccess(""); }}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="animate-spin text-[#15b86c]" size={32} />
                  <span className="text-sm text-gray-500">Uploading...</span>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2 w-full">
                  <div className="p-3 bg-gray-100 rounded-full text-gray-400 group-hover:text-[#15b86c] group-hover:bg-[#15b86c]/10 transition">
                    <Upload size={24} />
                  </div>
                  <span className="text-sm text-gray-500">Click to upload or drag and drop</span>
                  <span className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                </label>
              )}
            </>
          )}
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  );
}
