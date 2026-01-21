import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Briefcase,
  Trophy,
  Clock,
  Wallet,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Award,
  Calendar,
  Star,
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Send,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";

interface EmployeeDetailModalProps {
  employee: any;
  onClose: () => void;
}

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employee,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "performance" | "attendance" | "comp"
  >("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: <Briefcase size={16} /> },
    { id: "performance", label: "Performance", icon: <Trophy size={16} /> },
    { id: "attendance", label: "Attendance", icon: <Clock size={16} /> },
    { id: "comp", label: "Compensation", icon: <Wallet size={16} /> },
  ];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(val);

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Contact Info
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail size={16} className="text-indigo-500" />
                <span className="text-sm font-bold truncate">
                  {employee.email || "email@zenhr.com"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Phone size={16} className="text-emerald-500" />
                <span className="text-sm font-bold">+234 800 123 4567</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin size={16} className="text-rose-500" />
                <span className="text-sm font-bold">Lagos HQ, Floor 4</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-indigo-50 rounded-3xl space-y-4">
            <h4 className="text-xs font-black text-indigo-300 uppercase tracking-widest">
              Key Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {["React", "UI Design", "Leadership", "TypeScript"].map(
                (skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-white text-indigo-600 text-[10px] font-black uppercase rounded-lg shadow-sm"
                  >
                    {skill}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="col-span-2 space-y-6">
          <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Briefcase size={16} /> Employment History
            </h4>
            <div className="space-y-6 relative border-l-2 border-slate-100 ml-3 pl-8">
              {[
                {
                  role: employee.role,
                  date: "2023 - Present",
                  company: "ZenHR Systems",
                },
                {
                  role: "Mid-Level Designer",
                  date: "2021 - 2023",
                  company: "TechServe",
                },
              ].map((job, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[39px] top-1 w-5 h-5 bg-white border-4 border-indigo-500 rounded-full" />
                  <h5 className="text-sm font-black text-slate-800">
                    {job.role}
                  </h5>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {job.company}
                  </p>
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">
                    {job.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-2 gap-6">
        <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] relative overflow-hidden">
          <Trophy className="absolute -bottom-6 -right-6 w-40 h-40 text-indigo-500/20 rotate-12" />
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
            Current Rating
          </h4>
          <div className="flex items-end gap-2 mb-6">
            <span className="text-6xl font-black">4.8</span>
            <span className="text-xl font-bold text-slate-500 mb-2">/ 5.0</span>
          </div>
          <div className="flex gap-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={20}
                fill="currentColor"
                className={s > 4 ? "text-slate-700" : ""}
              />
            ))}
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-100 rounded-[2.5rem]">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
            Goal Progress
          </h4>
          <div className="space-y-4">
            {[
              { name: "Launch Mobile App v2", progress: 85, color: "emerald" },
              { name: "Hire 2 Jr Designers", progress: 40, color: "indigo" },
              { name: "Complete User Research", progress: 100, color: "amber" },
            ].map((g, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700">{g.name}</span>
                  <span className={`text-${g.color}-500`}>{g.progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-${g.color}-500 w-[${g.progress}%]`}
                    style={{ width: `${g.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8 bg-white border border-slate-100 rounded-3xl">
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">
          Review History
        </h4>
        <div className="space-y-4">
          {[
            { date: "Dec 2023", rating: 4.8, reviewer: "Marcus R." },
            { date: "Jun 2023", rating: 4.5, reviewer: "Marcus R." },
          ].map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                  {r.rating}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">
                    Performance Review
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    {r.date} • by {r.reviewer}
                  </p>
                </div>
              </div>
              <button className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors">
                <Download size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-3 gap-6">
        {[
          {
            label: "Attendance",
            val: "98%",
            icon: ShieldCheck,
            color: "emerald",
          },
          { label: "Punctuality", val: "92%", icon: Clock, color: "indigo" },
          { label: "Balance", val: "12 Days", icon: Calendar, color: "amber" },
        ].map((s, i) => (
          <div key={i} className={`p-6 bg-${s.color}-50 rounded-3xl`}>
            <s.icon size={24} className={`text-${s.color}-600 mb-4`} />
            <p
              className={`text-[10px] font-black text-${s.color}-400 uppercase tracking-widest`}
            >
              {s.label}
            </p>
            <h4 className={`text-2xl font-black text-${s.color}-900`}>
              {s.val}
            </h4>
          </div>
        ))}
      </div>

      <div className="p-8 bg-white border border-slate-100 rounded-3xl">
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">
          Recent Activity
        </h4>
        <div className="space-y-2">
          {[
            { date: "Today", status: "Present", time: "08:58 AM" },
            { date: "Yesterday", status: "Present", time: "09:02 AM" },
            { date: "Mon, 12 Aug", status: "Late", time: "09:45 AM" },
          ].map((a, i) => (
            <div
              key={i}
              className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <span className="text-sm font-bold text-slate-600">{a.date}</span>
              <div className="flex items-center gap-4">
                <span
                  className={`text-[10px] font-black uppercase px-2 py-1 rounded ${a.status === "Late" ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"}`}
                >
                  {a.status}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {a.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderComp = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] relative overflow-hidden">
        <Wallet className="absolute -bottom-6 -right-6 w-40 h-40 text-emerald-500/20 rotate-12" />
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
          Total Annual Cost
        </h4>
        <h2 className="text-4xl font-black mb-6">
          {formatCurrency(employee.salary * 12 * 1.05)}
        </h2>{" "}
        {/* Plus benefits overhead */}
        <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-6">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
              Base Salary
            </p>
            <p className="text-xl font-bold">
              {formatCurrency(employee.salary * 12)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
              Last Increment
            </p>
            <p className="text-xl font-bold text-emerald-400">
              +12%{" "}
              <span className="text-xs text-emerald-500/50 font-medium">
                (Dec '23)
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-4">
        <AlertCircle className="text-amber-600 shrink-0" />
        <div>
          <h4 className="text-sm font-black text-amber-800 mb-1">
            Market Analysis
          </h4>
          <p className="text-xs text-amber-700/80 leading-relaxed font-medium">
            Current package is in the{" "}
            <strong className="text-amber-900">75th percentile</strong> for this
            role. Risk of attrition is low based on compensation.
          </p>
        </div>
      </div>

      <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.01] transition-transform">
        Recommend Adjustment
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[150] overflow-hidden flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full"
      >
        {/* Header */}
        <div className="p-8 bg-slate-50 border-b border-slate-100 shrink-0">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-6">
              <img
                src={employee.avatar}
                className="w-20 h-20 rounded-[1.8rem] object-cover border-4 border-white shadow-xl"
              />
              <div>
                <h2 className="text-2xl font-black text-slate-800">
                  {employee.name}
                </h2>
                <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">
                  {employee.role}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-black uppercase rounded bg-emerald-100 text-emerald-700`}
                  >
                    Active
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    • Joined Jan 2023
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "performance" && renderPerformance()}
          {activeTab === "attendance" && renderAttendance()}
          {activeTab === "comp" && renderComp()}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-white grid grid-cols-2 gap-4">
          <button className="py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100">
            Message
          </button>
          <button className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
            Actions
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EmployeeDetailModal;
