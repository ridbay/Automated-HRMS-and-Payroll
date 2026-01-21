
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Fixed missing Settings, PieChart as PieIcon, History as HistoryIcon, and Award imports from lucide-react to resolve compilation errors
import { 
  Users, UserPlus, TrendingUp, Briefcase, Wallet, 
  AlertTriangle, Plus, FileText, Download, Upload, 
  Calendar, CheckCircle2, Star, Clock, Heart, 
  ShieldCheck, ShieldAlert, Info, ChevronRight, 
  Search, Filter, MoreHorizontal, ArrowUpRight, 
  ArrowDownRight, Bell, Zap, Megaphone, Target,
  MousePointer2, Flag, BookOpen, UserCheck, Trash2,
  Settings, PieChart as PieIcon, History as HistoryIcon,
  Award
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Legend
} from 'recharts';
import { MOCK_EMPLOYEES } from '../../data/mocks';

const deptData = [
  { name: 'Engineering', value: 45, fill: '#6366f1' },
  { name: 'Sales', value: 30, fill: '#10b981' },
  { name: 'Marketing', value: 20, fill: '#f59e0b' },
  { name: 'People', value: 15, fill: '#8b5cf6' },
  { name: 'Ops', value: 28, fill: '#3b82f6' },
];

const headcountTrend = [
  { month: 'Jan', total: 110, hires: 5, exits: 2 },
  { month: 'Feb', total: 115, hires: 8, exits: 3 },
  { month: 'Mar', total: 122, hires: 10, exits: 3 },
  { month: 'Apr', total: 128, hires: 12, exits: 6 },
  { month: 'May', total: 138, hires: 15, exits: 5 },
];

