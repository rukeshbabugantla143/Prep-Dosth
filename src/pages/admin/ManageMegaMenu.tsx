import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { Edit, Trash2, Plus, Users, Landmark, BookOpen, GraduationCap, Train, Shield, Cpu, Activity, Briefcase, Scale, FileText, PlayCircle, Building, Map, Award, Globe } from "lucide-react";
import ImageUpload from "../../components/common/ImageUpload";
import ConfirmationModal from "../../components/ConfirmationModal";
import { slugify } from "../../utils";

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

interface SubItem {
  label: string;
  path: string;
  icon_name?: string;
  image?: string;
}

interface MegaMenuItem {
  id?: string;
  menu_type: 'jobs' | 'exams' | 'tests';
  category_title: string;
  icon_name: string;
  category_image?: string;
  items: SubItem[];
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
    category_image: '',
    items: [],
    order_index: 0
  });
  const [exams, setExams] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isCustomPath, setIsCustomPath] = useState(false);
  const [newItem, setNewItem] = useState<SubItem>({
    label: '',
    path: '',
    icon_name: 'Award',
    image: ''
  });

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

  const fetchMegaMenu = async () => {
    // Fetch Mega Menu
    const { data: megaData } = await supabase
      .from("mega_menu")
      .select("*")
      .order("order_index", { ascending: true });
    if (megaData) setMenuItems(megaData);

    // Fetch Exams for dropdown
    const { data: examsData } = await supabase.from("exams").select("id, title").eq('is_subpage', false);
    if (examsData) setExams(examsData);

    // Fetch Jobs for dropdown
    const { data: jobsData } = await supabase.from("jobs").select("id, title").eq('is_subpage', false);
    if (jobsData) setJobs(jobsData);
  };

  useEffect(() => {
    fetchMegaMenu();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...currentItem, menu_type: activeTab };
    console.log("Saving payload:", payload); // Debug log
    
    if (currentItem.id) {
      await supabase.from("mega_menu").update(payload).eq("id", currentItem.id);
    } else {
      const nextOrder = menuItems.filter(i => i.menu_type === activeTab).length;
      await supabase.from("mega_menu").insert({ ...payload, order_index: nextOrder });
    }
    
    setIsEditing(false);
    setCurrentItem({ menu_type: activeTab, category_title: '', icon_name: 'Users', category_image: '', items: [], order_index: 0 });
    fetchMegaMenu();
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Category",
      message: "Are you sure you want to delete this category? This action cannot be undone.",
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("mega_menu").delete().eq("id", id);
          if (error) throw error;
          fetchMegaMenu();
        } catch (error: any) {
          console.error("Error deleting category:", error);
          alert(`Failed to delete category: ${error.message || "Unknown error"}`);
        }
      }
    });
  };

  const addItemToCategory = () => {
    if (newItem.label.trim() && newItem.path.trim()) {
      setCurrentItem({
        ...currentItem,
        items: [...currentItem.items, { ...newItem }]
      });
      setNewItem({ label: '', path: '', icon_name: 'Award', image: '' });
      setIsCustomPath(false);
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
                <div className="md:col-span-2">
                <ImageUpload 
                  label="Category Icon/Image (Optional - Overrides Icon Selection)" 
                  currentImage={currentItem.category_image} 
                  onUploadSuccess={(url) => setCurrentItem({...currentItem, category_image: url})} 
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-6">
              <label className="text-sm font-bold text-gray-800">Add Sub-items (Links)</label>
              <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Destination Page</label>
                      <select 
                        value={isCustomPath ? "custom" : newItem.path} 
                        onChange={e => {
                          const val = e.target.value;
                          if (val === "custom") {
                            setIsCustomPath(true);
                          } else {
                            setIsCustomPath(false);
                            let newLabel = newItem.label;

                            // Static routes
                            const staticPages: any = {
                              "/": "Home",
                              "/jobs": "Jobs",
                              "/exams": "Exams",
                              "/tests": "Mock Tests",
                              "/premium": "Premium",
                              "/about": "About",
                              "/contact": "Contact"
                            };

                            if (staticPages[val]) {
                              newLabel = staticPages[val];
                            } else if (val.startsWith("/exams/")) {
                              const exam = exams.find(ex => `/exams/${slugify(ex.title)}` === val);
                              if (exam) newLabel = exam.title;
                            } else if (val.startsWith("/jobs/")) {
                              const job = jobs.find(j => `/jobs/${slugify(j.title)}` === val);
                              if (job) newLabel = job.title;
                            }

                            setNewItem({...newItem, path: val, label: newLabel});
                          }
                        }}
                        className="border p-2 rounded-lg w-full text-sm outline-none bg-white focus:ring-1 focus:ring-[#15b86c]"
                      >
                        <option value="">Select a page...</option>
                        <optgroup label="Main Pages">
                          <option value="/">Home Page</option>
                          <option value="/jobs">All Jobs View</option>
                          <option value="/exams">All Exams View</option>
                          <option value="/tests">Mock Tests</option>
                          <option value="/premium">Premium Area</option>
                          <option value="/about">About Page</option>
                          <option value="/contact">Contact Page</option>
                        </optgroup>
                        <optgroup label="Latest Exams">
                          {exams.slice(0, 15).map(ex => (
                            <option key={ex.id} value={`/exams/${slugify(ex.title)}`}>{ex.title}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Latest Jobs">
                          {jobs.slice(0, 15).map(j => (
                            <option key={j.id} value={`/jobs/${slugify(j.title)}`}>{j.title}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Other">
                          <option value="custom">Custom URL...</option>
                        </optgroup>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Display Label</label>
                      <input 
                        type="text" 
                        placeholder="e.g. SSC CGL" 
                        value={newItem.label} 
                        onChange={e => setNewItem({...newItem, label: e.target.value})} 
                        className="border p-2 rounded-lg w-full text-sm outline-none focus:ring-1 focus:ring-[#15b86c]" 
                      />
                    </div>
                  </div>

                  {isCustomPath && (
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Custom Path / External URL</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="e.g. /my-custom-path or https://..." 
                          value={newItem.path} 
                          onChange={e => setNewItem({...newItem, path: e.target.value})} 
                          className="border p-2 rounded-lg w-full text-sm outline-none focus:ring-1 focus:ring-[#15b86c] pl-8" 
                        />
                        <Globe size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Item Default Icon</label>
                    <select 
                      value={newItem.icon_name} 
                      onChange={e => setNewItem({...newItem, icon_name: e.target.value})} 
                      className="border p-2 rounded-lg w-full text-sm outline-none bg-white focus:ring-1 focus:ring-[#15b86c]"
                    >
                      {Object.keys(ICON_OPTIONS).map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <ImageUpload 
                      label="Item Custom Icon (Optional)" 
                      currentImage={newItem.image} 
                      onUploadSuccess={(url) => setNewItem({...newItem, image: url})} 
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={addItemToCategory}
                    className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700 transition text-sm font-bold"
                  >
                    Add Item to List
                  </button>
                </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentItem.items.map((item, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.image ? (
                          <img src={item.image} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-400">
                            {ICON_OPTIONS[item.icon_name as keyof typeof ICON_OPTIONS] || <Award size={14} />}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    </div>
                    <button type="button" onClick={() => removeItemFromCategory(idx)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">
                      <Trash2 size={14} />
                    </button>
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
            {item.image && (
              <img 
                src={item.image} 
                alt={item.category_title} 
                className="w-full h-32 object-cover rounded-xl mb-4" 
                referrerPolicy="no-referrer"
              />
            )}
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
                  {typeof sub === 'string' ? sub : sub.label}
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
