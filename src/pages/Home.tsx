import React, { useState, useEffect, Suspense, lazy, useMemo } from "react";
import { supabase } from "../services/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { slugify } from "../utils";
import { Search, Users, Award, BookOpen, PlayCircle, ChevronRight, CheckCircle2, FileText, Clock, Calendar, Video, ArrowRight } from "lucide-react";
import { CardSkeleton, CategorySkeleton, Skeleton } from "../components/common/Skeleton";
import { format, differenceInDays, isBefore, startOfDay } from "date-fns";
import SEO from "../components/common/SEO";

export default function Home() {
  const [tests, setTests] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [latestExams, setLatestExams] = useState<any[]>([]);
  const [allExams, setAllExams] = useState<any[]>([]);
  const [heroes, setHeroes] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [categories, setCategories] = useState<{ name: string; count: number; icon: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const dynamicCategories = useMemo(() => {
    if (allExams.length === 0) return [];
    const counts = allExams.reduce((acc: any, exam: any) => {
      if (exam.category) {
        acc[exam.category] = (acc[exam.category] || 0) + 1;
      }
      return acc;
    }, {});
    
    const iconMap: Record<string, string> = {
      "SSC Exams": "🏛️",
      "Banking Exams": "🏦",
      "Teaching Exams": "👩‍🏫",
      "Civil Services": "⚖️",
      "Railway Exams": "🚂",
      "Engineering": "⚙️",
      "Defence Exams": "🛡️",
      "State Exams": "🗺️"
    };

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count: `${count}+ Exams`,
      icon: iconMap[name] || "📚"
    }));
  }, [allExams]);

  useEffect(() => {
    const fetchData = async () => {
      // Start fetching critical data first
      const [heroRes, sectionsRes] = await Promise.all([
        supabase.from("hero_section").select("*").order('id', { ascending: true }),
        supabase.from("sections").select("*").order('id', { ascending: true }),
      ]);
      
      if (heroRes.data) setHeroes(heroRes.data);
      if (sectionsRes.data) setSections(sectionsRes.data);
      
      // Fetch other data in parallel
      const [testsRes, jobsRes, examsRes] = await Promise.all([
        supabase.from("tests").select("*").limit(4),
        supabase.from("jobs").select("*").eq('is_subpage', false).limit(4),
        supabase.from("exams").select("id, category").eq('is_subpage', false),
      ]);

      if (testsRes.data) setTests(testsRes.data);
      if (jobsRes.data) setJobs(jobsRes.data);
      if (examsRes.data) setAllExams(examsRes.data);
      
      const { data: latestExamsData } = await supabase.from("exams").select("*").eq('is_subpage', false).order('date', { ascending: false }).limit(3);
      if (latestExamsData) setLatestExams(latestExamsData);

      const { data: statsData } = await supabase.from("home_stats").select("*").order("order_index", { ascending: true });
      if (statsData && statsData.length > 0) setStats(statsData);
      
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (heroes.length > 1) {
      const interval = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % heroes.length);
      }, 5000); // Change slide every 5 seconds
      return () => clearInterval(interval);
    }
  }, [heroes]);
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/exams?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const examCategories = [
    { name: "SSC Exams", count: "10+ Exams", icon: "🏛️" },
    { name: "Banking Exams", count: "15+ Exams", icon: "🏦" },
    { name: "Teaching Exams", count: "20+ Exams", icon: "👩‍🏫" },
    { name: "Civil Services", count: "5+ Exams", icon: "⚖️" },
    { name: "Railways Exams", count: "8+ Exams", icon: "🚂" },
    { name: "Engineering", count: "12+ Exams", icon: "⚙️" },
    { name: "Defence Exams", count: "10+ Exams", icon: "🛡️" },
    { name: "State Exams", count: "50+ Exams", icon: "🗺️" },
  ];

  if (loading && heroes.length === 0) {
    return (
      <div className="w-full font-sans">
        <section className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] xl:h-[80vh]">
          <Skeleton className="w-full h-full" />
        </section>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        </section>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full font-sans">
      <SEO 
        title="Home" 
        description="PrepDosth - Your ultimate destination for Exam Preparation, Job Notifications, and Mock Tests in Telangana and Andhra Pradesh."
      />
      {/* Hero Section */}
      {heroes.length > 0 ? (
        <section className="relative w-full overflow-hidden h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] xl:h-[80vh]">
          {heroes.map((hero, index) => (
            <div 
              key={hero.id} 
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentHeroIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              {hero.image ? (
                <img 
                  src={hero.image} 
                  className="w-full h-full object-cover md:object-fill lg:object-cover" 
                  alt={hero.title || "Hero Image"} 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <div className="w-full h-full bg-[#0b1b3d] flex items-center justify-center">
                  <span className="text-white/20 text-2xl font-bold">No Image</span>
                </div>
              )}
            </div>
          ))}
          
          {/* Slider Indicators */}
          {heroes.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {heroes.map((hero, idx) => (
                <button 
                  key={hero.id} 
                  onClick={() => setCurrentHeroIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentHeroIndex ? 'bg-[#15b86c] w-8' : 'bg-white/50 hover:bg-white'}`}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="bg-[#0b1b3d] text-white pt-16 pb-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black">Loading...</h1>
          </div>
        </section>
      )}

      {/* Stats Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {(stats.length > 0 ? stats : [
            { id: 1, icon: 'Users', value: '3.1 Crore+', label: 'Students Trusted' },
            { id: 2, icon: 'Award', value: '1 Lakh+', label: 'Selections' },
            { id: 3, icon: 'BookOpen', value: '70,000+', label: 'Mock Tests' },
            { id: 4, icon: 'PlayCircle', value: '10,000+', label: 'Video Lessons' }
          ]).map((stat: any) => {
            const IconComponent = (stat.icon === 'Users' ? Users : 
                                  stat.icon === 'Award' ? Award : 
                                  stat.icon === 'BookOpen' ? BookOpen : 
                                  stat.icon === 'PlayCircle' ? PlayCircle : 
                                  stat.icon === 'Calendar' ? Calendar : 
                                  stat.icon === 'Video' ? Video : Users);
            
            return (
              <div key={stat.id} className="space-y-2">
                <div className="flex justify-center text-[#15b86c]">
                  <IconComponent size={32} />
                </div>
                <h3 className="text-2xl font-black text-gray-800 tracking-tight">{stat.value}</h3>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </section>


      {/* Exam Notifications */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-50 rounded-2xl">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Exam Notifications</h2>
            <p className="text-gray-600 font-medium">Stay updated with the latest exam dates</p>
          </div>
          <Link to="/exams" className="hidden md:flex items-center text-[#15b86c] font-bold hover:underline">
            View All <ChevronRight size={20} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading && latestExams.length === 0 ? (
            [1, 2, 3].map(i => <CardSkeleton key={`skeleton-exam-${i}`} />)
          ) : (
            latestExams.map((exam, idx) => {
              const examDate = new Date(exam.date);
              const today = startOfDay(new Date());
              const daysLeft = differenceInDays(startOfDay(examDate), today);
              const isPast = isBefore(startOfDay(examDate), today);

              const parsedDescription = (() => {
                try {
                  return exam.description?.startsWith('{') ? JSON.parse(exam.description) : {};
                } catch(e) { return {}; }
              })();
              const logo = parsedDescription.logo_url;

              return (
                <div key={exam.id || `exam-${idx}`} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[180px] relative group overflow-hidden">
                  {/* Badges */}
                  <div className="absolute top-3 right-3 flex flex-wrap gap-1 justify-end max-w-[60%]">
                    {parsedDescription.badges?.map((badge: any, i: number) => {
                      const badgeText = typeof badge === 'string' ? badge : badge.text;
                      const badgeColor = typeof badge === 'string' ? 'emerald' : badge.color;
                      const colorClass = 
                        badgeColor === 'emerald' ? 'bg-[#15b86c]' :
                        badgeColor === 'ruby' ? 'bg-[#d00000]' :
                        badgeColor === 'sky' ? 'bg-[#0ea5e9]' :
                        badgeColor === 'amber' ? 'bg-[#f59e0b]' :
                        badgeColor === 'violet' ? 'bg-[#8b5cf6]' : 'bg-[#15b86c]';
                      
                      return (
                        <span key={i} className={`${colorClass} text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm`}>
                          {badgeText}
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex-grow">
                    <div className="flex gap-4 items-start mb-4">
                      {logo ? (
                        <div className="w-14 h-14 min-w-[56px] rounded-xl overflow-hidden bg-gray-50 border border-gray-100 p-1 group-hover:scale-105 transition-transform duration-300">
                          <img src={logo} alt={exam.title} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 min-w-[56px] rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 transition-transform duration-300 group-hover:scale-105">
                          <BookOpen size={24} />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#15b86c] transition-colors line-clamp-2">{exam.title}</h3>
                        <p className="text-gray-400 text-sm font-medium">
                          {exam.category || 'Entrance Exam'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex flex-col justify-end">
                      <p className="text-gray-500 text-sm font-medium mb-1">
                        Exam Date: {format(examDate, 'dd MMM yyyy')}
                      </p>
                      <div className="flex justify-between items-end">
                        <p className={`font-black text-lg ${isPast ? 'text-gray-400' : 'text-[#d00000]'}`}>
                          {isPast ? 'Expired' : (daysLeft === 0 ? 'Exam Today' : `${daysLeft} days left`)}
                        </p>
                        <Link to={`/exams/${slugify(exam.title)}`} className="text-[#15b86c] font-black text-sm hover:underline tracking-tight flex items-center gap-1">
                          View Details <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Exam Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Explore Exams</h2>
            <p className="text-gray-600 font-medium">Find the right exam for your career</p>
          </div>
          <Link to="/exams" className="hidden md:flex items-center text-[#15b86c] font-bold hover:underline">
            View All <ChevronRight size={20} />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {loading && dynamicCategories.length === 0 ? (
            [1, 2, 3, 4, 5, 6, 7, 8].map(i => <CategorySkeleton key={`skeleton-cat-${i}`} />)
          ) : (
            dynamicCategories.map((cat, idx) => (
              <Link key={cat.name || idx} to={`/exams?category=${encodeURIComponent(cat.name)}`} className="bg-white border border-gray-200 p-6 rounded-2xl hover:shadow-lg hover:border-[#15b86c] transition group flex flex-col items-center text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{cat.icon}</div>
                <h3 className="font-bold text-gray-800 mb-1">{cat.name}</h3>
                <p className="text-sm text-gray-500 font-medium">{cat.count}</p>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Trending Test Series */}
      <section className="bg-gray-50 py-20 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Trending Test Series</h2>
              <p className="text-gray-600 font-medium">Practice with the best mock tests</p>
            </div>
            <Link to="/tests" className="flex items-center text-[#15b86c] font-bold hover:underline">
              View All <ChevronRight size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading && tests.length === 0 ? (
              [1, 2, 3, 4].map(i => <CardSkeleton key={`skeleton-test-${i}`} />)
            ) : tests.length > 0 ? (
              tests.map((test, idx) => (
                <div key={test.id || `test-${idx}`} className="group bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-500 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-50 to-white rounded-2xl flex items-center justify-center p-2 border border-gray-100 group-hover:border-blue-200 group-hover:scale-110 transition-all duration-500 mb-6 shadow-sm">
                    {test.logo_url ? (
                      <img src={test.logo_url} alt={test.title} className="w-full h-full object-contain" />
                    ) : (
                      <FileText size={24} className="text-blue-600" />
                    )}
                  </div>
                  
                  <h3 className="text-lg font-black text-gray-900 mb-3 line-clamp-2 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{test.title}</h3>
                  
                  <div className="space-y-3 mb-8 flex-grow">
                    <div className="flex items-center gap-3 group/item">
                      <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all">
                        <CheckCircle2 size={12} />
                      </div>
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-tight group-hover/item:text-emerald-600 transition-colors">Multiple Mock Tests</p>
                    </div>
                    <div className="flex items-center gap-3 group/item">
                      <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all">
                        <Clock size={12} />
                      </div>
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-tight group-hover/item:text-blue-600 transition-colors">{test.timeLimit} Minutes Duration</p>
                    </div>
                  </div>

                  <Link to={`/user/test/${test.id}`} className="w-full block text-center bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    Start Free Test
                  </Link>
                </div>
              ))
            ) : (
              // Placeholders if no tests exist
              [1, 2, 3, 4].map(i => (
                <div key={`no-test-${i}`} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
                  <div className="bg-gray-100 w-12 h-12 rounded-xl mb-4 animate-pulse"></div>
                  <div className="h-6 bg-gray-100 rounded w-3/4 mb-4 animate-pulse"></div>
                  <div className="space-y-2 mb-6 flex-grow">
                    <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse"></div>
                  </div>
                  <div className="h-10 bg-gray-100 rounded-lg w-full animate-pulse"></div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* SuperCoaching / Latest Jobs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Latest Job Notifications</h2>
            <p className="text-gray-600 font-medium">Stay updated with recent government job openings</p>
          </div>
          <Link to="/jobs" className="flex items-center text-[#15b86c] font-bold hover:underline">
            View All <ChevronRight size={20} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading && jobs.length === 0 ? (
            [1, 2, 3, 4].map(i => <CardSkeleton key={`skeleton-job-${i}`} />)
          ) : jobs.length > 0 ? (
            jobs.map((job, idx) => {
              const parsedDescription = (() => {
                try {
                  return job.description?.startsWith('{') ? JSON.parse(job.description) : {};
                } catch(e) { return {}; }
              })();
              const logo = parsedDescription.logo_url;

              return (
                <div key={job.id || `job-${idx}`} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition flex flex-col relative group overflow-hidden min-h-[280px]">
                  {/* Badges */}
                  <div className="absolute top-3 right-3 flex flex-wrap gap-1 justify-end max-w-[60%]">
                    {parsedDescription.badges?.map((badge: any, i: number) => {
                      const badgeText = typeof badge === 'string' ? badge : badge.text;
                      const badgeColor = typeof badge === 'string' ? 'amber' : badge.color;
                      const colorClass = 
                        badgeColor === 'emerald' ? 'bg-[#15b86c]' :
                        badgeColor === 'ruby' ? 'bg-[#d00000]' :
                        badgeColor === 'sky' ? 'bg-[#0ea5e9]' :
                        badgeColor === 'amber' ? 'bg-[#f59e0b]' :
                        badgeColor === 'violet' ? 'bg-[#8b5cf6]' : 'bg-orange-500';
                      
                      return (
                        <span key={i} className={`${colorClass} text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm`}>
                          {badgeText}
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    {logo ? (
                      <div className="w-14 h-14 min-w-[56px] rounded-xl overflow-hidden bg-gray-50 border border-gray-100 p-1 group-hover:scale-105 transition-transform duration-300">
                        <img src={logo} alt={job.title} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 min-w-[56px] rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 transition-transform duration-300 group-hover:scale-105">
                        <Award size={26} />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight">{job.title}</h3>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{job.department}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 flex-grow">
                    <p className="text-sm text-gray-600 font-medium flex items-center gap-2">
                      <Users size={16} className="text-gray-400" /> {job.posts} Vacancies
                    </p>
                    <p className="text-sm text-gray-600 font-medium flex items-center gap-2">
                      <BookOpen size={16} className="text-gray-400" /> {job.qualification}
                    </p>
                  </div>
                  <Link to={`/jobs/${slugify(job.title)}`} className="w-full block text-center bg-gray-900 text-white py-3 rounded-xl font-black text-sm hover:bg-gray-800 transition active:scale-[0.98]">
                    View Details
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-500 font-medium">No active job notifications at the moment.</p>
            </div>
          )}
        </div>
      </section>


      {/* Dynamic Admin Sections */}
      {sections.map((section, idx) => (
        <section key={section.id || `section-${idx}`} className={`py-20 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {section.layout_type === 'reverse' ? (
              <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                <div className="md:w-1/2">
                  {section.image && <img src={section.image} className="rounded-2xl shadow-xl w-full object-cover h-[400px]" alt="" referrerPolicy="no-referrer" />}
                </div>
                <div className="md:w-1/2 space-y-6">
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900">{section.title}</h2>
                  <p className="text-lg text-gray-600 leading-relaxed">{section.description}</p>
                  {section.button_text && section.button_link && (
                    <Link to={section.button_link} className="inline-block bg-[#15b86c] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#12a15e] transition">
                      {section.button_text}
                    </Link>
                  )}
                </div>
              </div>
            ) : section.layout_type === 'card' ? (
              <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-12 shadow-xl flex flex-col md:flex-row items-center gap-12">
                <div className="md:w-1/3">
                  {section.image && <img src={section.image} className="rounded-2xl shadow-md w-full object-cover h-[300px]" alt="" referrerPolicy="no-referrer" />}
                </div>
                <div className="md:w-2/3 space-y-6">
                  <h2 className="text-3xl font-black text-gray-900">{section.title}</h2>
                  <p className="text-lg text-gray-600">{section.description}</p>
                  {section.button_text && section.button_link && (
                    <Link to={section.button_link} className="inline-block bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition">
                      {section.button_text}
                    </Link>
                  )}
                </div>
              </div>
            ) : section.layout_type === 'minimal' ? (
              <div className="max-w-3xl mx-auto text-center space-y-6">
                <h2 className="text-3xl md:text-4xl font-black text-gray-900">{section.title}</h2>
                <p className="text-lg text-gray-600 leading-relaxed">{section.description}</p>
                {section.button_text && section.button_link && (
                  <Link to={section.button_link} className="inline-block text-[#15b86c] font-bold text-lg hover:underline">
                    {section.button_text} →
                  </Link>
                )}
              </div>
            ) : (
              /* Default Layout */
              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="md:w-1/2">
                  {section.image && <img src={section.image} className="rounded-2xl shadow-xl w-full object-cover h-[400px]" alt="" referrerPolicy="no-referrer" />}
                </div>
                <div className="md:w-1/2 space-y-6">
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900">{section.title}</h2>
                  <p className="text-lg text-gray-600 leading-relaxed">{section.description}</p>
                  {section.button_text && section.button_link && (
                    <Link to={section.button_link} className="inline-block bg-[#15b86c] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#12a15e] transition">
                      {section.button_text}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
