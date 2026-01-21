
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Added UserPlus to imports to fix reference error in renderTeam
import { 
  Users, CheckCircle2, Clock, Trophy, Briefcase, 
  ChevronRight, Calendar, MessageSquare, Plus, 
  AlertCircle, Zap, Heart, BarChart3, TrendingUp, 
  MapPin, Coffee, Star, X, Check, Filter, 
  Download, Search, MoreHorizontal, CalendarDays,
  User, LayoutGrid, Timer, Laptop, ShieldCheck,
  Target, Presentation, ChevronDown, Eye, Mail,
  Phone, Trash2, FileText, Share2, DollarSign,
  ArrowRight, Landmark, Info, PieChart as PieIcon,
  HelpCircle, Flag, Megaphone, Send, Rocket,
  Video, ListChecks, FileCheck, Umbrella, Save,
  UserPlus
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area 
} from 'recharts';
import { MOCK_EMPLOYEES, MOCK_GOALS, MOCK_LEAVE_BALANCES } from '../../data/mocks';

const ManagerDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'team' | 'approvals' | 'performance' | 'meetings'>('dashboard');
  const [activeApprovalTab, setActiveApprovalTab] = useState<'leave' | 'expenses' | 'time' | 'requisition'>('leave');
  const [viewingEmployee, setViewingEmployee] = useState<any>(null);
  const [employeeDetailTab, setEmployeeDetailTab] = useState<'overview' | 'performance' | 'attendance' | 'comp'>('overview');

  const teamMembers = MOCK_EMPLOYEES;
  
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);

  const approvalsData = {
    leave: [
      { id: 'l1', name: 'Emma Davis', type: 'Annual Leave', range: 'Jun 12 - Jun 15', days: 4, reason: 'Family vacation to the coast.', balance: 16, impact: '3 others off', avatar: teamMembers[2].avatar },
      { id: 'l2', name: 'Michael Chen', type: 'Sick Leave', range: 'May 24 - May 25', days: 2, reason: 'Severe flu symptoms.', balance: 8, impact: 'High workload week', avatar: teamMembers[1].avatar },
    ],
    expenses: [
      { id: 'e1', name: 'Sarah Johnson', cat: 'Software', amount: 150000.00, date: 'May 22', desc: 'Enterprise Cloud License', budget: 'Within Budget', receipt: true, avatar: teamMembers[0].avatar },
    ],
    time: [
      { id: 't1', name: 'James Wilson', date: 'May 20', current: 'Absent', requested: 'Worked from Home', reason: 'Internet outage at HQ', avatar: teamMembers[3].avatar },
    ],
    requisition: [
      { id: 'r1', title: 'Senior Product Designer', dept: 'Design', budget: '₦1.2M - ₦1.8M', urgency: 'High', justification: 'To lead the ZenHR 3.0 mobile redesign.', avatar: 'https://i.pravatar.cc/150?u=hire' },
    ]
  };

  const renderDashboard = () => (
    <div className="space-y-10">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Managerial Hub</h1>
           <p className="text-slate-500 font-medium">Good morning, Marcus. You have <b className="text-indigo-600">4 actions</b> requiring attention today.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setActiveSection('approvals')} className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-rose-100 flex items-center gap-2 relative">
              <ListChecks size={16} /> 3 Approvals
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
           </button>
           <button onClick={() => setActiveSection('meetings')} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:scale-105 transition-all">
              <Plus size={18} /> Schedule Sync
           </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
         {[
           { label: 'Team Size', val: teamMembers.length, sub: '4 Active, 2 Remote', icon: <Users className="text-indigo-600" />, bg: 'bg-indigo-50' },
           { label: 'Pending', val: '4', sub: 'Approvals Needed', icon: <CheckCircle2 className="text-emerald-600" />, bg: 'bg-emerald-50' },
           { label: 'Presence', val: '94%', sub: '2 Late Arrivals', icon: <Clock className="text-amber-600" />, bg: 'bg-amber-50' },
           { label: 'Avg Rating', val: '4.2', sub: 'Sarah J. (Top)', icon: <Trophy className="text-violet-600" />, bg: 'bg-violet-50' },
           { label: 'Hiring', val: '1', sub: '3 Candidates', icon: <Briefcase className="text-rose-600" />, bg: 'bg-rose-50' },
         ].map((s, i) => (
           <motion.div whileHover={{ y: -5 }} key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm group">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 transition-transform`}>
                 {s.icon}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <h4 className="text-2xl font-black text-slate-800 tracking-tighter">{s.val}</h4>
              <p className="text-[10px] font-bold text-slate-400 mt-2">{s.sub}</p>
           </motion.div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
           <section className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-10 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="text-xl font-black text-slate-800 tracking-tight">Priority Approvals</h3>
                 <button onClick={() => setActiveSection('approvals')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1">View Full List <ChevronRight size={14} /></button>
              </div>
              <div className="divide-y divide-slate-50">
                 {approvalsData.leave.slice(0, 2).map((req) => (
                    <div key={req.id} className="p-8 hover:bg-slate-50/50 transition-all flex items-center justify-between group">
                       <div className="flex items-center gap-6">
                          <img src={req.avatar} className="w-14 h-14 rounded-[1.5rem] object-cover ring-4 ring-white shadow-xl" />
                          <div>
                             <div className="flex items-center gap-3 mb-1">
                                <h4 className="text-sm font-black text-slate-800">{req.name}</h4>
                                <span className="px-3 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-500">Leave</span>
                             </div>
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{req.type} • {req.range}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <button className="p-3 bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm"><X size={18} /></button>
                          <button className="p-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all shadow-lg"><Check size={18} /></button>
                       </div>
                    </div>
                 ))}
              </div>
           </section>
        </div>
      </div>
    </div>
  );

  // Added comment above fix to implement missing renderTeam function
  const renderTeam = () => (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">My Direct Reports</h2>
           <p className="text-sm text-slate-500 font-medium italic">Managing performance and growth for {teamMembers.length} members.</p>
        </div>
        <button className="px-8 py-3.5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2">
           <UserPlus size={18} /> Add Team Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {teamMembers.map((emp) => (
          <motion.div 
            key={emp.id} 
            whileHover={{ y: -8 }}
            onClick={() => setViewingEmployee(emp)}
            className="bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer relative group overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-full h-24 ${emp.status === 'active' ? 'bg-emerald-50' : 'bg-amber-50'} transition-transform group-hover:scale-x-110`} />
            <div className="relative mb-6 pt-4">
               <div className="relative mx-auto w-24 h-24">
                  <img src={emp.avatar} className="w-full h-full rounded-[2rem] object-cover border-4 border-white shadow-lg" />
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-2 border-white rounded-lg flex items-center justify-center shadow-md ${emp.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                     <ShieldCheck size={12} className="text-white" />
                  </div>
               </div>
            </div>
            <div className="text-center">
               <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1">{emp.name}</h3>
               <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-6">{emp.role}</p>
               
               <div className="space-y-3 mb-8">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                     <span>Performance</span>
                     <span className="text-slate-800 font-black">4.8/5.0</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500 w-[92%]" />
                  </div>
               </div>

               <div className="flex gap-2">
                  <button className="flex-1 py-2.5 bg-slate-50 text-slate-500 hover:text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors">Review</button>
                  <button className="p-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"><MessageSquare size={14} /></button>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderApprovals = () => (
    <div className="space-y-10 pb-20">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
             <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Approval Center</h2>
             <p className="text-sm text-slate-500 font-medium">Review and authorize team requests.</p>
          </div>
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
             {[
                { id: 'leave', label: 'Leaves', icon: <Umbrella size={16} /> },
                { id: 'expenses', label: 'Expenses', icon: <DollarSign size={16} /> },
                { id: 'time', label: 'Attendance', icon: <Clock size={16} /> },
                { id: 'requisition', label: 'Hiring', icon: <Briefcase size={16} /> },
             ].map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveApprovalTab(tab.id as any)}
                 className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                   activeApprovalTab === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'
                 }`}
               >
                 {tab.icon} {tab.label}
               </button>
             ))}
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnimatePresence mode="wait">
             {activeApprovalTab === 'leave' && (
               <>
                 {approvalsData.leave.map((req) => (
                   <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col gap-8 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                         <div className="flex items-center gap-6">
                            <img src={req.avatar} className="w-16 h-16 rounded-[1.8rem] object-cover ring-4 ring-white shadow-xl" />
                            <div>
                               <h3 className="text-xl font-black text-slate-800">{req.name}</h3>
                               <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">{req.type}</p>
                            </div>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                         <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Duration</p>
                            <p className="text-sm font-black text-slate-800">{req.range}</p>
                         </div>
                         <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Remaining</p>
                            <p className="text-sm font-black text-slate-800">{req.balance} Days</p>
                         </div>
                      </div>
                      <div className="flex gap-4">
                         <button className="flex-1 py-4 bg-white border border-slate-200 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">Reject</button>
                         <button className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100">Approve</button>
                      </div>
                   </motion.div>
                 ))}
               </>
             )}

             {activeApprovalTab === 'expenses' && (
                <>
                  {approvalsData.expenses.map((exp) => (
                    <motion.div key={exp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-8">
                       <div className="flex justify-between items-start">
                          <div className="flex items-center gap-6">
                             <img src={exp.avatar} className="w-16 h-16 rounded-[1.8rem] object-cover" />
                             <div>
                                <h3 className="text-xl font-black text-slate-800">{exp.name}</h3>
                                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">{exp.cat} Expense</p>
                             </div>
                          </div>
                          <h4 className="text-2xl font-black text-slate-800">{formatCurrency(exp.amount)}</h4>
                       </div>
                       <div className="flex gap-4">
                          <button className="flex-1 py-4 bg-white border border-slate-200 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">Reject</button>
                          <button className="flex-2 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Approve Payout</button>
                       </div>
                    </motion.div>
                  ))}
                </>
             )}
          </AnimatePresence>
       </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
       <div className="flex bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-sm w-fit overflow-x-auto scrollbar-hide">
          {[
            { id: 'dashboard', label: 'Management Hub', icon: <LayoutGrid size={18} /> },
            { id: 'team', label: 'My Team', icon: <Users size={18} /> },
            { id: 'approvals', label: 'Approvals', icon: <ListChecks size={18} /> },
            { id: 'performance', label: 'Performance', icon: <Trophy size={18} /> },
            { id: 'meetings', label: 'Meetings', icon: <Video size={18} /> },
          ].map(tab => (
             <button 
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all whitespace-nowrap ${
                  activeSection === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'
                }`}
             >
                {tab.icon} {tab.label}
             </button>
          ))}
       </div>

       <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
             {activeSection === 'dashboard' && renderDashboard()}
             {activeSection === 'team' && renderTeam()}
             {activeSection === 'approvals' && renderApprovals()}
          </motion.div>
       </AnimatePresence>

       {/* Employee Detail Modal */}
       <AnimatePresence>
          {viewingEmployee && (
            <div className="fixed inset-0 z-[150] overflow-hidden">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingEmployee(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
               <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-2xl flex flex-col">
                  <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
                     <div className="flex items-center gap-6">
                        <img src={viewingEmployee.avatar} className="w-20 h-20 rounded-[1.8rem] object-cover border-4 border-white shadow-xl" />
                        <div>
                           <h2 className="text-2xl font-black text-slate-800">{viewingEmployee.name}</h2>
                           <p className="text-sm font-black text-indigo-600 uppercase tracking-widest">{viewingEmployee.role}</p>
                        </div>
                     </div>
                     <button onClick={() => setViewingEmployee(null)} className="p-3 bg-white border border-slate-200 rounded-2xl hover:text-rose-500 transition-all"><X size={24} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
                     <div className="p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                        <DollarSign className="absolute -bottom-10 -right-10 w-48 h-48 text-indigo-500/10 rotate-12" />
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Base Package</p>
                        <h4 className="text-4xl font-black mb-8">{formatCurrency(viewingEmployee.salary * 12)} <span className="text-sm text-slate-400">/ Year</span></h4>
                        <button className="px-8 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Propose Review</button>
                     </div>
                  </div>
               </motion.div>
            </div>
          )}
       </AnimatePresence>
    </div>
  );
};

export default ManagerDashboard;
