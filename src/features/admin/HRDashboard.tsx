import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  TrendingUp,
  Briefcase,
  Wallet,
  AlertTriangle,
  Plus,
  FileText,
  Download,
  Upload,
  Calendar,
  CheckCircle2,
  Star,
  Clock,
  Heart,
  ShieldCheck,
  ShieldAlert,
  Info,
  ChevronRight,
  Search,
  Filter,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Zap,
  Megaphone,
  Target,
  MousePointer2,
  Flag,
  BookOpen,
  UserCheck,
  Trash2,
  Settings,
  PieChart as PieIcon,
  History as HistoryIcon,
  Award,
  Globe,
  GraduationCap,
  Plane,
  FileCheck,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "../../context/NavigationContext";
import { useDashboardStats, downloadReportCsv } from "../../api/client";
import { Loader2 } from "lucide-react";

const HRDashboard: React.FC = () => {
  const { user } = useAuth();
  const { setActiveTab } = useNavigation();
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: dashboardData, isLoading } = useDashboardStats();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadReportCsv("employees");
    } catch (err) {
      // Swallow — the export helper already surfaces network errors via the
      // fetch call itself; nothing more actionable to show here.
    } finally {
      setIsExporting(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTab("directory");
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  const {
    totalHeadcount = 0,
    newHires = 0,
    attritionRate = "0%",
    openPositions = 0,
    totalPayroll = 0,
    deptData = [],
    diversityData = [],
    headcountTrend = [],
    alerts = [],
    recentActivity = [],
    events = { birthdays: [], anniversaries: [] }
  } = dashboardData || {};

  const stats = [
    {
      label: "Total Headcount",
      value: totalHeadcount.toString(),
      sub: "Active & Onboarding",
      trend: "up",
      breakdown: "Current total workforce",
      icon: <Users className="text-indigo-600" />,
      bg: "bg-indigo-50",
      action: "View All",
      path: "workforce",
    },
    {
      label: "New Hires",
      value: newHires.toString(),
      sub: "This Month",
      trend: "up",
      breakdown: "Joined recently",
      icon: <UserPlus className="text-emerald-600" />,
      bg: "bg-emerald-50",
      action: "Onboarding",
      path: "onboarding",
    },
    {
      label: "Attrition Rate",
      value: attritionRate,
      sub: "Trailing 30 days",
      trend: "down",
      breakdown: "Estimated turnover",
      icon: <TrendingUp className="text-rose-600" />,
      bg: "bg-rose-50",
      action: "Analysis",
      path: "reports",
    },
    {
      label: "Open Positions",
      value: openPositions.toString(),
      sub: "Actively Sourcing",
      trend: "up",
      breakdown: "Pending hires",
      icon: <Briefcase className="text-amber-600" />,
      bg: "bg-amber-50",
      action: "Recruitment",
      path: "recruitment",
    },
    {
      label: "Payroll (Current)",
      value: `₦${(totalPayroll / 1000000).toFixed(1)}M`,
      sub: "Estimated run",
      trend: "stable",
      breakdown: "Base salaries sum",
      icon: <Wallet className="text-violet-600" />,
      bg: "bg-violet-50",
      action: "Reports",
      path: "reports",
    },
    {
      label: "Pending Actions",
      value: alerts.length.toString(),
      sub: alerts.length > 0 ? "Requires attention" : "All clear",
      trend: "stable",
      breakdown: "Active alerts",
      icon: <AlertTriangle className={alerts.length > 0 ? "text-orange-600" : "text-emerald-600"} />,
      bg: alerts.length > 0 ? "bg-orange-50" : "bg-emerald-50",
      action: "Tasks",
      path: "leave-approvals",
    },
  ];

  const getIconForType = (type: string) => {
    switch (type) {
      case "UserCheck": return <UserCheck size={16} />;
      case "FileText": return <FileText size={16} />;
      case "Wallet": return <Wallet size={16} />;
      case "Calendar": return <Calendar size={16} />;
      case "Briefcase": return <Briefcase size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Executive Summary Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
              <Zap size={20} fill="currentColor" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
              HR Control Center
            </h1>
          </div>
          <p className="text-slate-500 font-medium italic">
            Welcome, {user?.name || "Administrator"}. Organization snapshot as
            of{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee, policy..."
              title="Press Enter to search the directory"
              className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={16}
            />
          </form>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isExporting ? "Exporting…" : "Report"}
          </button>
          <button
            onClick={() => setActiveTab("workforce")}
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all"
          >
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
            <div
              className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform`}
            >
              {s.icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {s.label}
            </p>
            <h4 className="text-2xl font-black text-slate-800 tracking-tighter">
              {s.value}
            </h4>
            <p
              className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${s.trend === "up" ? "text-emerald-500" : s.trend === "down" ? "text-rose-500" : "text-slate-400"}`}
            >
              {s.sub}
            </p>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[80px]">
                {s.breakdown}
              </p>
              <button
                onClick={() => setActiveTab(s.path)}
                className="text-[9px] font-black text-indigo-600 uppercase hover:underline"
              >
                {s.action}
              </button>
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
              <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase text-xs tracking-[0.2em] text-slate-400">
                Administrative Orchestration
              </h3>
              <button className="p-2 text-slate-300 hover:text-indigo-600">
                <Settings size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                {
                  label: "Workforce",
                  actions: [
                    { label: "Add Employee", path: "workforce" },
                    { label: "Bulk Import", path: "workforce" },
                    { label: "Generate Roster", path: "reports" },
                    { label: "Exits", path: "onboarding" },
                  ],
                  icon: <Users className="text-indigo-500" />,
                },
                {
                  label: "Recruitment",
                  actions: [
                    { label: "Post Job", path: "recruitment" },
                    { label: "Offers", path: "recruitment" },
                    { label: "Interview Board", path: "recruitment" },
                    { label: "Pipeline", path: "recruitment" },
                  ],
                  icon: <Briefcase className="text-amber-500" />,
                },
                {
                  label: "Payroll",
                  actions: [
                    { label: "Process Run", path: "payroll" },
                    { label: "Tax Filing", path: "payroll" },
                    { label: "Wallet Fund", path: "payroll" },
                    { label: "Payslips", path: "payroll" },
                  ],
                  icon: <Wallet className="text-emerald-500" />,
                },
                {
                  label: "Performance",
                  actions: [
                    { label: "New Cycle", path: "performance" },
                    { label: "Calibration", path: "performance" },
                    { label: "Appraisals", path: "performance" },
                    { label: "Reports", path: "reports" },
                  ],
                  icon: <Target className="text-rose-500" />,
                },
                {
                  label: "Benefits",
                  actions: [
                    { label: "Enrollment", path: "benefits" },
                    { label: "Claims", path: "benefits" },
                    { label: "Renewals", path: "benefits" },
                    { label: "Vendors", path: "benefits" },
                  ],
                  icon: <Heart className="text-pink-500" />,
                },
              ].map((group, i) => (
                <div
                  key={i}
                  className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group"
                >
                  <div className="flex items-center gap-3 mb-6">
                    {group.icon}
                    <span className="text-[10px] font-black uppercase text-slate-700 tracking-widest">
                      {group.label}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {group.actions.map((a) => (
                      <button
                        key={a.label}
                        onClick={() => setActiveTab(a.path)}
                        className="w-full text-left p-3 bg-white rounded-xl text-[10px] font-bold text-slate-600 hover:text-indigo-600 hover:shadow-sm transition-all flex items-center justify-between group/btn"
                      >
                        {a.label}{" "}
                        <ChevronRight
                          size={10}
                          className="opacity-0 group-hover/btn:opacity-100 transition-opacity"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Dept Distribution */}
            <section className="col-span-1 bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
                <PieIcon className="text-indigo-600" size={16} /> Departmental
                Mix
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deptData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {deptData.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                          strokeWidth={0}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Diversity */}
            <section className="col-span-1 bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
                <Globe className="text-pink-600" size={16} /> Diversity (Gender)
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={diversityData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {diversityData.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                          strokeWidth={0}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Attrition Analysis (Placeholder) */}
            <section className="col-span-1 bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
                <ArrowUpRight className="text-rose-600" size={16} /> Attrition Reasons
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-bold mb-1">
                  <span className="text-slate-600">No sufficient data for attrition</span>
                  <span className="text-slate-800"></span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("reports")}
                className="w-full mt-6 py-3 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-rose-600"
              >
                Full Exit Report
              </button>
            </section>
          </div>

          {/* Growth Trend - Full Width */}
          <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-3">
              <TrendingUp className="text-emerald-600" size={18} /> Workforce
              Velocity (YTD)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={headcountTrend}>
                  <defs>
                    <linearGradient id="totalG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 800, fill: "#94a3b8" }}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#totalG)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Sidebar Alerts & Notifications */}
        <div className="space-y-10">
          {/* Critical Alerts Stack */}
          <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Priority Alerts
              </h3>
              {alerts.length > 0 && (
                <span className="w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center animate-pulse">
                  {alerts.length}
                </span>
              )}
            </div>
            {alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.map((alert: any, i: number) => (
                  <div
                    key={i}
                    className={`p-5 rounded-3xl border-2 flex items-start gap-4 transition-all hover:scale-[1.02] cursor-pointer ${
                      alert.type === "red"
                        ? "bg-rose-50/50 border-rose-100 text-rose-800"
                        : "bg-amber-50/50 border-amber-100 text-amber-800"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl ${alert.type === "red" ? "bg-rose-500 text-white" : "bg-amber-500 text-white"} shadow-lg`}
                    >
                      {getIconForType(alert.iconType)}
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight leading-none mb-1">
                        {alert.title}
                      </p>
                      <p className="text-[10px] font-bold uppercase opacity-60">
                        {alert.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400 opacity-50" />
                <p className="text-xs font-bold">All clear!</p>
                <p className="text-[10px]">No pending items.</p>
              </div>
            )}
          </section>

          {/* Activity Timeline */}
          <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <HistoryIcon size={80} />
            </div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 relative z-10">
              Operations Log
            </h3>
            <div className="space-y-8 relative z-10">
              {recentActivity.map((ev: any, i: number) => (
                <div key={i} className="flex gap-4 items-start group">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ev.color}`}
                  />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">
                      {ev.ev}
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase mt-1">
                      {ev.t}
                    </p>
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
            <h3 className="text-xs font-black text-indigo-300 uppercase tracking-[0.2em] mb-8">
              Social & Culture
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-rose-400 shrink-0">
                  <Heart size={20} fill="currentColor" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold">Birthdays This Month</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                    {events?.birthdays?.length > 0 ? events.birthdays.join(", ") : "No birthdays"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-amber-400 shrink-0">
                  <Award size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold">Anniversaries</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                    {events?.anniversaries?.length > 0 ? events.anniversaries.join(", ") : "No anniversaries"}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                  Upcoming Event
                </p>
                <p className="text-xs font-bold">Q2 Team Townhall</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase">
                  Friday, 2:00 PM (GMT+1)
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
