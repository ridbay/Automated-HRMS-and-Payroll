import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Settings2,
  Send,
  Download,
  Trash2,
  User,
  Briefcase,
  DollarSign,
  Clock,
  Trophy,
  FileText,
  Wallet,
  Heart,
  BookOpen,
  AlertCircle,
  History,
  CheckCircle2,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Building2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Star,
  MoreHorizontal,
  Plus,
  Globe,
  ShieldAlert,
  Sparkles,
  Zap,
  Shield,
  Umbrella,
  Users,
} from "lucide-react";
import { Employee } from "../../types/index";
import {
  Skeleton,
  CardSkeleton,
  ListSkeleton,
  ChartSkeleton,
} from "../../components/Skeleton";

interface Props {
  employee: Employee;
  onBack: () => void;
}

const EmployeeDetail: React.FC<Props> = ({ employee, onBack }) => {
  const [activeTab, setActiveTab] = useState("personal");
  const [isLoading, setIsLoading] = useState(false);

  // Simulated loading effect when switching tabs
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(val);

  // Profile Completion Logic
  const completionStats = useMemo(() => {
    const items = [
      { label: "Middle Name", filled: !!employee.middleName },
      { label: "Phone Number", filled: !!employee.phone },
      { label: "Date of Birth", filled: !!employee.dob },
      { label: "Gender", filled: !!employee.gender },
      { label: "Nationality", filled: !!employee.nationality },
      { label: "Marital Status", filled: !!employee.maritalStatus },
      {
        label: "Emergency Contacts",
        filled: (employee.emergencyContacts?.length || 0) > 0,
      },
      {
        label: "Education History",
        filled: (employee.education?.length || 0) > 0,
      },
      {
        label: "Experience Records",
        filled: (employee.experience?.length || 0) > 0,
      },
      { label: "Bank Details", filled: !!employee.bankDetails?.accountNumber },
    ];
    const completed = items.filter((i) => i.filled).length;
    const percent = Math.round((completed / items.length) * 100);
    const nextStep = items.find((i) => !i.filled)?.label;

    return { percent, nextStep };
  }, [employee]);

  const tabs = [
    { id: "personal", label: "Personal", icon: <User size={16} /> },
    { id: "employment", label: "Employment", icon: <Briefcase size={16} /> },
    { id: "compensation", label: "Comp", icon: <DollarSign size={16} /> },
    { id: "attendance", label: "Time", icon: <Clock size={16} /> },
    { id: "performance", label: "Perf", icon: <Trophy size={16} /> },
    { id: "documents", label: "Docs", icon: <FileText size={16} /> },
    { id: "payroll", label: "Payroll", icon: <Wallet size={16} /> },
    { id: "benefits", label: "Benefits", icon: <Heart size={16} /> },
    { id: "training", label: "Development", icon: <BookOpen size={16} /> },
    { id: "disciplinary", label: "Notes", icon: <AlertCircle size={16} /> },
    { id: "activity", label: "Audit", icon: <History size={16} /> },
  ];

  return (
    <div className="space-y-10 pb-20">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-indigo-600 transition-colors"
      >
        <ChevronLeft size={18} /> Back to Directory
      </button>

      {/* Profile Header */}
      <section className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="h-48 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          <div className="absolute top-6 right-12 hidden md:flex items-center gap-6 text-white/90">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                Profile Strength
              </p>
              <p className="text-lg font-black">
                {completionStats.percent}% Complete
              </p>
            </div>
            <div className="relative w-16 h-16">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-white/10"
                />
                <motion.circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={175.9}
                  initial={{ strokeDashoffset: 175.9 }}
                  animate={{
                    strokeDashoffset:
                      175.9 * (1 - completionStats.percent / 100),
                  }}
                  className="text-white"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap size={16} className="text-indigo-200" />
              </div>
            </div>
          </div>
        </div>
        <div className="px-12 pb-12 -mt-20 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8">
            <div className="flex flex-col md:flex-row items-end gap-8">
              <div className="relative group">
                <img
                  src={employee.avatar}
                  className="w-44 h-44 rounded-[4rem] border-8 border-white shadow-2xl object-cover"
                />
                <div
                  className={`absolute bottom-2 right-2 w-10 h-10 bg-emerald-500 border-4 border-white rounded-2xl shadow-lg flex items-center justify-center`}
                >
                  <ShieldCheck size={20} className="text-white" />
                </div>
              </div>
              <div className="mb-4">
                <h1 className="text-4xl font-black text-slate-800 tracking-tighter">
                  {employee.name}
                </h1>
                <p className="text-xl font-bold text-slate-500 tracking-tight">
                  {employee.role} • {employee.department}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-4 mb-4">
              <div className="flex gap-3">
                <button className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all">
                  Manage Employee
                </button>
                <button className="p-4 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl hover:text-indigo-600 transition-all">
                  <MoreHorizontal size={20} />
                </button>
              </div>
              {completionStats.percent < 100 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100 text-[10px] font-bold text-indigo-600 uppercase tracking-tight animate-pulse">
                  <Plus size={12} /> Next Step: Add {completionStats.nextStep}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-sm flex gap-1 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                : "text-slate-400 hover:bg-slate-50"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </section>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="min-h-[500px]"
        >
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-10">
                <CardSkeleton height="h-64" />
                <div className="grid grid-cols-2 gap-8">
                  <CardSkeleton height="h-48" />
                  <CardSkeleton height="h-48" />
                </div>
              </div>
              <CardSkeleton height="h-[500px]" />
            </div>
          ) : (
            <>
              {activeTab === "compensation" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-10">
                    <section className="bg-slate-900 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
                      <DollarSign className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 -rotate-12 transition-transform group-hover:scale-110" />
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">
                        Annual Remuneration
                      </p>
                      <h2 className="text-6xl font-black tracking-tighter tabular-nums mb-12">
                        {formatCurrency(employee.salary * 12)}
                      </h2>
                      <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-10">
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase mb-2">
                            Monthly Gross
                          </p>
                          <p className="text-xl font-bold">
                            {formatCurrency(employee.salary)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase mb-2">
                            Last Review
                          </p>
                          <p className="text-xl font-bold">Jan 2024</p>
                        </div>
                      </div>
                    </section>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
                          Payroll Method
                        </h4>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <Wallet size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">
                              Automated Wallet
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                              Instant Disbursal
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
                          Tax Compliance
                        </h4>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                            <Shield size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">
                              LIRS Verified
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                              TIN Registered
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <CardSkeleton height="h-[300px]">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
                        Allowances
                      </h4>
                      <div className="space-y-4">
                        {["Housing", "Transport", "Utilities"].map((a) => (
                          <div
                            key={a}
                            className="flex justify-between items-center text-sm font-bold border-b border-slate-50 pb-3"
                          >
                            <span className="text-slate-500">{a}</span>
                            <span className="text-slate-800">15%</span>
                          </div>
                        ))}
                      </div>
                    </CardSkeleton>
                  </div>
                </div>
              )}

              {activeTab === "personal" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-10">
                    <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                      <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase text-xs tracking-[0.2em] text-slate-400">
                        Identity Details
                      </h3>
                      <div className="grid grid-cols-2 gap-8">
                        {[
                          {
                            l: "Full Legal Name",
                            v: `${employee.name} ${employee.lastName}`,
                          },
                          {
                            l: "Birth Date",
                            v: employee.dob || "Not Provided",
                          },
                          { l: "Personal Email", v: employee.email },
                          {
                            l: "Phone Number",
                            v: employee.phone || "Not Provided",
                          },
                          {
                            l: "Nationality",
                            v: employee.nationality || "Not Provided",
                          },
                          {
                            l: "Marital Status",
                            v: employee.maritalStatus || "Not Provided",
                          },
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all"
                          >
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                              {item.l}
                            </p>
                            <p className="text-sm font-bold text-slate-800">
                              {item.v}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">
                        Home Address
                      </h3>
                      <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <MapPin className="text-indigo-600 mt-1" size={20} />
                        <p className="text-sm font-bold text-slate-700 leading-relaxed">
                          Plot 12, Admiralty Way, Phase 1,
                          <br />
                          Lekki, Lagos, Nigeria
                        </p>
                      </div>
                    </section>
                  </div>

                  <div className="space-y-10">
                    <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">
                        Emergency Contacts
                      </h3>
                      <div className="space-y-4">
                        {(employee.emergencyContacts || []).length > 0 ? (
                          employee.emergencyContacts?.map((contact, i) => (
                            <div
                              key={i}
                              className="p-4 bg-slate-50 rounded-2xl border border-slate-100"
                            >
                              <p className="text-xs font-black text-slate-800">
                                {contact.name}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">
                                {contact.relationship} • {contact.phone}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl text-center text-slate-400 font-bold text-xs">
                            No contacts added
                          </div>
                        )}
                        <button className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all">
                          + Add New Contact
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {activeTab === "performance" && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-2">
                        <TrendingUp className="text-indigo-600" /> Performance
                        Trend
                      </h3>
                      <ChartSkeleton />
                    </section>
                    <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-2">
                        <Star className="text-amber-500" /> Key Competencies
                      </h3>
                      <div className="space-y-6">
                        {[
                          "Technical Accuracy",
                          "Leadership",
                          "Collaboration",
                          "Problem Solving",
                        ].map((c) => (
                          <div key={c} className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                              <span>{c}</span>
                              <span className="text-indigo-600">4.5 / 5.0</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "90%" }}
                                className="h-full bg-indigo-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {activeTab === "documents" && (
                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                      Digital Document Vault
                    </h3>
                    <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2">
                      <Plus size={14} /> Upload Document
                    </button>
                  </div>
                  <ListSkeleton count={4} />
                </div>
              )}

              {activeTab === "employment" && (
                <div className="space-y-10">
                  <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-2">
                      <Briefcase className="text-indigo-600" /> Career Timeline
                    </h3>
                    <div className="space-y-8 relative pl-8 border-l-2 border-slate-100">
                      {[
                        {
                          title: "Senior Backend Engineer",
                          date: "Jan 2024 - Present",
                          desc: "Promoted to lead the core payments infrastructure team.",
                        },
                        {
                          title: "Backend Engineer",
                          date: "Jun 2022 - Dec 2023",
                          desc: "Joined to build out the initial payroll engine.",
                        },
                      ].map((role, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[41px] w-5 h-5 bg-indigo-600 rounded-full border-4 border-white shadow-md"></div>
                          <h4 className="text-lg font-black text-slate-800">
                            {role.title}
                          </h4>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            {role.date}
                          </p>
                          <p className="text-sm font-medium text-slate-600 max-w-xl">
                            {role.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
                        Contract Status
                      </h4>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">
                            Permanent
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">
                            Confirmed (Oct 2022)
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold border-b border-slate-50 pb-2">
                          <span className="text-slate-500">Notice Period</span>
                          <span className="text-slate-800">3 Months</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold border-b border-slate-50 pb-2">
                          <span className="text-slate-500">Probation Ends</span>
                          <span className="text-slate-800">Completed</span>
                        </div>
                      </div>
                    </section>
                    <section className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 flex flex-col justify-center items-center text-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm mb-4">
                        <Users size={28} />
                      </div>
                      <h4 className="text-sm font-black text-slate-800 mb-1">
                        Direct Reports
                      </h4>
                      <p className="text-3xl font-black text-indigo-600 tracking-tighter mb-4">
                        4
                      </p>
                      <button className="px-6 py-2 bg-white text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:text-indigo-600">
                        View Team
                      </button>
                    </section>
                  </div>
                </div>
              )}

              {activeTab === "attendance" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <section className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
                      <Clock className="text-amber-500" /> Leave Balances
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        {
                          type: "Annual Leave",
                          bal: 14,
                          tot: 20,
                          color: "text-indigo-600",
                          bg: "bg-indigo-600",
                        },
                        {
                          type: "Sick Leave",
                          bal: 8,
                          tot: 10,
                          color: "text-emerald-600",
                          bg: "bg-emerald-600",
                        },
                        {
                          type: "Casual",
                          bal: 2,
                          tot: 5,
                          color: "text-amber-600",
                          bg: "bg-amber-600",
                        },
                      ].map((l, i) => (
                        <div
                          key={i}
                          className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative overflow-hidden"
                        >
                          <div
                            className={`absolute top-0 left-0 h-1 w-full ${l.bg}`}
                          />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                            {l.type}
                          </p>
                          <div className="flex items-end gap-2">
                            <span className="text-4xl font-black text-slate-800">
                              {l.bal}
                            </span>
                            <span className="text-xs font-bold text-slate-400 mb-1.5">
                              / {l.tot} Days
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-10">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">
                        Recent Activity
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                              <Calendar size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800">
                                Remote Work Request
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">
                                May 12 • Approved
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                            Approved
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-40 h-40 rounded-full border-[12px] border-emerald-100 flex items-center justify-center relative mb-6">
                      <span className="text-4xl font-black text-emerald-600">
                        98%
                      </span>
                      <div className="absolute top-0 left-0 w-full h-full border-[12px] border-emerald-500 rounded-full border-t-transparent border-l-transparent rotate-45" />
                    </div>
                    <h4 className="text-lg font-black text-slate-800">
                      Punctuality Score
                    </h4>
                    <p className="text-xs font-medium text-slate-500 mt-2 max-w-[200px]">
                      Consistently clocks in before 9:00 AM. Top 5% of
                      workforce.
                    </p>
                  </section>
                </div>
              )}

              {activeTab === "payroll" && (
                <div className="space-y-10">
                  <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Wallet className="text-emerald-500" /> Payslip History
                      </h3>
                      <button className="px-6 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100">
                        Download YTD Statement
                      </button>
                    </div>
                    <table className="w-full text-left">
                      <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                          <th className="pb-4 pl-4">Period</th>
                          <th className="pb-4">Basic</th>
                          <th className="pb-4">Allowances</th>
                          <th className="pb-4">Deductions</th>
                          <th className="pb-4">Net Pay</th>
                          <th className="pb-4 text-right pr-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {[
                          {
                            p: "May 2024",
                            b: "₦850,000",
                            a: "₦120,000",
                            d: "-₦45,000",
                            n: "₦925,000",
                          },
                          {
                            p: "Apr 2024",
                            b: "₦850,000",
                            a: "₦120,000",
                            d: "-₦45,000",
                            n: "₦925,000",
                          },
                        ].map((row, i) => (
                          <tr key={i} className="group hover:bg-slate-50/50">
                            <td className="py-4 pl-4 font-bold text-slate-800">
                              {row.p}
                            </td>
                            <td className="py-4 font-medium text-slate-600">
                              {row.b}
                            </td>
                            <td className="py-4 font-medium text-emerald-600">
                              {row.a}
                            </td>
                            <td className="py-4 font-medium text-rose-500">
                              {row.d}
                            </td>
                            <td className="py-4 font-black text-slate-800">
                              {row.n}
                            </td>
                            <td className="py-4 text-right pr-4">
                              <button className="p-2 bg-white border border-slate-200 text-indigo-600 rounded-lg hover:bg-indigo-50">
                                <Download size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                </div>
              )}

              {activeTab === "benefits" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    {
                      name: "Health Insurance",
                      prov: "AXA Mansard",
                      plan: "Gold Plan",
                      status: "Active",
                      icon: <Heart size={20} />,
                      color: "rose",
                    },
                    {
                      name: "Pension",
                      prov: "Stanbic IBTC",
                      plan: "RSA Fund II",
                      status: "Active",
                      icon: <Shield size={20} />,
                      color: "indigo",
                    },
                    {
                      name: "Life Assurance",
                      prov: "Leadway",
                      plan: "Group Life",
                      status: "Active",
                      icon: <Umbrella size={20} />,
                      color: "emerald",
                    },
                  ].map((b, i) => (
                    <div
                      key={i}
                      className={`bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group`}
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl mb-6 flex items-center justify-center bg-${b.color}-50 text-${b.color}-600`}
                      >
                        {b.icon}
                      </div>
                      <h4 className="text-lg font-black text-slate-800 mb-1">
                        {b.name}
                      </h4>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-6">
                        {b.prov} • {b.plan}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg">
                          Active
                        </span>
                        <button className="text-[10px] font-black text-indigo-600 uppercase hover:underline">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                  <button className="h-full min-h-[200px] border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300 hover:border-indigo-200 hover:text-indigo-400 transition-all font-black uppercase tracking-widest gap-2">
                    <Plus size={32} /> Encode Benefit
                  </button>
                </div>
              )}

              {activeTab === "training" && (
                <div className="space-y-10">
                  <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
                      <BookOpen className="text-indigo-600" /> Learning Journey
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        {
                          course: "Advanced React Patterns",
                          prov: "Frontend Masters",
                          date: "Mar 2024",
                          status: "Completed",
                        },
                        {
                          course: "Engineering Leadership",
                          prov: "Internal Academy",
                          date: "In Progress",
                          status: "In Progress",
                        },
                      ].map((c, i) => (
                        <div
                          key={i}
                          className="flex gap-5 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 items-center"
                        >
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm font-black text-xl">
                            {c.course.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-800">
                              {c.course}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                              {c.prov}
                            </p>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full w-24 overflow-hidden">
                              <div
                                className={`h-full ${c.status === "Completed" ? "bg-emerald-500 w-full" : "bg-amber-500 w-1/2"}`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === "disciplinary" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 font-bold text-sm min-h-[200px]">
                      No disciplinary records found.
                    </div>
                  </div>
                  <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100">
                    <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ShieldAlert size={16} /> HR Private Notes
                    </h4>
                    <textarea
                      className="w-full h-40 bg-white border-none rounded-xl p-4 text-xs font-medium text-slate-600 outline-none resize-none mb-4"
                      placeholder="Add private administrative notes here..."
                    />
                    <button className="w-full py-3 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-amber-600">
                      Save Note
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "activity" && (
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-2">
                    <History className="text-slate-400" /> System Audit Trail
                  </h3>
                  <div className="space-y-8 pl-8 border-l-2 border-slate-100">
                    {[
                      {
                        action: "Updated Bank Details",
                        user: "System Admin",
                        time: "2 hours ago",
                      },
                      {
                        action: "Approved Leave Request",
                        user: "Sarah Boss (Manager)",
                        time: "Yesterday",
                      },
                      {
                        action: "Profile Created",
                        user: "System Admin",
                        time: "Jun 1, 2024",
                      },
                    ].map((log, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[39px] w-4 h-4 bg-slate-200 rounded-full border-4 border-white shadow-sm" />
                        <p className="text-sm font-black text-slate-800">
                          {log.action}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          By {log.user} • {log.time}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default EmployeeDetail;
