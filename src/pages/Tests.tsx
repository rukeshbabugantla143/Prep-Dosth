import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Clock, FileText, ChevronRight, ShieldCheck, Trophy, Folder, ArrowLeft, Users, Zap, Layers, Globe } from "lucide-react";
import logo from "../assets/images/prepdosth-logo.png";

export default function Tests() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userCounts, setUserCounts] = useState<{[key: string]: number}>({});
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

        // Fetch Real User Counts from test_results
        const { data: resultsData } = await supabase.from("test_results").select("test_id, user_id");
        if (resultsData) {
          const counts: {[key: string]: Set<string>} = {};
          
          // Map test_id to its category
          const testToCat: {[key: string]: string} = {};
          data?.forEach(t => testToCat[t.id] = t.category || "Uncategorized");

          resultsData.forEach(r => {
            const cat = testToCat[r.test_id];
            if (cat) {
              if (!counts[cat]) counts[cat] = new Set();
              counts[cat].add(r.user_id);
            }
          });

          const finalCounts: {[key: string]: number} = {};
          Object.keys(counts).forEach(cat => finalCounts[cat] = counts[cat].size);
          setUserCounts(finalCounts);
        }
      } catch (err) {
        console.error("Error fetching tests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  // Group tests by category
  const categoriesMap = tests.reduce((acc: any, test: any) => {
    const cat = test.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(test);
    return acc;
  }, {});

  const categories = Object.keys(categoriesMap).sort();

  const filteredTests = selectedCategory 
    ? categoriesMap[selectedCategory] || [] 
    : [];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-2 uppercase leading-none">
              {selectedCategory ? selectedCategory : "Mock Assessments"}
            </h1>
            <p className="text-gray-500 font-bold tracking-widest uppercase text-[10px] md:text-xs">
              {selectedCategory 
                ? `Exploring mock tests in ${selectedCategory}` 
                : "Choose your favorite test series to begin."
              }
            </p>
          </div>
          
          <div className="flex gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
            {selectedCategory && (
              <button 
                onClick={() => setSelectedCategory(null)}
                className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 transition-all shadow-xl shadow-blue-600/5 group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Test Series
              </button>
            )}
            <div className="hidden md:flex bg-white p-4 rounded-3xl shadow-sm border border-gray-100 items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Trophy size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Live Series</p>
                <p className="text-xl font-black text-gray-900 leading-none">
                  {selectedCategory ? filteredTests.length : tests.length}
                </p>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-[1.5rem] h-96 border border-gray-100 animate-pulse shadow-sm"></div>
            ))}
          </div>
        ) : !selectedCategory ? (
          /* Level 1: Premium Test Series Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {categories.map(cat => {
              const testsInCategory = categoriesMap[cat];
              const categoryLogo = testsInCategory.find((t: any) => t.logo_url)?.logo_url;
              const freeCount = testsInCategory.filter((t: any) => t.is_free).length;
              const liveCount = testsInCategory.filter((t: any) => t.is_live).length;
              const chapterCount = testsInCategory.filter((t: any) => t.test_type === "Chapter Test").length;
              const caCount = testsInCategory.filter((t: any) => t.test_type === "CA Booster").length;
              const realUserCount = userCounts[cat] || 0;

              return (
                <div 
                  key={cat}
                  className="group bg-gradient-to-br from-white to-blue-50/30 rounded-[1.5rem] border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-600/10 transition-all duration-500 flex flex-col relative"
                >
                  <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600"></div>
                  {/* Header Section */}
                  <div className="p-4 pb-2">
                    <div className="flex justify-between items-start mb-2">
                      <div className={`w-11 h-11 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform p-1`}>
                        <img src={categoryLogo || logo} alt={cat} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-300 to-orange-400 text-white px-3 py-1 rounded-full shadow-sm">
                        <Users size={12} className="fill-white" />
                        <span className="text-[9px] font-black uppercase tracking-tight">
                          {realUserCount > 0 ? `${realUserCount} Students` : "Join Now"}
                        </span>
                      </div>
                    </div>
                    
                    <h2 className="text-[17px] font-black text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem] group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                      {cat} Mock Test Series 2026
                    </h2>
                  </div>

                  {/* Stats Summary Section */}
                  <div className="px-5 py-2 bg-blue-50/30 border-y border-gray-50 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-900">{testsInCategory.length} Total Tests</span>
                    <span className="text-[10px] font-bold text-green-600">{freeCount} Free Tests</span>
                  </div>

                  {/* Info Pills */}
                  <div className="px-5 py-2 flex items-center gap-2">
                    <Globe size={11} className="text-blue-400" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">English, Telugu, Hindi</span>
                  </div>

                  {/* Bulleted List Section */}
                  <div className="px-5 py-2 space-y-2 mb-3 bg-white flex-1">
                    {liveCount > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-md bg-pink-50 flex items-center justify-center">
                          <Zap size={10} className="text-pink-600 fill-pink-600" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">{liveCount} Live {cat} Tests</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-md bg-orange-50 flex items-center justify-center">
                        <Layers size={10} className="text-orange-600" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">{chapterCount || 0} Chapter Tests</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center">
                        <FileText size={10} className="text-blue-600" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">{caCount || 0} CA Booster</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-green-600 uppercase tracking-widest pl-8 leading-none mt-1">Real-time Data</span>
                    </div>
                  </div>

                  {/* Footer Action Button */}
                  <button 
                    onClick={() => navigate(`/user/series/${encodeURIComponent(cat)}`)}
                    className="w-full bg-gradient-to-r from-[#0ea5e9] via-[#38bdf8] to-[#0ea5e9] bg-[length:200%_100%] hover:bg-right text-white py-4 font-black uppercase text-[11px] tracking-widest transition-all duration-500 active:scale-95 shadow-inner"
                  >
                    View All Tests
                  </button>
                </div>
              )
            })}
            
            {categories.length === 0 && (
              <div className="col-span-full bg-white rounded-[2.5rem] p-20 border border-dashed border-gray-200 flex flex-col items-center text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6">
                  <Folder size={40} className="text-gray-300" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase">No Series Found</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-xs">The administrator hasn't established any test series yet.</p>
              </div>
            )}
          </div>
        ) : (
          /* Level 2: Filtered Tests (Perfected Premium Inner Cards) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {filteredTests.map(test => {
              const now = new Date();
              const start = test.start_date ? new Date(test.start_date) : new Date();
              const end = test.end_date ? new Date(test.end_date) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
              
              const isFuture = now < start;
              const isExpired = now > end;
              const isLive = !isFuture && !isExpired;

              const startStr = start.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
              const endStr = end.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });

              return (
                <div key={test.id} className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 flex flex-col relative ${isExpired ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                  {/* Subtle color highlight on hover */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex items-center gap-4 p-4 pb-0.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:border-blue-200 transition-all p-1 overflow-hidden shrink-0">
                      <img src={test.logo_url || logo} alt={test.title} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        {isFuture ? (
                          <div className="bg-blue-500 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight shadow-md shadow-blue-100 w-fit">
                            Coming Soon
                          </div>
                        ) : isLive && test.is_live ? (
                          <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded shadow-lg shadow-red-100 w-fit">
                            <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                            <span className="text-[9px] font-black uppercase tracking-tight">Live Test</span>
                          </div>
                        ) : isExpired ? (
                          <div className="bg-gray-400 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight shadow-sm w-fit">
                            Ended
                          </div>
                        ) : null}
                        {test.is_free && (
                          <div className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase shadow-lg shadow-emerald-100 w-fit">
                            Free
                          </div>
                        )}
                      </div>
                      <h2 className="text-[14px] font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1 truncate uppercase tracking-tight">
                        {test.title}
                      </h2>
                    </div>
                  </div>

                  <div className="px-5 pb-5 flex flex-col flex-1">
                    {/* Compact Stats Row with soft coloring */}
                    <div className="flex items-center gap-3 text-gray-400 mb-5 border-t border-gray-50 pt-4 mt-1">
                      <div className="flex items-center gap-1.5 group/stat">
                        <div className="w-5 h-5 bg-blue-50 rounded flex items-center justify-center text-blue-500 group-hover/stat:bg-blue-600 group-hover/stat:text-white transition-all">
                          <FileText size={10} />
                        </div>
                        <span className="text-[10px] font-black tracking-tight uppercase group-hover/stat:text-blue-600 transition-colors">{test.questions?.length || 0} Questions</span>
                      </div>
                      <span className="opacity-10 text-xs text-gray-300">|</span>
                      <div className="flex items-center gap-1.5 group/stat">
                        <div className="w-5 h-5 bg-emerald-50 rounded flex items-center justify-center text-emerald-500 group-hover/stat:bg-emerald-500 group-hover/stat:text-white transition-all">
                          <Clock size={10} />
                        </div>
                        <span className="text-[10px] font-black tracking-tight uppercase group-hover/stat:text-emerald-500 transition-colors">{test.timeLimit} Min.</span>
                      </div>
                      <span className="opacity-10 text-xs text-gray-300">|</span>
                      <div className="flex items-center gap-1.5 group/stat">
                        <div className="w-5 h-5 bg-amber-50 rounded flex items-center justify-center text-amber-500 group-hover/stat:bg-amber-500 group-hover/stat:text-white transition-all">
                          <Trophy size={10} />
                        </div>
                        <span className="text-[10px] font-black tracking-tight uppercase group-hover/stat:text-amber-500 transition-colors">{test.total_marks || 100} Marks</span>
                      </div>
                    </div>

                    {/* Availability + Action Row */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2 text-gray-400/80">
                        <Clock size={16} className={`opacity-40 ${isLive ? 'text-blue-500' : ''}`} />
                        <span className={`text-[10px] font-black ${isLive ? 'text-blue-600' : 'text-gray-400'} tracking-widest uppercase`}>
                          {startStr}
                        </span>
                      </div>
                      
                      <div className="relative z-10">
                        {user ? (
                          <button 
                            onClick={() => isLive && startTest(test.id)}
                            disabled={!isLive}
                            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-500 shadow-xl ${
                              isFuture 
                                ? 'bg-blue-50 text-blue-400 cursor-not-allowed border border-blue-100'
                                : isExpired
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-blue-200 hover:scale-105 active:scale-95'
                            }`}
                          >
                            {isFuture ? 'SOON' : isExpired ? 'EXPIRED' : 'START TEST'}
                          </button>
                        ) : (
                          <button 
                            onClick={() => navigate("/login")}
                            className="bg-gray-50 text-gray-400 px-5 py-2.5 rounded-xl font-black text-[10px] border border-gray-100 uppercase tracking-widest transition-all hover:bg-gray-100"
                          >
                            Login
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer Section */}
                  <div className="px-5 py-3 bg-gray-50/40 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button className="text-[#00bcd4] text-[11px] font-bold hover:underline">Syllabus</button>
                      <span className="text-gray-200 text-xs">|</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe size={13} className="text-gray-300" />
                      <span className="text-[10px] font-bold text-gray-400 tracking-tight">{test.languages || "English, Hindi + 4 More"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredTests.length === 0 && (
              <div className="col-span-full bg-white rounded-[2.5rem] p-20 border border-dashed border-gray-200 flex flex-col items-center text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6">
                  <FileText size={40} className="text-gray-300" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase">No Tests Found</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-xs">No mock tests have been uploaded to this category yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
