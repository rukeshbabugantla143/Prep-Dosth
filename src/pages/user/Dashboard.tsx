import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Clock, 
  ChevronRight, 
  Trophy, 
  ShieldCheck, 
  User, 
  LayoutDashboard,
  Zap,
  Star,
  ArrowRight
} from "lucide-react";
import { motion } from "motion/react";

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<any[]>([]);
  const [stats, setStats] = useState({
    attempted: 0,
    avgScore: 0,
    rank: "#--"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch available tests
      const { data: testsData, error: testsError } = await supabase.from("tests").select("*").order("created_at", { ascending: false });
      if (testsData) setTests(testsData);
      if (testsError) console.error("Error fetching tests:", testsError);

      // Fetch user stats
      if (user?.id) {
        const { data: resultsData, error: resultsError } = await supabase
          .from("test_results")
          .select("accuracy")
          .eq("user_id", user.id);
        
        if (resultsData && resultsData.length > 0) {
          const attempted = resultsData.length;
          const totalAccuracy = resultsData.reduce((acc, curr) => acc + curr.accuracy, 0);
          const avgScore = Math.round(totalAccuracy / attempted);
          setStats(prev => ({ ...prev, attempted, avgScore }));
        }
        if (resultsError) console.error("Error fetching stats:", resultsError);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-12">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <ShieldCheck className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-gray-900 uppercase leading-none">PrepDosth</h1>
              <p className="text-[8px] md:text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-1">Secure Portal V2.1</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4 bg-white border border-gray-200 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl shadow-sm w-full sm:w-auto">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-gray-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-gray-900 uppercase tracking-tight truncate">{user?.name || "User"}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{user?.role || "Student"}</span>
            </div>
          </div>
        </header>

        {/* Welcome Banner */}
        <div className="bg-[#0f172a] rounded-3xl md:rounded-[2.5rem] p-6 md:p-12 text-white mb-8 md:mb-12 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-bold tracking-widest text-blue-400 mb-4 md:mb-6 uppercase">
              <Zap size={10} className="fill-blue-400" />
              Ready for your next challenge?
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 tracking-tight leading-tight md:leading-none uppercase">WELCOME BACK, {user?.name?.split(' ')[0] || 'USER'}!</h2>
            <p className="text-gray-400 text-sm md:text-lg font-medium mb-6 md:mb-8 leading-relaxed">
              Track your progress, attempt mock tests, and access premium study materials to excel in your upcoming examinations.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button onClick={() => navigate("/user/results")} className="bg-blue-600 hover:bg-blue-700 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black tracking-widest uppercase text-[10px] md:text-xs transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                View Performance <ArrowRight size={16} />
              </button>
              <button onClick={() => navigate("/premium")} className="bg-white/10 hover:bg-white/20 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black tracking-widest uppercase text-[10px] md:text-xs transition-all border border-white/10 flex items-center justify-center gap-2">
                Study Materials <FileText size={16} />
              </button>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-64 md:w-96 h-64 md:h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          {[
            { label: "Tests Attempted", value: (stats.attempted || 0).toString(), icon: <Trophy className="text-orange-500" />, bg: "bg-orange-50" },
            { label: "Average Score", value: `${stats.avgScore || 0}%`, icon: <Star className="text-yellow-500" />, bg: "bg-yellow-50" },
            { label: "Global Rank", value: stats.rank || "#--", icon: <LayoutDashboard className="text-purple-500" />, bg: "bg-purple-50" }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex items-center gap-4 md:gap-6">
              <div className={`w-12 h-12 md:w-16 md:h-16 ${stat.bg} rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0`}>
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 truncate">{stat.label}</p>
                <p className="text-2xl md:text-3xl font-black text-gray-900 truncate">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mock Tests Section */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 md:mb-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">Available Mock Tests</h3>
              <p className="text-gray-500 text-[10px] font-bold tracking-widest uppercase mt-1">Prepare yourself with our latest assessments.</p>
            </div>
            <button className="text-blue-600 font-black tracking-widest uppercase text-[10px] flex items-center gap-2 hover:gap-3 transition-all">
              View All Tests <ChevronRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm animate-pulse h-64"></div>
              ))}
            </div>
          ) : tests.length === 0 ? (
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-12 md:p-20 border border-dashed border-gray-200 flex flex-col items-center text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-2xl md:rounded-3xl flex items-center justify-center mb-6">
                <FileText size={32} className="text-gray-300" />
              </div>
              <h4 className="text-xl md:text-2xl font-black text-gray-900 mb-2">No Tests Available</h4>
              <p className="text-gray-500 text-[10px] font-bold tracking-widest uppercase max-w-xs">Check back later for new mock tests and assessments.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {tests.map((test) => (
                <motion.div 
                  key={test.id}
                  whileHover={{ y: -8 }}
                  className="bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-all">
                      <FileText size={20} className="text-blue-600 group-hover:text-white transition-all" />
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full">
                      <Clock size={10} className="text-gray-400" />
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{test.timeLimit}m</span>
                    </div>
                  </div>
                  
                  <h4 className="text-lg md:text-xl font-black text-gray-900 mb-4 leading-tight min-h-[3rem] line-clamp-2">
                    {test.title}
                  </h4>
                  
                  <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 text-gray-400">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <LayoutDashboard size={14} className="flex-shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-widest truncate">{test.questions?.length || 0} Items</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-300 rounded-full flex-shrink-0"></div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Trophy size={14} className="flex-shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-widest truncate">Mock Exam</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/user/test/${test.id}`)}
                    className="w-full bg-[#0f172a] hover:bg-blue-600 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-black tracking-widest uppercase text-[10px] transition-all flex items-center justify-center gap-2"
                  >
                    Start Assessment <ArrowRight size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
