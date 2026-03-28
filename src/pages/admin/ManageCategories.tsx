import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { Edit, Trash2, Save, X, Briefcase, GraduationCap, Bell } from "lucide-react";
import ConfirmationModal from "../../components/ConfirmationModal";

type CategorySource = 'jobs' | 'exams' | 'notifications';

interface CategoryItem {
  name: string;
  count: number;
  source: CategorySource;
}

export default function ManageCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string; source: CategorySource } | null>(null);
  const [loading, setLoading] = useState(true);

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

  const fetchCategories = async () => {
    setLoading(true);
    try {
      // Fetch from Jobs
      const { data: jobsData } = await supabase.from("jobs").select("department");
      const jobCats: { [key: string]: number } = {};
      jobsData?.forEach(j => {
        if (j.department) jobCats[j.department] = (jobCats[j.department] || 0) + 1;
      });

      // Fetch from Exams
      const { data: examsData } = await supabase.from("exams").select("category");
      const examCats: { [key: string]: number } = {};
      examsData?.forEach(e => {
        if (e.category) examCats[e.category] = (examCats[e.category] || 0) + 1;
      });

      // Fetch from Notifications
      const { data: notifData } = await supabase.from("notifications").select("type");
      const notifCats: { [key: string]: number } = {};
      notifData?.forEach(n => {
        if (n.type) notifCats[n.type] = (notifCats[n.type] || 0) + 1;
      });

      const combined: CategoryItem[] = [
        ...Object.keys(jobCats).map(name => ({ name, count: jobCats[name], source: 'jobs' as CategorySource })),
        ...Object.keys(examCats).map(name => ({ name, count: examCats[name], source: 'exams' as CategorySource })),
        ...Object.keys(notifCats).map(name => ({ name, count: notifCats[name], source: 'notifications' as CategorySource }))
      ];

      setCategories(combined);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleRename = async () => {
    if (!editingCategory || !editingCategory.newName.trim()) return;

    const { oldName, newName, source } = editingCategory;
    const table = source === 'jobs' ? 'jobs' : source === 'exams' ? 'exams' : 'notifications';
    const column = source === 'jobs' ? 'department' : source === 'exams' ? 'category' : 'type';

    try {
      const { error } = await supabase
        .from(table)
        .update({ [column]: newName })
        .eq(column, oldName);

      if (error) throw error;
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      alert("Error renaming category: " + error.message);
    }
  };

  const handleDelete = (cat: CategoryItem) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Category",
      message: `Are you sure you want to remove the category "${cat.name}"? This will set all ${cat.count} items in this category to "Uncategorized".`,
      onConfirm: async () => {
        const table = cat.source === 'jobs' ? 'jobs' : cat.source === 'exams' ? 'exams' : 'notifications';
        const column = cat.source === 'jobs' ? 'department' : cat.source === 'exams' ? 'category' : 'type';

        try {
          const { error } = await supabase
            .from(table)
            .update({ [column]: 'Uncategorized' })
            .eq(column, cat.name);

          if (error) throw error;
          fetchCategories();
        } catch (error: any) {
          alert("Error deleting category: " + error.message);
        }
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manage Categories</h1>
          <p className="text-gray-500">Edit or delete categories across Jobs, Exams, and Notifications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Jobs Categories */}
        <CategorySection 
          title="Job Categories" 
          icon={<Briefcase className="text-blue-600" />}
          items={categories.filter(c => c.source === 'jobs')}
          onEdit={(name) => setEditingCategory({ oldName: name, newName: name, source: 'jobs' })}
          onDelete={handleDelete}
          editingCategory={editingCategory}
          setEditingCategory={setEditingCategory}
          handleRename={handleRename}
        />

        {/* Exams Categories */}
        <CategorySection 
          title="Exam Categories" 
          icon={<GraduationCap className="text-green-600" />}
          items={categories.filter(c => c.source === 'exams')}
          onEdit={(name) => setEditingCategory({ oldName: name, newName: name, source: 'exams' })}
          onDelete={handleDelete}
          editingCategory={editingCategory}
          setEditingCategory={setEditingCategory}
          handleRename={handleRename}
        />

        {/* Notifications Categories */}
        <CategorySection 
          title="Notification Types" 
          icon={<Bell className="text-purple-600" />}
          items={categories.filter(c => c.source === 'notifications')}
          onEdit={(name) => setEditingCategory({ oldName: name, newName: name, source: 'notifications' })}
          onDelete={handleDelete}
          editingCategory={editingCategory}
          setEditingCategory={setEditingCategory}
          handleRename={handleRename}
        />
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

function CategorySection({ title, icon, items, onEdit, onDelete, editingCategory, setEditingCategory, handleRename }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        {icon}
        <h2 className="font-bold text-gray-800">{title}</h2>
      </div>
      <div className="divide-y divide-gray-50">
        {items.length === 0 ? (
          <p className="p-4 text-center text-gray-400 text-sm">No categories found</p>
        ) : (
          items.map((cat: CategoryItem) => (
            <div key={cat.name} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              {editingCategory?.oldName === cat.name && editingCategory?.source === cat.source ? (
                <div className="flex items-center gap-2 w-full">
                  <input 
                    type="text" 
                    value={editingCategory.newName}
                    onChange={e => setEditingCategory({ ...editingCategory, newName: e.target.value })}
                    className="border p-1 rounded text-sm flex-1 outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                  <button onClick={handleRename} className="text-green-600 p-1 hover:bg-green-50 rounded"><Save size={16} /></button>
                  <button onClick={() => setEditingCategory(null)} className="text-gray-400 p-1 hover:bg-gray-100 rounded"><X size={16} /></button>
                </div>
              ) : (
                <>
                  <div>
                    <span className="font-medium text-gray-800">{cat.name}</span>
                    <span className="ml-2 text-xs text-gray-400">({cat.count} items)</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => onEdit(cat.name)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"><Edit size={14} /></button>
                    <button onClick={() => onDelete(cat)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"><Trash2 size={14} /></button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
