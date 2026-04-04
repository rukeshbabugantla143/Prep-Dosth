import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import { 
  ChevronRight, 
  Trophy, 
  Users, 
  Globe, 
  Zap, 
  Layers, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Search,
  LayoutDashboard,
  ShieldCheck,
  Calendar,
  MoreHorizontal,
  Home as HomeIcon,
  HelpCircle,
  Phone,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import logo from "../../assets/images/prepdosth-logo.png";

type TestType = 'All' | 'Live' | 'Chapter' | 'Sectional' | 'Full';
type MainTab = 'Mock Tests' | 'PYPs' | 'PRO';

export default function TestSeriesDetails() {
  const { category: encodedCategory } = useParams();
  const category = decodeURIComponent(encodedCategory || "");
  const navigate = useNavigate();
  
  const [tests, setTests] = useState<any[]>([]);
  const [otherSeries, setOtherSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<MainTab>('Mock Tests');
  const [subTab, setSubTab] = useState<TestType>('All');
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all tests for this category
        const { data: testsData, error: testsError } = await supabase
          .from("tests")
          .select("*")
          .eq("category", category)
          .order("created_at", { ascending: false });
        
        if (testsData) setTests(testsData);
        if (testsError) throw testsError;

        // Fetch other series for sidebar
        const { data: categoriesData } = await supabase
          .from("tests")
          .select("category, logo_url")
          .neq("category", category)
          .limit(20);
        
        if (categoriesData) {
          const uniqueCats = Array.from(new Set(categoriesData.map(t => t.category)))
            .map(cat => ({
              name: cat,
              logo: categoriesData.find(t => t.category === cat)?.logo_url,
              count: 0 // We can calculate this if needed
            }))
            .slice(0, 5);
          setOtherSeries(uniqueCats);
        }

      } catch (err) {
        console.error("Error fetching series details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [category]);

  const uniqueBranches = useMemo(() => {
    const branches = new Set<string>();
    tests.forEach(test => {
      if (test.branch) branches.add(test.branch);
    });
    return ['All', ...Array.from(branches).sort()];
  }, [tests]);

  const filteredTests = useMemo(() => {
    let result = tests.filter(test => {
      // Main Tab Filtering (Mock Tests vs PYPs)
      if (mainTab === 'PYPs' && !test.is_pyp) return false;
      if (mainTab === 'Mock Tests' && test.is_pyp) return false;

      // Sub Tab Filtering
      if (subTab === 'Live' && !test.is_live) return false;
      if (subTab === 'Chapter' && test.test_type !== 'Chapter Test') return false;
      if (subTab === 'Sectional' && test.test_type !== 'Sectional Test') return false;
      if (subTab === 'Full' && test.test_type !== 'Full Test') return false;

      // Branch Filtering
      if (selectedBranch !== 'All' && test.branch !== selectedBranch) return false;

      // Search Query
      if (searchQuery && !test.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      return true;
    });
    return result;
  }, [tests, mainTab, subTab, selectedBranch, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: tests.length,
      free: tests.filter(t => t.is_free).length,
      live: tests.filter(t => t.is_live).length,
      chapter: tests.filter(t => t.test_type === 'Chapter Test').length,
      sectional: tests.filter(t => t.test_type === 'Sectional Test').length,
      full: tests.filter(t => t.test_type === 'Full Test').length,
      ca: tests.filter(t => t.test_type === 'CA Booster').length
    };
  }, [tests]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20">
      {/* 1. Breadcrumbs Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          <Link to="/" className="hover:text-blue-600 flex items-center gap-1">
            <HomeIcon size={12} /> Home
          </Link>
          <ChevronRight size={10} />
          <Link to="/tests" className="hover:text-blue-600">Mock Tests</Link>
          <ChevronRight size={10} />
          <span className="text-gray-900">{category}</span>
        </div>
      </div>

      {/* 2. Main Hero Section */}
      <div className="bg-white px-4 pt-8 pb-12 shadow-sm relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl -mr-48 -mt-48 opacity-60"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-blue-100 flex items-center justify-center p-3 border border-gray-50">
                  <img src={tests[0]?.logo_url || logo} alt={category} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight uppercase">
                    {category} Mock Test Series 2026
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border border-blue-100">
                      <Clock size={12} /> Last updated on {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Pills */}
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 text-gray-500 font-bold border-r pr-4 border-gray-200 last:border-0 h-4">
                  <FileText size={14} className="text-blue-500" />
                  <span className="text-xs uppercase tracking-tight">{stats.total} Total Tests</span>
                </div>
                <div className="flex items-center gap-2 font-bold border-r pr-4 border-gray-200 last:border-0 h-4">
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span className="text-xs uppercase tracking-tight text-green-600">{stats.free} Free Tests</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 font-bold border-r pr-4 border-gray-200 last:border-0 h-4 text-xs font-black">
                  <Users size={14} className="text-orange-500" />
                  <span className="text-xs uppercase tracking-tight">{(Math.random() * 500 + 100).toFixed(1)}k Users</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 font-bold h-4">
                  <Globe size={14} className="text-indigo-500" />
                  <span className="text-xs uppercase tracking-tight">English, Telugu, Hindi</span>
                </div>
              </div>

              {/* Summary Type Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 max-w-4xl">
                {[
                  { label: "Live Test", count: stats.live, icon: <Zap size={14} /> },
                  { label: "Chapter Test", count: stats.chapter, icon: <Layers size={14} /> },
                  { label: "CA Booster", count: stats.ca, icon: <Trophy size={14} /> },
                  { label: "Sectional Test", count: stats.sectional, icon: <FileText size={14} /> },
                  { label: "Full Test", count: stats.full, icon: <LayoutDashboard size={14} /> }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 group-hover:text-blue-600 shadow-sm border border-gray-50 transition-colors">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-black leading-none mb-1 text-gray-900 uppercase">{item.count}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>


              <div className="mt-10">
              </div>
            </div>

            {/* Sidebar Overview (Inspired by image but without phone number) */}
            <div className="w-full lg:w-[320px] pt-4">
               <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                  <h3 className="text-lg font-black tracking-tight leading-tight mb-4 uppercase">Unlock Full Performance Analysis!</h3>
                  <p className="text-white/70 text-xs font-medium leading-relaxed mb-6">
                    Join {(Math.random() * 500 + 100).toFixed(1)}k+ students who already use PrepDosth for their dream job preparation.
                  </p>
                  <button onClick={() => navigate('/register')} className="w-full bg-white text-blue-600 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-50 transition-colors active:scale-95">
                    Start Prep For Free
                  </button>
                  <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                    <ShieldCheck size={12} /> Trusted by students
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 3. Main Content List Area */}
          <div className="flex-1">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase mb-8 flex items-center gap-3">
               {category} All Tests <span className="bg-gray-100 text-gray-400 px-3 py-1 rounded-lg text-sm">{stats.total}</span>
            </h2>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
              {(['Mock Tests', 'PYPs', 'PRO'] as MainTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setMainTab(tab)}
                  className={`px-8 py-4 text-[11px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
                    mainTab === tab ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab}
                  {mainTab === tab && (
                    <motion.div layoutId="mainTab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-lg shadow-blue-100" />
                  )}
                </button>
              ))}
            </div>

            {/* Sub Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-4 p-1.5 bg-white rounded-2xl border border-gray-100 shadow-sm md:w-fit">
              {(['All', 'Live', 'Chapter', 'Sectional', 'Full'] as TestType[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSubTab(tab)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    subTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Branch Filter Row */}
            {uniqueBranches.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 mb-8 animate-in fade-in slide-in-from-left-2 duration-500">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mr-2">Filter by Branch:</span>
                {uniqueBranches.map(branch => (
                  <button
                    key={branch}
                    onClick={() => setSelectedBranch(branch)}
                    className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${
                      selectedBranch === branch 
                        ? 'bg-gray-900 text-white border-transparent shadow-md' 
                        : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    {branch}
                  </button>
                ))}
              </div>
            )}

            {/* Test List */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredTests.map((test, idx) => (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-[2rem] border border-gray-100 shadow-md hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-500 p-6 group flex flex-col md:flex-row items-center gap-6 relative overflow-hidden"
                  >
                    {/* Interactive background glow on hover */}
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="shrink-0 w-16 h-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl flex items-center justify-center p-2 border border-gray-100 group-hover:border-blue-200 group-hover:scale-110 transition-all duration-500 shadow-sm">
                      <img src={test.logo_url || logo} alt={test.title} className="w-full h-full object-contain" />
                    </div>

                    <div className="flex-1 w-full text-center md:text-left">
                       <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                          {test.is_live && (
                            <div className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-lg shadow-red-100">
                              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> Live
                            </div>
                          )}
                          {test.is_free && (
                            <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-lg shadow-emerald-100">
                              Free
                            </div>
                          )}
                          {test.branch && (
                            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-lg shadow-blue-100">
                               {test.branch}
                            </div>
                          )}
                          <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-indigo-100">
                             {test.test_type || "Mock Test"}
                          </div>
                       </div>
                       
                       <h3 className="text-lg md:text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors mb-3 leading-tight tracking-tight uppercase">
                         {test.title}
                       </h3>

                       <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2">
                          <div className="flex items-center gap-2 group/stat">
                             <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 group-hover/stat:bg-blue-600 group-hover/stat:text-white transition-all">
                               <HelpCircle size={14} />
                             </div>
                             <span className="text-[11px] font-black text-gray-400 group-hover/stat:text-blue-600 uppercase tracking-tight transition-colors">{test.questions?.length || 0} Questions</span>
                          </div>
                          <div className="flex items-center gap-2 group/stat">
                             <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 group-hover/stat:bg-amber-500 group-hover/stat:text-white transition-all">
                               <Trophy size={14} />
                             </div>
                             <span className="text-[11px] font-black text-gray-400 group-hover/stat:text-amber-500 uppercase tracking-tight transition-colors">{test.total_marks || 100} Marks</span>
                          </div>
                          <div className="flex items-center gap-2 group/stat">
                             <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500 group-hover/stat:bg-emerald-500 group-hover/stat:text-white transition-all">
                               <Clock size={14} />
                             </div>
                             <span className="text-[11px] font-black text-gray-400 group-hover/stat:text-emerald-500 uppercase tracking-tight transition-colors">{test.timeLimit} Minutes</span>
                          </div>
                       </div>
                       
                       <div className="mt-4 flex items-center justify-center md:justify-start gap-2 text-gray-400">
                          <Globe size={11} className="text-blue-400" />
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{test.languages || 'English, Telugu, Hindi'}</span>
                       </div>
                    </div>

                    <div className="shrink-0 w-full md:w-auto">
                      <button 
                        onClick={() => navigate(`/user/test/${test.id}`)}
                        className="w-full md:w-[180px] bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-blue-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group/btn"
                      >
                        Start Now <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredTests.length === 0 && (
                <div className="bg-white rounded-[2rem] p-20 border border-dashed border-gray-200 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                    <Search size={32} className="text-gray-300" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 uppercase">No Tests Found</h3>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2">Try adjusting your filters or search query.</p>
                </div>
              )}
            </div>
          </div>

          {/* 4. Sidebar: More Series + Support */}
          <aside className="w-full lg:w-[320px] space-y-8">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
               <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase mb-6 flex items-center gap-2">
                 More Series <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
               </h3>
               <div className="space-y-6">
                 {otherSeries.map((series, i) => (
                    <Link 
                      key={i} 
                      to={`/user/series/${encodeURIComponent(series.name)}`}
                      className="flex items-center gap-4 group"
                    >
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center p-1.5 border border-gray-50 group-hover:border-blue-200 group-hover:bg-white transition-all shadow-sm">
                        <img src={series.logo || logo} alt={series.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-black text-gray-900 uppercase truncate group-hover:text-blue-600 transition-colors leading-tight">{series.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Mock test series</p>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-600 transition-all translate-x-0 group-hover:translate-x-1" />
                    </Link>
                 ))}
               </div>
               <button onClick={() => navigate('/tests')} className="w-full mt-8 text-[10px] font-black uppercase text-blue-600 tracking-widest hover:underline">View All Series</button>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
               <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase mb-2">Need Support?</h3>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 leading-relaxed">Our experts are available to guide your preparation journey 24/7.</p>
               <div className="space-y-4">
                  <a href="tel:+910000000000" className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-white border border-transparent hover:border-gray-100 transition-all group">
                     <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                        <Phone size={18} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-gray-900 uppercase">Call Us</p>
                        <p className="text-[9px] font-bold text-gray-400 tracking-wider">+91 000 000 0000</p>
                     </div>
                  </a>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-white border border-transparent hover:border-gray-100 transition-all group">
                     <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                        <HelpCircle size={18} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-gray-900 uppercase">24/7 Support</p>
                        <p className="text-[9px] font-bold text-gray-400 tracking-wider">support@prepdosth.com</p>
                     </div>
                  </div>
               </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
