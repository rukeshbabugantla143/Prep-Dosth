import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Search, Phone, LogIn, Menu, ChevronDown, ChevronRight, Plus, Users, Landmark, BookOpen, GraduationCap, Train, Shield, Building, Map, Award, FileText, PlayCircle, Cpu, Activity, Scale, Briefcase, Twitter, Facebook, Instagram, Linkedin, Youtube, Mail, Smartphone, MonitorPlay, ArrowRight } from "lucide-react";
import { useState } from "react";

const examCategories = [
  { id: 'SSC Exams', icon: <Users size={18} />, items: ['SSC GD Constable', 'SSC CHSL', 'SSC Selection Post', 'SBI Clerk', 'SBI CBO', 'RBI Assistant', 'SSC JE', 'IBPS SO'] },
  { id: 'Banking Exams', icon: <Landmark size={18} />, items: ['SBI Clerk', 'SBI PO', 'IBPS PO', 'IBPS Clerk', 'RBI Assistant', 'RBI Grade B'] },
  { id: 'Teaching Exams', icon: <BookOpen size={18} />, items: ['CTET', 'UPTET', 'KVS', 'DSSSB', 'Super TET', 'NVS'] },
  { id: 'Civil Services', icon: <GraduationCap size={18} />, items: ['UPSC Prelims', 'UPSC Mains', 'UPPSC', 'BPSC', 'MPSC', 'RPSC'] },
  { id: 'Railway Exams', icon: <Train size={18} />, items: ['RRB NTPC', 'RRB Group D', 'RRB ALP', 'RRB JE', 'RPF Constable', 'RPF SI'] },
  { id: 'Defence Exams', icon: <Shield size={18} />, items: ['NDA', 'CDS', 'AFCAT', 'CAPF', 'Airforce X & Y', 'Navy AA/SSR'] },
  { id: 'Engineering CETs', icon: <Cpu size={18} />, items: ['JEE Main', 'MHT CET', 'KCET', 'AP EAPCET', 'TS EAMCET', 'WBJEE', 'BITSAT', 'AP ECET', 'TS ECET'] },
  { id: 'Medical CETs', icon: <Activity size={18} />, items: ['NEET UG', 'NEET PG', 'AIIMS', 'JIPMER', 'AFMC'] },
  { id: 'Management CETs', icon: <Briefcase size={18} />, items: ['CAT', 'MAT', 'XAT', 'CMAT', 'NMAT', 'SNAP'] },
  { id: 'Law CETs', icon: <Scale size={18} />, items: ['CLAT', 'AILET', 'LSAT India', 'MH CET Law'] },
  { id: 'University CETs', icon: <GraduationCap size={18} />, items: ['CUET UG', 'CUET PG', 'IPU CET', 'PU CET'] },
];

const jobCategories = [
  { id: 'Central Govt', icon: <Building size={18} />, items: ['UPSC Recruitment', 'SSC Recruitment', 'Railway Jobs', 'Post Office Jobs', 'PSU Jobs'] },
  { id: 'State Govt', icon: <Map size={18} />, items: ['UP Govt Jobs', 'Bihar Govt Jobs', 'MP Govt Jobs', 'Rajasthan Jobs', 'Delhi Jobs'] },
  { id: 'Bank Jobs', icon: <Landmark size={18} />, items: ['SBI Jobs', 'IBPS Jobs', 'RBI Jobs', 'NABARD Jobs', 'Cooperative Banks'] },
  { id: 'Defence Jobs', icon: <Shield size={18} />, items: ['Indian Army', 'Indian Navy', 'Indian Air Force', 'Coast Guard', 'Paramilitary'] },
];

const testCategories = [
  { id: 'Full Length Tests', icon: <FileText size={18} />, items: ['SSC CGL Tier 1', 'SBI PO Prelims', 'RRB NTPC CBT 1', 'CTET Paper 1', 'UPSC CSAT'] },
  { id: 'Subject Tests', icon: <BookOpen size={18} />, items: ['Quantitative Aptitude', 'Logical Reasoning', 'English Language', 'General Awareness', 'Current Affairs'] },
  { id: 'Previous Papers', icon: <PlayCircle size={18} />, items: ['SSC CGL 2025', 'SBI PO 2025', 'RRB NTPC 2024', 'UPSC Prelims 2025', 'CTET 2025'] },
];

