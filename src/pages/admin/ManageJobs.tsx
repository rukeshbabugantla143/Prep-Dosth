import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Edit, Trash2, Plus } from "lucide-react";

export default function ManageJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const { token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [currentJob, setCurrentJob] = useState<any>({});

  const fetchJobs = async () => {
    const res = await axios.get("/api/jobs");
    setJobs(res.data);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this job?")) {
      await axios.delete(`/api/jobs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchJobs();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentJob._id) {
      await axios.put(`/api/jobs/${currentJob._id}`, currentJob, { headers: { Authorization: `Bearer ${token}` } });
    } else {
      await axios.post("/api/jobs", currentJob, { headers: { Authorization: `Bearer ${token}` } });
    }
    setIsEditing(false);
    setCurrentJob({});
    fetchJobs();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Jobs</h1>
        <button onClick={() => { setIsEditing(true); setCurrentJob({}); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
          <Plus size={20} /> Add New Job
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">{currentJob._id ? "Edit Job" : "Add New Job"}</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" placeholder="Title" value={currentJob.title || ""} onChange={e => setCurrentJob({...currentJob, title: e.target.value})} className="border p-3 rounded-lg w-full" required />
            <input type="text" placeholder="Department" value={currentJob.department || ""} onChange={e => setCurrentJob({...currentJob, department: e.target.value})} className="border p-3 rounded-lg w-full" required />
            <input type="number" placeholder="Total Posts" value={currentJob.posts || ""} onChange={e => setCurrentJob({...currentJob, posts: e.target.value})} className="border p-3 rounded-lg w-full" required />
            <input type="text" placeholder="Qualification" value={currentJob.qualification || ""} onChange={e => setCurrentJob({...currentJob, qualification: e.target.value})} className="border p-3 rounded-lg w-full" required />
            <input type="text" placeholder="Age Limit" value={currentJob.ageLimit || ""} onChange={e => setCurrentJob({...currentJob, ageLimit: e.target.value})} className="border p-3 rounded-lg w-full" required />
            <input type="text" placeholder="Fee" value={currentJob.fee || ""} onChange={e => setCurrentJob({...currentJob, fee: e.target.value})} className="border p-3 rounded-lg w-full" required />
            <textarea placeholder="Description" value={currentJob.description || ""} onChange={e => setCurrentJob({...currentJob, description: e.target.value})} className="border p-3 rounded-lg w-full md:col-span-2" rows={4} required />
            <input type="text" placeholder="Apply Link" value={currentJob.applyLink || ""} onChange={e => setCurrentJob({...currentJob, applyLink: e.target.value})} className="border p-3 rounded-lg w-full" />
            <input type="text" placeholder="PDF Link" value={currentJob.pdfLink || ""} onChange={e => setCurrentJob({...currentJob, pdfLink: e.target.value})} className="border p-3 rounded-lg w-full" />
            
            <div className="md:col-span-2 flex gap-4 justify-end mt-4">
              <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Save Job</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
              <th className="p-4 font-semibold">Title</th>
              <th className="p-4 font-semibold">Department</th>
              <th className="p-4 font-semibold">Posts</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="p-4 font-medium text-gray-800">{job.title}</td>
                <td className="p-4 text-gray-600">{job.department}</td>
                <td className="p-4 text-gray-600">{job.posts}</td>
                <td className="p-4 flex justify-end gap-3">
                  <button onClick={() => { setCurrentJob(job); setIsEditing(true); }} className="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded-lg transition"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(job._id)} className="text-red-600 hover:text-red-800 p-2 bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">No jobs found. Add one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
