import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LayoutDashboard, Briefcase, FileText, CheckSquare, Home, LogOut, Users, Crown, Settings, Menu, Activity, BookOpen, X } from "lucide-react";

export default function AdminLayout() {
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const navLinks = [
    { to: "/admin", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { to: "/admin/jobs", icon: <Briefcase size={20} />, label: "Jobs Management" },
    { to: "/admin/exams", icon: <FileText size={20} />, label: "Exam Notifications" },
    { to: "/admin/tests", icon: <CheckSquare size={20} />, label: "Mock Tests" },
    { to: "/admin/notifications", icon: <Activity size={20} />, label: "Notifications" },
    { to: "/admin/home", icon: <Home size={20} />, label: "Manage Home" },
    { to: "/admin/menu", icon: <Menu size={20} />, label: "Menu Management" },
    { to: "/admin/mega-menu", icon: <BookOpen size={20} />, label: "Mega Menu Content" },
    { to: "/admin/categories", icon: <Settings size={20} />, label: "Manage Categories" },
    { to: "/admin/users", icon: <Users size={20} />, label: "Users" },
    { to: "/admin/premium", icon: <Crown size={20} />, label: "Premium Content", className: "text-yellow-500" },
    { to: "/admin/settings", icon: <Settings size={20} />, label: "Settings" },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden bg-gray-900 text-white p-4 flex items-center justify-between sticky top-0 z-50 h-16">
        <div className="text-xl font-bold">Admin Panel</div>
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-16 md:top-0 h-[calc(100vh-64px)] md:h-screen z-40
        w-64 bg-gray-900 text-white flex flex-col transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="hidden md:block p-4 text-2xl font-bold border-b border-gray-800">Admin Panel</div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => (
            <Link 
              key={link.to}
              to={link.to} 
              onClick={closeSidebar}
              className={`flex items-center space-x-2 p-2 rounded transition-colors ${
                location.pathname === link.to 
                  ? 'bg-primary text-white font-medium' 
                  : `text-gray-400 hover:bg-gray-800 hover:text-white ${link.className || ''}`
              }`}
            >
              {link.icon} <span>{link.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={() => {
              closeSidebar();
              logout();
            }} 
            className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded w-full text-left text-red-400 transition-colors"
          >
            <LogOut size={20} /> <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
