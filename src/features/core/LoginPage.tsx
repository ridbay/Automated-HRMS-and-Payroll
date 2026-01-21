
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, Mail, Lock, Eye, EyeOff, 
  ChevronRight, ArrowRight, ShieldCheck, 
  Users, Briefcase, Wallet, Building2, User,
  Rocket
} from 'lucide-react';
import { UserRole, User as UserType } from '../../types/index';

interface LoginPageProps {
  onLogin: (user: UserType) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('admin@zenhr.com');
  const [role, setRole] = useState<UserRole>('HR_ADMIN');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      onLogin({
        id: 'u1',
        name: role === 'SUPER_ADMIN' ? 'Sarah Boss' : 
              role === 'MANAGER' ? 'Marcus Head' : 
              role === 'RECRUITER' ? 'Hiring Pro' :
              role === 'EMPLOYEE' ? 'Jane Doe' : 'James HR',
        email: email,
        role: role,
        avatar: `https://i.pravatar.cc/150?u=${role}`
      });
      setIsLoading(false);
    }, 1000);
  };

  const roles: { id: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'SUPER_ADMIN', label: 'Super Admin', icon: <ShieldCheck size={18} />, desc: 'Global system access' },
    { id: 'HR_ADMIN', label: 'HR Admin', icon: <Briefcase size={18} />, desc: 'Full HR management' },
    { id: 'RECRUITER', label: 'Recruiter', icon: <Rocket size={18} />, desc: 'Talent acquisition' },
    { id: 'PAYROLL_OFFICER', label: 'Payroll Officer', icon: <Wallet size={18} />, desc: 'Finance & Payouts' },
    { id: 'MANAGER', label: 'Manager', icon: <Users size={18} />, desc: 'Team approvals' },
    { id: 'EMPLOYEE', label: 'Employee', icon: <User size={18} />, desc: 'Self-service portal' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-600/5 -skew-x-12 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-white relative z-10">
        
        {/* Left Side: Branding & Info */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-slate-900 text-white relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
             <div className="absolute top-10 left-10 w-96 h-96 border border-white rounded-full"></div>
             <div className="absolute bottom-10 right-10 w-[500px] h-[500px] border border-white rounded-full"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
                  <Zap size={24} fill="currentColor" />
               </div>
               <span className="text-2xl font-black tracking-tighter">ZenHR</span>
            </div>

            <h1 className="text-5xl font-black leading-tight mb-8 tracking-tighter">
              Next-generation <br />
              <span className="text-indigo-400">Workforce OS</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md">
              Automate your entire employee lifecycle from pre-funding payroll to real-time performance analytics.
            </p>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <div>
                <p className="text-sm font-bold">Trusted by 250+ Enterprises</p>
                <p className="text-xs text-slate-400 font-medium">Compliance-ready in 12 jurisdictions.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-12 md:p-16 flex flex-col justify-center">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 font-medium">Select your portal to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Role Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                    role === r.id 
                      ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-500/10' 
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${role === r.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {r.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-800 tracking-tight leading-tight">{r.label}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 transition-all"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                   <button type="button" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Forgot?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    defaultValue="password123"
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 transition-all"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-8">
               <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20" />
               <label htmlFor="remember" className="text-xs font-bold text-slate-500 cursor-pointer">Stay logged in for 30 days</label>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Sign in to Dashboard <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-sm font-medium text-slate-400">
              New organization? <button className="text-indigo-600 font-bold hover:underline">Start your free trial</button>
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 opacity-30">
         <span className="text-[10px] font-black uppercase tracking-widest">© 2024 ZenHR OS</span>
         <span className="text-[10px] font-black uppercase tracking-widest">•</span>
         <span className="text-[10px] font-black uppercase tracking-widest hover:underline cursor-pointer">Privacy</span>
         <span className="text-[10px] font-black uppercase tracking-widest hover:underline cursor-pointer">Security</span>
      </div>
    </div>
  );
};

export default LoginPage;