const HRDashboard: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stats = [
    { label: 'Total Headcount', value: '138', sub: '+12% from last month', trend: 'up', breakdown: '124 Active, 6 On Leave', icon: <Users className="text-indigo-600" />, bg: 'bg-indigo-50' },
    { label: 'New Hires', value: '15', sub: '85% Onboarded', trend: 'up', breakdown: 'May 2024 cohort', icon: <UserPlus className="text-emerald-600" />, bg: 'bg-emerald-50' },
    { label: 'Attrition Rate', value: '4.2%', sub: '-0.8% vs industry', trend: 'down', breakdown: '5 exits this month', icon: <TrendingUp className="text-rose-600" />, bg: 'bg-rose-50' },
    { label: 'Open Positions', value: '24', sub: '128 Candidates', trend: 'up', breakdown: '8 High priority', icon: <Briefcase className="text-amber-600" />, bg: 'bg-amber-50' },
    { label: 'Payroll (May)', value: '₦420M', sub: 'Processed', trend: 'stable', breakdown: 'Payday: May 25', icon: <Wallet className="text-violet-600" />, bg: 'bg-violet-50' },
    { label: 'Pending Actions', value: '18', sub: '4 Critical Alerts', trend: 'up', breakdown: 'Requires HR attention', icon: <AlertTriangle className="text-orange-600" />, bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Executive Summary Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                <Zap size={20} fill="currentColor" />
             </div>
             <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">HR Control Center</h1>
          </div>
          <p className="text-slate-500 font-medium italic">Welcome, Administrator. Organization snapshot as of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
            <Download size={16} /> Monthly Report
          </button>
          <button className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all">
            + New Action
          </button>
        </div>
      </section>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {stats.map((s, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm relative group overflow-hidden"
          >
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform`}>
              {s.icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <h4 className="text-2xl font-black text-slate-800 tracking-tighter">{s.value}</h4>
            <p className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${s.trend === 'up' ? 'text-emerald-500' : s.trend === 'down' ? 'text-rose-500' : 'text-slate-400'}`}>
              {s.sub}
            </p>
            <div className="mt-4 pt-4 border-t border-slate-50">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.breakdown}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Alerts & Analytics Section */}
        <div className="lg:col-span-3 space-y-10">
          
          {/* Quick Actions Matrix */}
          <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
             <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase text-xs tracking-[0.2em] text-slate-400">Administrative Orchestration</h3>
                {/* Resolved "Cannot find name 'Settings'" by importing it from lucide-react */}
                <button className="p-2 text-slate-300 hover:text-indigo-600"><Settings size={20} /></button>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Workforce', actions: ['Add Employee', 'Bulk Import', 'Generate Roster'], icon: <Users className="text-indigo-500" /> },
                  { label: 'Recruitment', actions: ['Post Job', 'Offers', 'Interview Board'], icon: <Briefcase className="text-amber-500" /> },
                  { label: 'Payroll', actions: ['Process Run', 'Tax Filing', 'Wallet Fund'], icon: <Wallet className="text-emerald-500" /> },
                  { label: 'Performance', actions: ['New Cycle', 'Calibration', 'Appraisals'], icon: <Target className="text-rose-500" /> },
                ].map((group, i) => (
                  <div key={i} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group">
                    <div className="flex items-center gap-3 mb-6">
                       {group.icon}
                       <span className="text-[10px] font-black uppercase text-slate-700 tracking-widest">{group.label}</span>
                    </div>
                    <div className="space-y-3">
                       {group.actions.map(a => (
                         <button key={a} className="w-full text-left p-3 bg-white rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 hover:shadow-sm transition-all flex items-center justify-between group/btn">
                           {a} <ChevronRight size={12} className="opacity-0 group-hover/btn:opacity-100" />
                         </button>
                       ))}
                    </div>
                  </div>
                ))}
             </div>
          </section>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {/* Dept Distribution */}
             <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-3">
                   {/* Resolved "Cannot find name 'PieIcon'" by adding 'PieChart as PieIcon' to imports */}
                   <PieIcon className="text-indigo-600" size={18} /> Departmental Mix
                </h3>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie data={deptData} innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value">
                            {deptData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                            ))}
                         </Pie>
                         <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-8">
                   {deptData.map((d, i) => (
                     <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                           <span className="text-[10px] font-bold text-slate-500 uppercase">{d.name}</span>
                        </div>
                        <span className="text-xs font-black text-slate-800">{d.value}</span>
                     </div>
                   ))}
                </div>
             </section>

             {/* Growth Trend */}
             <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-3">
                   <TrendingUp className="text-emerald-600" size={18} /> Growth Velocity
                </h3>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={headcountTrend}>
                         <defs>
                            <linearGradient id="totalG" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                               <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                         <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} />
                         <Tooltip />
                         <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#totalG)" />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
                <p className="text-[10px] font-bold text-slate-400 text-center uppercase mt-6 tracking-widest">Net Change: +28 Employees YTD</p>
             </section>
          </div>

          {/* Compliance & Document Health */}
          <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
             <div className="flex items-center justify-between mb-10">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                   <ShieldCheck className="text-emerald-500" size={20} /> Governance & Compliance
                </h3>
                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Full Audit Report</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { label: 'Doc Compliance', val: '95%', color: 'emerald', sub: 'Missing: 12 Files' },
                  { label: 'Training Score', val: '87%', color: 'indigo', sub: 'Overdue: 8 Sessions' },
                  { label: 'Policy Acks', val: '98%', color: 'emerald', sub: 'H1 2024 Cycle' },
                ].map((c, i) => (
                  <div key={i} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{c.label}</p>
                     <div className="flex items-end gap-2 mb-4">
                        <span className={`text-4xl font-black text-${c.color}-600`}>{c.val}</span>
                        <div className="w-full h-1.5 bg-white rounded-full mb-2 overflow-hidden">
                           <div className={`h-full bg-${c.color}-500 w-[${c.val}]`} />
                        </div>
                     </div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase">{c.sub}</p>
                  </div>
                ))}
             </div>
          </section>

        </div>

        {/* Sidebar Alerts & Notifications */}
        <div className="space-y-10">
          {/* Critical Alerts Stack */}
          <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Priority Alerts</h3>
                <span className="w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center animate-pulse">4</span>
             </div>
             <div className="space-y-4">
                {[
                  { title: 'Probation Ending', sub: '5 Employees (Jun 1)', type: 'red', icon: <UserCheck size={16} /> },
                  { title: 'Document Expiry', sub: 'Passport: Sarah J. (14d)', type: 'red', icon: <FileText size={16} /> },
                  { title: 'Payroll Variance', sub: '12% higher than forecast', type: 'orange', icon: <Wallet size={16} /> },
                  { title: 'New Leave Flood', sub: '12 pending approvals', type: 'orange', icon: <Calendar size={16} /> },
                ].map((alert, i) => (
                  <div key={i} className={`p-5 rounded-3xl border-2 flex items-start gap-4 transition-all hover:scale-[1.02] cursor-pointer ${
                    alert.type === 'red' ? 'bg-rose-50/50 border-rose-100 text-rose-800' : 'bg-amber-50/50 border-amber-100 text-amber-800'
                  }`}>
                    <div className={`p-2 rounded-xl ${alert.type === 'red' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'} shadow-lg`}>
                       {alert.icon}
                    </div>
                    <div>
                       <p className="text-sm font-black tracking-tight leading-none mb-1">{alert.title}</p>
                       <p className="text-[10px] font-bold uppercase opacity-60">{alert.sub}</p>
                    </div>
                  </div>
                ))}
             </div>
             <button className="w-full mt-6 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all">View All Alerts</button>
          </section>

          {/* Activity Timeline */}
          <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                {/* Resolved "'History' cannot be used as a JSX component" by using aliased 'HistoryIcon' to avoid conflict with browser History type */}
                <HistoryIcon size={80} />
             </div>
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 relative z-10">Operations Log</h3>
             <div className="space-y-8 relative z-10">
                {[
                  { ev: 'Sarah J. promoted to Lead', t: '2h ago', color: 'bg-emerald-500' },
                  { ev: 'Payroll Batch #28 approved', t: '5h ago', color: 'bg-indigo-500' },
                  { ev: 'New hire: Marcus L.', t: 'Yesterday', color: 'bg-emerald-500' },
                  { ev: 'Exit processed: Linda P.', t: 'Yesterday', color: 'bg-rose-500' },
                ].map((ev, i) => (
                  <div key={i} className="flex gap-4 items-start group">
                     <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ev.color}`} />
                     <div className="flex-1">
                        <p className="text-xs font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">{ev.ev}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase mt-1">{ev.t}</p>
                     </div>
                  </div>
                ))}
             </div>
          </section>

          {/* Info & Events */}
          <section className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 overflow-hidden">
                <div className="absolute -top-10 -left-10 w-32 h-32 border border-white rounded-full" />
             </div>
             <h3 className="text-xs font-black text-indigo-300 uppercase tracking-[0.2em] mb-8">Social & Culture</h3>
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-rose-400">
                      <Heart size={20} fill="currentColor" />
                   </div>
                   <div>
                      <p className="text-xs font-bold">Birthdays This Week</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">James W, Emma D.</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-amber-400">
                      {/* Resolved "Cannot find name 'Award'" by adding it to lucide-react imports */}
                      <Award size={20} />
                   </div>
                   <div>
                      <p className="text-xs font-bold">1-Year Anniversary</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Michael Chen</p>
                   </div>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Upcoming Event</p>
                   <p className="text-xs font-bold">Q2 Team Townhall</p>
                   <p className="text-[10px] text-slate-400 mt-1 uppercase">Friday, 2:00 PM (GMT+1)</p>
                </div>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
