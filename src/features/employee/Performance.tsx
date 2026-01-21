
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Target, TrendingUp, Users, Award, 
  ChevronRight, Calendar, Star, MessageSquare, 
  Plus, CheckCircle2, AlertCircle, Zap, Heart,
  BarChart3, PieChart as PieChartIcon, 
  Map as MapIcon, ArrowUpRight, ArrowRight,
  User, Flame, Sparkles, Filter, X, Send,
  MoreHorizontal, ChevronDown, Rocket, 
  BrainCircuit, ThumbsUp, Ghost
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, 
  Cell, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, PieChart, Pie
} from 'recharts';
import { MOCK_EMPLOYEES, MOCK_GOALS, MOCK_FEEDBACK, MOCK_BADGES } from '../../data/mocks';
import Celebration from '../../components/Celebration';

const performanceDistData = [
  { name: 'Unsatisfactory', count: 2, fill: '#ef4444' },
  { name: 'Needs Imp.', count: 8, fill: '#f97316' },
  { name: 'Meets Exp.', count: 65, fill: '#3b82f6' },
  { name: 'Exceeds Exp.', count: 42, fill: '#8b5cf6' },
  { name: 'Exceptional', count: 12, fill: '#10b981' },
];

const skillGapData = [
  { subject: 'Technical', current: 120, target: 150 },
  { subject: 'Leadership', current: 98, target: 130 },
  { subject: 'Strategy', current: 86, target: 130 },
  { subject: 'Communication', current: 99, target: 140 },
  { subject: 'Innovation', current: 135, target: 140 },
];

