import { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { Users, Briefcase, FileText, CheckSquare, Bell, Plus, ArrowRight, Activity, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface RecentItem {
  id: string;
  title: string;
  created_at: string;
  type: 'job' | 'exam' | 'notification';
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, jobs: 0, exams: 0, tests: 0, notifications: 0 });
  const [recentActivity, setRecentActivity] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [jobsRes, examsRes, testsRes, usersRes, notifsRes] = await Promise.all([
          supabase.from("jobs").select("*", { count: 'exact', head: true }),
          supabase.from("exams").select("*", { count: 'exact', head: true }),
          supabase.from("tests").select("*", { count: 'exact', head: true }),
          supabase.from("profiles").select("*", { count: 'exact', head: true }),
          supabase.from("notifications").select("*", { count: 'exact', head: true }),
        ]);
        
        setStats({
          users: usersRes.count || 0,
          jobs: jobsRes.count || 0,
          exams: examsRes.count || 0,
          tests: testsRes.count || 0,
          notifications: notifsRes.count || 0,
        });

        // Fetch recent activity
        const [recentJobs, recentExams] = await Promise.all([
          supabase.from("jobs").select("id, title, created_at").order("created_at", { ascending: false }).limit(3),
          supabase.from("exams").select("id, title, created_at").order("created_at", { ascending: false }).limit(3),
        ]);

        const combined: RecentItem[] = [
          ...(recentJobs.data || []).map(j => ({ ...j, type: 'job' as const })),
          ...(recentExams.data || []).map(e => ({ ...e, type: 'exam' as const })),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

        setRecentActivity(combined);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const StatCard = ({ icon: Icon, label, value, color, bgColor, trend }: any) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`${bgColor} p-3 rounded-2xl ${color} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className="flex items-center text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
            <TrendingUp size={12} className="mr-1" />
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <Link 
            to="/admin/notifications" 
            className="relative p-2 text-gray-400 hover:text-gray-600 bg-white rounded-xl border border-gray-200 shadow-sm transition-colors"
          >
            <Bell size={24} />
            {stats.notifications > 0 && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
            )}
          </Link>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          icon={Users} 
          label="Total Users" 
          value={stats.users} 
          color="text-blue-600" 
          bgColor="bg-blue-50"
          trend="+12%"
        />
        <StatCard 
          icon={Briefcase} 
          label="Active Jobs" 
          value={stats.jobs} 
          color="text-emerald-600" 
          bgColor="bg-emerald-50"
          trend="+5%"
        />
        <StatCard 
          icon={FileText} 
          label="Exams" 
          value={stats.exams} 
          color="text-violet-600" 
          bgColor="bg-violet-50"
        />
        <StatCard 
          icon={CheckSquare} 
          label="Mock Tests" 
          value={stats.tests} 
          color="text-orange-600" 
          bgColor="bg-orange-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-full">
            <div className="flex items-center gap-2 mb-8">
              <Activity className="text-blue-600" size={20} />
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <QuickActionButton 
                to="/admin/jobs" 
                label="Post New Job" 
                icon={Plus} 
                color="bg-blue-600" 
              />
              <QuickActionButton 
                to="/admin/exams" 
                label="Add New Exam" 
                icon={Plus} 
                color="bg-emerald-600" 
              />
              <QuickActionButton 
                to="/admin/tests" 
                label="Create Mock Test" 
                icon={Plus} 
                color="bg-violet-600" 
              />
              <QuickActionButton 
                to="/admin/users" 
                label="Manage Users" 
                icon={Users} 
                color="bg-gray-800" 
              />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Clock className="text-blue-600" size={20} />
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              </div>
              <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View All <ArrowRight size={14} />
              </button>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-16 bg-gray-50 rounded-2xl w-full"></div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Activity size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No recent activity found</p>
                </div>
              ) : (
                recentActivity.map((item) => (
                  <div 
                    key={`${item.type}-${item.id}`} 
                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${
                        item.type === 'job' ? 'bg-emerald-100 text-emerald-600' : 'bg-violet-100 text-violet-600'
                      }`}>
                        {item.type === 'job' ? <Briefcase size={18} /> : <FileText size={18} />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{item.title}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <span className="capitalize">{item.type}</span> • {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Link 
                      to={`/admin/${item.type === 'job' ? 'jobs' : 'exams'}`}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({ to, label, icon: Icon, color }: any) {
  return (
    <Link 
      to={to} 
      className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className={`${color} p-2 rounded-xl text-white group-hover:scale-110 transition-transform`}>
          <Icon size={18} />
        </div>
        <span className="font-semibold text-gray-700">{label}</span>
      </div>
      <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
    </Link>
  );
}
