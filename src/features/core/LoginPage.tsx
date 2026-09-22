
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, Mail, Lock, Eye, EyeOff, 
  ChevronRight, ArrowRight, ArrowLeft, ShieldCheck, 
  Users, Briefcase, Wallet, Building2, User,
  Rocket, X, CheckCircle2, KeyRound
} from 'lucide-react';
import { UserRole, User as UserType } from '../../types/index';

interface LoginPageProps {
  onLogin: (user: UserType, token: string) => void;
  onNavigateRegister?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigateRegister }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'reset' | 'success'>('request');
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetShowPassword, setResetShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  // Password change state
  const [isPasswordChangeRequired, setIsPasswordChangeRequired] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempUser, setTempUser] = useState<any>(null);

  const openForgotPassword = () => {
    setResetEmail(email || '');
    setResetToken('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetError('');
    setResetStep('request');
    setShowForgotPassword(true);
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    try {
      const { requestPasswordReset } = await import('../../api/client');
      const res = await requestPasswordReset(resetEmail);
      if (!res.resetToken) {
        setResetError('No account found with this email address. Please check your spelling or contact your HR administrator.');
        return;
      }
      setResetToken(res.resetToken);
      setResetStep('reset');
    } catch (err: any) {
      setResetError(err.message || 'Failed to request password reset');
    } finally {
      setResetLoading(false);
    }
  };

  const handlePerformReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    try {
      if (resetNewPassword !== resetConfirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (resetNewPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      const { resetPasswordWithToken } = await import('../../api/client');
      const res = await resetPasswordWithToken({
        token: resetToken,
        newPassword: resetNewPassword,
      });
      setResetSuccessMsg(res.message || 'Password has been successfully updated!');
      setEmail(resetEmail);
      setPassword(resetNewPassword);
      setResetStep('success');
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      const { loginUser, changeUserPassword } = await import('../../api/client');

      if (isPasswordChangeRequired) {
        if (newPassword !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        // We must have tempUser if we are here, and since we need a token for changePassword,
        // wait, changePassword endpoint requires the employeeId. But our fetchWithTenant needs a token.
        // I will temporarily set the token in local storage so the change password request succeeds.
        localStorage.setItem('zenhr_token', tempUser.token);
        
        await changeUserPassword({ currentPassword: password, newPassword });
        
        // Success
        onLogin(tempUser.employee, tempUser.token);
      } else {
        const result = await loginUser({ email, password });
        
        if (!result.employee.isPasswordChanged) {
          setTempUser(result);
          setIsPasswordChangeRequired(true);
        } else {
          onLogin(result.employee, result.token);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
      if (isPasswordChangeRequired) {
        localStorage.removeItem('zenhr_token'); // Clean up on fail
      }
    } finally {
      setIsLoading(false);
    }
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


            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold text-center">
                {errorMsg}
              </div>
            )}

            {!isPasswordChangeRequired ? (
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
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                     <button 
                       type="button" 
                       onClick={openForgotPassword}
                       className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                     >
                       Forgot?
                     </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 transition-all"
                      placeholder="••••••••"
                      required
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
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mb-4">
                  <p className="text-xs font-bold text-amber-800">For security reasons, please change your temporary password before continuing.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 transition-all"
                      placeholder="New password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 transition-all"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

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
                <>{isPasswordChangeRequired ? 'Update Password' : 'Sign in to Dashboard'} <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-sm font-medium text-slate-400">
              New organization? <button type="button" onClick={onNavigateRegister} className="text-indigo-600 font-bold hover:underline">Start your free trial</button>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal (End-to-End) */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            {/* STEP 1: Request Reset Token */}
            {resetStep === 'request' && (
              <div>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <KeyRound size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Reset your password</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Enter your work email address. We will verify your account and generate a secure password reset token.
                </p>

                {resetError && (
                  <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold">
                    {resetError}
                  </div>
                )}

                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="employee@company.com"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-slate-800 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading || !resetEmail}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    {resetLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Generate Reset Token <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: Set New Password */}
            {resetStep === 'reset' && (
              <div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <Lock size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1">Create New Password</h3>
                <p className="text-xs text-slate-500 mb-6">
                  Resetting credentials for <span className="font-bold text-slate-800">{resetEmail}</span>
                </p>

                {resetError && (
                  <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold">
                    {resetError}
                  </div>
                )}

                <form onSubmit={handlePerformReset} className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reset Token</label>
                      <span className="text-[10px] font-bold text-emerald-600">✓ Token Attached</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Paste reset token"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-xs text-slate-600 truncate"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input
                        type={resetShowPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="•••••••• (min 6 characters)"
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-slate-800 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setResetShowPassword(!resetShowPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {resetShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input
                        type={resetShowPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-slate-800 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading || !resetNewPassword || !resetConfirmPassword}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    {resetLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Update Password <ArrowRight size={16} /></>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setResetStep('request'); setResetError(''); }}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 mx-auto"
                    >
                      <ArrowLeft size={14} /> Back to email input
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 3: Success Confirmation */}
            {resetStep === 'success' && (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Password Updated!</h3>
                <p className="text-sm text-slate-500 mb-6">
                  {resetSuccessMsg || 'Your password has been successfully reset in the system. The sign-in form has been pre-filled with your new credentials.'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
