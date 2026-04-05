import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { Edit, Trash2, Plus } from "lucide-react";
import ImageUpload from "../../components/common/ImageUpload";
import ConfirmationModal from "../../components/ConfirmationModal";

export default function ManageHome() {
  const [heroes, setHeroes] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  
  const [isEditingHero, setIsEditingHero] = useState(false);
  const [currentHero, setCurrentHero] = useState<any>({ image: '' });
  
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [currentSection, setCurrentSection] = useState<any>({ layout_type: 'default' });

  const [isEditingStat, setIsEditingStat] = useState(false);
  const [currentStat, setCurrentStat] = useState<any>({ icon: 'Users', value: '', label: '', order_index: 0 });

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const fetchData = async () => {
    const [heroRes, sectionRes, statsRes] = await Promise.all([
      supabase.from("hero_section").select("*").order("id", { ascending: true }),
      supabase.from("sections").select("*").order("id", { ascending: true }),
      supabase.from("home_stats").select("*").order("order_index", { ascending: true })
    ]);
    if (heroRes.data) setHeroes(heroRes.data);
    if (sectionRes.data) setSections(sectionRes.data);
    if (statsRes.data) setStats(statsRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentHero.id) {
        const { error } = await supabase.from("hero_section").update(currentHero).eq("id", currentHero.id);
        if (error) {
          // If layout_type column is missing, try saving without it
          if (error.message.includes('layout_type') && (error.message.includes('does not exist') || error.message.includes('schema cache'))) {
            const { layout_type, ...heroWithoutLayout } = currentHero;
            const { error: retryError } = await supabase.from("hero_section").update(heroWithoutLayout).eq("id", currentHero.id);
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }
      } else {
        const { error } = await supabase.from("hero_section").insert(currentHero);
        if (error) {
          // If layout_type column is missing, try saving without it
          if (error.message.includes('layout_type') && (error.message.includes('does not exist') || error.message.includes('schema cache'))) {
            const { layout_type, ...heroWithoutLayout } = currentHero;
            const { error: retryError } = await supabase.from("hero_section").insert(heroWithoutLayout);
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }
      }
      setIsEditingHero(false);
      setCurrentHero({ image: '' });
      fetchData();
    } catch (error: any) {
      console.error("Error saving hero:", error);
      alert(`Failed to save hero: ${error.message || "Unknown error"}`);
    }
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentSection.id) {
        const { error } = await supabase.from("sections").update(currentSection).eq("id", currentSection.id);
        if (error) {
          // If layout_type column is missing, try saving without it
          if (error.message.includes('layout_type') && (error.message.includes('does not exist') || error.message.includes('schema cache'))) {
            const { layout_type, ...sectionWithoutLayout } = currentSection;
            const { error: retryError } = await supabase.from("sections").update(sectionWithoutLayout).eq("id", currentSection.id);
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }
      } else {
        const { error } = await supabase.from("sections").insert(currentSection);
        if (error) {
          // If layout_type column is missing, try saving without it
          if (error.message.includes('layout_type') && (error.message.includes('does not exist') || error.message.includes('schema cache'))) {
            const { layout_type, ...sectionWithoutLayout } = currentSection;
            const { error: retryError } = await supabase.from("sections").insert(sectionWithoutLayout);
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }
      }
      setIsEditingSection(false);
      setCurrentSection({ layout_type: 'default' });
      fetchData();
    } catch (error: any) {
      console.error("Error saving section:", error);
      alert(`Failed to save section: ${error.message || "Unknown error"}`);
    }
  };

  const handleDeleteHero = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Hero Image",
      message: "Are you sure you want to delete this hero image? This action cannot be undone.",
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("hero_section").delete().eq("id", id);
          if (error) throw error;
          fetchData();
        } catch (error: any) {
          console.error("Error deleting hero:", error);
          alert(`Failed to delete hero: ${error.message || "Unknown error"}`);
        }
      }
    });
  };

  const handleDeleteSection = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Section",
      message: "Are you sure you want to delete this section? This action cannot be undone.",
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("sections").delete().eq("id", id);
          if (error) throw error;
          fetchData();
        } catch (error: any) {
          console.error("Error deleting section:", error);
          alert(`Failed to delete section: ${error.message || "Unknown error"}`);
        }
      }
    });
  };

  const handleSaveStat = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentStat.id) {
        const { error } = await supabase.from("home_stats").update(currentStat).eq("id", currentStat.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("home_stats").insert(currentStat);
        if (error) throw error;
      }
      setIsEditingStat(false);
      setCurrentStat({ icon: 'Users', value: '', label: '', order_index: 0 });
      fetchData();
    } catch (error: any) {
      console.error("Error saving stat:", error);
      alert(`Failed to save stat: ${error.message || "Unknown error"}`);
    }
  };

  const handleDeleteStat = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Stat",
      message: "Are you sure you want to delete this statistic? This action cannot be undone.",
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("home_stats").delete().eq("id", id);
          if (error) throw error;
          fetchData();
        } catch (error: any) {
          console.error("Error deleting stat:", error);
          alert(`Failed to delete stat: ${error.message || "Unknown error"}`);
        }
      }
    });
  };

  return (
    <div className="space-y-12">
      <h1 className="text-3xl font-bold text-gray-800">Manage Home Page</h1>

      {/* Hero Section Management */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Hero Section</h2>
          <button onClick={() => { setIsEditingHero(true); setCurrentHero({ image: '' }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
            <Plus size={20} /> Add Hero
          </button>
        </div>

        {isEditingHero && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <h3 className="text-xl font-bold mb-6 text-gray-800">{currentHero.id ? "Edit Hero Image" : "Add Hero Image"}</h3>
            <form onSubmit={handleSaveHero} className="space-y-6">
              <div>
                <ImageUpload 
                  label="Hero Image (Full Width)" 
                  currentImage={currentHero.image} 
                  onUploadSuccess={(url) => setCurrentHero({...currentHero, image: url})} 
                />
                <p className="text-xs text-gray-500 mt-2 italic">* Text and buttons are disabled as per your request. Only the image will be displayed.</p>
              </div>
              
              {/* Hidden fields but kept in state for DB compatibility if needed */}
              <div className="hidden">
                <input type="text" value={currentHero.title || ""} onChange={e => setCurrentHero({...currentHero, title: e.target.value})} />
                <input type="text" value={currentHero.subtitle || ""} onChange={e => setCurrentHero({...currentHero, subtitle: e.target.value})} />
              </div>

              <div className="flex gap-4 justify-end mt-4">
                <button type="button" onClick={() => setIsEditingHero(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Save Hero Image</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {heroes.map(hero => (
            <div key={hero.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group relative">
              <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                {hero.image ? (
                  <img src={hero.image} alt={hero.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-gray-400 flex flex-col items-center">
                    <Plus size={32} />
                    <span className="text-xs mt-2">No Image</span>
                  </div>
                )}
              </div>
              <div className="p-4 flex justify-between items-center">
                <span className="text-xs text-gray-400 italic">Image Only Hero</span>
                <div className="flex gap-3">
                  <button onClick={() => { setCurrentHero(hero); setIsEditingHero(true); }} className="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded-lg transition"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteHero(hero.id)} className="text-red-600 hover:text-red-800 p-2 bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}
          {heroes.length === 0 && (
            <div className="col-span-full p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-500">
              No hero items found. Add one to start the slider.
            </div>
          )}
        </div>
      </section>

      {/* Home Stats Management */}
      <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Home Stats Strip</h2>
            <p className="text-sm text-gray-500 mt-1">Manage the big numbers displayed on your home page.</p>
          </div>
          <button 
            onClick={() => { setIsEditingStat(true); setCurrentStat({ icon: 'Users', value: '', label: '', order_index: stats.length + 1 }); }} 
            className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 transition shadow-lg shadow-orange-200 active:scale-95"
          >
            <Plus size={20} /> Add New Stat
          </button>
        </div>

        {isEditingStat && (
          <div className="bg-gray-50 p-8 rounded-2xl border-2 border-orange-100 mb-8 animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-black mb-6 text-gray-800">{currentStat.id ? "Edit Statistic" : "Add Statistic"}</h3>
            <form onSubmit={handleSaveStat} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Icon Name (Lucide)</label>
                <select 
                  value={currentStat.icon || "Users"} 
                  onChange={e => setCurrentStat({...currentStat, icon: e.target.value})} 
                  className="border-2 border-gray-200 p-3 rounded-xl w-full bg-white shadow-sm focus:border-orange-500 focus:ring-0 focus:outline-none transition-colors"
                >
                  <option value="Users">Users (Students)</option>
                  <option value="Award">Award (Selections)</option>
                  <option value="BookOpen">BookOpen (Tests)</option>
                  <option value="PlayCircle">PlayCircle (Videos)</option>
                  <option value="Trophy">Trophy</option>
                  <option value="Calendar">Calendar</option>
                  <option value="CheckCircle2">CheckCircle</option>
                  <option value="Clock">Clock</option>
                  <option value="Building2">Building</option>
                  <option value="GraduationCap">Graduation Cap</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Value (e.g. 3.1 Crore+)</label>
                <input 
                  type="text" 
                  placeholder="Value" 
                  value={currentStat.value || ""} 
                  onChange={e => setCurrentStat({...currentStat, value: e.target.value})} 
                  className="border-2 border-gray-200 p-3 rounded-xl w-full shadow-sm focus:border-orange-500 focus:ring-0 focus:outline-none transition-colors" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Label (e.g. Students Trusted)</label>
                <input 
                  type="text" 
                  placeholder="Label" 
                  value={currentStat.label || ""} 
                  onChange={e => setCurrentStat({...currentStat, label: e.target.value})} 
                  className="border-2 border-gray-200 p-3 rounded-xl w-full shadow-sm focus:border-orange-500 focus:ring-0 focus:outline-none transition-colors" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Sort Order</label>
                <input 
                  type="number" 
                  placeholder="Order Index" 
                  value={currentStat.order_index || 0} 
                  onChange={e => setCurrentStat({...currentStat, order_index: parseInt(e.target.value)})} 
                  className="border-2 border-gray-200 p-3 rounded-xl w-full shadow-sm focus:border-orange-500 focus:ring-0 focus:outline-none transition-colors" 
                />
              </div>

              <div className="md:col-span-2 flex gap-4 justify-end mt-4 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setIsEditingStat(false)} className="bg-white text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-100 transition font-black border-2 border-gray-100">Cancel</button>
                <button type="submit" className="bg-orange-600 text-white px-10 py-3 rounded-xl hover:bg-orange-700 transition font-black shadow-lg shadow-orange-100">
                  {currentStat.id ? "Update Stat" : "Create Stat"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(stat => (
            <div key={stat.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-xl hover:border-orange-200 transition-all duration-300">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-orange-600 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <span className="font-black text-xs uppercase tracking-tighter text-center leading-none">
                  {stat.icon}<br />
                  <span className="text-[8px] opacity-40 italic">Icon</span>
                </span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-500 font-bold mb-6">{stat.label}</p>
              <div className="flex gap-2 w-full mt-auto">
                <button 
                  onClick={() => { setCurrentStat(stat); setIsEditingStat(true); window.scrollTo({ top: 300, behavior: 'smooth' }); }} 
                  className="flex-1 bg-white text-blue-600 py-2.5 rounded-xl text-xs font-black hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Edit size={14} /> Edit
                </button>
                <button 
                  onClick={() => handleDeleteStat(stat.id)} 
                  className="flex-1 bg-white text-red-500 py-2.5 rounded-xl text-xs font-black hover:bg-red-600 hover:text-white transition-all border border-red-100 shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
          {stats.length === 0 && (
            <div className="col-span-full p-16 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
              <Plus className="mx-auto mb-4 opacity-50" size={48} />
              <p className="font-bold">No stats created yet.</p>
              <p className="text-sm">Click "Add New Stat" to populate your home page strip.</p>
            </div>
          )}
        </div>
      </section>

      {/* Dynamic Sections Management */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Dynamic Sections</h2>
          <button onClick={() => { setIsEditingSection(true); setCurrentSection({ layout_type: 'default' }); }} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition">
            <Plus size={20} /> Add Section
          </button>
        </div>

        {isEditingSection && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <h3 className="text-xl font-bold mb-6 text-gray-800">{currentSection.id ? "Edit Section" : "Add Section"}</h3>
            <form onSubmit={handleSaveSection} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" placeholder="Title" value={currentSection.title || ""} onChange={e => setCurrentSection({...currentSection, title: e.target.value})} className="border p-3 rounded-lg w-full" required />
              <div className="md:col-span-2">
                <ImageUpload 
                  label="Section Image (Optional)" 
                  currentImage={currentSection.image} 
                  onUploadSuccess={(url) => setCurrentSection({...currentSection, image: url})} 
                />
              </div>
              <textarea placeholder="Description" value={currentSection.description || ""} onChange={e => setCurrentSection({...currentSection, description: e.target.value})} className="border p-3 rounded-lg w-full md:col-span-2" rows={4} required />
              <input type="text" placeholder="Button Text" value={currentSection.button_text || ""} onChange={e => setCurrentSection({...currentSection, button_text: e.target.value})} className="border p-3 rounded-lg w-full" />
              <input type="text" placeholder="Button Link" value={currentSection.button_link || ""} onChange={e => setCurrentSection({...currentSection, button_link: e.target.value})} className="border p-3 rounded-lg w-full" />
              
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-gray-600">Section Template / Layout</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'default', label: 'Default', desc: 'Side by side' },
                    { id: 'reverse', label: 'Reverse', desc: 'Image left' },
                    { id: 'card', label: 'Card', desc: 'Boxed style' },
                    { id: 'minimal', label: 'Minimal', desc: 'No image' }
                  ].map(layout => (
                    <button
                      key={layout.id}
                      type="button"
                      onClick={() => setCurrentSection({...currentSection, layout_type: layout.id})}
                      className={`p-4 border-2 rounded-xl text-left transition ${currentSection.layout_type === layout.id ? 'border-green-600 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <div className="font-bold text-sm">{layout.label}</div>
                      <div className="text-xs text-gray-500">{layout.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 flex gap-4 justify-end mt-4">
                <button type="button" onClick={() => setIsEditingSection(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">Save Section</button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-6">
          {sections.map(section => (
            <div key={section.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-48 h-32 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                {section.image ? (
                  <img src={section.image} alt={section.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-gray-400 text-xs">No Image</div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-800">{section.title}</h3>
                  <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded text-gray-600 uppercase tracking-wider">
                    {section.layout_type || 'default'}
                  </span>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-3">{section.description}</p>
                <div className="flex gap-3">
                  <button onClick={() => { setCurrentSection(section); setIsEditingSection(true); }} className="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded-lg transition"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteSection(section.id)} className="text-red-600 hover:text-red-800 p-2 bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}
          {sections.length === 0 && (
            <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-500">
              No dynamic sections found.
            </div>
          )}
        </div>
      </section>

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
}
