import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { Edit, Trash2, Plus } from "lucide-react";
import ImageUpload from "../../components/common/ImageUpload";
import ConfirmationModal from "../../components/ConfirmationModal";

export default function ManageHome() {
  const [heroes, setHeroes] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  
  const [isEditingHero, setIsEditingHero] = useState(false);
  const [currentHero, setCurrentHero] = useState<any>({ image: '' });
  
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [currentSection, setCurrentSection] = useState<any>({ layout_type: 'default' });

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
    const [heroRes, sectionRes] = await Promise.all([
      supabase.from("hero_section").select("*"),
      supabase.from("sections").select("*")
    ]);
    if (heroRes.data) setHeroes(heroRes.data);
    if (sectionRes.data) setSections(sectionRes.data);
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
