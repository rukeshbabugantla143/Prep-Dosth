import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { Edit, Trash2, Plus } from "lucide-react";

export default function ManageHome() {
  const [heroes, setHeroes] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  
  const [isEditingHero, setIsEditingHero] = useState(false);
  const [currentHero, setCurrentHero] = useState<any>({});
  
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [currentSection, setCurrentSection] = useState<any>({});

  const fetchData = async () => {
    const [heroRes, sectionRes] = await Promise.all([
      supabase.from("hero").select("*"),
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
    if (currentHero.id) {
      await supabase.from("hero").update(currentHero).eq("id", currentHero.id);
    } else {
      await supabase.from("hero").insert(currentHero);
    }
    setIsEditingHero(false);
    setCurrentHero({});
    fetchData();
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentSection.id) {
      await supabase.from("sections").update(currentSection).eq("id", currentSection.id);
    } else {
      await supabase.from("sections").insert(currentSection);
    }
    setIsEditingSection(false);
    setCurrentSection({});
    fetchData();
  };

  const handleDeleteHero = async (id: string) => {
    if (confirm("Delete this hero image?")) {
      await supabase.from("hero").delete().eq("id", id);
      fetchData();
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (confirm("Delete this section?")) {
      await supabase.from("sections").delete().eq("id", id);
      fetchData();
    }
  };

  return (
    <div className="space-y-12">
      <h1 className="text-3xl font-bold text-gray-800">Manage Home Page</h1>

      {/* Hero Section Management */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Hero Section</h2>
          <button onClick={() => { setIsEditingHero(true); setCurrentHero({}); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
            <Plus size={20} /> Add Hero
          </button>
        </div>

        {isEditingHero && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <h3 className="text-xl font-bold mb-6 text-gray-800">{currentHero.id ? "Edit Hero" : "Add Hero"}</h3>
            <form onSubmit={handleSaveHero} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" placeholder="Image URL" value={currentHero.image || ""} onChange={e => setCurrentHero({...currentHero, image: e.target.value})} className="border p-3 rounded-lg w-full md:col-span-2" required />
              <input type="text" placeholder="Title" value={currentHero.title || ""} onChange={e => setCurrentHero({...currentHero, title: e.target.value})} className="border p-3 rounded-lg w-full" required />
              <input type="text" placeholder="Subtitle" value={currentHero.subtitle || ""} onChange={e => setCurrentHero({...currentHero, subtitle: e.target.value})} className="border p-3 rounded-lg w-full" />
              <input type="text" placeholder="Button Text" value={currentHero.buttonText || ""} onChange={e => setCurrentHero({...currentHero, buttonText: e.target.value})} className="border p-3 rounded-lg w-full" />
              <input type="text" placeholder="Button Link" value={currentHero.buttonLink || ""} onChange={e => setCurrentHero({...currentHero, buttonLink: e.target.value})} className="border p-3 rounded-lg w-full" />
              
              <div className="md:col-span-2 flex gap-4 justify-end mt-4">
                <button type="button" onClick={() => setIsEditingHero(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Save Hero</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {heroes.map(hero => (
            <div key={hero.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <img src={hero.image} alt={hero.title} className="w-full h-48 object-cover" />
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{hero.title}</h3>
                <p className="text-gray-600 mb-4">{hero.subtitle}</p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => { setCurrentHero(hero); setIsEditingHero(true); }} className="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded-lg transition"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteHero(hero.id)} className="text-red-600 hover:text-red-800 p-2 bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dynamic Sections Management */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Dynamic Sections</h2>
          <button onClick={() => { setIsEditingSection(true); setCurrentSection({}); }} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition">
            <Plus size={20} /> Add Section
          </button>
        </div>

        {isEditingSection && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <h3 className="text-xl font-bold mb-6 text-gray-800">{currentSection.id ? "Edit Section" : "Add Section"}</h3>
            <form onSubmit={handleSaveSection} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" placeholder="Title" value={currentSection.title || ""} onChange={e => setCurrentSection({...currentSection, title: e.target.value})} className="border p-3 rounded-lg w-full" required />
              <input type="text" placeholder="Image URL (Optional)" value={currentSection.image || ""} onChange={e => setCurrentSection({...currentSection, image: e.target.value})} className="border p-3 rounded-lg w-full" />
              <textarea placeholder="Description" value={currentSection.description || ""} onChange={e => setCurrentSection({...currentSection, description: e.target.value})} className="border p-3 rounded-lg w-full md:col-span-2" rows={4} required />
              <input type="text" placeholder="Button Text" value={currentSection.buttonText || ""} onChange={e => setCurrentSection({...currentSection, buttonText: e.target.value})} className="border p-3 rounded-lg w-full" />
              <input type="text" placeholder="Button Link" value={currentSection.buttonLink || ""} onChange={e => setCurrentSection({...currentSection, buttonLink: e.target.value})} className="border p-3 rounded-lg w-full" />
              
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
              {section.image && <img src={section.image} alt={section.title} className="w-full md:w-48 h-32 object-cover rounded-xl" />}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{section.title}</h3>
                <p className="text-gray-600 mb-4">{section.description}</p>
                <div className="flex gap-3">
                  <button onClick={() => { setCurrentSection(section); setIsEditingSection(true); }} className="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded-lg transition"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteSection(section.id)} className="text-red-600 hover:text-red-800 p-2 bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
