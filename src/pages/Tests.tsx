import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Clock, FileText, ChevronRight, ShieldCheck, Trophy, Target } from "lucide-react";

export default function Tests() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const startTest = (testId: string) => {
    if (!testId || testId === "undefined") {
      console.error("Tests: Cannot start test - Invalid Test ID");
      return;
    }
    navigate(`/user/test/${testId}`);
  };

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from("tests").select("*").order("created_at", { ascending: false });
        if (data) setTests(data);
        if (error) throw error;
      } catch (err) {
        console.error("Error fetching tests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-2 uppercase">Mock Assessments</h1>
            <p className="text-gray-500 font-bold tracking-widest uppercase text-[10px] md:text-xs">Select a test to begin your preparation journey.</p>
          </div>
          <div className="hidden md:flex gap-4">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Trophy size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Available</p>
                <p className="text-xl font-black text-gray-900 leading-none">{tests.length}</p>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[2.5rem] h-80 border border-gray-100 animate-pulse shadow-sm"></div>
            ))}
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 border border-dashed border-gray-200 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6">
              <FileText size={40} className="text-gray-300" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase">No Tests Found</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-xs">The administrator hasn't posted any mock tests yet. Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tests.map(test => (
              <div key={test.id} className="group bg-white rounded-[2.5rem] border border-gray-100 p-8 hover:shadow-2xl hover:shadow-blue-600/10 transition-all duration-500 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="text-white" size={24} />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Premium</span>
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                       <Clock size={12} /> {test.timeLimit}m
                    </div>
                  </div>
                </div>
                
                <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-6 leading-tight min-h-[3.5rem] line-clamp-2">{test.title}</h2>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Questions</span>
                    <span className="text-xs font-black text-gray-900">{test.questions?.length || 0} ITEMS</span>
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  {user ? (
                    <button 
                      onClick={() => startTest(test.id)}
                      className="w-full bg-[#0f172a] hover:bg-blue-600 text-white py-4 rounded-2xl font-black tracking-widest uppercase text-[10px] transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2 group-hover:-translate-y-1"
                    >
                      Start Exam
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate("/login")}
                      className="w-full bg-gray-50 text-gray-400 py-4 rounded-2xl font-black tracking-widest uppercase text-[10px] border border-gray-200"
                    >
                      Login to Attempt
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
