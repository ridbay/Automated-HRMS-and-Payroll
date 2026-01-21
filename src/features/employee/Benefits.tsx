
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Shield, PieChart as PieChartIcon, TrendingUp, Activity, 
  Coffee, Download, Plus, ChevronRight, Calculator, Umbrella, 
  Users, AlertCircle, FileText, CheckCircle2, Star, Zap,
  Search, Filter, ExternalLink, Calendar, MapPin, Phone,
  Lock, ArrowRight, X, LayoutGrid, Rocket, Info, User
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar
} from 'recharts';
import { 
  MOCK_BENEFITS, MOCK_CLAIMS, MOCK_DEPENDENTS, 
  MOCK_EQUITY, MOCK_CHALLENGES 
} from '../../data/mocks';

const compensationData = [
  { name: 'Base Salary', value: 75, fill: '#4f46e5' },
  { name: 'Health Benefits', value: 10, fill: '#10b981' },
  { name: 'Retirement', value: 8, fill: '#6366f1' },
  { name: 'Other Perks', value: 7, fill: '#f59e0b' },
];

const Benefits: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'summary' | 'health' | 'retirement' | 'equity' | 'wellness' | 'enrollment'>('summary');
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [enrollmentStep, setEnrollmentStep] = useState(1);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);

  const renderSummary = () => (
    <div className="space-y-8 pb-20">
      {/* Top Value Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-10 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
          <div className="flex-1 space-y-6 relative z-10">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Rewards Value (Annual)</p>
                <h2 className="text-5xl font-black text-slate-800 tracking-tighter">₦148,250,000.00</h2>
             </div>
             <div className="flex flex-wrap gap-4">
                <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   <TrendingUp size={14} /> 15% Above Market
                </div>
                <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   <Shield size={14} /> Fully Insured
                </div>
             </div>
             <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-md">
                Your total compensation includes your base salary plus the market value of your health, retirement, and equity benefits.
             </p>
          </div>
          <div className="w-full md:w-64 h-64 shrink-0">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                   <Pie data={compensationData} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                      {compensationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                   </Pie>
                   <Tooltip />
                </PieChart>
             </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
           <Zap className="absolute -bottom-8 -right-8 w-48 h-48 text-indigo-500/10 rotate-12" />
           <h3 className="text-xl font-black mb-8 flex items-center gap-3">
              <Calendar className="text-indigo-400" /> Open Enrollment
           </h3>
           <div className="space-y-6 mb-10">
              <div>
                 <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Ends in</p>
                 <p className="text-3xl font-black">12 Days</p>
              </div>
              <p className="text-xs text-indigo-100 font-medium leading-relaxed">
                 You can still change your health and dental plans for the 2024 period. Review your current elections.
              </p>
           </div>
           <button 
             onClick={() => setActiveTab('enrollment')}
             className="w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-sm uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all"
           >
              Update Elections
           </button>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MOCK_BENEFITS.map((benefit) => (
          <motion.div 
            key={benefit.id}
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all relative group"
          >
            <div className={`w-14 h-14 bg-${benefit.color}-50 text-${benefit.color}-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform`}>
               {benefit.icon === 'Shield' && <Shield size={28} />}
               {benefit.icon === 'Heart' && <Heart size={28} />}
               {benefit.icon === 'PieChart' && <PieChartIcon size={28} />}
               {benefit.icon === 'TrendingUp' && <TrendingUp size={28} />}
               {benefit.icon === 'Activity' && <Activity size={28} />}
               {benefit.icon === 'Coffee' && <Coffee size={28} />}
            </div>
            
            <div className="flex justify-between items-start mb-2">
               <h3 className="text-lg font-black text-slate-800">{benefit.title}</h3>
               <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{benefit.status}</span>
            </div>
            <p className="text-sm font-bold text-slate-400 mb-6">{benefit.provider || 'ZenHR Perk'}</p>
            
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Coverage/Value</p>
                  <p className="text-sm font-black text-slate-800">{benefit.value}</p>
               </div>
               <button className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><ChevronRight size={20} /></button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderHealth = () => (
    <div className="space-y-10 pb-20">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
             {/* Plan Card */}
             <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                   <Shield size={120} />
                </div>
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                      <Shield size={32} />
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-slate-800">Health Insurance Detail</h2>
                      <p className="text-sm text-slate-500 font-medium italic">Provider: Aetna • Gold PPO Plan</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Policy Number</p>
                      <p className="text-lg font-black text-slate-800 font-mono">AE-8293-4820</p>
                   </div>
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Coverage Level</p>
                      <p className="text-lg font-black text-slate-800">Family (3 Members)</p>
                   </div>
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Annual Limit</p>
                      <p className="text-lg font-black text-slate-800">₦5,000,000</p>
                   </div>
                </div>

                <div className="flex gap-4">
                   <button className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-indigo-100 hover:scale-105 transition-all">
                      <Download size={18} /> Download ID Card
                   </button>
                   <button className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 transition-all">
                      <ExternalLink size={18} /> Network Hospitals
                   </button>
                </div>
             </div>

             {/* Claims Table */}
             <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                   <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">Recent Claims</h3>
                   <button 
                     onClick={() => setShowClaimModal(true)}
                     className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all"
                   >
                     New Claim Request
                   </button>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                         <tr>
                            <th className="px-10 py-5">Date</th>
                            <th className="px-8 py-5">Service Type</th>
                            <th className="px-8 py-5">Hospital</th>
                            <th className="px-8 py-5 text-right">Amount</th>
                            <th className="px-8 py-5 text-center">Status</th>
                            <th className="px-10 py-5 text-right"></th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {MOCK_CLAIMS.map((claim) => (
                           <tr key={claim.id} className="hover:bg-slate-50/50 transition-all group">
                              <td className="px-10 py-5">
                                 <span className="text-xs font-bold text-slate-800">{claim.date}</span>
                              </td>
                              <td className="px-8 py-5">
                                 <span className="text-xs font-bold text-slate-500 uppercase">{claim.type}</span>
                              </td>
                              <td className="px-8 py-5">
                                 <span className="text-xs font-bold text-slate-800">{claim.hospital}</span>
                              </td>
                              <td className="px-8 py-5 text-right font-mono text-sm font-black text-slate-800">
                                 {formatCurrency(claim.amount)}
                              </td>
                              <td className="px-8 py-5">
                                 <div className="flex justify-center">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                      claim.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 
                                      claim.status === 'review' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                       {claim.status}
                                    </span>
                                 </div>
                              </td>
                              <td className="px-10 py-5 text-right">
                                 <button className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><FileText size={18} /></button>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>

          <div className="space-y-10">
             {/* Dependent Management */}
             <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Dependents</h3>
                   <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">+ Add</button>
                </div>
                <div className="space-y-6">
                   {MOCK_DEPENDENTS.map((dep) => (
                     <div key={dep.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
                           <User size={20} />
                        </div>
                        <div className="flex-1">
                           <p className="text-sm font-black text-slate-800">{dep.name}</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{dep.relationship} • {dep.dob}</p>
                        </div>
                        <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                           <CheckCircle2 size={12} />
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             {/* Coverage Details Perk */}
             <div className="bg-indigo-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <Lock className="absolute -bottom-8 -right-8 w-48 h-48 text-white/10 rotate-12" />
                <h4 className="text-xl font-black mb-8 flex items-center gap-3">
                   <Info size={24} /> Plan Highlights
                </h4>
                <div className="space-y-6">
                   {[
                     'Zero Deductible Consultation',
                     '100% Maternity Cover',
                     'Global Dental & Optical Add-on',
                     'Annual Wellness Health-check'
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-3 text-xs font-bold text-indigo-100">
                        <CheckCircle2 size={16} className="text-emerald-400" /> {item}
                     </div>
                   ))}
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  const renderWellness = () => (
    <div className="space-y-10 pb-20">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
             <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 text-indigo-100/50">
                   <Activity size={100} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-10 flex items-center gap-4">
                   <Activity className="text-amber-500" /> Active Challenges
                </h3>
                <div className="space-y-8">
                   {MOCK_CHALLENGES.map((challenge) => (
                     <div key={challenge.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative group">
                        <div className="flex justify-between items-start mb-6">
                           <div>
                              <h4 className="text-lg font-black text-slate-800 mb-1">{challenge.title}</h4>
                              <p className="text-xs text-slate-500 font-medium">Ends in 8 days • {challenge.participants} members</p>
                           </div>
                           <button className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                             challenge.joined ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-600 text-white shadow-lg'
                           }`}>
                             {challenge.joined ? 'Participating' : 'Join Challenge'}
                           </button>
                        </div>
                        <div className="space-y-3">
                           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <span>Progress</span>
                              <span>{challenge.progress} / {challenge.goal}</span>
                           </div>
                           <div className="w-full h-3 bg-white rounded-full overflow-hidden p-0.5">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(challenge.progress / challenge.goal) * 100}%` }}
                                className="h-full bg-amber-500 rounded-full"
                              />
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="space-y-10">
             <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <Rocket className="absolute -bottom-8 -right-8 w-40 h-40 text-indigo-500/10 rotate-12" />
                <h4 className="text-xl font-black mb-8">Gym Access</h4>
                <div className="bg-white p-6 rounded-[2rem] flex items-center justify-center mb-8">
                   <div className="w-32 h-32 border-4 border-slate-900 rounded-xl relative flex items-center justify-center overflow-hidden">
                      <LayoutGrid size={80} className="text-slate-900 opacity-20" />
                      <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
                         {Array.from({ length: 16 }).map((_, i) => (
                           <div key={i} className={`border border-slate-900/10 ${Math.random() > 0.5 ? 'bg-slate-900' : ''}`} />
                         ))}
                      </div>
                   </div>
                </div>
                <div className="text-center">
                   <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Membership ID</p>
                   <p className="text-lg font-black tracking-widest">ZEN-FIT-82930</p>
                   <button className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest">Renew Access</button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  const renderEnrollment = () => (
    <div className="max-w-4xl mx-auto pb-20">
       <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-indigo-600 p-12 text-white flex justify-between items-start relative">
             <Star className="absolute top-10 right-10 w-24 h-24 text-white/10" />
             <div>
                <h2 className="text-3xl font-black mb-2 tracking-tighter">Benefits Enrollment</h2>
                <p className="text-indigo-100 font-medium">Design your rewards package for the 2024 period.</p>
             </div>
          </div>
          
          <div className="p-12 min-h-[500px]">
             <AnimatePresence mode="wait">
                <motion.div
                  key={enrollmentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                   {enrollmentStep === 1 && (
                     <div className="space-y-10">
                        <div className="flex items-center gap-4 border-l-4 border-indigo-600 pl-6">
                           <Shield className="text-indigo-600" size={32} />
                           <h3 className="text-xl font-black text-slate-800">Step 1: Choose Your Health Plan</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {[
                             { name: 'Standard PPO', cost: '₦45,000/mo', features: ['90% In-network', '₦50k Deductible'], selected: false },
                             { name: 'Gold PPO (Recommended)', cost: '₦80,000/mo', features: ['100% In-network', 'Zero Deductible', 'Optical Incl.'], selected: true },
                           ].map((plan, i) => (
                             <div key={i} className={`p-8 rounded-[2.5rem] border-4 transition-all cursor-pointer ${
                               plan.selected ? 'border-indigo-600 bg-indigo-50/20 shadow-xl shadow-indigo-100' : 'border-slate-100 bg-slate-50'
                             }`}>
                                <h4 className="text-lg font-black text-slate-800 mb-2">{plan.name}</h4>
                                <p className="text-indigo-600 font-black mb-6 uppercase text-xs tracking-widest">{plan.cost} Cost</p>
                                <ul className="space-y-3 mb-10">
                                   {plan.features.map((f, j) => (
                                     <li key={j} className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                        <CheckCircle2 size={16} className="text-emerald-500" /> {f}
                                     </li>
                                   ))}
                                </ul>
                                <button className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                  plan.selected ? 'bg-indigo-600 text-white' : 'bg-white text-slate-50'
                                }`}>
                                   {plan.selected ? 'Selected Plan' : 'Select This Plan'}
                                </button>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </motion.div>
             </AnimatePresence>
          </div>
       </div>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Header & Main Nav */}
      <div className="flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center">
        <div>
           <div className="flex items-center gap-4 mb-1">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                 <Heart size={24} fill="currentColor" />
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Benefits & Wellbeing</h1>
           </div>
           <p className="text-slate-500 font-medium">Empowering your life beyond the workplace.</p>
        </div>

        <div className="flex bg-white p-2 rounded-3xl border border-slate-200 shadow-sm w-full lg:w-auto overflow-x-auto scrollbar-hide">
          {[
            { id: 'summary', name: 'Overview', icon: <LayoutGrid size={18} /> },
            { id: 'health', name: 'Health & Life', icon: <Shield size={18} /> },
            { id: 'retirement', name: 'Retirement', icon: <PieChartIcon size={18} /> },
            { id: 'wellness', name: 'Wellness', icon: <Activity size={18} /> },
            { id: 'enrollment', name: 'Enrollment', icon: <Zap size={18} /> },
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
            {activeTab === 'summary' && renderSummary()}
            {activeTab === 'health' && renderHealth()}
            {activeTab === 'wellness' && renderWellness()}
            {activeTab === 'enrollment' && renderEnrollment()}
         </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Benefits;
