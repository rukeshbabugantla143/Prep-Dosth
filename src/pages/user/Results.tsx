import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabaseClient";
import { 
  Trophy, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  FileText,
  Calendar,
  Target
} from "lucide-react";
import { motion } from "motion/react";

export default function Results() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("test_results")
        .select(`
          *,
          tests (
            title
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (data) setResults(data);
      if (error) console.error("Error fetching results:", error);
      setLoading(false);
    };
    fetchResults();
  }, [user]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const handleViewDetails = (resultId: string) => {
    navigate(`/user/results/${resultId}`);
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 uppercase">Assessment History</h1>
          <p className="text-gray-500 text-[10px] md:text-xs font-bold tracking-widest uppercase mt-1">Review your performance across all mock tests.</p>
        </div>

        {/* Performance Overview Cards */}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 shrink-0">
                <FileText size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Attempted</p>
                <p className="text-3xl font-black text-gray-900 leading-none">{results.length}</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6">
              <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center text-green-600 shrink-0">
                <Target size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg. Accuracy</p>
                <p className="text-3xl font-black text-gray-900 leading-none">
                  {Math.round(results.reduce((acc, r) => acc + r.accuracy, 0) / results.length)}%
                </p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6">
              <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-600 shrink-0">
                <Trophy size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Best Score</p>
                <p className="text-3xl font-black text-gray-900 leading-none">
                  {Math.max(...results.map(r => r.score || 0))}
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white h-32 rounded-2xl md:rounded-3xl border border-gray-100 animate-pulse"></div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-10 md:p-20 border border-dashed border-gray-200 flex flex-col items-center text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-2xl md:rounded-3xl flex items-center justify-center mb-6">
              <Trophy size={32} md:size={40} className="text-gray-300" />
            </div>
            <h4 className="text-xl md:text-2xl font-black text-gray-900 mb-2">No Results Found</h4>
            <p className="text-gray-500 text-[10px] md:text-xs font-bold tracking-widest uppercase max-w-xs">Attempt a mock test to see your performance history here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <motion.div 
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6"
              >
                <div className="flex items-center gap-4 md:gap-6 w-full md:w-1/3">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 ${result.accuracy >= 70 ? 'bg-green-50 text-green-600' : result.accuracy >= 40 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                    <Trophy size={24} md:size={28} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base md:text-lg font-black text-gray-900 leading-tight mb-1 truncate">{result.tests?.title || "Mock Test"}</h3>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar size={10} md:size={12} />
                      <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">{new Date(result.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 md:gap-4 w-full md:w-1/2">
                  <div className="text-center">
                    <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Score</p>
                    <p className="text-sm md:text-xl font-black text-gray-900">{result.score}/{result.total_marks || result.total_items}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Accuracy</p>
                    <p className={`text-sm md:text-xl font-black ${result.accuracy >= 70 ? 'text-green-600' : result.accuracy >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>{result.accuracy}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Time</p>
                    <p className="text-sm md:text-xl font-black text-gray-900">{formatTime(result.time_taken)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                    <div className="flex justify-center">
                      {result.accuracy >= 70 ? (
                        <CheckCircle2 className="text-green-500" size={20} md:size={24} />
                      ) : (
                        <XCircle className="text-red-500" size={20} md:size={24} />
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleViewDetails(result.id)}
                  className="w-full md:w-auto bg-gray-50 hover:bg-gray-100 text-gray-600 px-6 py-3 rounded-xl md:rounded-2xl font-black tracking-widest uppercase text-[9px] md:text-[10px] flex items-center justify-center gap-2 transition-all"
                >
                  Details <ChevronRight size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
