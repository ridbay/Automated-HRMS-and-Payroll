
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Settings2, Send, Download, Trash2, 
  User, Briefcase, DollarSign, Clock, Trophy, 
  FileText, Wallet, Heart, BookOpen, AlertCircle, 
  History, CheckCircle2, MapPin, Mail, Phone, 
  Calendar, Building2, ExternalLink, ShieldCheck,
  TrendingUp, Star, MoreHorizontal, Plus,
  Globe, ShieldAlert, Sparkles, Zap, Shield
} from 'lucide-react';
import { Employee } from '../../types/index';
import { Skeleton, CardSkeleton, ListSkeleton, ChartSkeleton } from '../../components/Skeleton';

interface Props {
  employee: Employee;
  onBack: () => void;
}

const EmployeeDetail: React.FC<Props> = ({ employee, onBack }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isLoading, setIsLoading] = useState(false);

  // Simulated loading effect when switching tabs
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);

  // Profile Completion Logic
  const completionStats = useMemo(() => {
    const items = [
      { label: 'Middle Name', filled: !!employee.middleName },
      { label: 'Phone Number', filled: !!employee.phone },
      { label: 'Date of Birth', filled: !!employee.dob },
      { label: 'Gender', filled: !!employee.gender },
      { label: 'Nationality', filled: !!employee.nationality },
      { label: 'Marital Status', filled: !!employee.maritalStatus },
      { label: 'Emergency Contacts', filled: (employee.emergencyContacts?.length || 0) > 0 },
      { label: 'Education History', filled: (employee.education?.length || 0) > 0 },
      { label: 'Experience Records', filled: (employee.experience?.length || 0) > 0 },
      { label: 'Bank Details', filled: !!employee.bankDetails?.accountNumber },
    ];
    const completed = items.filter(i => i.filled).length;
    const percent = Math.round((completed / items.length) * 100);
    const nextStep = items.find(i => !i.filled)?.label;
    
    return { percent, nextStep };
  }, [employee]);

  const tabs = [
    { id: 'personal', label: 'Personal', icon: <User size={16} /> },
    { id: 'employment', label: 'Employment', icon: <Briefcase size={16} /> },
    { id: 'compensation', label: 'Comp', icon: <DollarSign size={16} /> },
    { id: 'attendance', label: 'Time', icon: <Clock size={16} /> },
    { id: 'performance', label: 'Perf', icon: <Trophy size={16} /> },
    { id: 'documents', label: 'Docs', icon: <FileText size={16} /> },
    { id: 'payroll', label: 'Payroll', icon: <Wallet size={16} /> },
    { id: 'benefits', label: 'Benefits', icon: <Heart size={16} /> },
    { id: 'training', label: 'Development', icon: <BookOpen size={16} /> },
    { id: 'disciplinary', label: 'Notes', icon: <AlertCircle size={16} /> },
    { id: 'activity', label: 'Audit', icon: <History size={16} /> },
  ];

  return (
    <div className="space-y-10 pb-20">
       <button 
         onClick={onBack}
         className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-indigo-600 transition-colors"
       >
          <ChevronLeft size={18} /> Back to Directory
       </button>

       {/* Profile Header */}
       <section className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden relative">
          <div className="h-48 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 relative">
             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
             <div className="absolute top-6 right-12 hidden md:flex items-center gap-6 text-white/90">
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Profile Strength</p>
                   <p className="text-lg font-black">{completionStats.percent}% Complete</p>
                </div>
                <div className="relative w-16 h-16">
                   <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/10" />
                      <motion.circle 
                        cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" 
                        strokeDasharray={175.9} 
                        initial={{ strokeDashoffset: 175.9 }}
                        animate={{ strokeDashoffset: 175.9 * (1 - completionStats.percent / 100) }}
                        className="text-white"
                      />
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Zap size={16} className="text-indigo-200" />
                   </div>
                </div>
             </div>
          </div>
          <div className="px-12 pb-12 -mt-20 relative z-10">
             <div className="flex flex-col md:flex-row items-end justify-between gap-8">
                <div className="flex flex-col md:flex-row items-end gap-8">
                   <div className="relative group">
                      <img src={employee.avatar} className="w-44 h-44 rounded-[4rem] border-8 border-white shadow-2xl object-cover" />
                      <div className={`absolute bottom-2 right-2 w-10 h-10 bg-emerald-500 border-4 border-white rounded-2xl shadow-lg flex items-center justify-center`}>
                        <ShieldCheck size={20} className="text-white" />
                      </div>
                   </div>
                   <div className="mb-4">
                      <h1 className="text-4xl font-black text-slate-800 tracking-tighter">{employee.name}</h1>
                      <p className="text-xl font-bold text-slate-500 tracking-tight">{employee.role} • {employee.department}</p>
                   </div>
                </div>
                <div className="flex flex-col items-end gap-4 mb-4">
                   <div className="flex gap-3">
                      <button className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all">Manage Employee</button>
                      <button className="p-4 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl hover:text-indigo-600 transition-all"><MoreHorizontal size={20} /></button>
                   </div>
                   {completionStats.percent < 100 && (
                     <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100 text-[10px] font-bold text-indigo-600 uppercase tracking-tight animate-pulse">
                        <Plus size={12} /> Next Step: Add {completionStats.nextStep}
                     </div>
                   )}
                </div>
             </div>
          </div>
       </section>

       <section className="bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-sm flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                 activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'
               }`}
             >
                {tab.icon} {tab.label}
             </button>
          ))}
       </section>

       <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab} 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="min-h-[500px]"
          >
             {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                   <div className="lg:col-span-2 space-y-10">
                      <CardSkeleton height="h-64" />
                      <div className="grid grid-cols-2 gap-8">
                         <CardSkeleton height="h-48" />
                         <CardSkeleton height="h-48" />
                      </div>
                   </div>
                   <CardSkeleton height="h-[500px]" />
                </div>
             ) : (
               <>
                 {activeTab === 'compensation' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                       <div className="lg:col-span-2 space-y-10">
                          <section className="bg-slate-900 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
                            <DollarSign className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 -rotate-12 transition-transform group-hover:scale-110" />
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Annual Remuneration</p>
                            <h2 className="text-6xl font-black tracking-tighter tabular-nums mb-12">
                               {formatCurrency(employee.salary * 12)}
                            </h2>
                            <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-10">
                               <div>
                                  <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Monthly Gross</p>
                                  <p className="text-xl font-bold">{formatCurrency(employee.salary)}</p>
                               </div>
                               <div>
                                  <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Last Review</p>
                                  <p className="text-xl font-bold">Jan 2024</p>
                               </div>
                            </div>
                          </section>

                          <div className="grid grid-cols-2 gap-8">
                             <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Payroll Method</h4>
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                      <Wallet size={24} />
                                   </div>
                                   <div>
                                      <p className="text-sm font-black text-slate-800">Automated Wallet</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">Instant Disbursal</p>
                                   </div>
                                </div>
                             </div>
                             <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Tax Compliance</h4>
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                      <Shield size={24} />
                                   </div>
                                   <div>
                                      <p className="text-sm font-black text-slate-800">LIRS Verified</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">TIN Registered</p>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                       
                       <div className="space-y-8">
                          <CardSkeleton height="h-[300px]">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Allowances</h4>
                             <div className="space-y-4">
                                {['Housing', 'Transport', 'Utilities'].map(a => (
                                  <div key={a} className="flex justify-between items-center text-sm font-bold border-b border-slate-50 pb-3">
                                     <span className="text-slate-500">{a}</span>
                                     <span className="text-slate-800">15%</span>
                                  </div>
                                ))}
                             </div>
                          </CardSkeleton>
                       </div>
                    </div>
                 )}
                 
                 {activeTab === 'personal' && (
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                      <div className="lg:col-span-2 space-y-10">
                         <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase text-xs tracking-[0.2em] text-slate-400">Identity Details</h3>
                            <div className="grid grid-cols-2 gap-8">
                               {[
                                  { l: 'Full Legal Name', v: `${employee.name} ${employee.lastName}` },
                                  { l: 'Birth Date', v: employee.dob || 'Not Provided' },
                                  { l: 'Personal Email', v: employee.email },
                                  { l: 'Phone Number', v: employee.phone || 'Not Provided' },
                                  { l: 'Nationality', v: employee.nationality || 'Not Provided' },
                                  { l: 'Marital Status', v: employee.maritalStatus || 'Not Provided' },
                               ].map((item, i) => (
                                 <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{item.l}</p>
                                    <p className="text-sm font-bold text-slate-800">{item.v}</p>
                                 </div>
                               ))}
                            </div>
                         </section>

                         <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Home Address</h3>
                            <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                               <MapPin className="text-indigo-600 mt-1" size={20} />
                               <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                  Plot 12, Admiralty Way, Phase 1,<br />
                                  Lekki, Lagos, Nigeria
                               </p>
                            </div>
                         </section>
                      </div>

                      <div className="space-y-10">
                         <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Emergency Contacts</h3>
                            <div className="space-y-4">
                               {(employee.emergencyContacts || []).length > 0 ? (
                                 employee.emergencyContacts?.map((contact, i) => (
                                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                       <p className="text-xs font-black text-slate-800">{contact.name}</p>
                                       <p className="text-[10px] font-bold text-slate-400 uppercase">{contact.relationship} • {contact.phone}</p>
                                    </div>
                                 ))
                               ) : (
                                 <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl text-center text-slate-400 font-bold text-xs">
                                    No contacts added
                                 </div>
                               )}
                               <button className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all">+ Add New Contact</button>
                            </div>
                         </section>
                      </div>
                   </div>
                 )}

                 {activeTab === 'performance' && (
                    <div className="space-y-10">
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-2">
                                <TrendingUp className="text-indigo-600" /> Performance Trend
                             </h3>
                             <ChartSkeleton />
                          </section>
                          <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-2">
                                <Star className="text-amber-500" /> Key Competencies
                             </h3>
                             <div className="space-y-6">
                                {['Technical Accuracy', 'Leadership', 'Collaboration', 'Problem Solving'].map(c => (
                                  <div key={c} className="space-y-2">
                                     <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                                        <span>{c}</span>
                                        <span className="text-indigo-600">4.5 / 5.0</span>
                                     </div>
                                     <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: '90%' }} className="h-full bg-indigo-500" />
                                     </div>
                                  </div>
                                ))}
                             </div>
                          </section>
                       </div>
                    </div>
                 )}

                 {activeTab === 'documents' && (
                    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-8">
                       <div className="flex justify-between items-center">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Digital Document Vault</h3>
                          <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2">
                             <Plus size={14} /> Upload Document
                          </button>
                       </div>
                       <ListSkeleton count={4} />
                    </div>
                 )}

                 {!['personal', 'compensation', 'performance', 'documents'].includes(activeTab) && (
                    <div className="bg-white p-32 rounded-[4rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                       <div className="w-24 h-24 bg-indigo-50 text-indigo-300 rounded-[2rem] flex items-center justify-center mb-8"><Sparkles size={48} /></div>
                       <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">{activeTab} MODULE CONNECTING</h3>
                       <p className="text-slate-400 max-w-sm mt-4 font-medium italic">"Financial ledgers are currently aggregating {activeTab} data for this report."</p>
                    </div>
                 )}
               </>
             )}
          </motion.div>
       </AnimatePresence>
    </div>
  );
};

export default EmployeeDetail;