function MegaMenuDropdown({ categories, basePath, offsetClass = 'left-0' }: { categories: any[], basePath: string, offsetClass?: string }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <div 
      className={`absolute top-full ${offsetClass} bg-white shadow-xl border border-gray-200 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex overflow-hidden`}
      onMouseLeave={() => setActiveCategory(null)}
    >
      {/* Left Column */}
      <div className="w-60 bg-white py-2 flex-shrink-0">
        {categories.map(cat => (
          <div
            key={cat.id}
            onMouseEnter={() => setActiveCategory(cat.id)}
            className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${activeCategory === cat.id ? 'bg-gray-50 border-l-4 border-[#15b86c]' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
          >
            <div className="flex items-center gap-3 text-gray-700 font-semibold text-sm">
              <span className={activeCategory === cat.id ? 'text-[#15b86c]' : 'text-gray-500'}>{cat.icon}</span>
              {cat.id}
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <ChevronRight size={14} />
              <Plus size={14} />
            </div>
          </div>
        ))}
      </div>

      {/* Right Column */}
      {activeCategory && (
        <div className="w-[400px] bg-slate-50 border-l border-gray-200 p-6 flex-shrink-0">
          <div className="grid grid-cols-2 gap-3">
            {categories.find(c => c.id === activeCategory)?.items.map((item: string) => (
              <Link to={basePath} key={item} className="flex items-center gap-3 bg-white border border-gray-200 p-3 rounded-lg hover:border-[#15b86c] hover:shadow-md transition group/item">
                <div className="bg-red-50 p-1.5 rounded-md text-red-500 group-hover/item:bg-[#15b86c]/10 group-hover/item:text-[#15b86c] transition-colors flex-shrink-0">
                  <Award size={16} />
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover/item:text-[#15b86c] transition-colors truncate">{item}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MainLayout() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      {/* Top Bar */}
      <div className="bg-[#1d2027] text-gray-300 text-xs py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex space-x-4">
            <span className="flex items-center gap-1"><Phone size={12} />949412348</span>
            <span>support@prepdosth.com</span>
          </div>
          <div className="flex space-x-4">
            <Link to="#" className="hover:text-white">Download App</Link>
            <Link to="#" className="hover:text-white">Teach with us</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center">
                <img src="https://res.cloudinary.com/dbkmzja6c/image/upload/v1773433603/prepdosth_zvc5qm.png" alt="PrepDosth Logo" className="h-8 object-contain" referrerPolicy="no-referrer" />
              </Link>
              <nav className="hidden md:flex space-x-6 text-sm font-semibold text-gray-700 h-full items-center">
                <Link to="/" className="hover:text-[#15b86c] transition py-5">Home</Link>
                
                <div className="relative group h-full flex items-center">
                  <Link to="/jobs" className="hover:text-[#15b86c] transition flex items-center gap-1 py-5">Jobs <ChevronDown size={14} /></Link>
                  <MegaMenuDropdown categories={jobCategories} basePath="/jobs" offsetClass="left-0" />
                </div>

                <div className="relative group h-full flex items-center">
                  <Link to="/exams" className="hover:text-[#15b86c] transition flex items-center gap-1 py-5">Exams <ChevronDown size={14} /></Link>
                  <MegaMenuDropdown categories={examCategories} basePath="/exams" offsetClass="-left-20" />
                </div>

                <div className="relative group h-full flex items-center">
                  <Link to="/tests" className="hover:text-[#15b86c] transition flex items-center gap-1 py-5">Mock Tests <ChevronDown size={14} /></Link>
                  <MegaMenuDropdown categories={testCategories} basePath="/tests" offsetClass="-left-40" />
                </div>

                <div className="relative group h-full flex items-center">
                  <Link to="/premium" className="hover:text-yellow-600 text-yellow-500 transition flex items-center gap-1 py-5">Premium <ChevronDown size={14} /></Link>
                  <div className="absolute top-full right-0 w-64 bg-white shadow-xl border border-gray-100 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col py-2">
                    <Link to="/premium" className="px-4 py-2 hover:bg-yellow-50 hover:text-yellow-600 text-gray-700">Railway Premium Content</Link>
                    <Link to="/premium" className="px-4 py-2 hover:bg-yellow-50 hover:text-yellow-600 text-gray-700">Premium Mock Tests</Link>
                    <Link to="/premium" className="px-4 py-2 hover:bg-yellow-50 hover:text-yellow-600 text-gray-700">Paid Courses</Link>
                  </div>
                </div>

                <Link to="/about" className="hover:text-[#15b86c] transition py-5">About</Link>
                <Link to="/contact" className="hover:text-[#15b86c] transition py-5">Contact</Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden lg:flex items-center bg-gray-100 rounded-full px-3 py-1.5 border border-gray-200 focus-within:border-[#15b86c] focus-within:bg-white transition">
                <Search size={16} className="text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search exams..." 
                  className="bg-transparent border-none focus:ring-0 text-sm px-2 w-48 outline-none"
                />
              </div>

              {user ? (
                <div className="hidden md:flex items-center gap-4">
                  <Link to={user.role === "admin" ? "/admin" : "/user"} className="text-sm font-bold text-gray-700 hover:text-[#15b86c]">Dashboard</Link>
                  <button onClick={logout} className="text-sm font-bold text-red-500 hover:text-red-600">Logout</button>
                </div>
              ) : (
                <Link to="/login" className="hidden md:flex items-center gap-2 bg-[#1d2027] text-white px-5 py-2 rounded-md font-bold text-sm hover:bg-gray-800 transition shadow-sm">
                  <LogIn size={16} /> Login / Register
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button 
                className="md:hidden text-gray-600"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-4 shadow-lg absolute w-full left-0">
            <Link to="/" className="block text-gray-700 font-semibold hover:text-[#15b86c]" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            <Link to="/jobs" className="block text-gray-700 font-semibold hover:text-[#15b86c]" onClick={() => setIsMobileMenuOpen(false)}>Jobs</Link>
            <Link to="/exams" className="block text-gray-700 font-semibold hover:text-[#15b86c]" onClick={() => setIsMobileMenuOpen(false)}>Exams</Link>
            <Link to="/tests" className="block text-gray-700 font-semibold hover:text-[#15b86c]" onClick={() => setIsMobileMenuOpen(false)}>Mock Tests</Link>
            <Link to="/premium" className="block text-yellow-500 font-semibold hover:text-yellow-600" onClick={() => setIsMobileMenuOpen(false)}>Premium</Link>
            <Link to="/about" className="block text-gray-700 font-semibold hover:text-[#15b86c]" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
            <Link to="/contact" className="block text-gray-700 font-semibold hover:text-[#15b86c]" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
            {user ? (
              <>
                <Link to={user.role === "admin" ? "/admin" : "/user"} className="block text-gray-700 font-semibold hover:text-[#15b86c]" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="block text-red-500 font-semibold hover:text-red-600">Logout</button>
              </>
            ) : (
              <Link to="/login" className="block text-[#15b86c] font-semibold" onClick={() => setIsMobileMenuOpen(false)}>Login / Register</Link>
            )}
          </div>
        )}
      </header>

      <main className="flex-grow w-full">
        <Outlet />
      </main>

      <footer className="bg-[#0a0a0a] text-gray-300 pt-16 pb-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
            <div className="lg:col-span-2">
              <Link to="/" className="inline-block mb-6">
                <img src="https://res.cloudinary.com/dbkmzja6c/image/upload/v1773433603/prepdosth_zvc5qm.png" alt="PrepDosth Logo" className="h-10 object-contain" referrerPolicy="no-referrer" />
              </Link>
              <p className="text-gray-400 mb-8 leading-relaxed max-w-md">
                India's most trusted preparation platform for competitive exams. We empower millions of students to achieve their career goals with top-tier educators and comprehensive study materials.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#15b86c] hover:text-white transition-all duration-300">
                  <Facebook size={18} />
                </a>
                <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#15b86c] hover:text-white transition-all duration-300">
                  <Twitter size={18} />
                </a>
                <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#15b86c] hover:text-white transition-all duration-300">
                  <Instagram size={18} />
                </a>
                <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#15b86c] hover:text-white transition-all duration-300">
                  <Linkedin size={18} />
                </a>
                <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#15b86c] hover:text-white transition-all duration-300">
                  <Youtube size={18} />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 text-lg">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link to="/about" className="hover:text-[#15b86c] transition-colors flex items-center gap-2"><ChevronRight size={14} className="text-[#15b86c]" /> About Us</Link></li>
                <li><Link to="#" className="hover:text-[#15b86c] transition-colors flex items-center gap-2"><ChevronRight size={14} className="text-[#15b86c]" /> Careers</Link></li>
                <li><Link to="#" className="hover:text-[#15b86c] transition-colors flex items-center gap-2"><ChevronRight size={14} className="text-[#15b86c]" /> Teach Online</Link></li>
                <li><Link to="#" className="hover:text-[#15b86c] transition-colors flex items-center gap-2"><ChevronRight size={14} className="text-[#15b86c]" /> Media & Press</Link></li>
                <li><Link to="/contact" className="hover:text-[#15b86c] transition-colors flex items-center gap-2"><ChevronRight size={14} className="text-[#15b86c]" /> Contact Us</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 text-lg">Products</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link to="/tests" className="hover:text-[#15b86c] transition-colors flex items-center gap-2"><ChevronRight size={14} className="text-[#15b86c]" /> Test Series</Link></li>
                <li><Link to="/jobs" className="hover:text-[#15b86c] transition-colors flex items-center gap-2"><ChevronRight size={14} className="text-[#15b86c]" /> SuperCoaching</Link></li>
                <li><Link to="/premium" className="hover:text-[#15b86c] transition-colors flex items-center gap-2"><ChevronRight size={14} className="text-[#15b86c]" /> PrepDosth Pass</Link></li>
                <li><Link to="/premium" className="hover:text-[#15b86c] transition-colors flex items-center gap-2"><ChevronRight size={14} className="text-[#15b86c]" /> Online Courses</Link></li>
                <li><Link to="#" className="hover:text-[#15b86c] transition-colors flex items-center gap-2"><ChevronRight size={14} className="text-[#15b86c]" /> E-Books</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 text-lg">Stay Updated</h4>
              <p className="text-gray-400 text-sm mb-4">Subscribe to our newsletter for the latest exam updates and offers.</p>
              <div className="relative mb-6">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#15b86c] transition-colors"
                />
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <button className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#15b86c] rounded-md flex items-center justify-center text-white hover:bg-[#129c5b] transition-colors">
                  <ArrowRight size={16} />
                </button>
              </div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Download App</h4>
              <div className="flex flex-col gap-3">
                <button className="w-full bg-white/5 border border-white/10 text-white py-2.5 px-4 rounded-lg flex items-center gap-3 hover:bg-white/10 transition-colors group">
                  <Smartphone size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                  <div className="text-left">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider leading-none mb-1">Get it on</div>
                    <div className="text-sm font-semibold leading-none">Google Play</div>
                  </div>
                </button>
                <button className="w-full bg-white/5 border border-white/10 text-white py-2.5 px-4 rounded-lg flex items-center gap-3 hover:bg-white/10 transition-colors group">
                  <MonitorPlay size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                  <div className="text-left">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider leading-none mb-1">Download on the</div>
                    <div className="text-sm font-semibold leading-none">App Store</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} PrepDosth. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="#" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="#" className="hover:text-white transition-colors">Refund Policy</Link>
              <Link to="#" className="hover:text-white transition-colors">Sitemap</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
