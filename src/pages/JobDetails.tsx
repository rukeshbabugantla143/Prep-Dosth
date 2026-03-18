import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Building2, Users, GraduationCap, Calendar, IndianRupee, FileText, ExternalLink, ArrowLeft, Clock, ChevronRight, CheckCircle2, PlayCircle, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [importantLinks, setImportantLinks] = useState<any[]>([]);

  useEffect(() => {
    const fetchJob = async () => {
      const { data, error } = await supabase.from('jobs').select('*').eq('id', id).single();
      if (data) {
        setJob(data);
        // Fetch important links for this job
        const { data: linksData } = await supabase
          .from('important_links')
          .select('*')
          .eq('job_id', data.id)
          .order('order_index', { ascending: true });
        if (linksData) setImportantLinks(linksData);
      }
      if (error) console.error("Error fetching job details:", error);
      setLoading(false);
    };
    fetchJob();
  }, [id]);

  const { toc, sections } = React.useMemo(() => {
    if (!job?.description) return { toc: [], sections: [] };
    
    const generatedToc: { id: string, text: string }[] = [];
    const generatedSections: { id: string, title: string, content: string, description?: string, type?: string }[] = [];

    try {
      const parsedData = JSON.parse(job.description);
      const sectionsToProcess = Array.isArray(parsedData) ? parsedData : (parsedData.sections || []);
      
      sectionsToProcess.forEach((sec: any) => {
        let contentHtml = '';
        if (sec.type === 'text') {
          contentHtml = sec.content;
        } else if (sec.type === 'table' && sec.tableData) {
          contentHtml = `<div class="overflow-x-auto my-6"><table class="w-full border-collapse border border-gray-200">
            <thead>
              <tr class="bg-gray-100 text-gray-700">
                ${sec.tableData.headers.map((h: string) => `<th class="border border-gray-200 p-3 text-left font-semibold">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${sec.tableData.rows.map((row: string[]) => `
                <tr class="hover:bg-gray-50">
                  ${row.map((cell: string) => `<td class="border border-gray-200 p-3 text-gray-600">${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table></div>`;
        }
        
        const id = sec.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        generatedToc.push({ id, text: sec.title });
        
        generatedSections.push({
          id,
          title: sec.title,
          description: sec.description,
          content: contentHtml,
          type: sec.type
        });
      });
      
      return { toc: generatedToc, sections: generatedSections };
    } catch (e) {
      console.error("Failed to parse JSON description, falling back to HTML", e);
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(job.description, 'text/html');
    
    let currentSectionId = 'overview';
    let currentSectionTitle = 'Overview';
    let currentContent: Node[] = [];
    
    Array.from(doc.body.childNodes).forEach((node) => {
      if (node.nodeName === 'H2') {
        // Save previous section
        if (currentContent.length > 0 || currentSectionId !== 'overview') {
          const tempDiv = document.createElement('div');
          currentContent.forEach(n => tempDiv.appendChild(n.cloneNode(true)));
          if (tempDiv.innerHTML.trim() || currentSectionId !== 'overview') {
            generatedSections.push({
              id: currentSectionId,
              title: currentSectionTitle,
              content: tempDiv.innerHTML
            });
          }
        }
        
        const text = node.textContent || 'Section';
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        
        currentSectionId = id;
        currentSectionTitle = text;
        currentContent = [];
        
        generatedToc.push({ id, text });
      } else {
        currentContent.push(node);
      }
    });
    
    // Push the last section
    if (currentContent.length > 0 || currentSectionId !== 'overview') {
      const tempDiv = document.createElement('div');
      currentContent.forEach(n => tempDiv.appendChild(n.cloneNode(true)));
      if (tempDiv.innerHTML.trim() || currentSectionId !== 'overview') {
        generatedSections.push({
          id: currentSectionId,
          title: currentSectionTitle,
          content: tempDiv.innerHTML
        });
      }
    }
    
    // Add Overview to TOC if it exists and isn't there
    if (generatedSections.length > 0 && generatedSections[0].id === 'overview') {
      generatedToc.unshift({ id: 'overview', text: 'Overview' });
    }
    
    return { toc: generatedToc, sections: generatedSections };
  }, [job?.description]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#15b86c]"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen pt-24 flex flex-col justify-center items-center bg-gray-50">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Job Not Found</h2>
        <p className="text-gray-600 mb-8">The job notification you are looking for does not exist or has been removed.</p>
        <Link to="/jobs" className="bg-[#15b86c] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#12a15e] transition flex items-center gap-2">
          <ArrowLeft size={20} /> Back to Jobs
        </Link>
      </div>
    );
  }

  const tabs = toc.length > 0 ? toc : [
    { id: 'overview', text: 'Overview' },
    { id: 'vacancy', text: 'Vacancy' },
    { id: 'eligibility', text: 'Eligibility' },
    { id: 'salary', text: 'Salary' },
    { id: 'apply-online', text: 'Apply Online' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center text-sm text-gray-500">
            <Link to="/" className="hover:text-[#15b86c]">Home</Link>
            <ChevronRight size={16} className="mx-2" />
            <Link to="/jobs" className="hover:text-[#15b86c]">Jobs</Link>
            <ChevronRight size={16} className="mx-2" />
            <span className="text-gray-900 font-medium truncate">{job.title}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                {job.title} Notification, Exam Date Out, Vacancy, Selection and Eligibility Criteria
              </h1>
              <div className="flex flex-wrap gap-4">
                {job.applyLink && (
                  <a 
                    href={job.applyLink.startsWith('http') ? job.applyLink : `https://${job.applyLink}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="bg-[#15b86c] text-white px-6 py-2.5 rounded font-medium hover:bg-[#12a15e] transition flex items-center gap-2"
                  >
                    Get Started for Free
                  </a>
                )}
                {job.pdfLink && (
                  <a 
                    href={job.pdfLink.startsWith('http') ? job.pdfLink : `https://${job.pdfLink}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="bg-white text-[#15b86c] border border-[#15b86c] px-6 py-2.5 rounded font-medium hover:bg-green-50 transition flex items-center gap-2"
                  >
                    <Download size={18} /> Download as PDF
                  </a>
                )}
              </div>
            </div>
            <div className="hidden md:block w-64 shrink-0">
              <img src="https://cdni.iconscout.com/illustration/premium/thumb/online-education-4364975-3625624.png" alt="Hero Illustration" className="w-full h-auto object-contain" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-[64px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-sm font-semibold whitespace-nowrap border-b-4 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#15b86c] text-[#15b86c]'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.text}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column (Content) */}
          <div className="lg:w-2/3 space-y-6">
            
            {sections.length > 0 ? (
              <div className="space-y-6">
                {sections.map((section) => (
                  <div key={section.id} id={section.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 scroll-mt-32">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      {section.title}
                    </h2>
                    {(section.type === 'table' || section.type === 'text_table') && section.description && (
                      <div 
                        className="prose prose-sm md:prose-base max-w-none text-gray-700 leading-relaxed mb-4"
                        dangerouslySetInnerHTML={{ __html: section.description }}
                      />
                    )}
                    <div 
                      className="prose prose-sm md:prose-base max-w-none text-gray-700 leading-relaxed
                                 prose-headings:font-bold prose-headings:text-gray-900
                                 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
                                 prose-p:mb-4
                                 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                                 prose-table:w-full prose-table:border-collapse prose-table:border prose-table:border-gray-300
                                 prose-th:bg-gray-100 prose-th:border prose-th:border-gray-300 prose-th:p-3 prose-th:text-left prose-th:font-bold
                                 prose-td:border prose-td:border-gray-300 prose-td:p-3
                                 prose-ul:list-disc prose-ul:pl-5 prose-ul:mb-4
                                 prose-li:mb-1"
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Overview Section */}
                <div id="overview" className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200 scroll-mt-32">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">
                    {job.title} Overview
                  </h2>
                  <div className="prose prose-green max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                    Detailed information about this job will be updated soon.
                  </div>
                </div>

                {/* Vacancy Section */}
                <div id="vacancy" className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200 scroll-mt-32">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">
                    Vacancy Details
                  </h2>
                  <p className="text-gray-700 mb-4">The total number of vacancies announced for this recruitment is <strong>{job.posts || "N/A"}</strong>. Category-wise vacancy details will be available in the official notification.</p>
                </div>

                {/* Eligibility Section */}
                <div id="eligibility" className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200 scroll-mt-32">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">
                    Eligibility Criteria
                  </h2>
                  <p className="text-gray-700 mb-4">Candidates must fulfill the following eligibility criteria to apply for the recruitment:</p>
                  <ul className="list-disc pl-5 text-gray-700 space-y-2">
                    <li><strong>Educational Qualification:</strong> {job.qualification || "As per official notification."}</li>
                    <li><strong>Age Limit:</strong> {job.ageLimit || "As per official notification."}</li>
                    <li>Age relaxation is applicable as per government rules.</li>
                  </ul>
                </div>

                {/* Salary Section */}
                <div id="salary" className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200 scroll-mt-32">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">
                    Salary & Pay Scale
                  </h2>
                  <p className="text-gray-700 mb-4">Selected candidates will receive a competitive salary package as per government norms, including basic pay, DA, HRA, and other allowances.</p>
                </div>

                {/* Apply Online Section */}
                <div id="apply-online" className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200 scroll-mt-32">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">
                    Application Fee & Process
                  </h2>
                  <div className="overflow-x-auto mb-6">
                    <table className="min-w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">Category</th>
                          <th className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">Fee</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">General / OBC / EWS</td>
                          <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{job.fee || "Check Notification"}</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">SC / ST / PwD / Women</td>
                          <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">Exempted / Check Notification</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-gray-700 mb-4">Interested and eligible candidates can apply online through the official website. Ensure you have all required documents ready before starting the application process.</p>
                  {job.applyLink && (
                    <a 
                      href={job.applyLink.startsWith('http') ? job.applyLink : `https://${job.applyLink}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center gap-2 bg-[#15b86c] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#12a15e] transition"
                    >
                      <ExternalLink size={20} /> Click Here to Apply Online
                    </a>
                  )}
                </div>
              </>
            )}
            
          </div>

          {/* Right Column (Sidebar) */}
          <div className="lg:w-1/3 space-y-6">
            
            {/* Promo Banner */}
            <div className="bg-gradient-to-br from-red-900 to-black rounded-lg p-6 text-white text-center shadow-md">
              <h3 className="text-2xl font-bold mb-2">Crack {job.title}</h3>
              <p className="text-sm text-gray-300 mb-4">With India's Super Teachers</p>
              <button className="bg-white text-red-900 font-bold px-4 py-2 rounded w-full hover:bg-gray-100 transition">
                Join SuperCoaching
              </button>
            </div>

            {/* Quick Overview Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={20} className="text-[#15b86c]" /> Quick Overview
                </h3>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Department</p>
                    <p className="font-semibold text-gray-900">{job.department || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-green-50 p-2 rounded-lg text-green-600">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Vacancies</p>
                    <p className="font-semibold text-gray-900">{job.posts || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Qualification</p>
                    <p className="font-semibold text-gray-900">{job.qualification || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Age Limit</p>
                    <p className="font-semibold text-gray-900">{job.ageLimit || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-red-50 p-2 rounded-lg text-red-600">
                    <IndianRupee size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Application Fee</p>
                    <p className="font-semibold text-gray-900">{job.fee || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Links */}
            {importantLinks.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <h3 className="font-bold text-gray-900 p-4 border-b border-gray-200 bg-gray-50">Important Links</h3>
                <div className="flex flex-col">
                  {importantLinks.map((link) => (
                    <Link key={link.id} to={link.url} className="p-3 px-4 text-sm text-gray-700 hover:text-[#15b86c] border-b border-gray-100 last:border-0 flex justify-between items-center transition-colors">
                      {link.title}
                      <ChevronRight size={16} className="text-gray-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Promo Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <h3 className="text-xl font-black mb-2 relative z-10">Prepare for {job.department || "this Job"}</h3>
              <p className="text-gray-300 text-sm mb-6 relative z-10">Get access to 100+ mock tests, previous year papers, and live classes.</p>
              <Link to="/premium" className="w-full bg-[#15b86c] text-white py-3 rounded-lg font-bold hover:bg-[#12a15e] transition flex items-center justify-center gap-2 relative z-10">
                Unlock Pass Pro <ChevronRight size={18} />
              </Link>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <ExternalLink size={20} className="text-[#15b86c]" /> Quick Links
                </h3>
              </div>
              <div className="p-2">
                <Link to="/tests" className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition group">
                  <span className="font-medium text-gray-700 group-hover:text-[#15b86c]">Mock Tests</span>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-[#15b86c]" />
                </Link>
                <Link to="/jobs" className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition group">
                  <span className="font-medium text-gray-700 group-hover:text-[#15b86c]">Other Govt Jobs</span>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-[#15b86c]" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
