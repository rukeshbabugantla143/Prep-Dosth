import { useAuth } from "../../context/AuthContext";
import { User, ShieldCheck, Mail, Calendar, Award } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tight text-gray-900">Your Profile</h1>
          <p className="text-gray-500 text-xs font-bold tracking-widest uppercase mt-1">Manage your account information and preferences.</p>
        </div>

        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
          <div className="bg-[#0f172a] h-48 relative">
            <div className="absolute -bottom-16 left-12">
              <div className="w-32 h-32 bg-white rounded-[2.5rem] p-2 shadow-xl">
                <div className="w-full h-full bg-blue-600 rounded-[2rem] flex items-center justify-center text-white">
                  <User size={64} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-24 pb-12 px-12">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{user?.name || "User"}</h2>
                <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mt-1 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-blue-600" />
                  {user?.role || "Student"} Account
                </p>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black tracking-widest uppercase text-xs transition-all shadow-lg shadow-blue-600/20">
                Edit Profile
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Email Address</p>
                    <p className="text-sm font-black text-gray-900">{user?.email || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-purple-600 shadow-sm">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Member Since</p>
                    <p className="text-sm font-black text-gray-900">March 2026</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
                    <Award size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Current Status</p>
                    <p className="text-sm font-black text-gray-900">Active Learner</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-green-600 shadow-sm">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Account Verification</p>
                    <p className="text-sm font-black text-gray-900">Verified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
