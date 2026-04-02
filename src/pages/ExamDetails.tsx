import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { slugify } from '../utils';
import { Calendar, FileText, ExternalLink, ArrowLeft, Clock, ChevronRight, CheckCircle2, BookOpen, PlayCircle, Download, Bell, Play, X, Link as LinkIcon, AlertCircle, Info, Trophy, Folder, Users, Globe, Zap, Layers } from 'lucide-react';
import { format } from 'date-fns';
import FAQSection from '../components/FAQSection';
import IconList from '../components/common/IconList';

export default function ExamDetails() {
  const { slug } = useParams();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [importantLinks, setImportantLinks] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);

  useEffect(() => {
    const fetchExam = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('exams').select('*');
      if (data) {
        const foundExam = data.find(e => slugify(e.title) === slug);
        setExam(foundExam);
        if (foundExam) {
          // Fetch important links for this exam
          const { data: linksData } = await supabase
            .from('important_links')
            .select('*')
            .eq('exam_id', foundExam.id)
            .order('order_index', { ascending: true });
          if (linksData) setImportantLinks(linksData);
        }
      }
      if (error) console.error("Error fetching exam details:", error);
      setLoading(false);
    };
    fetchExam();
  }, [slug]);

  const { toc, sections, status, customDates, officialLinks, notificationLinks, youtubeVideos, logoUrl, featuredTestIds } = React.useMemo(() => {
    if (!exam?.description) return { toc: [], sections: [], status: 'Confirmed', customDates: [], officialLinks: [], notificationLinks: [], youtubeVideos: [], logoUrl: '', featuredTestIds: [] };
    
    const generatedToc: { id: string, text: string }[] = [];
    const generatedSections: any[] = [];
    let examStatus = 'Confirmed';
    let examCustomDates: { label: string, date: string, icon?: string, status?: string }[] = [];
    let examOfficialLinks: { label: string, url: string, color?: string }[] = [];
    let examNotificationLinks: { label: string, url: string, color?: string }[] = [];
    let examYoutubeVideos: { url: string, title: string }[] = [];
    let examLogoUrl = '';
    let examFeaturedTestIds: string[] = [];

    try {
      const trimmedDesc = exam.description.trim();
      if (trimmedDesc.startsWith('[') || trimmedDesc.startsWith('{')) {
        const parsedData = JSON.parse(trimmedDesc);
        
        const sectionsToProcess = Array.isArray(parsedData) ? parsedData : (parsedData.sections || []);
        if (!Array.isArray(parsedData)) {
          examStatus = parsedData.status || 'Confirmed';
          examCustomDates = parsedData.important_dates || [];
          examLogoUrl = parsedData.logo_url || '';
          examFeaturedTestIds = parsedData.featured_test_ids || [];
          
          if (parsedData.official_links) {
            examOfficialLinks = parsedData.official_links.map((l: any) => ({ ...l, color: l.color || 'blue' }));
          } else if (parsedData.official_website) {
            examOfficialLinks = [{ label: 'Official Website', url: parsedData.official_website, color: 'blue' }];
          }

          if (parsedData.notification_links) {
            examNotificationLinks = parsedData.notification_links.map((l: any) => ({ ...l, color: l.color || 'red' }));
          } else if (parsedData.notification_pdf) {
            examNotificationLinks = [{ label: 'Notification PDF', url: parsedData.notification_pdf, color: 'red' }];
          }
          
          const rawVideos = parsedData.youtube_videos || [];
          examYoutubeVideos = rawVideos.map((v: any) => {
            if (typeof v === 'string') return { url: v, title: 'Preparation Video' };
            return v;
          });
        }

        sectionsToProcess.forEach((sec: any, index: number) => {
          const id = sec.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          generatedToc.push({ id, text: sec.title });
          generatedSections.push({ ...sec, id });
          
          // Inject TOC link for mock tests after the 2nd section
          if (index === 1 && examFeaturedTestIds.length > 0) {
            generatedToc.push({ id: 'mock-tests', text: 'Practice Mock Tests' });
          }
        });
        
        // If there were fewer than 2 sections, add the TOC link at the end
        if (sectionsToProcess.length < 2 && examFeaturedTestIds.length > 0) {
          generatedToc.push({ id: 'mock-tests', text: 'Practice Mock Tests' });
        }
        
        if (examYoutubeVideos.length > 0) generatedToc.push({ id: 'videos', text: 'Preparation Videos' });

        return { 
          toc: generatedToc, sections: generatedSections, status: examStatus, 
          customDates: examCustomDates, officialLinks: examOfficialLinks, 
          notificationLinks: examNotificationLinks, youtubeVideos: examYoutubeVideos, 
          logoUrl: examLogoUrl, featuredTestIds: examFeaturedTestIds 
        };
      }
    } catch (e) {
      console.error("Failed to parse JSON description, falling back to HTML", e);
    }
    
    // Fallback for HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(exam.description, 'text/html');
    let currentSectionId = 'overview';
    let currentSectionTitle = 'Overview';
    let currentContent: Node[] = [];
    
    Array.from(doc.body.childNodes).forEach((node) => {
      if (node.nodeName === 'H2') {
        if (currentContent.length > 0 || currentSectionId !== 'overview') {
          const tempDiv = document.createElement('div');
          currentContent.forEach(n => tempDiv.appendChild(n.cloneNode(true)));
          generatedSections.push({ id: currentSectionId, title: currentSectionTitle, content: tempDiv.innerHTML });
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
    
    if (currentContent.length > 0 || currentSectionId !== 'overview') {
      const tempDiv = document.createElement('div');
      currentContent.forEach(n => tempDiv.appendChild(n.cloneNode(true)));
      generatedSections.push({ id: currentSectionId, title: currentSectionTitle, content: tempDiv.innerHTML });
    }
    
    return { 
      toc: generatedToc, sections: generatedSections, status: 'Confirmed', customDates: [],
      officialLinks: exam.link ? [{ label: 'Official Website', url: exam.link }] : [],
      notificationLinks: [], youtubeVideos: [], logoUrl: '', featuredTestIds: []
    };
  }, [exam?.description, exam?.link]);

  useEffect(() => {
    const fetchFeaturedTests = async () => {
      if (featuredTestIds && featuredTestIds.length > 0) {
        const { data: testsData, error: testsError } = await supabase
          .from('tests')
          .select('*')
          .in('id', featuredTestIds);
        
        if (testsData) {
          const sortedTests = [...testsData].sort((a, b) => 
            featuredTestIds.indexOf(a.id) - featuredTestIds.indexOf(b.id)
          );
          setTests(sortedTests);
        }
        if (testsError) console.error("Error fetching featured tests:", testsError);
      } else {
        setTests([]);
      }
    };
    fetchFeaturedTests();
  }, [featuredTestIds]);

  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'red': return 'bg-red-50 text-red-700 hover:bg-red-100 border-red-100';
      case 'green': return 'bg-green-50 text-green-700 hover:bg-green-100 border-green-100';
      case 'orange': return 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-100';
      case 'purple': return 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-100';
      case 'gray': return 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-100';
      case 'blue':
      default: return 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#15b86c]"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen pt-24 flex flex-col justify-center items-center bg-gray-50">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Exam Not Found</h2>
        <p className="text-gray-600 mb-8">The exam notification you are looking for does not exist or has been removed.</p>
        <Link to="/exams" className="bg-[#15b86c] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#12a15e] transition flex items-center gap-2">
          <ArrowLeft size={20} /> Back to Exams
        </Link>
      </div>
    );
  }

  const tabs = toc.length > 0 ? toc : [
    { id: 'overview', text: 'Overview' },
    { id: 'eligibility', text: 'Eligibility' },
    { id: 'syllabus', text: 'Syllabus' },
    { id: 'exam-pattern', text: 'Exam Pattern' },
    { id: 'salary', text: 'Salary' },
  ];

  return (
    <div className="bg-gray-50 relative">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center text-sm text-gray-500">
            <Link to="/" className="hover:text-[#15b86c]">Home</Link>
            <ChevronRight size={16} className="mx-2" />
            <Link to="/exams" className="hover:text-[#15b86c]">Exams</Link>
            <ChevronRight size={16} className="mx-2" />
            <span className="text-gray-900 font-medium truncate">{exam.title}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="hidden md:block w-64 shrink-0">
              <img src={logoUrl || "https://cdni.iconscout.com/illustration/premium/thumb/online-education-4364975-3625624.png"} alt="Exam Logo" className="w-full h-auto object-contain max-h-48" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                {exam.title} Exam - Registration (Started), Date, Syllabus, Pattern, Eligibility, Admission Process
              </h1>
              <div className="flex flex-wrap gap-4">
                <Link to="/tests" className="bg-[#15b86c] text-white px-6 py-2.5 rounded font-medium hover:bg-[#12a15e] transition flex items-center gap-2">
                  Get Started for Free
                </Link>
                {exam.link && (
                  <a 
                    href={exam.link.startsWith('http') ? exam.link : `https://${exam.link}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="bg-white text-[#15b86c] border border-[#15b86c] px-6 py-2.5 rounded font-medium hover:bg-green-50 transition flex items-center gap-2"
                  >
                    <Download size={18} /> Download as PDF
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 inset-x-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto scrollbar-hide w-full">
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
                {sections.map((section, index) => (
                  <React.Fragment key={section.id}>
                    <div id={section.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 scroll-mt-32">
                      <h2 className="text-xl font-bold text-gray-900 mb-0">
                        {section.title}
                      </h2>
                      {(section.type === 'table' || section.type === 'text_table') && section.description && (
                        <div 
                          className="prose prose-sm md:prose-base max-w-none text-gray-700 leading-relaxed mb-4"
                          dangerouslySetInnerHTML={{ __html: section.description }}
                        />
                      )}
                      
                      {(section.type === 'text' || section.type === 'text_table') && (
                        <div 
                          className="prose prose-sm md:prose-base max-w-none text-gray-700 leading-tight
                                     prose-headings:font-bold prose-headings:text-gray-900
                                     prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-1
                                     prose-p:mb-2
                                     prose-a:text-blue-600 prose-a:font-bold hover:prose-a:text-blue-700
                                     prose-table:w-full prose-table:border-collapse prose-table:border prose-table:border-gray-300
                                     prose-th:bg-gray-100 prose-th:border prose-th:border-gray-300 prose-th:p-3 prose-th:text-left prose-th:font-bold
                                     prose-td:border prose-td:border-gray-300 prose-td:p-3
                                     prose-ul:pl-0 prose-ul:mb-2
                                     prose-li:mb-0.5"
                          dangerouslySetInnerHTML={{ __html: section.content }}
                        />
                      )}

                      {section.type === 'faq' && (
                        <FAQSection faqData={section.faqData} />
                      )}

                      {section.type === 'icon_list' && (
                        <div className="space-y-4">
                          {section.content && (
                            <div 
                              className="prose prose-sm md:prose-base max-w-none text-gray-700 leading-relaxed mb-1
                                         prose-headings:font-bold prose-headings:text-gray-900
                                         prose-p:mb-2
                                         prose-a:text-blue-600 prose-a:font-bold hover:prose-a:text-blue-700"
                              dangerouslySetInnerHTML={{ __html: section.content }}
                            />
                          )}
                          <IconList items={section.items} iconName={section.iconName} iconColor={section.iconColor} />
                        </div>
                      )}

                      {(section.type === 'table' || section.type === 'text_table') && section.tableData && (
                        <div className="overflow-x-auto mt-4">
                          <table className="min-w-full border-collapse border border-gray-200">
                            <thead>
                              <tr className="bg-gray-50">
                                {section.tableData.headers.map((header: string, i: number) => (
                                  <th key={i} className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">{header}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {section.tableData.rows.map((row: string[], i: number) => (
                                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                  {row.map((cell: string, j: number) => (
                                    <td 
                                      key={j} 
                                      className={`border border-gray-200 px-4 py-3 text-sm text-gray-700 ${section.tableData.boldCells?.[i]?.[j] ? 'font-bold' : ''} [&_a]:text-blue-600 [&_a]:font-bold hover:[&_a]:text-blue-700 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1`} 
                                      dangerouslySetInnerHTML={{ __html: cell }}
                                    ></td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    {/* Inject Mock Tests in the Middle (after 2 sections) */}
                    {index === 1 && tests.length > 0 && (
                      <div id="mock-tests" className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 scroll-mt-32 overflow-hidden">
                        <div className="flex justify-between items-end mb-8">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 uppercase tracking-tight">
                              <Trophy className="text-[#0ea5e9]" /> Practice Mock Tests
                            </h2>
                            <p className="text-gray-500 text-xs mt-1 uppercase font-bold tracking-widest">Hand-picked assessments for your {exam.title} preparation.</p>
                          </div>
                          <Link to="/tests" className="text-[#0ea5e9] text-xs font-black uppercase tracking-widest hover:underline px-4 py-2 bg-blue-50 rounded-lg transition-all">View All</Link>
                        </div>

                        {/* Pixel-Perfect Premium Series Card */}
                        {/* Grid container for individual test cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {tests.map((test: any) => (
                            <div key={test.id} className="group bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-2xl hover:shadow-blue-600/10 transition-all duration-500 flex flex-col relative w-full h-full">
                              {/* Top Blue Bar */}
                              <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600"></div>
                              
                              <div className="p-6 flex-grow">
                                {/* Header: Folder + Join Now */}
                                <div className="flex justify-between items-start mb-6">
                                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                                    <Folder className="text-white" size={28} />
                                  </div>
                                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500 text-white px-4 py-2 rounded-full shadow-md transform hover:scale-105 transition-transform cursor-pointer">
                                    <Users size={14} className="fill-white" />
                                    <span className="text-[10px] font-black uppercase tracking-tight">Join Now</span>
                                  </div>
                                </div>
                                
                                {/* Title: Use the actual test title */}
                                <h2 className="text-[1.3rem] font-black text-gray-900 leading-[1.2] mb-6 uppercase tracking-tight line-clamp-2">
                                  {test.title}
                                </h2>

                                {/* Stats Summary Section */}
                                <div className="flex items-center justify-between py-4 border-t border-gray-50">
                                  <span className="text-[11px] font-bold text-gray-900 uppercase">1 Total Test</span>
                                  <span className={`text-[11px] font-bold uppercase ${test.is_free ? 'text-green-600' : 'text-orange-500'}`}>
                                    {test.is_free ? 'Free Test' : 'Premium Test'}
                                  </span>
                                </div>

                                {/* Languages */}
                                <div className="py-4 border-t border-gray-50 flex items-center gap-2">
                                  <Globe size={14} className="text-blue-400" />
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">English, Telugu, Hindi</span>
                                </div>

                                {/* List Sections: Highlight the specific type of this test */}
                                <div className="py-2 space-y-4">
                                  <div className={`flex items-center gap-4 ${test.is_live ? 'opacity-100' : 'opacity-40'}`}>
                                    <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center">
                                      <Zap size={14} className={`text-pink-600 ${test.is_live ? 'fill-pink-600' : ''}`} />
                                    </div>
                                    <span className="text-[11px] font-black text-gray-600 uppercase tracking-tight">
                                      {test.is_live ? 'Live Test' : '0 Live Tests'}
                                    </span>
                                  </div>
                                  
                                  <div className={`flex items-center gap-4 ${test.test_type === "Chapter Test" ? 'opacity-100' : 'opacity-40'}`}>
                                    <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                                      <Layers size={14} className="text-orange-600" />
                                    </div>
                                    <span className="text-[11px] font-black text-gray-600 uppercase tracking-tight">
                                      {test.test_type === "Chapter Test" ? 'Chapter Test' : '0 Chapter Tests'}
                                    </span>
                                  </div>
                                  
                                  <div className={`flex items-center gap-4 ${test.test_type === "CA Booster" ? 'opacity-100' : 'opacity-40'}`}>
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                                      <FileText size={14} className="text-blue-600" />
                                    </div>
                                    <span className="text-[11px] font-black text-gray-600 uppercase tracking-tight">
                                      {test.test_type === "CA Booster" ? 'CA Booster' : '0 CA Booster'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-4 pt-2">
                                    <div className="w-8"></div> {/* Spacer */}
                                    <span className="text-[12px] font-black text-green-500 uppercase tracking-widest">+ Real-time Content</span>
                                  </div>
                                </div>
                              </div>

                              {/* Footer Action Button */}
                              <Link 
                                to={`/user/test/${test.id}`}
                                className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white py-5 font-black uppercase text-[12px] tracking-[0.2em] transition-all duration-300 text-center block mt-auto"
                              >
                                View Test
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
                
                {/* Fallback if sections < 2: show tests at the end */}
                {sections.length < 2 && tests.length > 0 && (
                  <div id="mock-tests" className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 scroll-mt-32 overflow-hidden relative">
                    <div className="flex justify-between items-end mb-8">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 uppercase tracking-tight">
                          <Trophy className="text-[#0ea5e9]" /> Practice Mock Tests
                        </h2>
                        <p className="text-gray-500 text-xs mt-1 uppercase font-bold tracking-widest">Hand-picked assessments for your {exam.title} preparation.</p>
                      </div>
                      <Link to="/tests" className="text-[#0ea5e9] text-xs font-black uppercase tracking-widest hover:underline px-4 py-2 bg-blue-50 rounded-lg transition-all">View All</Link>
                    </div>

                    {/* Pixel-Perfect Premium Series Card (Fallback) */}
                    {/* Grid container for individual test cards (Fallback) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {tests.map((test: any) => (
                        <div key={test.id} className="group bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-2xl hover:shadow-blue-600/10 transition-all duration-500 flex flex-col relative w-full h-full">
                          {/* Top Blue Bar */}
                          <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600"></div>
                          
                          <div className="p-6 flex-grow">
                            {/* Header: Folder + Join Now */}
                            <div className="flex justify-between items-start mb-6">
                              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                                <Folder className="text-white" size={28} />
                              </div>
                              <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500 text-white px-4 py-2 rounded-full shadow-md transform hover:scale-105 transition-transform cursor-pointer">
                                <Users size={14} className="fill-white" />
                                <span className="text-[10px] font-black uppercase tracking-tight">Join Now</span>
                              </div>
                            </div>
                            
                            {/* Title: Use the actual test title */}
                            <h2 className="text-[1.3rem] font-black text-gray-900 leading-[1.2] mb-6 uppercase tracking-tight line-clamp-2">
                              {test.title}
                            </h2>

                            {/* Stats Summary Section */}
                            <div className="flex items-center justify-between py-4 border-t border-gray-50">
                              <span className="text-[11px] font-bold text-gray-900 uppercase">1 Total Test</span>
                              <span className={`text-[11px] font-bold uppercase ${test.is_free ? 'text-green-600' : 'text-orange-500'}`}>
                                {test.is_free ? 'Free Test' : 'Premium Test'}
                              </span>
                            </div>

                            {/* Languages */}
                            <div className="py-4 border-t border-gray-50 flex items-center gap-2">
                              <Globe size={14} className="text-blue-400" />
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">English, Telugu, Hindi</span>
                            </div>

                            {/* List Sections: Highlight original type */}
                            <div className="py-2 space-y-4">
                              <div className={`flex items-center gap-4 ${test.is_live ? 'opacity-100' : 'opacity-40'}`}>
                                <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center">
                                  <Zap size={14} className={`text-pink-600 ${test.is_live ? 'fill-pink-600' : ''}`} />
                                </div>
                                <span className="text-[11px] font-black text-gray-600 uppercase tracking-tight">
                                  {test.is_live ? 'Live Test' : '0 Live Tests'}
                                </span>
                              </div>
                              
                              <div className={`flex items-center gap-4 ${test.test_type === "Chapter Test" ? 'opacity-100' : 'opacity-40'}`}>
                                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                                  <Layers size={14} className="text-orange-600" />
                                </div>
                                <span className="text-[11px] font-black text-gray-600 uppercase tracking-tight">
                                  {test.test_type === "Chapter Test" ? 'Chapter Test' : '0 Chapter Tests'}
                                </span>
                              </div>
                              
                              <div className={`flex items-center gap-4 ${test.test_type === "CA Booster" ? 'opacity-100' : 'opacity-40'}`}>
                                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                                  <FileText size={14} className="text-blue-600" />
                                </div>
                                <span className="text-[11px] font-black text-gray-600 uppercase tracking-tight">
                                  {test.test_type === "CA Booster" ? 'CA Booster' : '0 CA Booster'}
                                </span>
                              </div>

                              <div className="flex items-center gap-4 pt-2">
                                <div className="w-8"></div> {/* Spacer */}
                                <span className="text-[12px] font-black text-green-500 uppercase tracking-widest">+ Real-time Content</span>
                              </div>
                            </div>
                          </div>

                          {/* Footer Action Button */}
                          <Link 
                            to={`/user/test/${test.id}`}
                            className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white py-5 font-black uppercase text-[12px] tracking-[0.2em] transition-all duration-300 text-center block mt-auto"
                          >
                            View Test
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overview Section */}
                <div id="overview" className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 scroll-mt-32">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">
                    {exam.title} Overview
                  </h2>
                  <div className="prose prose-green max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                    Detailed information about this exam will be updated soon.
                  </div>
                </div>

                {/* Eligibility Section */}
                <div id="eligibility" className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 scroll-mt-32">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">
                    Eligibility Criteria
                  </h2>
                  <p className="text-gray-700 mb-4">Candidates must fulfill the following eligibility criteria to apply for the exam:</p>
                  <ul className="list-disc pl-5 text-gray-700 space-y-2">
                    <li>Must be a citizen of India.</li>
                    <li>Must possess a Bachelor's degree from a recognized university.</li>
                    <li>Age limit varies by post, generally between 18 to 32 years.</li>
                  </ul>
                </div>

                {/* Exam Pattern Section */}
                <div id="exam-pattern" className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 scroll-mt-32">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">
                    Exam Pattern
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">Subject</th>
                          <th className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">Questions</th>
                          <th className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">Marks</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">General Intelligence & Reasoning</td>
                          <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">25</td>
                          <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">50</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">General Awareness</td>
                          <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">25</td>
                          <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">50</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">Quantitative Aptitude</td>
                          <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">25</td>
                          <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">50</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">English Comprehension</td>
                          <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">25</td>
                          <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">50</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* YouTube Videos Section */}
            {youtubeVideos && youtubeVideos.length > 0 && (
              <div id="videos" className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 scroll-mt-32">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
                  <PlayCircle className="text-red-600" /> Preparation Videos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {youtubeVideos.map((video, idx) => {
                    const url = video.url;
                    let videoId = '';
                    try {
                      if (url.includes('v=')) {
                        videoId = url.split('v=')[1].split('&')[0];
                      } else if (url.includes('be/')) {
                        videoId = url.split('be/')[1].split('?')[0];
                      }
                    } catch (e) {
                      console.error("Invalid YouTube URL", url);
                    }

                    if (!videoId) return null;

                    return (
                      <div 
                        key={idx} 
                        className="group cursor-pointer relative"
                        onClick={() => setSelectedVideo(videoId)}
                      >
                        <div className="relative aspect-video rounded-xl overflow-hidden shadow-sm border border-gray-100 mb-3">
                          <img 
                            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} 
                            alt={video.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                              <Play size={32} className="text-white fill-white ml-1" />
                            </div>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center group-hover:hidden transition-opacity">
                            <div className="w-12 h-12 bg-blue-600/90 rounded-full flex items-center justify-center shadow-lg">
                              <Play size={24} className="text-white fill-white ml-1" />
                            </div>
                          </div>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                          {video.title || "Preparation Video"}
                        </h4>
                        <p className="text-xs text-gray-500">PrepDosth - Exam Prep</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Video Modal */}
            {selectedVideo && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVideo(null);
                    }}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors border border-white/20"
                  >
                    <X size={24} />
                  </button>
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`} 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="absolute inset-0 -z-10" onClick={() => setSelectedVideo(null)}></div>
              </div>
            )}

          </div>

          {/* Right Column (Sidebar) */}
          <div className="lg:w-1/3">
            <div className="sticky top-32 space-y-6 self-start">
              {/* Promo Banner */}
              <div className="bg-gradient-to-br from-red-900 to-black rounded-lg p-6 text-white text-center shadow-md">
                <h3 className="text-2xl font-bold mb-2">Crack {exam.title}</h3>
                <p className="text-sm text-gray-300 mb-4">With India's Super Teachers</p>
                <button className="bg-white text-red-900 font-bold px-4 py-2 rounded w-full hover:bg-gray-100 transition">
                  Join SuperCoaching
                </button>
              </div>

              {/* Important Dates Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Calendar size={20} className="text-[#15b86c]" /> Important Dates
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="relative pl-8 border-l-2 border-gray-200 space-y-8">
                    {customDates.length > 0 ? (
                      customDates.map((d, i) => (
                        <div key={i} className="relative">
                          <div className={`absolute -left-[45px] w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${i === 0 ? 'bg-[#15b86c]' : 'bg-blue-500'}`}>
                            {d.icon === 'Bell' ? <Bell size={14} className="text-white" /> : 
                             d.icon === 'Calendar' ? <Calendar size={14} className="text-white" /> :
                             d.icon === 'FileText' ? <FileText size={14} className="text-white" /> :
                             d.icon === 'CheckCircle2' ? <CheckCircle2 size={14} className="text-white" /> :
                             d.icon === 'Clock' ? <Clock size={14} className="text-white" /> :
                             d.icon === 'Download' ? <Download size={14} className="text-white" /> :
                             d.icon === 'Link' ? <LinkIcon size={14} className="text-white" /> :
                             d.icon === 'AlertCircle' ? <AlertCircle size={14} className="text-white" /> :
                             d.icon === 'Info' ? <Info size={14} className="text-white" /> :
                             <Clock size={14} className="text-white" />}
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm text-gray-500 font-medium">{d.label}</p>
                            {(d.status || (d.label.toLowerCase().includes('exam date') && status)) && (
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                (d.status === 'Confirmed' || (!d.status && status === 'Confirmed')) 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-orange-100 text-orange-700'
                              }`}>
                                {d.status || status}
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-gray-900">{d.date ? format(new Date(d.date), 'dd MMM yyyy') : 'TBA'}</p>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="relative">
                          <div className="absolute -left-[45px] bg-[#15b86c] w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm">
                            <Bell size={14} className="text-white" />
                          </div>
                          <p className="text-sm text-gray-500 font-medium mb-1">Notification Released</p>
                          <p className="font-bold text-gray-900">{format(new Date(exam.created_at), 'dd MMM yyyy')}</p>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-[45px] bg-blue-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm">
                            <Calendar size={14} className="text-white" />
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm text-gray-500 font-medium">Exam Date</p>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              {status}
                            </span>
                          </div>
                          <p className="font-bold text-gray-900">{format(new Date(exam.date), 'dd MMM yyyy')}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Official Links */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <ExternalLink size={20} className="text-[#15b86c]" /> Official Resources
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {officialLinks.map((link: any, idx: number) => (
                    <a key={`off-${idx}`} href={link.url.startsWith('http') ? link.url : `https://${link.url}`} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-3 rounded-lg transition font-medium text-sm border ${getColorClasses(link.color)}`}>
                      {link.label || 'Official Website'}
                      <ExternalLink size={16} />
                    </a>
                  ))}
                  {notificationLinks.map((link: any, idx: number) => (
                    <a key={`not-${idx}`} href={link.url.startsWith('http') ? link.url : `https://${link.url}`} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-3 rounded-lg transition font-medium text-sm border ${getColorClasses(link.color)}`}>
                      {link.label || 'Notification PDF'}
                      <Download size={16} />
                    </a>
                  ))}
                  {officialLinks.length === 0 && notificationLinks.length === 0 && exam.link && (
                    <a href={exam.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium text-sm">
                      Official Link
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <ExternalLink size={20} className="text-[#15b86c]" /> Quick Links
                  </h3>
                </div>
                <div className="p-2">
                  {exam.link && (
                    <a href={exam.link.startsWith('http') ? exam.link : `https://${exam.link}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition group">
                      <span className="font-medium text-gray-700 group-hover:text-[#15b86c]">Official Website</span>
                      <ExternalLink size={16} className="text-gray-400 group-hover:text-[#15b86c]" />
                    </a>
                  )}
                  <Link to="/tests" className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition group">
                    <span className="font-medium text-gray-700 group-hover:text-[#15b86c]">Mock Tests</span>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-[#15b86c]" />
                  </Link>
                  <Link to="/exams" className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition group">
                    <span className="font-medium text-gray-700 group-hover:text-[#15b86c]">Other Exams</span>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-[#15b86c]" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
