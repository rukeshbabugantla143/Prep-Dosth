import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { Edit, Trash2, Plus } from "lucide-react";

export default function ManageExams() {
  const [exams, setExams] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentExam, setCurrentExam] = useState<any>({});

  const fetchExams = async () => {
    const { data, error } = await supabase.from("exams").select("*");
    if (data) setExams(data);
    if (error) console.error("Error fetching exams:", error);
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this exam?")) {
      await supabase.from("exams").delete().eq("id", id);
      fetchExams();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let error;
    if (currentExam.id) {
      const res = await supabase.from("exams").update(currentExam).eq("id", currentExam.id);
      error = res.error;
    } else {
      const res = await supabase.from("exams").insert(currentExam);
      error = res.error;
    }
    if (error) {
      console.error("Error saving exam:", error);
      alert("Failed to save exam: " + error.message);
      return;
    }
    setIsEditing(false);
    setCurrentExam({});
    fetchExams();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Exams</h1>
        <button onClick={() => { setIsEditing(true); setCurrentExam({}); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
          <Plus size={20} /> Add New Exam
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">{currentExam.id ? "Edit Exam" : "Add New Exam"}</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" placeholder="Title" value={currentExam.title || ""} onChange={e => setCurrentExam({...currentExam, title: e.target.value})} className="border p-3 rounded-lg w-full" required />
            <input type="date" placeholder="Date" value={currentExam.date ? new Date(currentExam.date).toISOString().split('T')[0] : ""} onChange={e => setCurrentExam({...currentExam, date: e.target.value})} className="border p-3 rounded-lg w-full" required />
            <textarea placeholder="Description" value={currentExam.description || ""} onChange={e => setCurrentExam({...currentExam, description: e.target.value})} className="border p-3 rounded-lg w-full md:col-span-2" rows={4} required />
            <input type="text" placeholder="Link" value={currentExam.link || ""} onChange={e => setCurrentExam({...currentExam, link: e.target.value})} className="border p-3 rounded-lg w-full md:col-span-2" />
            
            <div className="md:col-span-2 flex gap-4 justify-end mt-4">
              <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Save Exam</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
              <th className="p-4 font-semibold">Title</th>
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.map(exam => (
              <tr key={exam.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="p-4 font-medium text-gray-800">{exam.title}</td>
                <td className="p-4 text-gray-600">{new Date(exam.date).toLocaleDateString()}</td>
                <td className="p-4 flex justify-end gap-3">
                  <button onClick={() => { setCurrentExam(exam); setIsEditing(true); }} className="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded-lg transition"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(exam.id)} className="text-red-600 hover:text-red-800 p-2 bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {exams.length === 0 && (
              <tr><td colSpan={3} className="p-8 text-center text-gray-500">No exams found. Add one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
