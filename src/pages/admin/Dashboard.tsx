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
    <div>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Admin Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
            <Users size={32} />
          </div>
          <div>
            <p className="text-gray-500 font-medium">Total Users</p>
            <p className="text-3xl font-bold text-gray-800">{stats.users}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-green-100 p-4 rounded-xl text-green-600">
            <Briefcase size={32} />
          </div>
          <div>
            <p className="text-gray-500 font-medium">Active Jobs</p>
            <p className="text-3xl font-bold text-gray-800">{stats.jobs}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-purple-100 p-4 rounded-xl text-purple-600">
            <FileText size={32} />
          </div>
          <div>
            <p className="text-gray-500 font-medium">Exams</p>
            <p className="text-3xl font-bold text-gray-800">{stats.exams}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-orange-100 p-4 rounded-xl text-orange-600">
            <CheckSquare size={32} />
          </div>
          <div>
            <p className="text-gray-500 font-medium">Mock Tests</p>
            <p className="text-3xl font-bold text-gray-800">{stats.tests}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-gray-50 hover:bg-gray-100 p-4 rounded-xl text-center transition font-medium text-gray-700 border border-gray-200">
            + New Job
          </button>
          <button className="bg-gray-50 hover:bg-gray-100 p-4 rounded-xl text-center transition font-medium text-gray-700 border border-gray-200">
            + New Exam
          </button>
          <button className="bg-gray-50 hover:bg-gray-100 p-4 rounded-xl text-center transition font-medium text-gray-700 border border-gray-200">
            + Create Test
          </button>
          <button className="bg-gray-50 hover:bg-gray-100 p-4 rounded-xl text-center transition font-medium text-gray-700 border border-gray-200">
            Manage Users
          </button>
        </div>
      </div>
    </div>
  );
}
