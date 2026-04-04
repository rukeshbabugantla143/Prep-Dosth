import { useState, useEffect, useMemo } from "react";
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
  category_image?: string;
  items: any[];
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
      className={`absolute top-full ${offsetClass} bg-white shadow-[0_15px_50px_-15px_rgba(0,0,0,0.15)] border border-gray-100 rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 flex overflow-hidden translate-y-2 group-hover:translate-y-0`}
      onMouseLeave={() => setActiveCategory(null)}
    >
      {/* Left Column (Categories) */}
      <div className="w-64 bg-gray-50/50 py-3 flex-shrink-0 border-r border-gray-100">
        {categories.filter(cat => cat.items?.length > 0).map(cat => (
          <div
            key={cat.id}
            onMouseEnter={() => setActiveCategory(cat.id)}
            className={`flex items-center justify-between px-4 py-3.5 cursor-pointer transition-all duration-200 ${activeCategory === cat.id ? 'bg-white shadow-[2px_0_10px_rgba(0,0,0,0.02)]' : 'hover:bg-gray-100/50'}`}
          >
            <div className="flex items-center gap-3 text-gray-700 font-bold text-[13px] tracking-tight">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${activeCategory === cat.id ? 'bg-[#15b86c]/10 text-[#15b86c]' : 'bg-white shadow-sm text-gray-400'}`}>
                {cat.category_image ? (
                  <img src={cat.category_image} className="w-5 h-5 object-contain" />
                ) : (
                  cat.icon
                )}
              </div>
              <span className={activeCategory === cat.id ? 'text-[#15b86c]' : 'text-gray-600'}>{cat.category_title}</span>
            </div>
            <ChevronRight size={14} className={`transition-transform duration-200 ${activeCategory === cat.id ? 'text-[#15b86c] translate-x-1' : 'text-gray-300'}`} />
          </div>
        ))}
      </div>

      {/* Right Column (Items) */}
      {activeCategory && (
        <div className="w-[500px] bg-white p-6 flex-shrink-0 animate-in fade-in slide-in-from-left-2 duration-300">
          <div className="mb-4">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Available Programs</h4>
            <div className="h-1 w-8 bg-[#15b86c] rounded-full"></div>
          </div>
          
          {categories.find(c => c.id === activeCategory)?.items?.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {categories.find(c => c.id === activeCategory)?.items.map((item: any) => {
                const label = (typeof item === 'string' ? item : item?.label) || '';
                const path = typeof item === 'object' ? item?.path : `${basePath}?search=${encodeURIComponent(label)}`;
                
                return (
                  <Link 
                    to={path} 
                    key={label} 
                    className="flex items-center gap-3 bg-white border border-gray-100 p-3 rounded-xl hover:border-[#15b86c] hover:shadow-[0_8px_20px_-8px_rgba(21,184,108,0.2)] transition-all duration-300 group/item hover:-translate-y-0.5"
                  >
                    <div className="w-10 h-10 bg-gray-50 rounded-lg group-hover/item:bg-[#15b86c]/5 transition-colors flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-50">
                      {item.image ? (
                        <img src={item.image} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-gray-400 group-hover/item:text-[#15b86c] transition-colors">
                          {getIcon(item.icon_name || 'Award')}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-700 group-hover/item:text-[#15b86c] transition-colors truncate">
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm italic">
              No items listed yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dynamicMenu, setDynamicMenu] = useState<MenuItem[]>([]);
  const [megaMenuData, setMegaMenuData] = useState<MegaMenuCategory[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Use a single query if possible or at least ensure they are parallel
      const [navRes, megaRes] = await Promise.all([
        supabase.from("navigation").select("*").eq("is_active", true).order("order_index", { ascending: true }),
        supabase.from("mega_menu").select("*").order("order_index", { ascending: true })
      ]);
      
      if (navRes.data) setDynamicMenu(navRes.data);
      if (megaRes.data) setMegaMenuData(megaRes.data);
    };
    fetchData();
  }, []);

  const getMegaMenuCategories = useMemo(() => (type: string) => {
    return megaMenuData
      .filter(item => item.menu_type === type)
      .map(item => ({
        id: item.id,
        category_title: item.category_title,
        category_image: item.category_image,
        icon: getIcon(item.icon_name),
        items: item.items || []
      }));
  }, [megaMenuData]);

  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick();
    } else {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    }
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
              onClick={handleMenuClick}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {!onMenuClick && isMobileMenuOpen && (
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
