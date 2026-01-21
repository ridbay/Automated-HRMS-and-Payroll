
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Mail, Phone, MapPin, Calendar, User, Briefcase, 
  Trophy, FileText, History, Download, Trash2, 
  ExternalLink, Plus, AlertCircle, CheckCircle2,
  TrendingUp, Award, Star, Users
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Employee } from '../types';
import { Skeleton, ListSkeleton, ChartSkeleton } from './Skeleton';

interface Props {
  employee: Employee | null;
  onClose: () => void;
}

const performanceData = [
  { month: 'Jan', score: 82 },
  { month: 'Feb', score: 85 },
  { month: 'Mar', score: 84 },
  { month: 'Apr', score: 88 },
  { month: 'May', score: 92 },
  { month: 'Jun', score: 95 },
];

const EmployeeProfileSlideOver: React.FC<Props> = ({ employee, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'documents' | 'history'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (employee) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [employee, activeTab]);

  if (!employee) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] overflow-hidden">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        
        {/* Slide-over */}
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-800">Employee Profile</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
            >
              <X size={20} />
            </button>
          </div>

          {/* Profile Quick Info */}
          <div className="px-8 py-8 flex items-start gap-6 border-b border-slate-100">
            <div className="relative">
              <img 
                src={employee.avatar || `https://ui-avatars.com/api/?name=${employee.name}`} 
                className="w-24 h-24 rounded-2xl object-cover shadow-lg border-4 border-white"
                alt={employee.name}
              />
              <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-white ${
                employee.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">{employee.name}</h1>
                <div className="flex gap-2">
                  <button className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                    <Mail size={18} />
                  </button>
                  <button className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                    <Phone size={18} />
                  </button>
                </div>
              </div>
              <p className="text-indigo-600 font-semibold">{employee.role}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><Briefcase size={14} /> {employee.department}</span>
                <span className="flex items-center gap-1.5"><MapPin size={14} /> Lagos Hub</span>
                <span className="flex items-center gap-1.5"><Calendar size={14} /> Joined 2022</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-8 border-b border-slate-100 flex gap-8">
            {['overview', 'performance', 'documents', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 text-sm font-bold uppercase tracking-wider relative transition-colors ${
                  activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
            {activeTab === 'overview' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <Skeleton className="w-1/2 h-3" />
                        <Skeleton className="w-3/4 h-4" />
                      </div>
                    ))
                  ) : (
                    [
                      { label: 'Service', value: '2.5 Years', icon: <Calendar className="text-indigo-600" size={18} /> },
                      { label: 'Projects', value: '14 Completed', icon: <Briefcase className="text-emerald-600" size={18} /> },
                      { label: 'Perf Score', value: '92/100', icon: <TrendingUp className="text-amber-600" size={18} /> },
                    ].map((stat, i) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="mb-2">{stat.icon}</div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{stat.label}</p>
                        <p className="text-sm font-bold text-slate-800">{stat.value}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Details Section */}
                <div className="space-y-6">
                  <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Employment Details</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                      {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="w-1/2 h-3" />
                            <Skeleton className="w-3/4 h-4" />
                          </div>
                        ))
                      ) : (
                        [
                          { label: 'Employee ID', value: `ZEN-${employee.id}` },
                          { label: 'Reporting Manager', value: 'Diana Prince' },
                          { label: 'Contract Type', value: 'Full-time Permanent' },
                          { label: 'Employment Status', value: employee.status.toUpperCase() },
                        ].map((detail, i) => (
                          <div key={i}>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{detail.label}</p>
                            <p className="text-sm font-semibold text-slate-800">{detail.value}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Skills & Endorsements</h3>
                    <div className="flex flex-wrap gap-2">
                      {isLoading ? (
                         Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="w-20 h-8 rounded-full" />)
                      ) : (
                        ['React.js', 'Typescript', 'Node.js', 'Tailwind CSS', 'Cloud Architecture', 'Agile'].map((skill, i) => (
                          <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100 shadow-sm">
                            {skill}
                          </span>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              </motion.div>
            )}

            {activeTab === 'performance' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Performance Trend</h3>
                    <Skeleton className="w-24 h-6" />
                  </div>
                  {isLoading ? (
                    <ChartSkeleton />
                  ) : (
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={performanceData}>
                          <defs>
                            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Tooltip />
                          <Area type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#scoreGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {isLoading ? (
                    <>
                      <div className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center gap-4">
                         <Skeleton className="w-24 h-24" variant="circle" />
                         <Skeleton className="w-3/4 h-4" />
                      </div>
                      <div className="space-y-4">
                         <Skeleton className="w-1/2 h-4" />
                         <Skeleton className="w-full h-10 rounded-xl" />
                         <Skeleton className="w-full h-10 rounded-xl" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="relative w-24 h-24 mb-4">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 * 0.12} className="text-indigo-600" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-indigo-600">88%</div>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Goal Completion</p>
                        <p className="text-sm font-bold text-slate-800">12 of 14 OKRs met</p>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Key Achievements</h3>
                        {[
                          { label: 'V2 Launch Lead', icon: <Award className="text-amber-500" /> },
                          { label: 'Q1 Top Talent', icon: <Star className="text-indigo-500" /> },
                          { label: 'Internal Mentorship', icon: <Users className="text-emerald-500" /> },
                        ].map((ach, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">{ach.icon}</div>
                            <span className="text-xs font-bold text-slate-700">{ach.label}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'documents' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Digital Vault</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100">
                    <Plus size={14} /> Upload New
                  </button>
                </div>

                <div className="space-y-6">
                  {isLoading ? (
                    <>
                      <div className="space-y-3">
                        <Skeleton className="w-1/4 h-3" />
                        <ListSkeleton count={2} />
                      </div>
                      <div className="space-y-3">
                        <Skeleton className="w-1/4 h-3" />
                        <ListSkeleton count={1} />
                      </div>
                    </>
                  ) : (
                    [
                      { category: 'Employment Contracts', docs: [{ name: 'Offer_Letter_V2.pdf', date: 'Jan 12, 2022' }, { name: 'NDA_Signed.pdf', date: 'Jan 15, 2022' }] },
                      { category: 'Personal Documents', docs: [{ name: 'ID_Passport_Copy.jpg', date: 'Jan 15, 2022' }, { name: 'Emergency_Medical.pdf', date: 'Feb 10, 2024' }] },
                      { category: 'Certifications', docs: [{ name: 'AWS_Solutions_Architect.pdf', date: 'Mar 15, 2023', expiry: 'Mar 2024', expired: true }] },
                    ].map((cat, i) => (
                      <div key={i} className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{cat.category}</h4>
                        <div className="space-y-2">
                          {cat.docs.map((doc, j) => (
                            <div key={j} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl group hover:border-indigo-200 transition-all shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center group-hover:text-indigo-500 transition-colors">
                                  <FileText size={20} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{doc.name}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 font-medium">Added {doc.date}</span>
                                    {doc.expiry && (
                                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${doc.expired ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {doc.expired ? 'Expired' : 'Active'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><ExternalLink size={16} /></button>
                                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Download size={16} /></button>
                                <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Activity Timeline</h3>
                {isLoading ? (
                  <div className="space-y-12 pl-8 border-l-2 border-slate-100">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="relative">
                        <Skeleton className="absolute -left-[2.15rem] top-1 w-7 h-7 rounded-full ring-4 ring-white" />
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                           <Skeleton className="w-1/3 h-4" />
                           <Skeleton className="w-full h-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="relative pl-8 space-y-12 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    {[
                      { title: 'Promotion: Senior Backend Engineer', date: 'Jan 2024', desc: 'Promoted for consistent high performance and leadership on Project V2.', icon: <TrendingUp className="text-white" size={14} />, color: 'bg-indigo-600' },
                      { title: 'Annual Performance Review', date: 'Dec 2023', desc: 'Final Rating: 4.8/5.0 (Exceptional). Bonus triggered.', icon: <CheckCircle2 className="text-white" size={14} />, color: 'bg-emerald-500' },
                      { title: 'Department Transfer', date: 'Jun 2023', desc: 'Transferred from Growth Team to Infrastructure.', icon: <ExternalLink className="text-white" size={14} />, color: 'bg-amber-500' },
                      { title: 'ZenHR Onboarding Completed', date: 'Jan 2022', desc: 'All documentation and initial training finalized.', icon: <User className="text-white" size={14} />, color: 'bg-slate-800' },
                    ].map((event, i) => (
                      <div key={i} className="relative">
                        <div className={`absolute -left-[2.15rem] top-1 w-7 h-7 rounded-full flex items-center justify-center shadow-md ring-4 ring-white ${event.color}`}>
                          {event.icon}
                        </div>
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-black text-slate-800">{event.title}</h4>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{event.date}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">{event.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
          
          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-4">
            <button className="flex-1 py-3 px-6 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-white hover:shadow-md transition-all">Export PDF</button>
            <button className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">Generate Summary</button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EmployeeProfileSlideOver;
