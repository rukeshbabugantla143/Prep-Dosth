import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { Edit, Trash2, Plus, Users, Landmark, BookOpen, GraduationCap, Train, Shield, Cpu, Activity, Briefcase, Scale, FileText, PlayCircle, Building, Map, Award } from "lucide-react";

const ICON_OPTIONS = {
  Users: <Users size={18} />,
  Landmark: <Landmark size={18} />,
  BookOpen: <BookOpen size={18} />,
  GraduationCap: <GraduationCap size={18} />,
  Train: <Train size={18} />,
  Shield: <Shield size={18} />,
  Cpu: <Cpu size={18} />,
  Activity: <Activity size={18} />,
  Briefcase: <Briefcase size={18} />,
  Scale: <Scale size={18} />,
  FileText: <FileText size={18} />,
  PlayCircle: <PlayCircle size={18} />,
  Building: <Building size={18} />,
  Map: <Map size={18} />,
  Award: <Award size={18} />
};

interface MegaMenuItem {
  id?: string;
  menu_type: 'jobs' | 'exams' | 'tests';
  category_title: string;
  icon_name: string;
  items: string[];
  order_index: number;
}

export default function ManageMegaMenu() {
  const [menuItems, setMenuItems] = useState<MegaMenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<'jobs' | 'exams' | 'tests'>('jobs');
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<MegaMenuItem>({
    menu_type: 'jobs',
    category_title: '',
    icon_name: 'Users',
    items: [],
    order_index: 0
  });
  const [newItemText, setNewItemText] = useState("");

  const fetchMegaMenu = async () => {
    const { data, error } = await supabase
      .from("mega_menu")
      .select("*")
      .order("order_index", { ascending: true });
    
    if (data) setMenuItems(data);
    if (error) console.error("Error fetching mega menu:", error);
  };

  useEffect(() => {
    fetchMegaMenu();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...currentItem, menu_type: activeTab };
    
    if (currentItem.id) {
      await supabase.from("mega_menu").update(payload).eq("id", currentItem.id);
    } else {
      const nextOrder = menuItems.filter(i => i.menu_type === activeTab).length;
      await supabase.from("mega_menu").insert({ ...payload, order_index: nextOrder });
    }
    
    setIsEditing(false);
    setCurrentItem({ menu_type: activeTab, category_title: '', icon_name: 'Users', items: [], order_index: 0 });
    fetchMegaMenu();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      await supabase.from("mega_menu").delete().eq("id", id);
      fetchMegaMenu();
    }
  };

  const addItemToCategory = () => {
    if (newItemText.trim()) {
      setCurrentItem({
        ...currentItem,
        items: [...currentItem.items, newItemText.trim()]
      });
      setNewItemText("");
    }
  };

  const removeItemFromCategory = (index: number) => {
    const newItems = [...currentItem.items];
    newItems.splice(index, 1);
    setCurrentItem({ ...currentItem, items: newItems });
  };

  const filteredItems = menuItems.filter(item => item.menu_type === activeTab);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Manage Mega Menus</h1>
        <button 
          onClick={() => { setIsEditing(true); setCurrentItem({ menu_type: activeTab, category_title: '', icon_name: 'Users', items: [], order_index: filteredItems.length }); }} 
          className="bg-[#15b86c] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#129c5b] transition"
        >
          <Plus size={20} /> Add Category
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['jobs', 'exams', 'tests'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setIsEditing(false); }}
            className={`px-6 py-3 font-bold text-sm capitalize transition-colors border-b-2 ${activeTab === tab ? 'border-[#15b86c] text-[#15b86c]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab} Mega Menu
          </button>
        ))}
      </div>

      {isEditing && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h3 className="text-xl font-bold mb-6 text-gray-800">{currentItem.id ? "Edit Category" : "Add New Category"}</h3>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600">Category Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. SSC Exams, Central Govt Jobs" 
                  value={currentItem.category_title} 
                  onChange={e => setCurrentItem({...currentItem, category_title: e.target.value})} 
                  className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-[#15b86c] outline-none" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600">Icon</label>
                <select 
                  value={currentItem.icon_name} 
                  onChange={e => setCurrentItem({...currentItem, icon_name: e.target.value})} 
                  className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-[#15b86c] outline-none bg-white"
                >
                  {Object.keys(ICON_OPTIONS).map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-semibold text-gray-600">Sub-items (Links)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Add an item (e.g. SSC CGL)" 
                  value={newItemText} 
                  onChange={e => setNewItemText(e.target.value)} 
                  className="border p-3 rounded-lg flex-1 focus:ring-2 focus:ring-[#15b86c] outline-none" 
                />
                <button 
                  type="button" 
                  onClick={addItemToCategory}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentItem.items.map((item, idx) => (
                  <div key={idx} className="bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium text-gray-700">
                    {item}
                    <button type="button" onClick={() => removeItemFromCategory(idx)} className="text-red-500 hover:text-red-700 font-bold">×</button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-4 justify-end mt-4">
              <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
              <button type="submit" className="bg-[#15b86c] text-white px-6 py-2 rounded-lg hover:bg-[#129c5b] transition">Save Category</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#15b86c]/10 text-[#15b86c] rounded-lg">
                  {ICON_OPTIONS[item.icon_name as keyof typeof ICON_OPTIONS] || <Users size={18} />}
                </div>
                <h3 className="font-bold text-gray-800">{item.category_title}</h3>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setCurrentItem(item); setIsEditing(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"><Edit size={16} /></button>
                <button onClick={() => handleDelete(item.id!)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="space-y-1">
              {item.items.slice(0, 5).map((sub, idx) => (
                <div key={idx} className="text-sm text-gray-500 flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-300 rounded-full" />
                  {sub}
                </div>
              ))}
              {item.items.length > 5 && (
                <div className="text-xs text-gray-400 italic">+{item.items.length - 5} more items</div>
              )}
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-dashed border-gray-300 text-gray-500">
            No categories found for {activeTab}. Click "Add Category" to start.
          </div>
        )}
      </div>
    </div>
  );
}
