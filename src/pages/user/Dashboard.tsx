import { useAuth } from "../../context/AuthContext";

export default function UserDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Welcome, {user?.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-blue-700 mb-4">Profile Information</h2>
          <div className="space-y-3 text-gray-700">
            <p><span className="font-semibold">Name:</span> {user?.name}</p>
            <p><span className="font-semibold">Email:</span> {user?.email}</p>
            <p><span className="font-semibold">Role:</span> <span className="capitalize">{user?.role}</span></p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-green-700 mb-4">Test Performance</h2>
          <p className="text-gray-600">You haven't attempted any tests yet.</p>
          {/* In a real app, fetch and display past test results here */}
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-purple-700 mb-4">Premium Content</h2>
          <p className="text-gray-600 mb-4">Access exclusive study materials and previous year papers.</p>
          <button className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-200 transition">
            Unlock Premium
          </button>
        </div>
      </div>
    </div>
  );
}
