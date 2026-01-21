
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Added Briefcase and Wallet to the imports from lucide-react to fix reference errors on lines 223 and 228
import { 
  BarChart3, PieChart as PieIcon, TrendingUp, Users, 
  Calendar, FileText, Download, Share2, Filter, 
  Plus, Search, ChevronRight, Info, Zap, LayoutGrid,
  Settings, Clock, ArrowUpRight, ArrowDownRight,
  Sparkles, Save, Trash2, Mail, ExternalLink,
  ChevronDown, Layers, Map, Eye, MoreHorizontal,
  Table as TableIcon, Activity, Funnel as FunnelIcon,
  ShieldCheck, BrainCircuit, Globe,
  Briefcase, Wallet
} from 'lucide-react';
// Added LabelList to the imports from recharts to fix reference error on line 160
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, AreaChart, Area, 
  PieChart, Pie, LineChart, Line, Funnel, FunnelChart,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  LabelList
} from 'recharts';

const workforceTrendData = [
  { month: 'Jun 23', total: 105, hires: 5, leavers: 1 },
  { month: 'Jul 23', total: 109, hires: 6, leavers: 2 },
  { month: 'Aug 23', total: 112, hires: 4, leavers: 1 },
  { month: 'Sep 23', total: 118, hires: 8, leavers: 2 },
  { month: 'Oct 23', total: 121, hires: 4, leavers: 1 },
  { month: 'Nov 23', total: 125, hires: 5, leavers: 1 },
  { month: 'Dec 23', total: 124, hires: 2, leavers: 3 },
  { month: 'Jan 24', total: 128, hires: 6, leavers: 2 },
  { month: 'Feb 24', total: 130, hires: 4, leavers: 2 },
  { month: 'Mar 24', total: 135, hires: 7, leavers: 2 },
  { month: 'Apr 24', total: 132, hires: 2, leavers: 5 },
  { month: 'May 24', total: 138, hires: 8, leavers: 2 },
];

const deptDistribution = [
  { name: 'Engineering', value: 45, fill: '#6366f1' },
  { name: 'Sales', value: 30, fill: '#10b981' },
  { name: 'Marketing', value: 20, fill: '#f59e0b' },
  { name: 'People/HR', value: 15, fill: '#8b5cf6' },
  { name: 'Operations', value: 28, fill: '#3b82f6' },
];

