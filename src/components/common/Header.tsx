import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabaseClient";
import { 
  Search, 
  LogIn, 
  Menu, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Users, 
  Landmark, 
  BookOpen, 
  GraduationCap, 
  Train, 
  Shield, 
  Building, 
  Map, 
  Award, 
  FileText, 
  PlayCircle, 
  Cpu, 
  Activity, 
  Scale, 
  Briefcase 
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  path: string;
  order_index: number;
  is_active: boolean;
}

interface MegaMenuCategory {
  id: string;
  menu_type: string;
  category_title: string;
  icon_name: string;
  items: string[];
  order_index: number;
}

const getIcon = (name: string) => {
  const icons: Record<string, any> = {
    Users: <Users size={18} />,
    Landmark: <Landmark size={18} />,
    BookOpen: <BookOpen size={18} />,
    GraduationCap: <GraduationCap size={18} />,
    Train: <Train size={18} />,
    Shield: <Shield size={18} />,
    Cpu: <Cpu size={18} />,
    Activity: <Activity size={18} />,
    Briefcase: <Briefcase size={18} />,
    Scale: <Scale size={18} />,
    FileText: <FileText size={18} />,
    PlayCircle: <PlayCircle size={18} />,
    Building: <Building size={18} />,
    Map: <Map size={18} />,
    Award: <Award size={18} />
  };
  return icons[name] || <Users size={18} />;
};

function MegaMenuDropdown({ categories, basePath, offsetClass = 'left-0' }: { categories: any[], basePath: string, offsetClass?: string }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <div 
      className={`absolute top-full ${offsetClass} bg-white shadow-xl border border-gray-200 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex overflow-hidden`}
      onMouseLeave={() => setActiveCategory(null)}
    >
      {/* Left Column */}
      <div className="w-60 bg-white py-2 flex-shrink-0">
        {categories.filter(cat => cat.items?.length > 0).map(cat => (
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
          {categories.find(c => c.id === activeCategory)?.items?.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {categories.find(c => c.id === activeCategory)?.items.map((item: any) => {
                const label = typeof item === 'string' ? item : item.label;
                return (
                  <Link to={`${basePath}?search=${encodeURIComponent(label.replace(/<[^>]*>?/gm, ''))}`} key={label} className="flex items-center gap-3 bg-white border border-gray-200 p-3 rounded-lg hover:border-[#15b86c] hover:shadow-md transition group/item">
                    <div className="bg-red-50 p-1.5 rounded-md text-red-500 group-hover/item:bg-[#15b86c]/10 group-hover/item:text-[#15b86c] transition-colors flex-shrink-0">
                      <Award size={16} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 group-hover/item:text-[#15b86c] transition-colors truncate">
                      {label.replace(/<[^>]*>?/gm, '')}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No items found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dynamicMenu, setDynamicMenu] = useState<MenuItem[]>([]);
  const [megaMenuData, setMegaMenuData] = useState<MegaMenuCategory[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [navRes, megaRes] = await Promise.all([
        supabase.from("navigation").select("*").eq("is_active", true).order("order_index", { ascending: true }),
        supabase.from("mega_menu").select("*").order("order_index", { ascending: true })
      ]);
      
      if (navRes.data) setDynamicMenu(navRes.data);
      if (megaRes.data) setMegaMenuData(megaRes.data);
    };
    fetchData();
  }, []);

  const getMegaMenuCategories = (type: string) => {
    return megaMenuData
      .filter(item => item.menu_type === type)
      .map(item => ({
        id: item.category_title,
        icon: getIcon(item.icon_name),
        items: item.items || []
      }));
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center">
              <img src="https://res.cloudinary.com/dbkmzja6c/image/upload/v1773433603/prepdosth_zvc5qm.png" alt="PrepDosth Logo" className="h-8 object-contain" referrerPolicy="no-referrer" />
            </Link>
            <nav className="hidden md:flex space-x-6 text-sm font-semibold text-gray-700 h-full items-center">
              {dynamicMenu.map((item) => {
                const categories = getMegaMenuCategories(item.path.replace('/', ''));
                
                if (['/jobs', '/exams', '/tests'].includes(item.path)) {
                  return (
                    <div key={item.id} className="relative group h-full flex items-center">
                      <Link to={item.path} className="hover:text-[#15b86c] transition flex items-center gap-1 py-5">{item.label} <ChevronDown size={14} /></Link>
                      {categories.length > 0 && <MegaMenuDropdown categories={categories} basePath={item.path} offsetClass={item.path === '/jobs' ? 'left-0' : item.path === '/exams' ? '-left-20' : '-left-40'} />}
                    </div>
                  );
                }
                
                if (item.path === "/premium") {
                  return (
                    <div key={item.id} className="relative group h-full flex items-center">
                      <Link to="/premium" className="hover:text-yellow-600 text-yellow-500 transition flex items-center gap-1 py-5">{item.label} <ChevronDown size={14} /></Link>
                      <div className="absolute top-full right-0 w-64 bg-white shadow-xl border border-gray-100 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col py-2">
                        <Link to="/premium" className="px-4 py-2 hover:bg-yellow-50 hover:text-yellow-600 text-gray-700">Railway Premium Content</Link>
                        <Link to="/premium" className="px-4 py-2 hover:bg-yellow-50 hover:text-yellow-600 text-gray-700">Premium Mock Tests</Link>
                        <Link to="/premium" className="px-4 py-2 hover:bg-yellow-50 hover:text-yellow-600 text-gray-700">Paid Courses</Link>
                      </div>
                    </div>
                  );
                }
                return (
                  <Link key={item.id} to={item.path} className="hover:text-[#15b86c] transition py-5">{item.label}</Link>
                );
              })}
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

            <button 
              className="md:hidden text-gray-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-4 shadow-lg absolute w-full left-0">
          {dynamicMenu.map((item) => (
            <Link 
              key={item.id} 
              to={item.path} 
              className={`block font-semibold ${item.path === '/premium' ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-700 hover:text-[#15b86c]'}`} 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
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
  );
}
