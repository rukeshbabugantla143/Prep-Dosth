import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { Edit, Trash2, Plus, MoveUp, MoveDown } from "lucide-react";
import ConfirmationModal from "../../components/ConfirmationModal";

interface MenuItem {
  id?: string;
  label: string;
  path: string;
  order_index: number;
  is_active: boolean;
}

export default function ManageMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<MenuItem>({ label: "", path: "", order_index: 0, is_active: true });
  const [loading, setLoading] = useState(true);

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

  const fetchMenuItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("navigation")
      .select("*")
      .order("order_index", { ascending: true });
    
    if (error) {
      console.error("Error fetching menu items:", error);
    } else {
      setMenuItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentItem.id) {
      await supabase.from("navigation").update(currentItem).eq("id", currentItem.id);
    } else {
      // Set order_index to end if not specified
      const nextOrder = menuItems.length > 0 ? Math.max(...menuItems.map(i => i.order_index)) + 1 : 0;
      await supabase.from("navigation").insert({ ...currentItem, order_index: nextOrder });
    }
    setIsEditing(false);
    setCurrentItem({ label: "", path: "", order_index: 0, is_active: true });
    fetchMenuItems();
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Menu Item",
      message: "Are you sure you want to delete this menu item? This action cannot be undone.",
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("navigation").delete().eq("id", id);
          if (error) throw error;
          fetchMenuItems();
        } catch (error: any) {
          console.error("Error deleting menu item:", error);
          alert(`Failed to delete menu item: ${error.message || "Unknown error"}`);
        }
      }
    });
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...menuItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index].order_index;
    newItems[index].order_index = newItems[targetIndex].order_index;
    newItems[targetIndex].order_index = temp;

    await Promise.all([
      supabase.from("navigation").update({ order_index: newItems[index].order_index }).eq("id", newItems[index].id),
      supabase.from("navigation").update({ order_index: newItems[targetIndex].order_index }).eq("id", newItems[targetIndex].id)
    ]);

    fetchMenuItems();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Manage Navigation Menu</h1>
        <button 
          onClick={() => { setIsEditing(true); setCurrentItem({ label: "", path: "", order_index: menuItems.length, is_active: true }); }} 
          className="bg-[#15b86c] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#129c5b] transition"
        >
          <Plus size={20} /> Add Menu Item
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h3 className="text-xl font-bold mb-6 text-gray-800">{currentItem.id ? "Edit Menu Item" : "Add Menu Item"}</h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600">Label</label>
              <input 
                type="text" 
                placeholder="e.g. Home, Jobs, About" 
                value={currentItem.label} 
                onChange={e => setCurrentItem({...currentItem, label: e.target.value})} 
                className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-[#15b86c] outline-none" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600">Path</label>
              <input 
                type="text" 
                placeholder="e.g. /, /jobs, /about" 
                value={currentItem.path} 
                onChange={e => setCurrentItem({...currentItem, path: e.target.value})} 
                className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-[#15b86c] outline-none" 
                required 
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input 
                type="checkbox" 
                id="is_active"
                checked={currentItem.is_active} 
                onChange={e => setCurrentItem({...currentItem, is_active: e.target.checked})} 
                className="w-4 h-4 text-[#15b86c] rounded focus:ring-[#15b86c]"
              />
              <label htmlFor="is_active" className="text-sm font-semibold text-gray-600">Active (Visible in Menu)</label>
            </div>
            
            <div className="md:col-span-2 flex gap-4 justify-end mt-4">
              <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
              <button type="submit" className="bg-[#15b86c] text-white px-6 py-2 rounded-lg hover:bg-[#129c5b] transition">Save Item</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-bold text-gray-700">Order</th>
              <th className="p-4 font-bold text-gray-700">Label</th>
              <th className="p-4 font-bold text-gray-700">Path</th>
              <th className="p-4 font-bold text-gray-700">Status</th>
              <th className="p-4 font-bold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading menu items...</td></tr>
            ) : menuItems.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No menu items found. Add one to get started!</td></tr>
            ) : (
              menuItems.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="text-gray-400 hover:text-[#15b86c] disabled:opacity-30"><MoveUp size={16} /></button>
                      <button onClick={() => moveItem(index, 'down')} disabled={index === menuItems.length - 1} className="text-gray-400 hover:text-[#15b86c] disabled:opacity-30"><MoveDown size={16} /></button>
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-gray-800">{item.label}</td>
                  <td className="p-4 text-gray-600">{item.path}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setCurrentItem(item); setIsEditing(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(item.id!)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
        <h4 className="font-bold text-blue-800 mb-2">Note:</h4>
        <p className="text-blue-700 text-sm">
          This section manages the top-level navigation links. Changes made here will reflect in the main header and mobile menu. 
          Make sure the paths match your application routes (e.g. /jobs, /exams).
        </p>
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
