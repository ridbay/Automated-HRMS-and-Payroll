
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Wallet, Users, Clock, ArrowUpRight, ArrowDownRight, MoreHorizontal, Calendar, Zap } from 'lucide-react';

const data = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4500 },
  { name: 'May', value: 6000 },
];

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Wallet Widget Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-indigo-100 text-sm font-medium mb-1 uppercase tracking-wider">Company Wallet Balance</p>
                <h2 className="text-4xl font-bold">₦24,580,000.00</h2>
              </div>
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
                <Wallet size={24} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                <p className="text-indigo-100 text-xs mb-1 uppercase">Virtual Bank Account (NUBAN)</p>
                <p className="text-xl font-mono tracking-widest font-bold">8293 4821 0293</p>
                <p className="text-xs text-indigo-200 mt-1">Monnify / Paystack Bank PLC</p>
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 text-indigo-100 text-sm mb-2">
                  <Clock size={16} />
                  <span>Next Automated Payroll: <b>May 25th</b></span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full w-[75%] transition-all duration-1000"></div>
                </div>
                <p className="text-xs text-indigo-200 mt-2">75% of monthly budget pre-funded</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-slate-800">Payroll Quick Stats</h3>
              <MoreHorizontal size={20} className="text-slate-400 cursor-pointer" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Active Employees</p>
                    <p className="text-lg font-bold text-slate-800">128</p>
                  </div>
                </div>
                <div className="text-emerald-500 flex items-center text-xs font-semibold">
                  <ArrowUpRight size={14} /> +4%
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Avg. Attendance</p>
                    <p className="text-lg font-bold text-slate-800">96.2%</p>
                  </div>
                </div>
                <div className="text-rose-500 flex items-center text-xs font-semibold">
                  <ArrowDownRight size={14} /> -1.2%
                </div>
              </div>
            </div>
          </div>
          <button className="w-full mt-6 py-3 bg-indigo-50 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-100 transition-colors">
            Run Custom Batch
          </button>
        </div>
      </div>

      {/* Analytics and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-slate-800">Spending Overview</h3>
            <select className="bg-slate-50 border-none text-xs font-medium rounded-lg px-2 py-1 outline-none cursor-pointer">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-6">Action Required</h3>
          <div className="space-y-4">
            {[
              { title: 'Approve Leave Request', subtitle: 'Sarah Johnson - 3 days Sick Leave', color: 'bg-amber-100 text-amber-600' },
              { title: 'Performance Review Due', subtitle: 'Q2 Appraisals for Engineering Team', color: 'bg-indigo-100 text-indigo-600' },
              { title: 'Candidate Screening', subtitle: '5 new applicants for React Dev role', color: 'bg-emerald-100 text-emerald-600' },
              { title: 'Wallet Low Balance', subtitle: 'Balance below 150% of estimated payroll', color: 'bg-rose-100 text-rose-600' },
            ].map((task, i) => (
              <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${task.color}`}>
                  <Zap size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{task.title}</p>
                  <p className="text-xs text-slate-500 truncate">{task.subtitle}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-indigo-600 text-xs font-bold px-3 py-1 bg-indigo-50 rounded-lg">View</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
