import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { User, LogOut, LayoutDashboard, FileText, CheckSquare, Bookmark, Crown } from "lucide-react";

export default function UserLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 text-xl font-bold border-b border-gray-100 flex items-center space-x-2 text-blue-600">
          <User size={24} /> <span>{user?.name}</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/user" className="flex items-center space-x-2 p-2 hover:bg-blue-50 text-gray-700 rounded">
            <LayoutDashboard size={20} /> <span>Dashboard</span>
          </Link>
          <Link to="/user" className="flex items-center space-x-2 p-2 hover:bg-blue-50 text-gray-700 rounded">
            <User size={20} /> <span>My Profile</span>
          </Link>
          <Link to="/user" className="flex items-center space-x-2 p-2 hover:bg-blue-50 text-gray-700 rounded">
            <FileText size={20} /> <span>My Tests</span>
          </Link>
          <Link to="/user" className="flex items-center space-x-2 p-2 hover:bg-blue-50 text-gray-700 rounded">
            <CheckSquare size={20} /> <span>Results</span>
          </Link>
          <Link to="/user" className="flex items-center space-x-2 p-2 hover:bg-blue-50 text-gray-700 rounded">
            <Bookmark size={20} /> <span>Bookmarks</span>
          </Link>
          <Link to="/premium" className="flex items-center space-x-2 p-2 hover:bg-yellow-50 text-yellow-600 rounded font-medium">
            <Crown size={20} /> <span>Premium Content</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={logout} className="flex items-center space-x-2 p-2 hover:bg-red-50 text-red-600 rounded w-full text-left">
            <LogOut size={20} /> <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
