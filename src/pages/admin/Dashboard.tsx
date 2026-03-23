import { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { Users, Briefcase, FileText, CheckSquare } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, jobs: 0, exams: 0, tests: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [jobsRes, examsRes, testsRes, usersRes] = await Promise.all([
        supabase.from("jobs").select("*", { count: 'exact', head: true }),
        supabase.from("exams").select("*", { count: 'exact', head: true }),
        supabase.from("tests").select("*", { count: 'exact', head: true }),
        supabase.from("profiles").select("*", { count: 'exact', head: true }),
      ]);
      
      setStats({
        users: usersRes.count || 0,
        jobs: jobsRes.count || 0,
        exams: examsRes.count || 0,
        tests: testsRes.count || 0,
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="p-2 md:p-0">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-gray-800">Admin Overview</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-blue-100 p-3 md:p-4 rounded-xl text-blue-600 flex-shrink-0">
            <Users size={24} className="md:w-8 md:h-8" />
          </div>
          <div className="min-w-0">
            <p className="text-gray-500 text-sm md:text-base font-medium truncate">Total Users</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-800 truncate">{stats.users}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-green-100 p-3 md:p-4 rounded-xl text-green-600 flex-shrink-0">
            <Briefcase size={24} className="md:w-8 md:h-8" />
          </div>
          <div className="min-w-0">
            <p className="text-gray-500 text-sm md:text-base font-medium truncate">Active Jobs</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-800 truncate">{stats.jobs}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-purple-100 p-3 md:p-4 rounded-xl text-purple-600 flex-shrink-0">
            <FileText size={24} className="md:w-8 md:h-8" />
          </div>
          <div className="min-w-0">
            <p className="text-gray-500 text-sm md:text-base font-medium truncate">Exams</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-800 truncate">{stats.exams}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-orange-100 p-3 md:p-4 rounded-xl text-orange-600 flex-shrink-0">
            <CheckSquare size={24} className="md:w-8 md:h-8" />
          </div>
          <div className="min-w-0">
            <p className="text-gray-500 text-sm md:text-base font-medium truncate">Mock Tests</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-800 truncate">{stats.tests}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <button className="bg-gray-50 hover:bg-gray-100 p-3 md:p-4 rounded-xl text-center transition font-medium text-gray-700 border border-gray-200 text-sm md:text-base">
            + New Job
          </button>
          <button className="bg-gray-50 hover:bg-gray-100 p-3 md:p-4 rounded-xl text-center transition font-medium text-gray-700 border border-gray-200 text-sm md:text-base">
            + New Exam
          </button>
          <button className="bg-gray-50 hover:bg-gray-100 p-3 md:p-4 rounded-xl text-center transition font-medium text-gray-700 border border-gray-200 text-sm md:text-base">
            + Create Test
          </button>
          <button className="bg-gray-50 hover:bg-gray-100 p-3 md:p-4 rounded-xl text-center transition font-medium text-gray-700 border border-gray-200 text-sm md:text-base">
            Manage Users
          </button>
        </div>
      </div>
    </div>
  );
}
