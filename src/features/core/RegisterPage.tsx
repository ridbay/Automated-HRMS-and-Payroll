import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, Mail, Lock, Eye, EyeOff, 
  ArrowRight, Building2, User
} from 'lucide-react';
import { User as UserType } from '../../types/index';

interface RegisterPageProps {
  onLogin: (user: UserType, token: string) => void;
  onNavigateLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onLogin, onNavigateLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      const { registerCompany } = await import('../../api/client');
      
      const payload = {
        companyName,
        industry,
        adminFirstName,
        adminLastName,
        adminEmail,
        adminPassword
      };

      const result = await registerCompany(payload);
      
      // On success, directly log them in
      onLogin(result.employee, result.token);
      
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-1/3 h-full bg-indigo-600/5 skew-x-12 -translate-x-1/2"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-white relative z-10">
        
        {/* Left Side: Register Form */}
        <div className="p-12 md:p-16 flex flex-col justify-center order-2 lg:order-1">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Create an Account</h2>
            <p className="text-slate-500 font-medium">Onboard your organization to ZenHR.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold text-center">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 transition-all text-sm"
                    placeholder="Acme Corp"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Industry</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 transition-all text-sm"
                    placeholder="Technology"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    value={adminFirstName}
                    onChange={(e) => setAdminFirstName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 transition-all text-sm"
                    placeholder="Jane"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    value={adminLastName}
                    onChange={(e) => setAdminLastName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 transition-all text-sm"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="email" 
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 transition-all text-sm"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 transition-all text-sm"
                  placeholder="••••••••"
                  required
                  minLength={6}
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

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Sign Up & Setup Organization <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-slate-400">
              Already have an account? <button onClick={onNavigateLogin} className="text-indigo-600 font-bold hover:underline">Log in</button>
            </p>
          </div>
        </div>

        {/* Right Side: Branding & Info */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-slate-900 text-white relative order-1 lg:order-2">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
             <div className="absolute top-10 right-10 w-96 h-96 border border-white rounded-full"></div>
             <div className="absolute bottom-10 left-10 w-[500px] h-[500px] border border-white rounded-full"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
                  <Zap size={24} fill="currentColor" />
               </div>
               <span className="text-2xl font-black tracking-tighter">ZenHR</span>
            </div>

            <h1 className="text-5xl font-black leading-tight mb-8 tracking-tighter">
              Build your <br />
              <span className="text-indigo-400">dream team.</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md">
              Start your journey with a platform designed to scale with your organization's growth.
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default RegisterPage;
