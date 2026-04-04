import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { slugify } from "../utils";
import { supabase } from "../services/supabaseClient";
import { format } from "date-fns";
import { Search, Award } from "lucide-react";
import SEO from "../components/common/SEO";

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get("category") || "All Jobs");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase.from("jobs").select("*");
      if (data) {
        setJobs(data);
        const uniqueDepartments = Array.from(new Set(data.map((job: any) => job.department).filter(Boolean)));
        setCategories(["All Jobs", ...uniqueDepartments] as string[]);
      }
      if (error) console.error("Error fetching jobs:", error);
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    const query = searchParams.get("search");
    if (query) {
      setSearchQuery(query);
    }
    const cat = searchParams.get("category");
    if (cat) {
      setFilter(cat);
    } else {
      setFilter("All Jobs");
    }
  }, [searchParams]);

  const filteredJobs = jobs.filter(job => {
    const matchesFilter = filter === "All Jobs" || job.department === filter;
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.department?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch && !job.is_subpage;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <SEO 
        title="Government Job Notifications" 
        description="Find all latest central and state government job notifications in Telangana and Andhra Pradesh. PSC, Banking, SSC, Railway, and more job alerts."
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-4xl font-bold text-gray-800">Government Job Notifications</h1>
        
        <div className="relative w-full md:w-72">
          <input 
            type="text" 
            placeholder="Search jobs..." 
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
        {filteredJobs.length > 0 ? filteredJobs.map(job => {
          const parsedDescription = (() => {
            try {
              return job.description?.startsWith('{') ? JSON.parse(job.description) : {};
            } catch(e) { return {}; }
          })();
          const logo = parsedDescription.logo_url;

          return (
            <div key={job.id} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition duration-300 flex flex-col relative group overflow-hidden min-h-[280px]">
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

              <div className="flex-grow">
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
                    <h2 className="text-xl font-bold text-blue-700 group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight">{job.title}</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{job.department}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-700 mb-6">
                  <div className="flex justify-between border-b border-gray-50 pb-1">
                    <span className="text-gray-500">Total Posts:</span>
                    <span className="font-semibold">{job.posts}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-1">
                    <span className="text-gray-500">Qualification:</span>
                    <span className="font-semibold">{job.qualification}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-1">
                    <span className="text-gray-500">Age Limit:</span>
                    <span className="font-semibold">{job.ageLimit}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-1">
                    <span className="text-gray-500">Fee:</span>
                    <span className="font-semibold">{job.fee}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-gray-500">Posted:</span>
                    <span className="font-semibold">{format(new Date(job.created_at), 'dd MMM yyyy')}</span>
                  </div>
                </div>
              </div>
            
            <div className="flex flex-col gap-3 mt-auto">
              <Link to={`/jobs/${slugify(job.title)}`} className="w-full text-center bg-blue-50 text-blue-700 py-2.5 rounded-lg font-bold hover:bg-blue-100 transition">
                View Full Details
              </Link>
              <div className="flex gap-3">
                {job.pdfLink && (
                  <a href={job.pdfLink.startsWith('http') ? job.pdfLink : `https://${job.pdfLink}`} target="_blank" rel="noreferrer" className="flex-1 text-center bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition text-sm">
                    PDF
                  </a>
                )}
                {job.applyLink && (
                  <a href={job.applyLink.startsWith('http') ? job.applyLink : `https://${job.applyLink}`} target="_blank" rel="noreferrer" className="flex-1 text-center bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm text-sm">
                    Apply
                  </a>
                )}
              </div>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">No jobs found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