const Performance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'goals' | 'reviews' | 'feedback' | 'growth'>('dashboard');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const triggerCelebration = () => {
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 3000);
  };

  const renderDashboard = () => (
    <div className="space-y-8 pb-20">
      {/* Performance Overview Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
               <TrendingUp size={20} />
             </div>
             <span className="text-emerald-500 text-xs font-black flex items-center gap-0.5">
                <ArrowUpRight size={14} /> +0.3
             </span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. Performance Score</p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tighter">4.2 <span className="text-sm font-medium text-slate-400">/ 5.0</span></h3>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
               <Target size={20} />
             </div>
             <span className="text-emerald-500 text-xs font-black flex items-center gap-0.5">
                <ArrowUpRight size={14} /> +12%
             </span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Goal Completion Rate</p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tighter">76%</h3>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
             <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
               <Star size={20} />
             </div>
             <div className="w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">5</div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Reviews</p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tighter">18</h3>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-indigo-600 p-6 rounded-3xl shadow-xl shadow-indigo-100 text-white relative overflow-hidden"
        >
          <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10" />
          <div className="relative z-10">
             <div className="p-2 bg-white/20 text-white rounded-xl w-fit mb-4">
               <Heart size={20} fill="currentColor" />
             </div>
             <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1">Continuous Feedback</p>
             <h3 className="text-3xl font-black tracking-tighter">240+ <span className="text-xs font-medium text-indigo-200">Shoutouts</span></h3>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bell Curve Distribution */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
           <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-black text-slate-800">Performance Distribution</h3>
                <p className="text-xs text-slate-400 font-medium">Visualization of talent density across categories.</p>
              </div>
              <div className="flex gap-2">
                 <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><MoreHorizontal size={20} /></button>
              </div>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={performanceDistData} margin={{ top: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="count" radius={[12, 12, 0, 0]} barSize={60}>
                       {performanceDistData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.fill} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
           <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
             <Trophy className="text-amber-500" /> Star Performers
           </h3>
           <div className="space-y-6 flex-1">
              {MOCK_EMPLOYEES.slice(0, 4).map((emp, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                   <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={emp.avatar} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-50 group-hover:ring-indigo-100 transition-all" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-lg flex items-center justify-center border-2 border-white">
                           <CheckCircle2 size={10} className="text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 leading-none mb-1">{emp.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{emp.role}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="flex items-center gap-1 text-amber-500 font-black text-sm">
                         <Star size={14} fill="currentColor" /> 4.{9 - i}
                      </div>
                   </div>
                </div>
              ))}
           </div>
           <button className="w-full mt-10 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all">
              View Analytics Report
           </button>
        </div>
      </div>

      {/* Deadlines Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Calendar className="text-indigo-600" /> Upcoming Deadlines
            </h3>
            <span className="text-xs font-bold text-slate-400">June 2024 Cycle</span>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Self-Assessments', date: 'June 10', progress: 100, color: 'emerald' },
              { title: 'Manager Reviews', date: 'June 15', progress: 65, color: 'indigo' },
              { title: 'Final Calibration', date: 'June 25', progress: 0, color: 'amber' },
            ].map((d, i) => (
              <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 relative group overflow-hidden">
                <div className={`absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity`}>
                   <CheckCircle2 size={20} className={`text-${d.color}-500`} />
                </div>
                <p className="text-xs font-black text-slate-800 mb-1">{d.title}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">Due: {d.date}</p>
                <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${d.progress}%` }}
                     className={`h-full bg-${d.color}-500`}
                   />
                </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-black text-slate-800">Strategic OKRs</h2>
           <p className="text-sm text-slate-500 font-medium">Aligning individual growth with the ZenHR mission.</p>
        </div>
        <button 
          onClick={() => setShowGoalModal(true)}
          className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={20} strokeWidth={3} /> New Objective
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MOCK_GOALS.map((goal) => (
          <motion.div 
            key={goal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative"
          >
            {goal.progress === 100 && (
              <div className="absolute top-6 right-8 text-emerald-500 animate-bounce">
                <Award size={24} fill="currentColor" />
              </div>
            )}
            
            <div className="flex gap-2 mb-6">
               <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                 goal.priority === 'high' ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500'
               }`}>
                 {goal.priority} Priority
               </span>
               <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                 goal.status === 'on_track' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
               }`}>
                 {goal.status.replace('_', ' ')}
               </span>
            </div>

            <h3 className="text-lg font-black text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors">{goal.title}</h3>
            <p className="text-xs text-slate-500 font-medium mb-8 leading-relaxed h-12 overflow-hidden">{goal.description}</p>
            
            <div className="space-y-3 mb-10">
               <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                  <span className="text-xl font-black text-slate-800">{goal.progress}%</span>
               </div>
               <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    className={`h-full rounded-full ${goal.status === 'on_track' ? 'bg-indigo-600' : 'bg-amber-500'}`}
                  />
               </div>
            </div>

            {goal.keyResults && (
              <div className="space-y-3 mb-8">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Results</p>
                 {goal.keyResults.map((kr, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                       {kr.completed ? <CheckCircle2 size={16} className="text-emerald-500" /> : <div className="w-4 h-4 border-2 border-slate-200 rounded-md" />}
                       <span className={`text-xs font-bold ${kr.completed ? 'text-slate-400 line-through' : 'text-slate-600'}`}>{kr.text}</span>
                    </div>
                 ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
               <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Calendar size={14} /> Due {goal.dueDate}
               </div>
               <button 
                onClick={triggerCelebration}
                className="px-4 py-2 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-xl transition-all"
               >
                  <CheckCircle2 size={18} />
               </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Goal Alignment Visualization */}
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
         <Sparkles className="absolute top-10 right-10 text-indigo-400/20 w-32 h-32" />
         <h3 className="text-2xl font-black mb-12 flex items-center gap-3">
           <MapIcon className="text-indigo-400" /> Strategic Alignment Matrix
         </h3>
         <div className="space-y-16 relative">
            {/* Alignment Tree - Conceptual */}
            <div className="relative pl-20 before:absolute before:left-[2.4rem] before:top-12 before:bottom-0 before:w-1 before:bg-indigo-500/20">
               <div className="absolute left-0 top-0 w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center border-8 border-slate-900 z-10 shadow-2xl">
                  <Rocket size={32} />
               </div>
               <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] max-w-xl backdrop-blur-sm">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Company Objective</p>
                  <h4 className="text-xl font-black mb-4">Africa's Leading Payroll Engine</h4>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                     <div className="flex -space-x-2">
                        {MOCK_EMPLOYEES.map(e => <img key={e.id} src={e.avatar} className="w-6 h-6 rounded-lg ring-2 ring-slate-900" />)}
                     </div>
                     <span>24 Aligned Initiatives</span>
                  </div>
               </div>
            </div>
            
            <div className="relative pl-40">
               <div className="absolute left-20 top-0 w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center border-8 border-slate-900 z-10 shadow-2xl">
                  <BrainCircuit size={24} />
               </div>
               <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] max-w-xl backdrop-blur-sm">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Engineering Pillar</p>
                  <h4 className="text-xl font-black mb-4">Scalable Micro-disbursement Architecture</h4>
                  <div className="w-full h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
                     <div className="h-full bg-emerald-500 w-[65%]" />
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      <Celebration active={celebrating} />
      {/* Performance Module Navigation */}
      <div className="flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                <Trophy size={20} />
             </div>
             <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Performance & Growth</h1>
          </div>
          <p className="text-slate-500 font-medium">Nurturing excellence through continuous feedback and clear alignment.</p>
        </div>
        
        <div className="flex bg-white p-2 rounded-3xl border border-slate-200 shadow-sm w-full lg:w-auto overflow-x-auto scrollbar-hide">
          {[
            { id: 'dashboard', name: 'Analytics', icon: <TrendingUp size={18} /> },
            { id: 'goals', name: 'Objectives', icon: <Target size={18} /> },
            { id: 'feedback', name: 'Shoutouts', icon: <Heart size={18} /> },
            { id: 'growth', name: 'Growth Map', icon: <MapIcon size={18} /> },
            { id: 'reviews', name: 'Reviews', icon: <Star size={18} /> },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main View Transition Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'goals' && renderGoals()}
          {activeTab === 'feedback' && (
            <div className="max-w-4xl mx-auto space-y-10 pb-20">
                <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div>
                    <h2 className="text-2xl font-black text-slate-800">ZenHR Wall of Praise</h2>
                    <p className="text-sm text-slate-500 font-medium italic">Celebrating wins, big and small.</p>
                    </div>
                    <button 
                    onClick={() => setShowFeedbackModal(true)}
                    className="px-8 py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-indigo-200 hover:scale-110 active:scale-95 transition-all"
                    >
                    <Sparkles size={22} fill="currentColor" /> Give Recognition
                    </button>
                </div>
                <div className="space-y-8 relative">
                    <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-slate-100 hidden md:block" />
                    {MOCK_FEEDBACK.map((fb, idx) => (
                    <motion.div 
                        key={fb.id}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative flex flex-col md:flex-row gap-8"
                    >
                        <div className="shrink-0 relative z-10 hidden md:block">
                        <div className="w-20 h-20 bg-white rounded-3xl p-1.5 shadow-xl border border-slate-100">
                            <img src={MOCK_EMPLOYEES.find(e => e.id === fb.fromId)?.avatar} className="w-full h-full rounded-2xl object-cover" />
                        </div>
                        </div>
                        <div className={`bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex-1 relative group hover:border-indigo-100 transition-all ${
                        fb.type === 'praise' ? 'bg-indigo-50/20' : ''
                        }`}>
                        {fb.type === 'praise' && (
                            <div className="absolute top-8 right-10 text-indigo-500 animate-pulse">
                                <Zap size={24} fill="currentColor" />
                            </div>
                        )}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="md:hidden w-12 h-12 rounded-xl overflow-hidden shadow-md">
                                <img src={MOCK_EMPLOYEES.find(e => e.id === fb.fromId)?.avatar} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-800">
                                {MOCK_EMPLOYEES.find(e => e.id === fb.fromId)?.name} 
                                <span className="text-slate-300 mx-2 font-normal">sent to</span> 
                                {MOCK_EMPLOYEES.find(e => e.id === fb.toId)?.name}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                {new Date(fb.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute -left-6 top-0 h-full w-1 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-slate-600 text-lg font-medium leading-relaxed italic">"{fb.message}"</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-8 border-t border-slate-50">
                            <div className="flex gap-2">
                                {fb.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                                    #{tag}
                                </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black hover:bg-indigo-100 transition-all">
                                    <Heart size={14} fill="currentColor" /> {fb.reactions}
                                </button>
                                <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                                    <MessageSquare size={18} />
                                </button>
                            </div>
                        </div>
                        </div>
                    </motion.div>
                    ))}
                </div>
            </div>
          )}
          {activeTab === 'growth' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pb-20">
                <div className="lg:col-span-2 space-y-10">
                    <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-12">
                            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4">
                            <Flame className="text-rose-500" /> Career Development Path
                            </h3>
                            <span className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-[1.2rem] text-xs font-black uppercase tracking-widest border border-emerald-100 shadow-sm">Active Plan</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative group">
                                <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg text-indigo-600 group-hover:scale-110 transition-transform">
                                    <Target size={24} />
                                </div>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">12 Month Vision</p>
                                <h5 className="text-lg font-black text-slate-800 mb-3">Technical Architect</h5>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">Transition from feature development to system-wide architectural governance and scalability optimization.</p>
                            </div>
                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative group">
                                <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg text-rose-500 group-hover:scale-110 transition-transform">
                                    <Rocket size={24} />
                                </div>
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3">Long Term Goal</p>
                                <h5 className="text-lg font-black text-slate-800 mb-3">VP of Engineering</h5>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">Scaling high-performance engineering cultures across multiple geographic regions and product lines.</p>
                            </div>
                        </div>
                        <section>
                            <div className="flex items-center justify-between mb-8">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Skills Analysis Matrix</h4>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-indigo-600" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Current</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-indigo-100" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Target</span>
                                </div>
                            </div>
                            </div>
                            <div className="h-[450px] w-full bg-slate-50/50 rounded-[3rem] p-10 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={skillGapData}>
                                    <PolarGrid stroke="#e2e8f0" strokeWidth={2} />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 150]} hide />
                                    <Radar name="Current" dataKey="current" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} dot={{ fill: '#4f46e5', r: 4 }} />
                                    <Radar name="Target" dataKey="target" stroke="#4f46e5" strokeDasharray="4 4" fill="#4f46e5" fillOpacity={0.1} />
                                    <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                            </div>
                        </section>
                    </div>
                </div>
                <div className="space-y-10">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-indigo-600 p-10 rounded-[3.5rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden"
                    >
                        <Award className="absolute -bottom-8 -right-8 w-48 h-48 text-white/10 rotate-12" />
                        <div className="relative z-10">
                            <h4 className="text-xl font-black mb-8 flex items-center gap-3">
                            <Users size={24} /> Mentorship
                            </h4>
                            <div className="flex items-center gap-6 mb-10 bg-white/10 p-6 rounded-[2rem] border border-white/20 backdrop-blur-md">
                            <img src="https://i.pravatar.cc/150?u=mentor_diana" className="w-16 h-16 rounded-[1.2rem] object-cover border-2 border-white/50" />
                            <div>
                                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Assigned Mentor</p>
                                <p className="text-lg font-black tracking-tight leading-tight">Diana Prince</p>
                                <p className="text-xs text-indigo-100 font-medium">VP Engineering</p>
                            </div>
                            </div>
                            <button className="w-full py-5 bg-white text-indigo-600 rounded-[1.8rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg hover:bg-indigo-50 transition-all">
                            Sync Progress <ArrowRight size={18} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
          )}
          {activeTab === 'reviews' && (
            <div className="bg-white p-24 rounded-[4rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }} 
                transition={{ duration: 4, repeat: Infinity }}
                className="w-32 h-32 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-300 mb-10 shadow-inner"
              >
                <Star size={64} strokeWidth={1.5} />
              </motion.div>
              <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter">Review Cycle Not Started</h3>
              <p className="text-slate-500 max-w-sm font-medium text-lg leading-relaxed">
                The next appraisal window (H2 2024) opens in 12 days. Prepare your self-reflections early!
              </p>
              <div className="flex gap-4 mt-12">
                 <button className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all">
                    Prepare My Assessment
                 </button>
                 <button className="px-10 py-5 bg-white border border-slate-200 text-slate-500 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all">
                    Review History
                 </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Goal Creation Modal */}
      <AnimatePresence>
         {showGoalModal && (
           <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowGoalModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden"
              >
                 <div className="p-10 bg-indigo-600 text-white flex justify-between items-start">
                    <div>
                       <h2 className="text-2xl font-black mb-1">Set Strategic Objective</h2>
                       <p className="text-indigo-100 text-sm font-medium">Define high-impact goals that drive growth.</p>
                    </div>
                    <button onClick={() => setShowGoalModal(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X size={20} /></button>
                 </div>
                 <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objective Title</label>
                       <input type="text" placeholder="e.g. Master the new Wallet Engine architecture" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-black text-slate-800" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Goal Category</label>
                          <select className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-600">
                             <option>Individual</option>
                             <option>Team</option>
                             <option>Department</option>
                          </select>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Date</label>
                          <input type="date" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-600" />
                       </div>
                    </div>
                 </div>
                 <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                    <button onClick={() => setShowGoalModal(false)} className="px-8 py-4 bg-white text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                    <button 
                        onClick={() => { setShowGoalModal(false); triggerCelebration(); }}
                        className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100"
                    >
                        Establish Goal
                    </button>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>

      {/* Give Feedback Modal */}
      <AnimatePresence>
         {showFeedbackModal && (
           <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFeedbackModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden"
              >
                 <div className="p-10 bg-indigo-600 text-white flex justify-between items-start">
                    <div>
                       <h2 className="text-2xl font-black mb-1">Send a Shoutout</h2>
                       <p className="text-indigo-100 text-sm font-medium">Appreciation is the catalyst for brilliance.</p>
                    </div>
                    <button onClick={() => setShowFeedbackModal(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X size={20} /></button>
                 </div>
                 <div className="p-10 space-y-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient</label>
                       <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input type="text" placeholder="Who deserves recognition today?" className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold" />
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                       {['Praise 👏', 'Bravo 💡', 'Gratitude ❓'].map(type => (
                         <button key={type} className="py-4 bg-slate-50 border-2 border-transparent hover:border-indigo-600 hover:bg-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all">
                           {type}
                         </button>
                       ))}
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">The Message</label>
                       <textarea rows={5} placeholder="Tell them why they're awesome..." className="w-full px-6 py-4 bg-slate-50 border-none rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium resize-none" />
                    </div>

                    <div className="flex gap-4">
                       <button 
                        onClick={() => { setShowFeedbackModal(false); triggerCelebration(); }}
                        className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                       >
                          <Send size={18} fill="currentColor" /> Send Now
                       </button>
                    </div>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default Performance;
