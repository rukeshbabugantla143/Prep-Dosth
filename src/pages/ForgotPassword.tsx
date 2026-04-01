import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, Loader2, KeyRound, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: "Passwords do not match!" });
      return;
    }

    setLoading(true);
    setMessage(null);
    
    try {
      const response = await axios.post(`${window.location.origin}/api/direct-reset`, { email, password }, { timeout: 15000 });
      
      if (response.data.success) {
        setMessage({
          type: 'success',
          text: "Your password has been reset successfully! You can now log in with your new password."
        });
        setStep(3); // Final success step
      }
    } catch (err: any) {
      console.error("[AXIOS ERROR]", err);
      let errorMsg = "Failed to reset password.";
      
      if (err.code === 'ECONNABORTED') {
        errorMsg = "Request timeout. The server is taking too long to respond.";
      } else if (err.message === 'Network Error') {
        errorMsg = "Network Error: Could not reach the server. Please check if the dev server is running on port 3000.";
      } else {
        errorMsg = err.response?.data?.error || err.message || errorMsg;
      }

      setMessage({
        type: 'error',
        text: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-blue-100/50 border border-gray-100 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
          
          <div className="relative z-10">
            <div className="mb-10 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200 rotate-12 transition-transform hover:rotate-0 duration-500">
                {step === 1 ? <KeyRound className="text-white" size={32} /> : 
                 step === 2 ? <Lock className="text-white" size={32} /> : 
                 <ShieldCheck className="text-white" size={32} />}
              </div>
              <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
                {step === 1 ? "Forgot Password" : step === 2 ? "Reset Password" : "All Set!"}
              </h2>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2 px-8">
                {step === 1 ? "Enter your email to find your account" : 
                 step === 2 ? "Create a strong new password for your account" : 
                 "Your account security has been updated"}
              </p>
            </div>

            {message && (
              <div className={`mb-8 p-4 border-2 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300 ${
                message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
              }`}>
                {message.type === 'success' ? <CheckCircle2 size={24} className="shrink-0" /> : <AlertCircle size={24} className="shrink-0" />}
                <p className="text-xs font-black uppercase tracking-tight leading-tight">{message.text}</p>
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleNext} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-sm text-gray-800 placeholder:text-gray-300 placeholder:font-bold"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3 active:scale-95 group"
                >
                  Continue
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                        <Lock size={18} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-sm text-gray-800 placeholder:text-gray-300"
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                        <Lock size={18} />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-sm text-gray-800 placeholder:text-gray-300"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70 disabled:active:scale-100 group"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      Reset Password
                      <ShieldCheck size={20} />
                    </>
                  )}
                </button>
                
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
                >
                  Change Email
                </button>
              </form>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center">
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-relaxed">
                    Success! Your account password has been updated. You can now use your new credentials to log in.
                  </p>
                </div>
                <Link 
                  to="/login" 
                  className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3 active:scale-95"
                >
                  Go to Login
                  <ArrowRight size={18} />
                </Link>
              </div>
            )}

            {step !== 3 && (
              <div className="mt-10 border-t border-gray-100 pt-8 text-center">
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
