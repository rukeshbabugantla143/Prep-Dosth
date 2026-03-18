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

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('IMAGES')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('IMAGES')
        .getPublicUrl(filePath);

      setPreview(publicUrl);
      onUploadSuccess(publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-600">{label}</label>
      <div className="relative border-2 border-dashed rounded-xl p-4 min-h-[150px] flex flex-col items-center justify-center">
        {preview ? (
          <div className="relative w-full flex flex-col items-center">
            <img src={preview} alt="Preview" className="max-h-32 rounded-lg mb-2" referrerPolicy="no-referrer" />
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle2 size={16} /> Uploaded Successfully
            </div>
            <button onClick={() => { setPreview(null); onUploadSuccess(""); }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><X size={14} /></button>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-col items-center gap-2">
            {uploading ? <Loader2 className="animate-spin text-[#15b86c]" size={32} /> : <Upload size={24} className="text-gray-400" />}
            <span className="text-sm text-gray-500">{uploading ? "Uploading..." : "Click to upload image"}</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
          </label>
        )}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  );
}