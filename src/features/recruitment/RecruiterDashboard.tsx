import React from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Briefcase,
  Clock,
  TrendingUp,
  CheckCircle2,
  Loader2,
  ArrowRight,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "../../context/NavigationContext";
import { useRecruitmentReport, useJobRequisitions } from "../../api/client";

const PRIORITY_STYLES: Record<string, string> = {
  High: "bg-rose-50 text-rose-600",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-slate-50 text-slate-500",
};

const RecruiterDashboard: React.FC = () => {
  const { user } = useAuth();
  const { setActiveTab } = useNavigation();
  const { data: report, isLoading: reportLoading } = useRecruitmentReport();
  const { data: requisitions = [], isLoading: reqLoading } = useJobRequisitions();

  if (reportLoading || reqLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  const {
    summary = { totalRequisitions: 0, openPositions: 0, filledThisMonth: 0, avgDaysOpen: 0, avgTimeToFill: null },
    statusBreakdown = [],
    byDepartment = [],
    monthlyTrend = [],
  } = report || {};

  const openRequisitions = requisitions
    .filter((r: any) => r.status === "Open")
    .sort((a: any, b: any) => (b.daysOpen || 0) - (a.daysOpen || 0));

  const stats = [
    {
      label: "Open Positions",
      value: summary.openPositions,
      icon: <Briefcase className="text-indigo-600" />,
      bg: "bg-indigo-50",
    },
    {
      label: "Total Requisitions",
      value: summary.totalRequisitions,
      icon: <Briefcase className="text-slate-600" />,
      bg: "bg-slate-100",
    },
    {
      label: "Filled This Month",
      value: summary.filledThisMonth,
      icon: <CheckCircle2 className="text-emerald-600" />,
      bg: "bg-emerald-50",
    },
    {
      label: "Avg Days Open",
      value: summary.avgDaysOpen,
      icon: <Clock className="text-amber-600" />,
      bg: "bg-amber-50",
    },
    {
      label: "Avg Time to Fill",
      value: summary.avgTimeToFill === null ? "—" : `${summary.avgTimeToFill}d`,
      icon: <TrendingUp className="text-violet-600" />,
      bg: "bg-violet-50",
    },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
              <Briefcase size={20} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
              Hiring Dashboard
            </h1>
          </div>
          <p className="text-slate-500 font-medium italic">
            Welcome, {user?.name || "Recruiter"}. Here's where hiring stands today.
          </p>
        </div>
        <button
          onClick={() => setActiveTab("recruitment")}
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all flex items-center gap-2"
        >
          Open Hiring Tool <ArrowRight size={16} />
        </button>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm"
          >
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-6 shadow-inner`}>
              {s.icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <h4 className="text-2xl font-black text-slate-800 tracking-tighter">{s.value}</h4>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Open Positions */}
          <section className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                Open Positions ({openRequisitions.length})
              </h3>
              <button
                onClick={() => setActiveTab("recruitment")}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                View All <ChevronRight size={14} />
              </button>
            </div>
            {openRequisitions.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Briefcase size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold">No open positions right now.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {openRequisitions.slice(0, 6).map((req: any) => (
                  <div key={req.id} className="p-6 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-all">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 truncate">{req.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                        {req.department} • <MapPin size={10} /> {req.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${PRIORITY_STYLES[req.priority] || "bg-slate-50 text-slate-500"}`}>
                        {req.priority}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">
                        {req.daysOpen}d open
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Monthly Trend */}
          <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-3">
              <TrendingUp className="text-emerald-600" size={18} /> Requisitions Opened vs Filled (6mo)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="openedG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="filledG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: "#94a3b8" }} />
                  <YAxis hide />
                  <Tooltip />
                  <Area type="monotone" dataKey="opened" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#openedG)" name="Opened" />
                  <Area type="monotone" dataKey="filled" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#filledG)" name="Filled" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Right col */}
        <div className="space-y-10">
          {/* Status Breakdown */}
          <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
              Requisition Status
            </h3>
            {statusBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold">No requisitions yet.</p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusBreakdown} innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                      {statusBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              {statusBreakdown.map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-500">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.fill }} />
                  {s.name} ({s.value})
                </div>
              ))}
            </div>
          </section>

          {/* By Department */}
          <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
              By Department
            </h3>
            {byDepartment.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold">No data yet.</p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDepartment} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={90} tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={16}>
                      {byDepartment.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
