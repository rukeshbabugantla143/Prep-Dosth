import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { format } from "date-fns";
import { Search } from "lucide-react";

export default function Exams() {
  const [exams, setExams] = useState<any[]>([]);
  const [filter, setFilter] = useState("All Exams");
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  useEffect(() => {
    const fetchExams = async () => {
      const { data, error } = await supabase.from("exams").select("*");
      if (data) setExams(data);
      if (error) console.error("Error fetching exams:", error);
    };
    fetchExams();
  }, []);

  useEffect(() => {
    const query = searchParams.get("search");
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  const filters = [
    "All Exams",
    "SSC Exams",
    "Banking Exams",
    "Teaching Exams",
    "Civil Services",
    "Railway Exams"
  ];

  const filteredExams = exams.filter(exam => {
    const matchesFilter = filter === "All Exams" || exam.title?.toLowerCase().includes(filter.toLowerCase().replace(' exams', ''));
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          exam.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
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
        {filters.map(f => (
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
        {filteredExams.length > 0 ? filteredExams.map(exam => (
          <div key={exam.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition duration-300 flex flex-col">
            <h2 className="text-2xl font-bold text-blue-700 mb-2">{exam.title}</h2>
            <p className="text-gray-600 font-medium mb-4 flex-grow line-clamp-3">{getCleanDescription(exam.description)}</p>
            
            <div className="space-y-2 text-sm text-gray-700 mb-6">
              <div className="flex justify-between border-b border-gray-50 pb-1">
                <span className="text-gray-500">Exam Date:</span>
                <span className="font-semibold text-red-600">{format(new Date(exam.date), 'dd MMM yyyy')}</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 mt-auto">
              <Link to={`/exams/${exam.id}`} className="w-full text-center bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm">
                View Full Details
              </Link>
              {exam.link && (
                <a href={exam.link.startsWith('http') ? exam.link : `https://${exam.link}`} target="_blank" rel="noreferrer" className="w-full text-center bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition text-sm">
                  Official Link
                </a>
              )}
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">No exams found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