const recruitmentFunnel = [
  { value: 100, name: 'Applied', fill: '#8884d8' },
  { value: 80, name: 'Screening', fill: '#83a6ed' },
  { value: 50, name: 'Interview', fill: '#8dd1e1' },
  { value: 40, name: 'Offer', fill: '#82ca9d' },
  { value: 26, name: 'Hired', fill: '#a4de6c' },
];

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'library' | 'builder' | 'predictive'>('dashboard');
  const [reportSearch, setReportSearch] = useState('');

  const renderDashboard = () => (
    <div className="space-y-8 pb-20">
      {/* Executive Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Headcount', value: '138', trend: '+12%', pos: true },
          { label: 'Attrition Rate', value: '4.2%', trend: '-0.5%', pos: true },
          { label: 'Avg. Tenure', value: '2.8y', trend: '+0.2y', pos: true },
          { label: 'Diversity Index', value: '72%', trend: '+4%', pos: true },
          { label: 'Engagement', value: '4.8/5', trend: 'Stable', pos: true },
          { label: 'Cost/Employee', value: '₦1.2M', trend: '+2.1%', pos: false },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{stat.label}</p>
            <div>
               <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{stat.value}</h3>
               <p className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${stat.pos ? 'text-emerald-500' : 'text-rose-500'}`}>
                 {stat.trend.includes('+') ? <ArrowUpRight size={10} /> : stat.trend.includes('-') ? <ArrowDownRight size={10} /> : null}
                 {stat.trend}
               </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Headcount Trends */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-10">
              <div>
                 <h3 className="text-lg font-black text-slate-800">Growth Velocity</h3>
                 <p className="text-xs text-slate-400 font-medium">Headcount and hiring trends over last 12 months</p>
              </div>
              <div className="flex bg-slate-50 p-1 rounded-xl">
                 <button className="px-4 py-1.5 bg-white text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">Trend</button>
                 <button className="px-4 py-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest">Hires</button>
              </div>
           </div>
           <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={workforceTrendData}>
                    <defs>
                      <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#totalGrad)" />
                    <Line type="monotone" dataKey="hires" stroke="#10b981" strokeWidth={2} dot={false} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Department Mix */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
           <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
             <Layers className="text-indigo-600" /> Department Distribution
           </h3>
           <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={deptDistribution} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                       {deptDistribution.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.fill} />
                       ))}
                    </Pie>
                    <Tooltip />
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="space-y-3 mt-6">
              {deptDistribution.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }}></div>
                      <span className="text-xs font-bold text-slate-600 uppercase">{d.name}</span>
                   </div>
                   <span className="text-sm font-black text-slate-800">{Math.round((d.value/138)*100)}%</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recruitment Funnel */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
           <h3 className="text-lg font-black text-slate-800 mb-10 flex items-center gap-2">
              <FunnelIcon className="text-amber-500" /> Recruitment Pipeline
           </h3>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <FunnelChart>
                    <Tooltip />
                    <Funnel dataKey="value" data={recruitmentFunnel} isAnimationActive>
                       <LabelList position="right" fill="#64748b" stroke="none" dataKey="name" fontSize={10} fontWeight={800} />
                    </Funnel>
                 </FunnelChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Tenure Bar Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
           <h3 className="text-lg font-black text-slate-800 mb-10 flex items-center gap-2">
              <Clock className="text-indigo-600" /> Tenure Distribution
           </h3>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={[
                   { name: '<1yr', value: 34 },
                   { name: '1-2yr', value: 42 },
                   { name: '2-4yr', value: 28 },
                   { name: '4-6yr', value: 15 },
                   { name: '6yr+', value: 19 },
                 ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={45} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );

  const renderLibrary = () => (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search reports library..." 
              value={reportSearch}
              onChange={(e) => setReportSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-sm"
            />
         </div>
         <div className="flex gap-3">
            <button className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
               <Calendar size={18} /> Last 30 Days
            </button>
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2">
               <Save size={18} /> Saved Reports
            </button>
         </div>
      </div>

      {[
        { title: 'Workforce', icon: <Users className="text-indigo-600" />, reports: [
          { name: 'Detailed Headcount', desc: 'Full employee roster with role and dept split.', type: 'Table' },
          { name: 'Diversity & Inclusion', desc: 'Gender, age, and ethnicity metrics.', type: 'Chart' },
          { name: 'Organizational Chart', desc: 'Visual reporting hierarchy map.', type: 'Visual' },
        ]},
        { title: 'Recruitment', icon: <Briefcase className="text-amber-500" />, reports: [
          { name: 'Time-to-Hire Analysis', desc: 'Average days from post to offer by role.', type: 'Line' },
          { name: 'Source Effectiveness', desc: 'Hires vs candidates per source (LinkedIn, etc).', type: 'Pie' },
          { name: 'Interview Performance', desc: 'Interviewer throughput and candidate rating.', type: 'Bar' },
        ]},
        { title: 'Payroll & Finance', icon: <Wallet className="text-emerald-500" />, reports: [
          { name: 'Salary Distribution', desc: 'Salary bands across the organization.', type: 'Heatmap' },
          { name: 'Payroll Cost Analysis', desc: 'Monthly variance vs wallet budget.', type: 'Trend' },
          { name: 'Tax Compliance Report', desc: 'PAYE schedule for annual audit.', type: 'Table' },
        ]},
      ].map((cat, i) => (
        <section key={i} className="space-y-6">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">{cat.icon}</div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{cat.title} Reports</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {cat.reports.map((r, j) => (
                <motion.div 
                  key={j} 
                  whileHover={{ scale: 1.02 }}
                  className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-indigo-600 transition-all cursor-pointer relative"
                >
                   <div className="flex justify-between items-start mb-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">{r.type}</span>
                      <button className="text-slate-300 hover:text-indigo-600 transition-all"><ExternalLink size={16} /></button>
                   </div>
                   <h4 className="text-lg font-black text-slate-800 mb-2">{r.name}</h4>
                   <p className="text-xs text-slate-400 font-medium leading-relaxed mb-8">{r.desc}</p>
                   <div className="flex items-center justify-between pt-6 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-2">
                        <button className="p-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all"><Download size={14} /></button>
                        <button className="p-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all"><Share2 size={14} /></button>
                      </div>
                      <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">Generate Now <ChevronRight size={14} /></button>
                   </div>
                </motion.div>
              ))}
           </div>
        </section>
      ))}
    </div>
  );

  const renderPredictive = () => (
    <div className="space-y-10 pb-20">
       <div className="bg-gradient-to-br from-indigo-600 to-violet-800 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
          <Sparkles className="absolute top-10 right-10 w-48 h-48 text-white/10" />
          <div className="relative z-10 max-w-2xl">
             <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] w-fit mb-6">AI Insight Module</div>
             <h2 className="text-4xl font-black mb-6 tracking-tighter">Predictive Workforce Intelligence</h2>
             <p className="text-indigo-100 text-lg leading-relaxed mb-10">
                ZenHR AI analyzes patterns across performance, attendance, and payroll to forecast future workforce trends with 92% accuracy.
             </p>
             <button className="px-10 py-5 bg-white text-indigo-600 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl flex items-center gap-3">
                <BrainCircuit size={20} /> Run New Simulation
             </button>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between mb-12">
                   <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4">
                     <Activity size={24} className="text-rose-500" /> Attrition Risk Forecast
                   </h3>
                   <span className="px-5 py-2 bg-rose-50 text-rose-600 rounded-full text-xs font-black uppercase tracking-widest border border-rose-100">Critical View</span>
                </div>
                <div className="space-y-8">
                   {[
                     { name: 'Sarah Johnson', risk: 'High', score: 85, factors: ['Performance decline', 'Market salary gap'], avatar: 'https://i.pravatar.cc/150?u=sarah' },
                     { name: 'Marcus Rodriguez', risk: 'Medium', score: 45, factors: ['Commute length', 'Leave utilization'], avatar: 'https://i.pravatar.cc/150?u=marcus' },
                   ].map((item, i) => (
                     <div key={i} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-8">
                        <img src={item.avatar} className="w-16 h-16 rounded-3xl object-cover" />
                        <div className="flex-1">
                           <div className="flex justify-between items-center mb-4">
                              <h4 className="text-lg font-black text-slate-800">{item.name}</h4>
                              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                item.risk === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                              }`}>{item.risk} Risk</span>
                           </div>
                           <div className="flex gap-2">
                             {item.factors.map(f => (
                               <span key={f} className="text-[10px] font-bold text-slate-400 uppercase tracking-tight bg-white px-2 py-1 rounded-lg border border-slate-100">#{f}</span>
                             ))}
                           </div>
                        </div>
                        <div className="text-center min-w-[80px]">
                           <p className="text-2xl font-black text-slate-800">{item.score}%</p>
                           <p className="text-[10px] font-black text-slate-400 uppercase">Risk Score</p>
                        </div>
                     </div>
                   ))}
                </div>
                <button className="w-full mt-10 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">View All Risk Factors</button>
             </div>
          </div>

          <div className="space-y-8">
             <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-10">Benchmarking</h3>
                <div className="space-y-8">
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-slate-700">Turnover Rate</span>
                         <span className="text-emerald-500 font-black text-xs">-15% Industry Avg</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-indigo-600 w-[65%]" />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-slate-700">Time-to-Hire</span>
                         <span className="text-rose-500 font-black text-xs">+4d Industry Avg</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-amber-500 w-[85%]" />
                      </div>
                   </div>
                </div>
                <button className="w-full mt-10 py-4 border-2 border-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                   <Globe size={16} /> Market Reports
                </button>
             </div>

             <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
                <TrendingUp className="absolute -bottom-8 -right-8 w-32 h-32 text-indigo-500/10 rotate-12" />
                <h4 className="text-xl font-black mb-6">Hiring Forecast</h4>
                <p className="text-xs text-indigo-200 font-medium leading-relaxed mb-8">
                   Based on growth projections, Engineering will need <b className="text-white text-sm">12 new senior roles</b> by Q3 2024 to hit roadmap targets.
                </p>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                   <p className="text-[10px] font-black text-indigo-300 uppercase mb-2">Confidence Level</p>
                   <p className="text-2xl font-black">94% <span className="text-xs font-medium text-slate-400">Reliability</span></p>
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  const renderBuilder = () => (
    <div className="flex flex-col lg:flex-row gap-8 pb-20">
       {/* Builder Side Panel */}
       <div className="lg:w-80 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-2">
                <Layers size={18} className="text-indigo-600" /> Data Sources
             </h3>
             <div className="space-y-4">
                {['Workforce Detail', 'Payroll Master', 'Attendance Logs', 'Recruitment Pipeline', 'Goal Performance'].map(source => (
                  <div key={source} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100">
                     <div className="w-4 h-4 border-2 border-slate-300 rounded" />
                     <span className="text-xs font-bold text-slate-600">{source}</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10">Visual Type</h3>
             <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Table', icon: <TableIcon size={16} /> },
                  { name: 'Bar', icon: <BarChart3 size={16} /> },
                  { name: 'Line', icon: <TrendingUp size={16} /> },
                  { name: 'Pie', icon: <PieIcon size={16} /> },
                ].map(type => (
                  <button key={type.name} className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all text-slate-400 group">
                     {type.icon}
                     <span className="text-[10px] font-black uppercase mt-2 group-hover:text-white">{type.name}</span>
                  </button>
                ))}
             </div>
          </div>
       </div>

       {/* Builder Canvas */}
       <div className="flex-1 space-y-8">
          <div className="bg-white p-12 rounded-[3.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center min-h-[600px] relative overflow-hidden bg-slate-50/20">
             <div className="absolute top-8 right-12 flex gap-4">
                <button className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">Preview</button>
                <button className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all">Save Report</button>
             </div>
             <motion.div 
               animate={{ scale: [1, 1.05, 1] }} 
               transition={{ duration: 4, repeat: Infinity }}
               className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-300 mb-8"
             >
                <LayoutGrid size={48} strokeWidth={1.5} />
             </motion.div>
             <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter">Your Canvas is Ready</h3>
             <p className="text-slate-400 max-w-sm font-medium leading-relaxed">
                Drag metrics from the side panel to start building your custom dashboard. Visualizations will generate in real-time.
             </p>
             <div className="grid grid-cols-3 gap-6 mt-16 max-w-lg w-full">
                <div className="h-20 bg-white rounded-2xl shadow-sm border border-slate-100" />
                <div className="h-20 bg-white rounded-2xl shadow-sm border border-slate-100" />
                <div className="h-20 bg-white rounded-2xl shadow-sm border border-slate-100" />
             </div>
          </div>
       </div>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Module Header & Navigation */}
      <div className="flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center">
        <div>
           <div className="flex items-center gap-4 mb-1">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                 <BarChart3 size={24} />
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Insights & Analytics</h1>
           </div>
           <p className="text-slate-500 font-medium">Data-driven decisions for modern workforce management.</p>
        </div>

        <div className="flex bg-white p-2 rounded-3xl border border-slate-200 shadow-sm w-full lg:w-auto overflow-x-auto scrollbar-hide">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: <TrendingUp size={18} /> },
            { id: 'library', name: 'Reports Library', icon: <FileText size={18} /> },
            { id: 'builder', name: 'Report Builder', icon: <Plus size={18} /> },
            { id: 'predictive', name: 'ZenHR AI', icon: <BrainCircuit size={18} /> },
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

      <AnimatePresence mode="wait">
         <motion.div
           key={activeTab}
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -15 }}
           transition={{ duration: 0.4, ease: "easeOut" }}
         >
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'library' && renderLibrary()}
            {activeTab === 'predictive' && renderPredictive()}
            {activeTab === 'builder' && renderBuilder()}
         </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Reports;
