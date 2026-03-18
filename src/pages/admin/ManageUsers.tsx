import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { Trash2 } from "lucide-react";
import ConfirmationModal from "../../components/ConfirmationModal";

export default function ManageUsers() {
  const [users, setUsers] = useState<any[]>([]);

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
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (data) setUsers(data);
    if (error) console.error("Error fetching users:", error);
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete User",
      message: "Are you sure you want to delete this user? This will only delete their profile, not their authentication account. This action cannot be undone.",
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("profiles").delete().eq("id", id);
          if (error) throw error;
          fetchUsers();
        } catch (error: any) {
          console.error("Error deleting user:", error);
          alert(`Failed to delete user: ${error.message || "Unknown error"}`);
        }
      }
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Users</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
              <th className="p-4 font-semibold">Username</th>
              <th className="p-4 font-semibold">Email</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="p-4 text-gray-800">{user.username || 'N/A'}</td>
                <td className="p-4 text-gray-600">{user.email || 'N/A'}</td>
                <td className="p-4 flex justify-end gap-3">
                  <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800 p-2 bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
