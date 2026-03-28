import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { Save, Loader2, Settings as SettingsIcon, Globe, Share2, BarChart, Palette } from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState({
    site_name: "",
    contact_email: "",
    maintenance_mode: false,
    registration_enabled: true,
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    linkedin_url: "",
    meta_description: "",
    meta_keywords: "",
    google_analytics_id: "",
    primary_color: "#2563eb",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("settings").select("*").single();
    if (data) setSettings(data);
    if (error) console.error("Error fetching settings:", error);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("settings").upsert(settings);
    if (error) {
      alert("Error saving settings: " + error.message);
    } else {
      alert("Settings saved successfully!");
      // Apply color immediately
      document.documentElement.style.setProperty('--primary-color', settings.primary_color);
    }
    setSaving(false);
  };

  if (loading) return <div className="p-6 text-center">Loading settings...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Admin Settings</h1>
      
      <form onSubmit={handleSave} className="space-y-8">
        {/* General Settings */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon className="text-blue-600" size={20} />
            <h2 className="text-xl font-bold text-gray-800">General Settings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600">Site Name</label>
              <input type="text" value={settings.site_name} onChange={e => setSettings({...settings, site_name: e.target.value})} className="border p-3 rounded-lg w-full" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600">Contact Email</label>
              <input type="email" value={settings.contact_email} onChange={e => setSettings({...settings, contact_email: e.target.value})} className="border p-3 rounded-lg w-full" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
              <Palette size={16} /> Primary Theme Color
            </label>
            <input 
              type="color" 
              value={settings.primary_color} 
              onChange={e => setSettings({...settings, primary_color: e.target.value})} 
              className="w-full h-12 border p-1 rounded-lg cursor-pointer" 
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <label className="font-semibold text-gray-700">Maintenance Mode</label>
            <input type="checkbox" checked={settings.maintenance_mode} onChange={e => setSettings({...settings, maintenance_mode: e.target.checked})} className="w-6 h-6 text-blue-600 rounded" />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <label className="font-semibold text-gray-700">Enable New Registrations</label>
            <input type="checkbox" checked={settings.registration_enabled} onChange={e => setSettings({...settings, registration_enabled: e.target.checked})} className="w-6 h-6 text-blue-600 rounded" />
          </div>
        </div>
        
        {/* ... rest of the form (SEO, Social, Analytics) ... */}
        {/* (I'll keep the rest of the form as is for brevity, just ensure the replacement covers it) */}

        {/* SEO Settings */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="text-blue-600" size={20} />
            <h2 className="text-xl font-bold text-gray-800">SEO Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600">Meta Description</label>
              <textarea value={settings.meta_description} onChange={e => setSettings({...settings, meta_description: e.target.value})} className="border p-3 rounded-lg w-full" rows={3} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600">Meta Keywords (comma separated)</label>
              <input type="text" value={settings.meta_keywords} onChange={e => setSettings({...settings, meta_keywords: e.target.value})} className="border p-3 rounded-lg w-full" />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="text-blue-600" size={20} />
            <h2 className="text-xl font-bold text-gray-800">Social Media Links</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" placeholder="Facebook URL" value={settings.facebook_url} onChange={e => setSettings({...settings, facebook_url: e.target.value})} className="border p-3 rounded-lg w-full" />
            <input type="text" placeholder="Instagram URL" value={settings.instagram_url} onChange={e => setSettings({...settings, instagram_url: e.target.value})} className="border p-3 rounded-lg w-full" />
            <input type="text" placeholder="Twitter URL" value={settings.twitter_url} onChange={e => setSettings({...settings, twitter_url: e.target.value})} className="border p-3 rounded-lg w-full" />
            <input type="text" placeholder="LinkedIn URL" value={settings.linkedin_url} onChange={e => setSettings({...settings, linkedin_url: e.target.value})} className="border p-3 rounded-lg w-full" />
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart className="text-blue-600" size={20} />
            <h2 className="text-xl font-bold text-gray-800">Analytics</h2>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600">Google Analytics ID</label>
            <input type="text" placeholder="e.g., UA-XXXXX-Y" value={settings.google_analytics_id} onChange={e => setSettings({...settings, google_analytics_id: e.target.value})} className="border p-3 rounded-lg w-full" />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition flex items-center gap-2 font-bold text-lg"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Save All Settings
        </button>
      </form>
    </div>
  );
}
