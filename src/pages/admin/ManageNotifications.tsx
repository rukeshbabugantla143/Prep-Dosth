import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Edit, Trash2, Plus } from "lucide-react";

export default function ManageNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const { token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<any>({});

  const fetchNotifications = async () => {
    const res = await axios.get("/api/notifications");
    setNotifications(res.data);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this notification?")) {
      await axios.delete(`/api/notifications/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchNotifications();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentNotification._id) {
      await axios.put(`/api/notifications/${currentNotification._id}`, currentNotification, { headers: { Authorization: `Bearer ${token}` } });
    } else {
      await axios.post("/api/notifications", currentNotification, { headers: { Authorization: `Bearer ${token}` } });
    }
    setIsEditing(false);
    setCurrentNotification({});
    fetchNotifications();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Notifications</h1>
        <button onClick={() => { setIsEditing(true); setCurrentNotification({}); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
          <Plus size={20} /> Add New Notification
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">{currentNotification._id ? "Edit Notification" : "Add New Notification"}</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" placeholder="Title" value={currentNotification.title || ""} onChange={e => setCurrentNotification({...currentNotification, title: e.target.value})} className="border p-3 rounded-lg w-full" required />
            <input type="text" placeholder="Date (e.g., 2 hours ago)" value={currentNotification.date || ""} onChange={e => setCurrentNotification({...currentNotification, date: e.target.value})} className="border p-3 rounded-lg w-full" required />
            <select value={currentNotification.type || ""} onChange={e => setCurrentNotification({...currentNotification, type: e.target.value})} className="border p-3 rounded-lg w-full bg-white" required>
              <option value="">Select Type</option>
              <option value="exam">Exam</option>
              <option value="alert">Alert</option>
              <option value="test">Test</option>
              <option value="result">Result</option>
            </select>
            
            <div className="md:col-span-2 flex gap-4 justify-end mt-4">
              <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Save Notification</button>
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
              <th className="p-4 font-semibold">Type</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map(notif => (
              <tr key={notif._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="p-4 font-medium text-gray-800">{notif.title}</td>
                <td className="p-4 text-gray-600">{notif.date}</td>
                <td className="p-4 text-gray-600 capitalize">{notif.type}</td>
                <td className="p-4 flex justify-end gap-3">
                  <button onClick={() => { setCurrentNotification(notif); setIsEditing(true); }} className="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded-lg transition"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(notif._id)} className="text-red-600 hover:text-red-800 p-2 bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {notifications.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">No notifications found. Add one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
