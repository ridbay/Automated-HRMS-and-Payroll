
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie
} from 'recharts';
import { 
  Wallet, Plus, ArrowUpRight, ArrowDownLeft, FileText, 
  Settings, CreditCard, History, ChevronRight, Download, 
  Search, Filter, CheckCircle2, AlertCircle, Eye, EyeOff, 
  Printer, Send, Calculator, ShieldCheck, PieChart as PieIcon,
  LayoutGrid, Table as TableIcon, Activity, Clock,
  ArrowDownRight, ShieldAlert, Banknote, Users,
  Calendar, Lock, Unlock, FileCheck, RefreshCw,
  ChevronDown, Gavel, Heart, Landmark, TrendingUp,
  X, Briefcase, DollarSign, Zap, BarChart3
} from 'lucide-react';
import { 
  MOCK_TRANSACTIONS, MOCK_PAYROLL_ENTRIES, MOCK_EMPLOYEES, 
  MOCK_LOANS, MOCK_COMPLIANCE, MOCK_TAX_BRACKETS 
} from '../../data/mocks';

const payrollHistory = [
  { month: 'Dec 25', amount: 22400 },
  { month: 'Jan 26', amount: 24500 },
];

const Payroll: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'wizard' | 'compliance' | 'loans' | 'history' | 'settings'>('dashboard');
  const [wizardStep, setWizardStep] = useState(1);
  const [showSensitive, setShowSensitive] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [isLocked, setIsLocked] = useState(false);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);

  const renderDashboard = () => (
    <div className="space-y-8 pb-20">
      {/* Payroll Header */}
      <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-40"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter">January 2026 Payroll</h1>
            <div className="flex items-center gap-4 mt-4">
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border ${
                isLocked ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                Status: {isLocked ? 'Processed & Locked' : 'Draft In Review'}
              </span>
              <p className="text-sm font-bold text-slate-400">Due in 5 days • February 1, 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden mr-4">
                <div className="h-full bg-indigo-600 w-[65%]" />
             </div>
             <button 
              onClick={() => setActiveTab('wizard')}
              className="px-10 py-4 bg-indigo-600 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
             >
               <Calculator size={18} /> Continue Processing
             </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Employees', val: '142', sub: '+4 New Joiners', icon: <Users />, color: 'indigo' },
          { label: 'Gross Payroll', val: '₦12.8M', sub: '+1.2% vs Last Month', icon: <TrendingUp />, color: 'emerald' },
          { label: 'Total Deductions', val: '₦2.4M', sub: 'Tax, Pension, Loans', icon: <DollarSign />, color: 'rose' },
          { label: 'Net Payroll', val: '₦10.4M', sub: 'Funds Required', icon: <Banknote />, color: 'violet' },
        ].map((m, i) => (
          <motion.div whileHover={{ y: -5 }} key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group overflow-hidden">
             <div className={`absolute top-0 right-0 w-16 h-16 bg-${m.color}-50 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform`} />
             <div className={`w-10 h-10 bg-${m.color}-50 text-${m.color}-600 rounded-xl flex items-center justify-center mb-6`}>
                {m.icon}
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
             <h4 className="text-2xl font-black text-slate-800 tracking-tighter tabular-nums">{m.val}</h4>
             <p className="text-[10px] font-bold text-slate-400 mt-2">{m.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Exception Review */}
        <div className="lg:col-span-2 space-y-8">
           <section className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                 <div>
                    <h3 className="text-xl font-black text-slate-800">Payroll Exceptions</h3>
                    <p className="text-xs text-slate-400 font-medium">Items requiring resolution before approval.</p>
                 </div>
                 <div className="w-8 h-8 bg-rose-500 text-white rounded-xl flex items-center justify-center text-[10px] font-black">5</div>
              </div>
              <div className="divide-y divide-slate-50">
                 {[
                   { emp: 'Sarah Johnson', issue: 'Missing Bank Details', severity: 'red', type: 'Compliance' },
                   { emp: 'Michael Chen', issue: 'Unexplained Absence (4 days)', severity: 'orange', type: 'Attendance' },
                   { emp: 'James Wilson', issue: 'Negative Net Pay Warning', severity: 'red', type: 'Calculation' },
                   { emp: 'Emma Davis', issue: 'New PFA - Verification needed', severity: 'orange', type: 'Statutory' },
                 ].map((ex, i) => (
                   <div key={i} className="p-8 flex items-center justify-between group hover:bg-slate-50/50 transition-all">
                      <div className="flex items-center gap-6">
                         <div className={`w-2 h-10 rounded-full ${ex.severity === 'red' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                         <div>
                            <p className="text-sm font-black text-slate-800">{ex.emp}</p>
                            <p className={`text-xs font-bold ${ex.severity === 'red' ? 'text-rose-600' : 'text-amber-600'}`}>{ex.issue}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ex.type}</span>
                         <button className="px-5 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase hover:border-indigo-600 hover:text-indigo-600 transition-all">Resolve</button>
                      </div>
                   </div>
                 ))}
              </div>
           </section>
        </div>

        {/* Compliance Dashboard Mini */}
        <div className="space-y-8">
           <section className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <ShieldCheck className="absolute -bottom-8 -right-8 w-40 h-40 text-indigo-500/10 rotate-12" />
              <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-indigo-400">
                 <ShieldAlert size={20} /> Compliance Status
              </h3>
              <div className="space-y-6 mb-10">
                 {MOCK_COMPLIANCE.map((c) => (
                   <div key={c.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className={`w-2 h-2 rounded-full ${c.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                         <span className="text-xs font-bold text-slate-300">{c.title}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase">{c.dueDate}</span>
                   </div>
                 ))}
              </div>
              <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                 <RefreshCw size={14} /> Sync Statutory Data
              </button>
           </section>

           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">Upcoming Remittances</h4>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500">Tax Filing Deadline</span>
                    <span className="font-black text-rose-500">Feb 10</span>
                 </div>
                 <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-4">
                    <span className="font-bold text-slate-500">Pension Deadline</span>
                    <span className="font-black text-amber-500">Feb 07</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderWizard = () => (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        {/* Wizard Header */}
        <div className="bg-slate-900 p-10 text-white flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-2">Payroll Run Wizard</h2>
            <p className="text-slate-400 text-sm font-medium">Step {wizardStep} of 7 • Process Accuracy Guaranteed</p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map(s => (
              <div key={s} className={`w-8 h-1.5 rounded-full transition-all duration-500 ${wizardStep >= s ? 'bg-indigo-500' : 'bg-slate-700'}`} />
            ))}
          </div>
        </div>

        {/* Horizontal Stepper */}
        <div className="flex bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-hide">
           {[
             { id: 1, label: 'Attendance', icon: <Clock /> },
             { id: 2, label: 'Earnings', icon: <Calculator /> },
             { id: 3, label: 'Deductions', icon: <DollarSign /> },
             { id: 4, label: 'Net Pay', icon: <Banknote /> },
             { id: 5, label: 'Review', icon: <ShieldCheck /> },
             { id: 6, label: 'Payment', icon: <Send /> },
             { id: 7, label: 'Post-Payroll', icon: <History /> },
           ].map(s => (
             <button key={s.id} onClick={() => setWizardStep(s.id)} className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${wizardStep === s.id ? 'bg-white border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>
                {s.icon} {s.label}
             </button>
           ))}
        </div>

        <div className="p-12 min-h-[600px]">
           <AnimatePresence mode="wait">
              <motion.div key={wizardStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                 
                 {wizardStep === 1 && (
                   <div className="space-y-8">
                      <div className="flex justify-between items-center">
                         <h3 className="text-xl font-black text-slate-800">Attendance & Time Review</h3>
                         <button className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                            <RefreshCw size={16} /> Sync Attendance
                         </button>
                      </div>
                      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                         <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                               <tr>
                                  <th className="px-10 py-6">Employee</th>
                                  <th className="px-8 py-6">Days Present</th>
                                  <th className="px-8 py-6">Absences</th>
                                  <th className="px-8 py-6">Overtime</th>
                                  <th className="px-8 py-6">Status</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                               {MOCK_PAYROLL_ENTRIES.map((entry, idx) => (
                                 <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="px-10 py-5">
                                       <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs">{entry.employeeName[0]}</div>
                                          <span className="text-sm font-bold text-slate-800">{entry.employeeName}</span>
                                       </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-bold text-slate-600">{entry.attendance?.present} / 22</td>
                                    <td className={`px-8 py-5 text-sm font-bold ${entry.attendance?.absent ? 'text-rose-500' : 'text-slate-400'}`}>{entry.attendance?.absent} days</td>
                                    <td className="px-8 py-5 text-sm font-bold text-emerald-600">{entry.attendance?.overtimeHours}h</td>
                                    <td className="px-8 py-5">
                                       <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Override</button>
                                    </td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                 )}

                 {wizardStep === 2 && (
                    <div className="space-y-8">
                       <h3 className="text-xl font-black text-slate-800">Earnings Calculation</h3>
                       <div className="grid grid-cols-1 gap-4">
                          {MOCK_PAYROLL_ENTRIES.map((entry, idx) => (
                             <div key={idx} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden group">
                                <div className="p-8 flex items-center justify-between bg-slate-50/50">
                                   <div className="flex items-center gap-6">
                                      <h4 className="text-lg font-black text-slate-800">{entry.employeeName}</h4>
                                      <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-400">{entry.department}</span>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Gross Estimate</p>
                                      <p className="text-xl font-black text-indigo-600 tabular-nums">{formatCurrency(entry.grossPay)}</p>
                                   </div>
                                </div>
                                <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                                   {[
                                      { l: 'Basic Salary', v: entry.earnings.basic },
                                      { l: 'Allowances', v: entry.earnings.housing + entry.earnings.transport },
                                      { l: 'Overtime', v: entry.earnings.overtime },
                                      { l: 'Bonuses', v: entry.earnings.bonus },
                                   ].map((item, i) => (
                                      <div key={i} className="space-y-2">
                                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.l}</p>
                                         <input type="number" defaultValue={item.v} className="w-full bg-slate-50 px-4 py-2 rounded-xl text-sm font-black text-slate-700 focus:ring-2 focus:ring-indigo-500/10 outline-none" />
                                      </div>
                                   ))}
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 {wizardStep === 3 && (
                    <div className="space-y-10">
                       <div className="flex justify-between items-center">
                          <h3 className="text-xl font-black text-slate-800">Deductions Processing</h3>
                          <div className="flex gap-3">
                             <button className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                                <Plus size={16} /> Add Custom Deduction
                             </button>
                          </div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <section className="space-y-6">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Statutory (Auto-Calculated)</h4>
                             <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                                <ShieldCheck className="absolute -bottom-8 -right-8 w-32 h-32 text-indigo-500/10 rotate-12" />
                                <div className="space-y-8">
                                   <div>
                                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Total PAYE Tax</p>
                                      <p className="text-4xl font-black tabular-nums">{formatCurrency(1245000)}</p>
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Total Pension (8%)</p>
                                      <p className="text-3xl font-black tabular-nums">{formatCurrency(840200)}</p>
                                   </div>
                                </div>
                             </div>
                          </section>
                          <section className="space-y-6">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Voluntary & Loans</h4>
                             <div className="space-y-4">
                                {MOCK_LOANS.map(loan => (
                                   <div key={loan.id} className="p-6 bg-white border border-slate-200 rounded-[2rem] flex items-center justify-between group">
                                      <div className="flex items-center gap-4">
                                         <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Gavel size={24} /></div>
                                         <div>
                                            <p className="text-sm font-black text-slate-800">{loan.employeeName}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Installment: {formatCurrency(loan.monthlyInstallment)}</p>
                                         </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                         <span className="text-[9px] font-black text-slate-400 uppercase">Bal: {formatCurrency(loan.remainingBalance)}</span>
                                         <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><ChevronRight size={20} /></button>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </section>
                       </div>
                    </div>
                 )}

                 {wizardStep === 4 && (
                    <div className="space-y-10">
                       <h3 className="text-xl font-black text-slate-800">Net Pay Summary & Quality Checks</h3>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[2.5rem] relative overflow-hidden">
                             <CheckCircle2 className="absolute -bottom-4 -right-4 w-24 h-24 text-emerald-100" />
                             <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Accuracy Rate</p>
                             <p className="text-4xl font-black text-emerald-700">100%</p>
                          </div>
                          <div className="p-8 bg-amber-50 border border-amber-100 rounded-[2.5rem] relative overflow-hidden">
                             <AlertCircle className="absolute -bottom-4 -right-4 w-24 h-24 text-amber-100" />
                             <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">High Variances</p>
                             <p className="text-4xl font-black text-amber-700">3 <span className="text-xs">Alerts</span></p>
                          </div>
                          <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] relative overflow-hidden">
                             <X className="absolute -bottom-4 -right-4 w-24 h-24 text-rose-100" />
                             <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">Failed Checks</p>
                             <p className="text-4xl font-black text-rose-700">0</p>
                          </div>
                       </div>
                       <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                          <table className="w-full text-left">
                             <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                                <tr>
                                   <th className="px-10 py-6">Employee</th>
                                   <th className="px-8 py-6">Gross Pay</th>
                                   <th className="px-8 py-6">Total Deductions</th>
                                   <th className="px-8 py-6">Net Pay</th>
                                   <th className="px-8 py-6">Variance</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-50">
                                {MOCK_PAYROLL_ENTRIES.map((entry, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/50">
                                     <td className="px-10 py-5">
                                        <p className="text-sm font-bold text-slate-800">{entry.employeeName}</p>
                                     </td>
                                     <td className="px-8 py-5 text-sm font-bold text-slate-600">{formatCurrency(entry.grossPay)}</td>
                                     <td className="px-8 py-5 text-sm font-bold text-rose-500">-{formatCurrency(entry.deductions.tax + entry.deductions.pension)}</td>
                                     <td className="px-8 py-5 text-sm font-black text-emerald-600">{formatCurrency(entry.netPay)}</td>
                                     <td className="px-8 py-5">
                                        <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase"><ArrowUpRight size={12} /> 2.1%</span>
                                     </td>
                                  </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </div>
                 )}

                 {wizardStep === 5 && (
                    <div className="space-y-10">
                       <div className="flex justify-between items-center">
                          <h3 className="text-xl font-black text-slate-800">Review & Final Approval</h3>
                          <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200">
                             <p className="text-xs font-black text-slate-400 uppercase">Lock and Submit?</p>
                             <button 
                                onClick={() => setIsLocked(!isLocked)}
                                className={`p-3 rounded-xl transition-all ${isLocked ? 'bg-rose-500 text-white shadow-xl shadow-rose-200' : 'bg-white text-slate-400 border border-slate-200'}`}
                             >
                                {isLocked ? <Lock size={20} /> : <Unlock size={20} />}
                             </button>
                          </div>
                       </div>
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          <div className="bg-slate-50 p-12 rounded-[3.5rem] space-y-10">
                             <div className="space-y-6">
                                <div className="flex justify-between items-center border-b border-slate-200 pb-6">
                                   <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Employees</span>
                                   <span className="text-xl font-black text-slate-800">142</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-200 pb-6">
                                   <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Company Gross</span>
                                   <span className="text-xl font-black text-slate-800">{formatCurrency(12840000)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-200 pb-6">
                                   <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Tax Remittance</span>
                                   <span className="text-xl font-black text-rose-500">{formatCurrency(2120000)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4">
                                   <span className="text-lg font-black text-slate-800 uppercase tracking-widest">Final Net Payout</span>
                                   <span className="text-3xl font-black text-indigo-600">{formatCurrency(10420000)}</span>
                                </div>
                             </div>
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approver Comments</label>
                                <textarea rows={4} placeholder="Add your final review comments here..." className="w-full px-6 py-4 bg-white border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium" />
                             </div>
                          </div>
                          <div className="bg-white rounded-[3.5rem] border border-slate-200 p-10 flex flex-col items-center justify-center text-center">
                             <div className="w-32 h-32 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-300 mb-8 shadow-inner">
                                <ShieldCheck size={64} strokeWidth={1.5} />
                             </div>
                             <h4 className="text-2xl font-black text-slate-800 mb-4">Awaiting Sign-off</h4>
                             <p className="text-slate-400 max-w-xs font-medium leading-relaxed">
                                This payroll run will be routed to the Finance Director for final authorization.
                             </p>
                             <button className="mt-10 px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all">
                                Send for Approval
                             </button>
                          </div>
                       </div>
                    </div>
                 )}

                 {wizardStep === 6 && (
                   <div className="space-y-10">
                      <h3 className="text-xl font-black text-slate-800">Payment Processing</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10">
                            <div className="flex items-center gap-6">
                               <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl">
                                  <Landmark size={32} />
                               </div>
                               <div>
                                  <h4 className="text-xl font-black text-slate-800">Bank File Generation</h4>
                                  <p className="text-xs text-slate-400 font-bold uppercase">Multi-bank format support</p>
                               </div>
                            </div>
                            <div className="space-y-4">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Output Format</label>
                                  <select className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold">
                                     <option>Standard NIP (XML)</option>
                                     <option>Excel Batch (Bulk)</option>
                                     <option>CSV Format (Legacy)</option>
                                     <option>SWIFT MT103</option>
                                  </select>
                               </div>
                               <button className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3">
                                  <Download size={18} /> Download Encrypted File
                               </button>
                            </div>
                         </div>
                         <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
                            <Wallet className="absolute -bottom-10 -right-10 w-48 h-48 text-white/10 rotate-12" />
                            <h4 className="text-2xl font-black mb-4">Direct Wallet Funding</h4>
                            <p className="text-indigo-100 text-sm font-medium mb-10 leading-relaxed">
                               Instantly disburse salaries to employee wallets. No bank files or delays required.
                            </p>
                            {/* Added comment above fix to handle missing Zap reference */}
                            <button className="w-full py-5 bg-white text-indigo-600 rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3">
                               <Zap size={18} fill="currentColor" /> Process via Wallet
                            </button>
                         </div>
                      </div>
                   </div>
                 )}

                 {wizardStep === 7 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                       <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-32 h-32 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-10 shadow-2xl shadow-emerald-500/20">
                          <CheckCircle2 size={64} />
                       </motion.div>
                       <h2 className="text-4xl font-black text-slate-800 mb-4">Payroll Cycle Complete!</h2>
                       <p className="text-slate-500 max-w-lg mb-12 text-lg font-medium">
                          Salaries have been disbursed successfully. Post-payroll automations are now running.
                       </p>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                          {[
                            { label: 'Payslip Delivery', icon: <FileCheck />, status: 'Delivering...', progress: 65, color: 'indigo' },
                            { label: 'Tax Remittance', icon: <Landmark />, status: 'Scheduled', progress: 0, color: 'amber' },
                            /* Added comment above fix to handle missing BarChart3 reference */
                            { label: 'Reports Ready', icon: <BarChart3 />, status: 'Completed', progress: 100, color: 'emerald' },
                          ].map((post, i) => (
                            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-left">
                               <div className={`w-10 h-10 bg-${post.color}-50 text-${post.color}-600 rounded-xl flex items-center justify-center mb-6`}>
                                  {post.icon}
                               </div>
                               <h5 className="text-sm font-black text-slate-800 mb-1">{post.label}</h5>
                               <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">{post.status}</p>
                               <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${post.progress}%` }} className={`h-full bg-${post.color}-500`} />
                               </div>
                            </div>
                          ))}
                       </div>
                       <button onClick={() => { setActiveTab('dashboard'); setWizardStep(1); }} className="mt-16 px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl">Return to Dashboard</button>
                    </div>
                 )}

              </motion.div>
           </AnimatePresence>
        </div>

        {/* Wizard Footer */}
        <div className="p-10 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
           <button 
             onClick={() => setWizardStep(prev => Math.max(1, prev - 1))}
             disabled={wizardStep === 1 || wizardStep === 7}
             className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest disabled:opacity-30"
           >
             Previous
           </button>
           {wizardStep < 7 && (
             <button 
               onClick={() => setWizardStep(prev => Math.min(7, prev + 1))}
               className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
             >
               {wizardStep === 5 ? 'Authorize & Proceed' : wizardStep === 6 ? 'Finalize Run' : 'Next Step'}
             </button>
           )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Module Navigation */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Payroll Administration</h1>
          <p className="text-slate-500 font-medium">Compliance, processing, and financial governance.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full lg:w-auto overflow-x-auto scrollbar-hide">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: <LayoutGrid size={18} /> },
            { id: 'wizard', name: 'Processing', icon: <Calculator size={18} /> },
            { id: 'compliance', name: 'Compliance', icon: <ShieldCheck size={18} /> },
            { id: 'loans', name: 'Loans', icon: <Gavel size={18} /> },
            { id: 'history', name: 'History', icon: <History size={18} /> },
            { id: 'settings', name: 'Salary Setup', icon: <Settings size={18} /> },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'wizard' && renderWizard()}
          {activeTab === 'compliance' && (
             <div className="space-y-10 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
                      <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3"><ShieldCheck className="text-indigo-600" /> Tax Configuration</h3>
                      <div className="space-y-6">
                         {MOCK_TAX_BRACKETS.map((bracket, i) => (
                           <div key={i} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl">
                              <span className="text-sm font-bold text-slate-600">{bracket.range}</span>
                              <span className="text-lg font-black text-indigo-600">{bracket.rate}%</span>
                           </div>
                         ))}
                         <button className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all">Update Tax Brackets</button>
                      </div>
                   </section>
                   <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
                      <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3"><Landmark className="text-emerald-600" /> Remittance History</h3>
                      <div className="space-y-6">
                         {[
                           { name: 'Jan 2026 PAYE', val: '₦2,120,400', date: 'Feb 05, 2026', status: 'Completed' },
                           { name: 'Dec 2025 Pension', val: '₦1,850,200', date: 'Jan 12, 2026', status: 'Completed' },
                         ].map((r, i) => (
                           <div key={i} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                              <div>
                                 <p className="text-sm font-black text-slate-800">{r.name}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase">{r.date}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-sm font-black text-slate-800 tabular-nums">{r.val}</p>
                                 <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded text-[8px] font-black uppercase">{r.status}</span>
                              </div>
                           </div>
                         ))}
                      </div>
                   </section>
                </div>
             </div>
          )}
          {activeTab === 'loans' && (
             <div className="space-y-8 pb-20">
                <div className="flex justify-between items-center">
                   <h2 className="text-2xl font-black text-slate-800">Active Loan Portfolio</h2>
                   <button className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">+ New Loan Setup</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {MOCK_LOANS.map(loan => (
                      <div key={loan.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                         <div className="flex justify-between items-start mb-8">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                               <Gavel size={28} />
                            </div>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{loan.status}</span>
                         </div>
                         <h3 className="text-lg font-black text-slate-800 mb-1">{loan.employeeName}</h3>
                         <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-8">Principal: {formatCurrency(loan.amount)}</p>
                         <div className="space-y-4">
                            <div className="flex justify-between text-xs font-bold">
                               <span className="text-slate-400 uppercase">Monthly Deduction</span>
                               <span className="text-slate-800">{formatCurrency(loan.monthlyInstallment)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold">
                               <span className="text-slate-400 uppercase">Remaining Balance</span>
                               <span className="text-slate-800">{formatCurrency(loan.remainingBalance)}</span>
                            </div>
                         </div>
                         <button className="w-full mt-8 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">View Recovery Schedule</button>
                      </div>
                   ))}
                </div>
             </div>
          )}
          {!['dashboard', 'wizard', 'compliance', 'loans'].includes(activeTab) && (
            <div className="bg-white p-32 rounded-[4rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 mb-8">
                <Settings size={40} />
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Module Configuration</h3>
              <p className="text-slate-400 max-w-sm font-medium">Fine-tuning the automated financial orchestration engine for January 2026 cycle.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Payroll;
