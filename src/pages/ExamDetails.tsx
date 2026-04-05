import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { slugify } from '../utils';
import { Calendar, FileText, ExternalLink, ArrowLeft, Clock, ChevronRight, CheckCircle2, BookOpen, PlayCircle, Download, Bell, Play, X, Link as LinkIcon, AlertCircle, Info, Trophy, Folder, Users, Globe, Zap, Layers } from 'lucide-react';
import { format } from 'date-fns';
import FAQSection from '../components/FAQSection';
import IconList from '../components/common/IconList';
import SEO from '../components/common/SEO';


export default function ExamDetails() {
  const { slug } = useParams();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [importantLinks, setImportantLinks] = useState<any[]>([]);
  const [parentExam, setParentExam] = useState<any>(null);
  const [subpages, setSubpages] = useState<any[]>([]);
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

          // NEW: Fetch related pages (parent and all subpages) for sidebar consistency
          const parentId = foundExam.parent_id || foundExam.id;
          const { data: relatedData } = await supabase
            .from('exams')
            .select('id, title, is_subpage, parent_id')
            .or(`id.eq.${parentId},parent_id.eq.${parentId}`)
            .order('created_at', { ascending: true });
          
          if (relatedData) {
            // Sort: Parent first, then subpages
            const sortedLinks = relatedData.sort((a, b) => {
              if (a.id === parentId) return -1;
              if (b.id === parentId) return 1;
              return 0;
            });
            setSubpages(sortedLinks);
          }

          // Set parent exam for breadcrumbs/info
          if (foundExam.parent_id) {
            const parent = relatedData?.find(r => r.id === foundExam.parent_id);
            if (parent) setParentExam(parent);
          } else {
            setParentExam(null);
          }
        }
      }
      if (error) console.error("Error fetching exam details:", error);
      setLoading(false);
    };
    fetchExam();
  }, [slug]);

  const { toc, sections, status, customDates, officialLinks, notificationLinks, youtubeVideos, logoUrl, promoTitle, promoDescription, promoButtonText, promoLink, promoBgColor, bannerImage, featuredTestIds } = React.useMemo(() => {
    if (!exam?.description) return { toc: [], sections: [], status: 'Confirmed', customDates: [], officialLinks: [], notificationLinks: [], youtubeVideos: [], logoUrl: '', promoTitle: '', promoDescription: '', promoButtonText: '', promoLink: '', promoBgColor: '', bannerImage: '', featuredTestIds: [] };
    
    const generatedToc: { id: string, text: string }[] = [];
    const generatedSections: any[] = [];
    let examStatus = 'Confirmed';
    let examCustomDates: { label: string, date: string, icon?: string, status?: string }[] = [];
    let examOfficialLinks: { label: string, url: string, color?: string }[] = [];
    let examNotificationLinks: { label: string, url: string, color?: string }[] = [];
    let examYoutubeVideos: { url: string, title: string }[] = [];
    let examLogoUrl = '';
    let examPromoTitle = '';
    let examPromoDescription = '';
    let examPromoButtonText = '';
    let examPromoLink = '';
    let examPromoBgColor = '';
    let examBannerImage = '';
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
          examPromoTitle = parsedData.promo_title || parsedData.banner_text || '';
          examPromoDescription = parsedData.promo_description || '';
          examPromoButtonText = parsedData.promo_button_text || '';
          examPromoLink = parsedData.promo_link || '';
          examPromoBgColor = parsedData.promo_bg_color || 'from-red-900 to-black';
          examBannerImage = parsedData.banner_image || '';
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
          toc: generatedToc, sections: generatedSections, status: examStatus, customDates: examCustomDates,
          officialLinks: examOfficialLinks, notificationLinks: examNotificationLinks, 
          youtubeVideos: examYoutubeVideos, logoUrl: examLogoUrl, 
          promoTitle: examPromoTitle, promoDescription: examPromoDescription, 
          promoButtonText: examPromoButtonText, promoLink: examPromoLink, promoBgColor: examPromoBgColor,
          bannerImage: examBannerImage,
          featuredTestIds: examFeaturedTestIds 
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
      notificationLinks: [], youtubeVideos: [], logoUrl: '', promoTitle: '', promoDescription: '', promoButtonText: '', promoLink: '', promoBgColor: '', bannerImage: '', featuredTestIds: []
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

  const handleDownloadPDF = () => {
    window.print();
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
      <SEO 
        title={exam.title} 
        description={`${exam.title} Preparation, Mock Tests, Syllabus, Pattern, and Eligibility criteria. Registration process and important dates for ${exam.title}.`}
      />
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 py-3 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center text-sm text-gray-500">
            <Link to="/" className="hover:text-[#15b86c]">Home</Link>
            <ChevronRight size={16} className="mx-2" />
            <Link to="/exams" className="hover:text-[#15b86c]">Exams</Link>
            {parentExam && (
              <>
                <ChevronRight size={16} className="mx-2" />
                <Link to={`/exams/${slugify(parentExam.title)}`} className="hover:text-[#15b86c]">
                  {parentExam.title}
                </Link>
              </>
            )}
            <ChevronRight size={16} className="mx-2" />
            <span className="text-gray-900 font-medium truncate">{exam.title}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {parentExam && (
            <div className="mb-6 animate-in slide-in-from-left-4 duration-500">
              <Link 
                to={`/exams/${slugify(parentExam.title)}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all shadow-sm"
              >
                <ArrowLeft size={14} /> Part of {parentExam.title}
              </Link>
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="hidden md:block w-64 shrink-0">
              <img src={logoUrl || "https://cdni.iconscout.com/illustration/premium/thumb/online-education-4364975-3625624.png"} alt="Exam Logo" className="w-full h-auto object-contain max-h-48" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                {exam.title}
              </h1>
              <div className="flex flex-wrap gap-4">
                <Link to="/tests" className="bg-[#15b86c] text-white px-6 py-2.5 rounded font-medium hover:bg-[#12a15e] transition flex items-center gap-2">
                  Get Started for Free
                </Link>
                <button 
                  onClick={handleDownloadPDF}
                  className="bg-white text-[#15b86c] border border-[#15b86c] px-6 py-2.5 rounded font-medium hover:bg-green-50 transition flex items-center gap-2 print:hidden"
                >
                  <Download size={18} />
                  Download as PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Navigation */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm print:hidden transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 md:space-x-8 overflow-x-auto scrollbar-hide py-1">
            {tabs.map((tab) => (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`group py-4 px-3 text-xs md:text-sm font-black whitespace-nowrap border-b-2 transition-all relative ${
                  activeTab === tab.id
                    ? 'border-[#15b86c] text-[#15b86c]'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <span className="relative z-10 uppercase tracking-tighter">{tab.text}</span>
                {activeTab === tab.id && (
                  <div className="absolute inset-0 bg-green-50/50 -z-0 rounded-t-lg animate-in fade-in duration-500"></div>
                )}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div id="exam-content-pdf" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative bg-gray-50">
        
        {/* Watermark for PDF Export */}
        <div className="fixed inset-0 pointer-events-none z-0 flex justify-center items-center opacity-10 overflow-hidden hidden print:flex">
          <img src="https://cdni.iconscout.com/illustration/premium/thumb/online-education-4364975-3625624.png" alt="Watermark" className="w-[60%] max-w-[500px] object-contain" referrerPolicy="no-referrer" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 relative z-10">
          
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
                      <div id="mock-tests" className="bg-gradient-to-br from-[#15b86c]/20 via-[#f0fdf4] to-blue-50/30 p-6 md:p-8 rounded-[32px] shadow-sm border border-green-100/50 scroll-mt-32 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#15b86c]/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100/20 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

                        <div className="flex justify-between items-end mb-6 relative z-10">
                          <div>
                            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-tighter">
                              <div className="w-8 h-8 bg-[#15b86c] rounded-lg flex items-center justify-center shadow-lg shadow-green-200">
                                <Trophy className="text-white" size={18} />
                              </div>
                              Practice Mock Tests
                            </h2>
                            <p className="text-gray-600 text-[11px] mt-1.5 uppercase font-black tracking-widest opacity-90 pl-11">Hand-picked assessments for your {exam.title} preparation.</p>
                          </div>
                          <Link to="/tests" className="text-[#15b86c] text-[11px] font-black uppercase tracking-widest hover:bg-[#15b86c] hover:text-white px-6 py-2 bg-white rounded-full transition-all shadow-md shadow-green-100/50 border border-green-100 whitespace-nowrap shrink-0">View All</Link>
                        </div>

                        {/* Pixel-Perfect Premium Series Card */}
                        {/* Grid container for individual test cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                          {tests.map((test: any) => (
                            <div key={test.id} className="bg-white rounded-[24px] border border-white overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col relative w-full h-full p-4 mt-0 group">
                              {/* Glowing Background Effect on Hover */}
                              <div className="absolute inset-0 bg-gradient-to-br from-[#15b86c]/5 to-blue-50/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                              {/* Header: Logo and Users */}
                              <div className="flex justify-between items-start mb-3 relative z-10">
                                <div className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center p-1.5 border border-gray-100 shadow-inner group-hover:bg-white transition-colors duration-300">
                                  <img src={test.logo_url || logoUrl || "https://cdni.iconscout.com/illustration/premium/thumb/online-education-4364975-3625624.png"} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                                </div>
                                
                              </div>
                              
                              {/* Title */}
                              <div className="relative z-10">
                                <h2 className="text-[16px] font-black text-gray-900 leading-snug mb-0.5 line-clamp-2 min-h-0 group-hover:text-[#15b86c] transition-colors duration-300">
                                  {test.title}
                                </h2>

                                {/* Tests Count */}
                                <div className="text-[12px] mb-1.5 text-gray-500 font-bold tracking-tight">
                                  {test.total_tests || 1} Tests <span className="text-gray-200 mx-1">•</span> <span className="text-[#15b86c]">{test.free_tests || (test.is_free ? 1 : 0)} Free</span>
                                </div>

                                {/* Languages */}
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[#06b6d4] text-[10px] mb-3 rounded font-black uppercase tracking-widest border border-blue-100">
                                  <Globe size={10} /> {test.languages || 'English'}
                                </div>

                                {/* Features List */}
                                <ul className="text-[12px] text-gray-600 space-y-1.5 mb-4 flex-grow list-none p-0">
                                  {test.is_live && (
                                    <li className="flex items-center gap-2">
                                      <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse"></div>
                                      Live Test Series
                                    </li>
                                  )}
                                  <li className="flex items-center gap-2">
                                    <CheckCircle2 size={12} className="text-[#15b86c]" /> 
                                    Latest Exam Pattern
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckCircle2 size={12} className="text-[#15b86c]" /> 
                                    Detailed Analysis
                                  </li>
                                </ul>

                                {/* Footer Action Button */}
                                <Link 
                                  to={`/user/test/${test.id}`}
                                  className="w-full bg-[#15b86c] hover:bg-[#12a15e] text-white py-2.5 rounded-xl text-xs font-black transition-all duration-300 text-center block mt-auto shadow-lg shadow-green-100 uppercase tracking-widest"
                                >
                                  Start Mock Test
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
                
                {/* Fallback if sections < 2: show tests at the end */}
                {sections.length < 2 && tests.length > 0 && (
                  <div id="mock-tests" className="bg-gradient-to-br from-blue-50/50 via-[#f8fbff] to-indigo-50/50 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 scroll-mt-32 overflow-hidden relative">
                    <div className="flex justify-between items-end mb-5 relative z-10">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 uppercase tracking-tight">
                          <Trophy className="text-[#0ea5e9]" size={28} /> Practice Mock Tests
                        </h2>
                        <p className="text-gray-500 text-[10px] mt-0.5 uppercase font-black tracking-widest opacity-80">Hand-picked assessments for your {exam.title} preparation.</p>
                      </div>
                      <Link to={`/user/series/${encodeURIComponent(tests[0]?.category)}`} className="text-[#0ea5e9] text-[11px] font-black uppercase tracking-widest hover:underline px-6 py-2 bg-white/80 backdrop-blur-sm rounded-full transition-all shadow-sm border border-blue-100/50 whitespace-nowrap shrink-0">View All</Link>
                    </div>

                    {/* Pixel-Perfect Premium Series Card (Fallback) */}
                    {/* Grid container for individual test cards (Fallback) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {tests.map((test: any) => (
                        <div key={test.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col relative w-full h-full p-4 mt-0">
                          {/* Header: Logo and Users */}
                          <div className="flex justify-between items-start mb-3 relative z-10">
                            <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 p-1.5">
                              <img src={test.logo_url || logoUrl || "https://cdni.iconscout.com/illustration/premium/thumb/online-education-4364975-3625624.png"} alt="Logo" className="w-full h-full object-contain rounded-full" />
                            </div>
                          </div>
                          
                          {/* Title */}
                          <h2 className="text-[15px] font-bold text-gray-900 leading-snug mb-0.5 line-clamp-2 min-h-0">
                            {test.title}
                          </h2>

                          {/* Tests Count */}
                          <div className="text-[12px] mb-1 text-gray-700 font-semibold tracking-wide">
                            {test.total_tests || 1} Total Tests <span className="text-gray-200 mx-1">|</span> <span className="text-[#15b86c]">{test.free_tests || (test.is_free ? 1 : 0)} Free Tests</span>
                          </div>

                          {/* Languages */}
                          <div className="text-[#06b6d4] text-[12px] mb-2 pb-2 border-b border-gray-50 font-bold uppercase tracking-tighter">
                            {test.languages || 'English, Telugu, Hindi'}
                          </div>

                          {/* Features List */}
                          <ul className="text-[12px] text-gray-600 space-y-1.5 mb-1 flex-grow list-disc pl-4 marker:text-gray-300">
                            {test.is_live && <li>Live Test</li>}
                            {test.test_type === "Chapter Test" && <li>Chapter Test</li>}
                            {test.test_type === "CA Booster" && <li>CA Booster</li>}
                            {!test.is_live && test.test_type !== "Chapter Test" && test.test_type !== "CA Booster" && (
                              <>
                                <li>Latest Exam Pattern</li>
                                <li>Detailed Performance Analysis</li>
                              </>
                            )}
                            <li>Real-time Data</li>
                          </ul>

                          {/* More Tests Link */}
                          <div className="text-[#15b86c] text-[12px] font-black mb-3 flex items-center gap-1">
                            +{test.more_tests || Math.floor(Math.random() * 50) + 5} more tests
                          </div>

                          {/* Footer Action Button */}
                          <Link 
                            to={`/user/test/${test.id}`}
                            className="w-full bg-[#06b6d4] hover:bg-[#0891b2] text-white py-2 rounded-lg text-sm font-black transition-all duration-300 text-center block mt-auto shadow-sm tracking-tight uppercase"
                          >
                            Start Test
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
          <div className="lg:w-1/3 print:hidden">
            <div className="sticky top-32 space-y-6 self-start">
              {/* Promo Banner */}
              {bannerImage ? (
                <div className="rounded-lg shadow-md overflow-hidden">
                  <img src={bannerImage} alt="Promo" className="w-full h-auto object-cover" />
                </div>
              ) : (
                <div className={`bg-gradient-to-br ${promoBgColor ? promoBgColor : 'from-red-900 to-black'} rounded-lg p-6 text-white text-center shadow-md`}>
                  <h3 className="text-2xl font-bold mb-2">{promoTitle ? promoTitle : `Crack ${exam.title}`}</h3>
                  <p className="text-sm text-gray-300 mb-4">{promoDescription ? promoDescription : "With India's Super Teachers"}</p>
                  {promoLink ? (
                    <Link to={promoLink} className="bg-white text-gray-900 font-bold px-4 py-2 rounded w-full hover:bg-gray-100 transition block text-center">
                      {promoButtonText ? promoButtonText : "Join SuperCoaching"}
                    </Link>
                  ) : (
                    <button className="bg-white text-gray-900 font-bold px-4 py-2 rounded w-full hover:bg-gray-100 transition">
                      {promoButtonText ? promoButtonText : "Join SuperCoaching"}
                    </button>
                  )}
                </div>
              )}

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

              {/* NEW: Subpages (Quick Links to Specific Pages) */}
              {subpages.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                    <h3 className="font-bold text-blue-900 flex items-center gap-2 uppercase text-[10px] tracking-widest">
                      <Layers size={16} /> Important Links
                    </h3>
                  </div>
                  <div className="p-2">
                    {subpages.map((sub, idx) => (
                      <Link 
                        key={sub.id} 
                        to={`/exams/${slugify(sub.title)}`} 
                        className="flex items-center justify-between p-4 hover:bg-blue-50/50 rounded-xl transition group border-b border-gray-50 last:border-0"
                      >
                        <span className={`text-[14px] font-medium transition-colors truncate flex-1 min-w-0 ${slugify(sub.title) === slug ? 'text-blue-600' : 'text-gray-700 group-hover:text-blue-600'}`}>
                        {sub.title}
                      </span>
                        <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
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
