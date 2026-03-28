import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Clock, FileText, ChevronRight, ShieldCheck, Trophy, Target } from "lucide-react";

export default function Tests() {
  const [tests, setTests] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTests = async () => {
      const { data, error } = await supabase.from("tests").select("*");
      if (data) setTests(data);
      if (error) console.error("Error fetching tests:", error);
    };
    fetchTests();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-2">MOCK TESTS</h1>
            <p className="text-gray-500 font-bold tracking-widest uppercase text-xs md:text-sm">Simulate real exam environments and boost your score.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Trophy size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Tests</p>
                <p className="text-xl font-black text-gray-900">{tests.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tests.map(test => (
            <div key={test.id} className="group bg-white rounded-[2rem] border border-gray-200 overflow-hidden hover:shadow-2xl hover:shadow-blue-600/10 transition-all duration-500 flex flex-col">
              <div className="p-8 flex-grow">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="text-white" size={24} />
                  </div>
                  <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Premium</span>
                </div>
                
                <h2 className="text-2xl font-black text-gray-900 mb-4 leading-tight group-hover:text-blue-600 transition-colors">{test.title}</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Clock size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Duration</span>
                    </div>
                    <p className="text-lg font-black text-gray-900">{test.timeLimit}m</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <FileText size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Items</span>
                    </div>
                    <p className="text-lg font-black text-gray-900">{test.questions?.length || 0}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {["Full Length Mock Test", "Real Exam Interface", "Detailed Analytics"].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-bold text-gray-500">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                {user ? (
                  <Link 
                    to={`/user/test/${test.id}`} 
                    className="w-full flex items-center justify-center gap-2 bg-[#0f172a] hover:bg-blue-600 text-white py-4 rounded-2xl font-black tracking-widest uppercase text-xs transition-all shadow-lg"
                  >
                    Start Assessment
                    <ChevronRight size={16} />
                  </Link>
                ) : (
                  <Link 
                    to="/login" 
                    className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-400 py-4 rounded-2xl font-black tracking-widest uppercase text-xs hover:border-blue-600 hover:text-blue-600 transition-all"
                  >
                    Login to Unlock
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
