import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { slugify } from "../utils";
import { Search, Users, Award, BookOpen, PlayCircle, ChevronRight, CheckCircle2, FileText, Clock, Calendar, Video } from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function Home() {
  const [tests, setTests] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [heroes, setHeroes] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [categories, setCategories] = useState<{ name: string; count: number; icon: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [testsRes, jobsRes, examsRes, heroRes, sectionsRes] = await Promise.all([
        supabase.from("tests").select("*").limit(4),
        supabase.from("jobs").select("*").limit(4),
        supabase.from("exams").select("category"),
        supabase.from("hero_section").select("*").order('id', { ascending: true }),
        supabase.from("sections").select("*").order('id', { ascending: true }),
      ]);
      if (testsRes.data) setTests(testsRes.data);
      if (jobsRes.data) setJobs(jobsRes.data);
      if (heroRes.data) setHeroes(heroRes.data);
      if (sectionsRes.data) setSections(sectionsRes.data);
      if (examsRes.data) {
        const counts = examsRes.data.reduce((acc: any, exam: any) => {
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

        const dynamicCategories = Object.entries(counts).map(([name, count]) => ({
          name,
          count: `${count}+ Exams`,
          icon: iconMap[name] || "📚"
        }));
        setCategories(dynamicCategories);
      }
      
      const { data: latestExams } = await supabase.from("exams").select("*").order('date', { ascending: false }).limit(3);
      if (latestExams) setExams(latestExams);
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="w-full font-sans">
      {/* Hero Section */}
      {heroes.length > 0 ? (
        <section className="relative w-full overflow-hidden h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] xl:h-[80vh]">
          {heroes.map((hero, index) => (
            <div 
              key={hero.id} 
              className={`absolute inset-0 transition-all duration-1000 ${index === currentHeroIndex ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`}
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
              {heroes.map((_, idx) => (
                <button 
                  key={idx} 
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
          <div className="space-y-2">
            <div className="flex justify-center text-[#15b86c]"><Users size={32} /></div>
            <h3 className="text-2xl font-black text-gray-800">3.1 Crore+</h3>
            <p className="text-sm font-medium text-gray-500">Students Trusted</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-center text-[#15b86c]"><Award size={32} /></div>
            <h3 className="text-2xl font-black text-gray-800">1 Lakh+</h3>
            <p className="text-sm font-medium text-gray-500">Selections</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-center text-[#15b86c]"><BookOpen size={32} /></div>
            <h3 className="text-2xl font-black text-gray-800">70,000+</h3>
            <p className="text-sm font-medium text-gray-500">Mock Tests</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-center text-[#15b86c]"><PlayCircle size={32} /></div>
            <h3 className="text-2xl font-black text-gray-800">10,000+</h3>
            <p className="text-sm font-medium text-gray-500">Video Lessons</p>
          </div>
        </div>
      </section>

      {/* Daily Free Quizzes & Current Affairs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Daily Free Quizzes & Current Affairs</h2>
            <p className="text-gray-600 font-medium">Boost your daily preparation with bite-sized tests</p>
          </div>
          <Link to="/tests" className="hidden md:flex items-center text-[#15b86c] font-bold hover:underline">
            View All <ChevronRight size={20} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Daily Current Affairs - 13 Mar", type: "Current Affairs", questions: 15, time: "10 Mins", icon: <Calendar size={24} className="text-blue-600" />, bg: "bg-blue-50" },
            { title: "Quantitative Aptitude Mini Mock", type: "Maths", questions: 20, time: "15 Mins", icon: <Clock size={24} className="text-purple-600" />, bg: "bg-purple-50" },
            { title: "English Vocabulary Booster", type: "English", questions: 10, time: "5 Mins", icon: <BookOpen size={24} className="text-orange-600" />, bg: "bg-orange-50" },
          ].map((quiz, idx) => (
            <div key={idx} className="bg-white border border-gray-200 p-6 rounded-2xl hover:shadow-lg transition flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className={`${quiz.bg} w-12 h-12 rounded-xl flex items-center justify-center`}>
                  {quiz.icon}
                </div>
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-md">{quiz.type}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{quiz.title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 font-medium mb-6">
                <span className="flex items-center gap-1"><CheckCircle2 size={16} className="text-[#15b86c]" /> {quiz.questions} Qs</span>
                <span className="flex items-center gap-1"><Clock size={16} className="text-[#15b86c]" /> {quiz.time}</span>
              </div>
              <button className="mt-auto w-full bg-white border-2 border-gray-200 text-gray-700 py-2.5 rounded-lg font-bold hover:border-[#15b86c] hover:text-[#15b86c] transition">
                Attempt Now
              </button>
            </div>
          ))}
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
          {exams.map(exam => (
            <div key={exam.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 text-lg mb-2">{exam.title}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{exam.category}</p>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">{new Date(exam.date).toLocaleDateString()}</span>
                  <span className="text-sm text-red-600 font-bold">
                    {(() => {
                      const diff = new Date(exam.date).getTime() - new Date().getTime();
                      const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
                      if (daysLeft > 0) return `${daysLeft} days left`;
                      if (daysLeft === 0) return "Today";
                      return "Exam Passed";
                    })()}
                  </span>
                </div>
                <Link to={`/exams/${slugify(exam.title)}`} className="text-[#15b86c] font-bold text-sm hover:underline">View Details</Link>
              </div>
            </div>
          ))}
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
          {categories.map((cat, idx) => (
            <Link key={idx} to="/exams" className="bg-white border border-gray-200 p-6 rounded-2xl hover:shadow-lg hover:border-[#15b86c] transition group flex flex-col items-center text-center">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{cat.icon}</div>
              <h3 className="font-bold text-gray-800 mb-1">{cat.name}</h3>
              <p className="text-sm text-gray-500 font-medium">{cat.count}</p>
            </Link>
          ))}
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
            {tests.length > 0 ? tests.map(test => (
              <div key={test.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition flex flex-col">
                <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                  <FileText size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{test.title}</h3>
                <div className="space-y-2 mb-6 flex-grow">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#15b86c]" /> {test.questions?.length || 0} Total Tests
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#15b86c]" /> {test.timeLimit} Mins Duration
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#15b86c]" /> {test.marks} Total Marks
                  </p>
                </div>
                <Link to={`/user/tests/${test.id}`} className="w-full block text-center bg-white border-2 border-[#15b86c] text-[#15b86c] py-2.5 rounded-lg font-bold hover:bg-[#15b86c] hover:text-white transition">
                  Start Free Test
                </Link>
              </div>
            )) : (
              // Placeholders if no tests exist
              [1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
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
          {jobs.length > 0 ? jobs.map(job => (
            <div key={job.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition flex flex-col">
              <div className="bg-orange-50 w-12 h-12 rounded-xl flex items-center justify-center text-orange-600 mb-4">
                <Award size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{job.title}</h3>
              <p className="text-sm text-gray-500 font-medium mb-4">{job.department}</p>
              <div className="space-y-2 mb-6 flex-grow">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Users size={16} className="text-gray-400" /> {job.posts} Vacancies
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <BookOpen size={16} className="text-gray-400" /> {job.qualification}
                </p>
              </div>
              <Link to={`/jobs/${slugify(job.title)}`} className="w-full block text-center bg-gray-900 text-white py-2.5 rounded-lg font-bold hover:bg-gray-800 transition">
                View Details
              </Link>
            </div>
          )) : (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-500 font-medium">No active job notifications at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Live Classes */}
      <section className="bg-[#0b1b3d] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <h2 className="text-3xl font-black text-white">Live Classes</h2>
              </div>
              <p className="text-gray-400 font-medium">Learn from India's top educators in real-time</p>
            </div>
            <Link to="/premium" className="hidden md:flex items-center text-[#15b86c] font-bold hover:underline">
              Explore Courses <ChevronRight size={20} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Complete Geometry for SSC CGL", teacher: "Aditya Ranjan", time: "Today, 5:00 PM", subject: "Mathematics" },
              { title: "March 2nd Week Current Affairs", teacher: "Piyush Sir", time: "Today, 7:00 PM", subject: "General Awareness" },
              { title: "Syllogism Tricks & Shortcuts", teacher: "Puneet Sir", time: "Tomorrow, 10:00 AM", subject: "Reasoning" },
            ].map((cls, idx) => (
              <div key={idx} className="bg-[#1d2027] border border-gray-700 p-6 rounded-2xl hover:border-gray-500 transition flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2.5 py-1 rounded-md">{cls.subject}</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-gray-400 bg-gray-800 px-2 py-1 rounded-md"><Video size={14} /> Live</span>
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{cls.title}</h3>
                <p className="text-sm text-gray-400 font-medium mb-6">By {cls.teacher}</p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-[#15b86c] font-bold text-sm flex items-center gap-1"><Clock size={16} /> {cls.time}</span>
                  <button className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 transition">
                    Notify Me
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pass Pro Promo */}
      <section className="bg-[#1d2027] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="md:w-1/2 space-y-6">
            <div className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black px-4 py-1 rounded-full text-sm tracking-wide uppercase">
              GovPrep Pass Pro
            </div>
            <h2 className="text-4xl md:text-5xl font-black leading-tight">
              Unlock 70,000+ Mock Tests & Previous Year Papers
            </h2>
            <p className="text-xl text-gray-400 font-medium">
              One pass for all exams. Get unlimited access to test series, live classes, and study notes.
            </p>
            <ul className="space-y-3 text-gray-300 font-medium">
              <li className="flex items-center gap-3"><CheckCircle2 className="text-[#15b86c]" size={20} /> 700+ Exams Covered</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="text-[#15b86c]" size={20} /> 17,000+ Previous Year Papers</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="text-[#15b86c]" size={20} /> Detailed Performance Analysis</li>
            </ul>
            <div className="pt-4">
              <Link to="/premium" className="inline-block bg-[#15b86c] text-white px-10 py-4 rounded-xl font-black text-lg hover:bg-[#12a15e] transition shadow-lg shadow-[#15b86c]/20">
                Buy Pass Pro Now
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 to-transparent rounded-full blur-3xl"></div>
            <img 
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Pass Pro" 
              className="rounded-2xl shadow-2xl relative z-10 border border-gray-700"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Dynamic Admin Sections */}
      {sections.map((section, idx) => (
        <section key={section.id} className={`py-20 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
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
