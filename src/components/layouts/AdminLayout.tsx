import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LayoutDashboard, Briefcase, FileText, CheckSquare, Home, LogOut, HelpCircle, Users, Crown, Settings, Menu } from "lucide-react";

export default function AdminLayout() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 text-2xl font-bold border-b border-gray-800">Admin Panel</div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link to="/admin" className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded">
            <LayoutDashboard size={20} /> <span>Dashboard</span>
          </Link>
          <Link to="/admin/jobs" className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded">
            <Briefcase size={20} /> <span>Jobs Management</span>
          </Link>
          <Link to="/admin/exams" className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded">
            <FileText size={20} /> <span>Exam Notifications</span>
          </Link>
          <Link to="/admin/tests" className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded">
            <CheckSquare size={20} /> <span>Mock Tests</span>
          </Link>
          <Link to="/admin" className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded">
            <HelpCircle size={20} /> <span>Questions</span>
          </Link>
          <Link to="/admin/home" className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded">
            <Home size={20} /> <span>Hero Section</span>
          </Link>
          <Link to="/admin/home" className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded">
            <Home size={20} /> <span>Home Sections</span>
          </Link>
          <Link to="/admin/menu" className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded">
            <Menu size={20} /> <span>Menu Management</span>
          </Link>
          <Link to="/admin/mega-menu" className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded">
            <LayoutDashboard size={20} /> <span>Mega Menu Content</span>
          </Link>
          <Link to="/admin" className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded">
            <Users size={20} /> <span>Users</span>
          </Link>
          <Link to="/admin" className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded text-yellow-500">
            <Crown size={20} /> <span>Premium Content</span>
          </Link>
          <Link to="/admin" className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded">
            <Settings size={20} /> <span>Settings</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={logout} className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded w-full text-left text-red-400">
            <LogOut size={20} /> <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
