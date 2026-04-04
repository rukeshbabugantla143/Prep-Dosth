import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { supabase } from "../services/supabaseClient";
import SEO from "../components/common/SEO";

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data, error } = await supabase.from("notifications").select("*");
      if (data) setNotifications(data);
      if (error) console.error("Error fetching notifications:", error);
    };
    fetchNotifications();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <SEO 
        title="Latest Updates & Notifications" 
        description="Stay updated with the latest exam dates, results, job alerts, and new mock tests on PrepDosth. Real-time alerts for TSPSC, APPSC, and more."
      />
      <h1 className="text-3xl font-bold mb-8 text-gray-800 flex items-center gap-3">
        <Bell className="text-[#15b86c]" /> All Latest Updates
      </h1>
      <div className="space-y-4">
        {notifications.map((notif) => (
          <div key={notif.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex justify-between items-center cursor-pointer">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">{notif.title}</h3>
              <p className="text-sm text-gray-500">{notif.date}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              notif.type === 'exam' ? 'bg-blue-100 text-blue-700' :
              notif.type === 'alert' ? 'bg-red-100 text-red-700' :
              notif.type === 'test' ? 'bg-green-100 text-green-700' :
              'bg-purple-100 text-purple-700'
            }`}>
              {notif.type}
            </span>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-gray-500 text-center py-8">No notifications available.</p>
        )}
      </div>
    </div>
  );
}
