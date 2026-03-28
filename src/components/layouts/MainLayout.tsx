import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Phone, Twitter, Facebook, Instagram, Linkedin, Youtube, Mail, Smartphone, MonitorPlay, ArrowRight, ChevronRight } from "lucide-react";
import Header from "../common/Header";

export default function MainLayout() {
  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans overflow-hidden">
      <div className="shrink-0 z-50">
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

        <Header />
      </div>

      <main id="main-content" className="flex-grow w-full overflow-y-auto">
        <Outlet />
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
    </main>
  </div>
);
}
