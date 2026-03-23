import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { User, LogOut, LayoutDashboard, FileText, CheckSquare, Bookmark, Crown, Menu, X } from "lucide-react";
import Header from "../common/Header";

export default function UserLayout() {
  const { logout, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const navLinks = [
    { to: "/user", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { to: "/user/profile", icon: <User size={20} />, label: "My Profile" },
    { to: "/user/tests", icon: <FileText size={20} />, label: "My Tests" },
    { to: "/user/results", icon: <CheckSquare size={20} />, label: "Results" },
    { to: "/user/bookmarks", icon: <Bookmark size={20} />, label: "Bookmarks" },
    { to: "/premium", icon: <Crown size={20} />, label: "Premium Content", className: "text-yellow-600 hover:bg-yellow-50" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between sticky top-16 z-40">
        <div className="flex items-center space-x-2 text-blue-600 font-bold">
          <User size={20} />
          <span className="truncate max-w-[150px]">{user?.name}</span>
        </div>
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex flex-1 relative">
        {/* Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-16 h-[calc(100vh-64px)] z-40
          w-64 bg-white shadow-md flex flex-col transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="hidden lg:flex p-6 text-xl font-bold border-b border-gray-100 items-center space-x-2 text-blue-600">
            <User size={24} /> <span className="truncate">{user?.name}</span>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navLinks.map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                onClick={closeSidebar}
                className={`flex items-center space-x-2 p-3 rounded-xl transition-all ${
                  location.pathname === link.to 
                    ? 'bg-blue-50 text-blue-600 font-bold' 
                    : `text-gray-700 hover:bg-gray-50 ${link.className || ''}`
                }`}
              >
                {link.icon} <span>{link.label}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-100">
            <button 
              onClick={() => {
                closeSidebar();
                logout();
              }} 
              className="flex items-center space-x-2 p-3 hover:bg-red-50 text-red-600 rounded-xl w-full text-left transition-colors font-medium"
            >
              <LogOut size={20} /> <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
