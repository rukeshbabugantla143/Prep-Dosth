import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { slugify } from '../utils';
import { Calendar, FileText, ExternalLink, ArrowLeft, Clock, ChevronRight, CheckCircle2, BookOpen, PlayCircle, Download, Bell, Play, X, Link as LinkIcon, AlertCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import FAQSection from '../components/FAQSection';

export default function ExamDetails() {
  const { slug } = useParams();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [importantLinks, setImportantLinks] = useState<any[]>([]);

  useEffect(() => {
    const fetchExam = async () => {
      const { data, error } = await supabase.from('exams').select('*');
      if (data) {
        const exam = data.find(e => slugify(e.title) === slug);
        setExam(exam);
        if (exam) {
          // Fetch important links for this exam
          const { data: linksData } = await supabase
            .from('important_links')
            .select('*')
            .eq('exam_id', exam.id)
            .order('order_index', { ascending: true });
          if (linksData) setImportantLinks(linksData);
        }
      }
      if (error) console.error("Error fetching exam details:", error);
      setLoading(false);
    };
    fetchExam();
  }, [slug]);

  const { toc, sections, status, customDates, officialLinks, notificationLinks, youtubeVideos, logoUrl } = React.useMemo(() => {
    if (!exam?.description) return { toc: [], sections: [], status: 'Confirmed', customDates: [], officialLinks: [], notificationLinks: [], youtubeVideos: [], logoUrl: '' };
    
    const generatedToc: { id: string, text: string }[] = [];
    const generatedSections: any[] = [];
    let examStatus = 'Confirmed';
    let examCustomDates: { label: string, date: string, icon?: string, status?: string }[] = [];
    let examOfficialLinks: { label: string, url: string, color?: string }[] = [];
    let examNotificationLinks: { label: string, url: string, color?: string }[] = [];
    let examYoutubeVideos: { url: string, title: string }[] = [];
    let examLogoUrl = '';

    try {
      const trimmedDesc = exam.description.trim();
      if (trimmedDesc.startsWith('[') || trimmedDesc.startsWith('{')) {
        const parsedData = JSON.parse(trimmedDesc);
        
        const sectionsToProcess = Array.isArray(parsedData) ? parsedData : (parsedData.sections || []);
        if (!Array.isArray(parsedData)) {
          examStatus = parsedData.status || 'Confirmed';
          examCustomDates = parsedData.important_dates || [];
          examLogoUrl = parsedData.logo_url || '';
          
          // Handle multiple links
          if (parsedData.official_links) {
            examOfficialLinks = parsedData.official_links.map((l: any) => ({ ...l, color: l.color || 'blue' }));
          } else if (parsedData.official_website) {
            examOfficialLinks = [{ label: 'Official Website', url: parsedData.official_website, color: 'blue' }];
          } else if (exam.link) {
            examOfficialLinks = [{ label: 'Official Website', url: exam.link, color: 'blue' }];
          }

          if (parsedData.notification_links) {
            examNotificationLinks = parsedData.notification_links.map((l: any) => ({ ...l, color: l.color || 'red' }));
          } else if (parsedData.notification_pdf) {
            examNotificationLinks = [{ label: 'Notification PDF', url: parsedData.notification_pdf, color: 'red' }];
          }
          
          // Handle both legacy string array and new object array
          const rawVideos = parsedData.youtube_videos || [];
          examYoutubeVideos = rawVideos.map((v: any) => {
            if (typeof v === 'string') return { url: v, title: 'Preparation Video' };
            return v;
          });
        }

        sectionsToProcess.forEach((sec: any) => {
          const id = sec.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          generatedToc.push({ id, text: sec.title });
          
          generatedSections.push({
            ...sec,
            id
          });
        });
        
        if (examYoutubeVideos.length > 0) {
          generatedToc.push({ id: 'videos', text: 'Preparation Videos' });
        }
        
        return { 
          toc: generatedToc, 
          sections: generatedSections, 
          status: examStatus, 
          customDates: examCustomDates,
          officialLinks: examOfficialLinks,
          notificationLinks: examNotificationLinks,
          youtubeVideos: examYoutubeVideos,
          logoUrl: examLogoUrl
        };
      }
    } catch (e) {
      console.error("Failed to parse JSON description, falling back to HTML", e);
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(exam.description, 'text/html');
    
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
    
    return { 
      toc: generatedToc, 
      sections: generatedSections, 
      status: 'Confirmed', 
      customDates: [],
      officialLinks: exam.link ? [{ label: 'Official Website', url: exam.link }] : [],
      notificationLinks: [],
      youtubeVideos: [],
      logoUrl: ''
    };
  }, [exam?.description, exam?.link]);

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
    <div className="min-h-screen bg-gray-50">
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
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
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
                    )}

                    {section.type === 'faq' && (
                      <FAQSection faqData={section.faqData} />
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
                                    className={`border border-gray-200 px-4 py-3 text-sm text-gray-700 ${section.tableData.boldCells?.[i]?.[j] ? 'font-bold' : ''} [&_a]:no-underline hover:[&_a]:underline [&_a]:text-blue-600 [&_a]:font-medium [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1`} 
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
                ))}
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
                          {/* Static play button for mobile/always visible */}
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
                {/* Click outside to close */}
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
                           // Fallback to text-based matching if icon is not explicitly set
                           d.label.toLowerCase().includes('notification') ? <Bell size={14} className="text-white" /> : 
                           d.label.toLowerCase().includes('exam') ? <Calendar size={14} className="text-white" /> :
                           d.label.toLowerCase().includes('admit') ? <FileText size={14} className="text-white" /> :
                           d.label.toLowerCase().includes('result') ? <CheckCircle2 size={14} className="text-white" /> :
                           d.label.toLowerCase().includes('download') ? <Download size={14} className="text-white" /> :
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
