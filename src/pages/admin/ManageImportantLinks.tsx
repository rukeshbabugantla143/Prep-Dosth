import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { Edit, Trash2, Plus, X } from "lucide-react";
import ConfirmationModal from "../../components/ConfirmationModal";

export default function ManageImportantLinks() {
  const [exams, setExams] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<'exam' | 'job'>('exam');
  const [selectedId, setSelectedId] = useState<string>('');
  const [links, setLinks] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLink, setCurrentLink] = useState<any>({});

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

  useEffect(() => {
    const fetchData = async () => {
      const { data: examsData } = await supabase.from("exams").select("id, title");
      if (examsData) setExams(examsData);
      const { data: jobsData } = await supabase.from("jobs").select("id, title");
      if (jobsData) setJobs(jobsData);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchLinks(selectedId, selectedType);
    } else {
      setLinks([]);
    }
  }, [selectedId, selectedType]);

  const fetchLinks = async (id: string, type: 'exam' | 'job') => {
    const query = supabase
      .from("important_links")
      .select("*")
      .order("order_index", { ascending: true });
      
    if (type === 'exam') query.eq('exam_id', id);
    else query.eq('job_id', id);
    
    const { data } = await query;
    if (data) setLinks(data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const linkToSave = { 
      ...currentLink, 
      exam_id: selectedType === 'exam' ? selectedId : null,
      job_id: selectedType === 'job' ? selectedId : null 
    };
    
    if (linkToSave.id) {
      await supabase.from("important_links").update(linkToSave).eq("id", linkToSave.id);
    } else {
      await supabase.from("important_links").insert(linkToSave);
    }
    setIsEditing(false);
    setCurrentLink({});
    fetchLinks(selectedId, selectedType);
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Link",
      message: "Are you sure you want to delete this link? This action cannot be undone.",
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("important_links").delete().eq("id", id);
          if (error) throw error;
          fetchLinks(selectedId, selectedType);
        } catch (error: any) {
          console.error("Error deleting link:", error);
          alert(`Failed to delete link: ${error.message || "Unknown error"}`);
        }
      }
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Important Links</h1>
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Type</label>
          <select 
            value={selectedType} 
            onChange={e => { setSelectedType(e.target.value as 'exam' | 'job'); setSelectedId(''); }}
            className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="exam">Exam</option>
            <option value="job">Job</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select {selectedType === 'exam' ? 'Exam' : 'Job'}</label>
          <select 
            value={selectedId} 
            onChange={e => setSelectedId(e.target.value)}
            className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">Select an {selectedType === 'exam' ? 'Exam' : 'Job'}</option>
            {(selectedType === 'exam' ? exams : jobs).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </div>
      </div>

      {selectedId && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-700">Links</h2>
            <button onClick={() => { setCurrentLink({}); setIsEditing(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
              <Plus size={20} /> Add Link
            </button>
          </div>

          {isEditing && (
            <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="Title" value={currentLink.title || ""} onChange={e => setCurrentLink({...currentLink, title: e.target.value})} className="border p-3 rounded-lg w-full" required />
              <input placeholder="URL" value={currentLink.url || ""} onChange={e => setCurrentLink({...currentLink, url: e.target.value})} className="border p-3 rounded-lg w-full" required />
              <input type="number" placeholder="Order Index" value={currentLink.order_index || 0} onChange={e => setCurrentLink({...currentLink, order_index: parseInt(e.target.value)})} className="border p-3 rounded-lg w-full" />
              <div className="md:col-span-3 flex gap-2 justify-end">
                <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-200 px-4 py-2 rounded-lg">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Save</button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4">Title</th>
                  <th className="p-4">URL</th>
                  <th className="p-4">Order</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map(link => (
                  <tr key={link.id} className="border-b">
                    <td className="p-4">{link.title}</td>
                    <td className="p-4">{link.url}</td>
                    <td className="p-4">{link.order_index}</td>
                    <td className="p-4 flex justify-end gap-2">
                      <button onClick={() => { setCurrentLink(link); setIsEditing(true); }} className="text-blue-600 p-2"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(link.id)} className="text-red-600 p-2"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

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
