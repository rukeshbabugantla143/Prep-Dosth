import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { slugify } from "../utils";
import { supabase } from "../services/supabaseClient";
import { format, differenceInDays, isBefore, startOfDay } from "date-fns";
import { Search, Calendar, ChevronRight, BookOpen, ArrowRight } from "lucide-react";
import SEO from "../components/common/SEO";

export default function Exams() {
  const [exams, setExams] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get("category") || "All Exams");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  useEffect(() => {
    const fetchExams = async () => {
      const { data, error } = await supabase.from("exams").select("*");
      if (data) {
        setExams(data);
        const uniqueCategories = Array.from(new Set(data.map((exam: any) => exam.category).filter(Boolean)));
        setCategories(['All Exams', ...uniqueCategories] as string[]);
        
        // If category in URL is not in uniqueCategories, reset to All Exams
        const urlCategory = searchParams.get("category");
        if (urlCategory && !uniqueCategories.includes(urlCategory)) {
          // setFilter("All Exams"); // Keep it if it might be valid but not present yet
        }
      }
      if (error) console.error("Error fetching exams:", error);
    };
    fetchExams();
  }, [searchParams]);

  useEffect(() => {
    const query = searchParams.get("search");
    if (query) {
      setSearchQuery(query);
    }
    const cat = searchParams.get("category");
    if (cat) {
      setFilter(cat);
    } else {
      setFilter("All Exams");
    }
  }, [searchParams]);

  const filteredExams = exams.filter(exam => {
    const matchesFilter = filter === "All Exams" || exam.category === filter;
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          exam.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch && !exam.is_subpage;
  });

  const getCleanDescription = (description: string) => {
    if (!description) return "";
    
    let cleanText = "";
    try {
      const trimmed = description.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        const sections = Array.isArray(parsed) ? parsed : (parsed.sections || []);
        cleanText = sections
          .filter((sec: any) => sec.type === 'text')
          .map((sec: any) => sec.content)
          .join(" ");
      } else {
        cleanText = description;
      }
    } catch (e) {
      cleanText = description;
    }

    // Strip HTML tags
    cleanText = cleanText.replace(/<[^>]*>?/gm, '');
    
    // Decode HTML entities (basic ones)
    cleanText = cleanText
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');

    // Truncate
    if (cleanText.length > 160) {
      return cleanText.substring(0, 157) + "...";
    }
    return cleanText;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <SEO 
        title="Upcoming Exam Notifications & Dates" 
        description="Stay updated with the latest exam notifications, registration dates, and countdowns for competitive exams including SSC, Banking, and State PSCs."
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-4xl font-bold text-gray-800">Exam Notifications</h1>
        
        <div className="relative w-full md:w-72">
          <input 
            type="text" 
            placeholder="Search exams..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15b86c] focus:border-[#15b86c] outline-none"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              filter === f 
                ? "bg-[#15b86c] text-white shadow-md" 
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExams.length > 0 ? filteredExams.map(exam => {
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
            <div key={exam.id} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[180px] relative group overflow-hidden">
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
                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-[#15b86c] transition-colors line-clamp-1">{exam.title}</h2>
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
                    <Link to={`/exams/${slugify(exam.title)}`} className="text-[#15b86c] font-black text-sm hover:underline tracking-tight flex items-center gap-1 transition-all">
                      View Details <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">No exams found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
