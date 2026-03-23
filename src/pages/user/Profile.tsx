import { useAuth } from "../../context/AuthContext";
import { User, ShieldCheck, Mail, Calendar, Award } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">Your Profile</h1>
          <p className="text-gray-500 text-[10px] md:text-xs font-bold tracking-widest uppercase mt-1">Manage your account information and preferences.</p>
        </div>

        <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
          <div className="bg-[#0f172a] h-32 md:h-48 relative">
            <div className="absolute -bottom-12 md:-bottom-16 left-6 md:left-12">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-1.5 md:p-2 shadow-xl">
                <div className="w-full h-full bg-blue-600 rounded-[1.2rem] md:rounded-[2rem] flex items-center justify-center text-white">
                  <User size={48} className="md:hidden" />
                  <User size={64} className="hidden md:block" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-16 md:pt-24 pb-8 md:pb-12 px-6 md:px-12">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 md:mb-12">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">{user?.name || "User"}</h2>
                <p className="text-gray-400 text-[10px] md:text-xs font-bold tracking-widest uppercase mt-1 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-blue-600" />
                  {user?.role || "Student"} Account
                </p>
              </div>
              <button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl md:rounded-2xl font-black tracking-widest uppercase text-[10px] md:text-xs transition-all shadow-lg shadow-blue-600/20">
                Edit Profile
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-4 p-4 md:p-6 bg-gray-50 rounded-2xl md:rounded-3xl border border-gray-100">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                    <Mail size={18} md:size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Email Address</p>
                    <p className="text-xs md:text-sm font-black text-gray-900 truncate">{user?.email || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 md:p-6 bg-gray-50 rounded-2xl md:rounded-3xl border border-gray-100">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-purple-600 shadow-sm shrink-0">
                    <Calendar size={18} md:size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Member Since</p>
                    <p className="text-xs md:text-sm font-black text-gray-900">March 2026</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-4 p-4 md:p-6 bg-gray-50 rounded-2xl md:rounded-3xl border border-gray-100">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-orange-600 shadow-sm shrink-0">
                    <Award size={18} md:size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Current Status</p>
                    <p className="text-xs md:text-sm font-black text-gray-900">Active Learner</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 md:p-6 bg-gray-50 rounded-2xl md:rounded-3xl border border-gray-100">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-green-600 shadow-sm shrink-0">
                    <ShieldCheck size={18} md:size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Account Verification</p>
                    <p className="text-xs md:text-sm font-black text-gray-900">Verified</p>
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
