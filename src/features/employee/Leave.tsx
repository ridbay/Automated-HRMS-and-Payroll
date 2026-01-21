import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
  Plus,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowLeft,
  Users,
  User,
  Download,
  Info,
  Timer,
} from "lucide-react";
import {
  MOCK_LEAVE_BALANCES,
  MOCK_LEAVE_REQUESTS,
  MOCK_EMPLOYEES,
} from "../../data/mocks";
import { useNavigation } from "../../context/NavigationContext";
import Celebration from "../../components/Celebration";

const Leave: React.FC = () => {
  const { setActiveTab } = useNavigation();
  const [activeTab, setLocalTab] = useState<
    "dashboard" | "apply" | "history" | "calendar"
  >("dashboard");
  const [showCelebration, setShowCelebration] = useState(false);

  // Request Form State
  const [requestStep, setRequestStep] = useState(1);
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [handoverEmployee, setHandoverEmployee] = useState("");

  // Mock checking logic
  const calculateDays = () => {
    if (!startDate) return 0;
    if (!endDate && !isHalfDay) return 0;
    if (isHalfDay) return 0.5;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleApply = () => {
    // Simulate API call
    setTimeout(() => {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        setLocalTab("dashboard");
        setRequestStep(1);
        // Reset form
        setLeaveType("");
        setStartDate("");
        setEndDate("");
        setReason("");
      }, 3000);
    }, 1000);
  };

  const renderDashboard = () => (
    <div className="space-y-8 pb-20">
      {/* 1. Balances Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_LEAVE_BALANCES.map((balance, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -4 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group"
          >
            <div
              className={`absolute top-0 right-0 p-4 opacity-10 text-${balance.color}-500 group-hover:scale-110 transition-transform`}
            >
              <CalendarIcon size={64} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                {balance.type}
              </p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-black text-slate-800 tracking-tighter">
                  {balance.total - balance.used}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  / {balance.total} Days Left
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((balance.total - balance.used) / balance.total) * 100}%`,
                  }}
                  className={`h-full bg-${balance.color}-500 rounded-full`}
                />
              </div>

              <button
                onClick={() => {
                  setLeaveType(balance.type);
                  setLocalTab("apply");
                }}
                className={`text-[10px] font-black text-${balance.color}-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all`}
              >
                Request Leave <ChevronRight size={12} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 2. Quick Request & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="relative z-10">
              <h2 className="text-2xl font-black mb-2">Need a break?</h2>
              <p className="text-indigo-100 font-medium mb-8 max-w-md">
                Select a quick duration to start your leave request immediately.
              </p>

              <div className="flex flex-wrap gap-4">
                {[
                  {
                    label: "Half Day",
                    icon: Clock,
                    action: () => {
                      setLocalTab("apply");
                      setLeaveType("Annual Leave");
                      setIsHalfDay(true);
                      setRequestStep(2);
                    },
                  },
                  {
                    label: "One Day",
                    icon: CalendarIcon,
                    action: () => {
                      setLocalTab("apply");
                      setLeaveType("Annual Leave");
                      setIsHalfDay(false);
                      setRequestStep(2);
                    },
                  },
                  {
                    label: "Sick Leave",
                    icon: AlertCircle,
                    action: () => {
                      setLocalTab("apply");
                      setLeaveType("Sick Leave");
                    },
                  },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    className="px-6 py-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 backdrop-blur-sm flex items-center gap-3 transition-all group"
                  >
                    <item.icon
                      size={18}
                      className="text-indigo-200 group-hover:text-white"
                    />
                    <span className="font-black text-xs uppercase tracking-widest">
                      {item.label}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => setLocalTab("apply")}
                  className="px-6 py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                >
                  + Custom Request
                </button>
              </div>
            </div>
          </section>

          {/* Recent Requests */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" /> Recent
                Requests
              </h3>
              <button
                onClick={() => setLocalTab("history")}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600"
              >
                View All
              </button>
            </div>

            <div className="space-y-4">
              {MOCK_LEAVE_REQUESTS.map((req, i) => (
                <div
                  key={i}
                  className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        req.status === "approved"
                          ? "bg-emerald-50 text-emerald-600"
                          : req.status === "pending"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {req.status === "approved" ? (
                        <CheckCircle2 size={20} />
                      ) : req.status === "pending" ? (
                        <Timer size={20} />
                      ) : (
                        <X size={20} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 mb-0.5">
                        {req.type}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {req.startDate} - {req.endDate} • {req.days} Days
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      req.status === "approved"
                        ? "bg-emerald-50 text-emerald-600"
                        : req.status === "pending"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Col: Team Calendar & Policies */}
        <div className="space-y-8">
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Users size={18} className="text-indigo-600" /> Team Availability
            </h3>
            <div className="space-y-6">
              <p className="text-xs text-slate-500 font-medium">
                3 colleagues are on leave this week.
              </p>
              <div className="flex -space-x-3 overflow-hidden py-2">
                {[1, 2, 3].map((_, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500"
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                  +2
                </div>
              </div>
              <button
                onClick={() => setLocalTab("calendar")}
                className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                View Team Calendar
              </button>
            </div>
          </section>

          <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
            <Info className="absolute -bottom-6 -right-6 w-32 h-32 text-indigo-500/20 rotate-12" />
            <h3 className="text-lg font-black mb-4">Leave Policy</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5" />
                <span className="text-xs text-slate-300 leading-relaxed font-medium">
                  Annual leave must be requested 2 weeks in advance.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5" />
                <span className="text-xs text-slate-300 leading-relaxed font-medium">
                  Sick leave requires a medical certificate if &gt; 2 days.
                </span>
              </li>
            </ul>
            <button className="text-[10px] font-black text-indigo-300 uppercase tracking-widest hover:text-white flex items-center gap-2">
              Read Full Policy <ChevronRight size={12} />
            </button>
          </section>
        </div>
      </div>
    </div>
  );

  const renderApplicationForm = () => (
    <div className="max-w-3xl mx-auto pb-20">
      <button
        onClick={() => setLocalTab("dashboard")}
        className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 mb-8 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-10 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-1">New Leave Request</h2>
            <p className="text-indigo-100 text-sm font-medium">
              Step {requestStep} of 5
            </p>
          </div>
          {/* Step Indicator */}
          <div className="flex gap-2 relative z-10">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i <= requestStep ? "bg-white" : "bg-white/30"}`}
              />
            ))}
          </div>
        </div>

        <div className="p-10">
          <AnimatePresence mode="wait">
            {requestStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-black text-slate-800">
                  Select Leave Type
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {MOCK_LEAVE_BALANCES.map((type, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setLeaveType(type.type);
                        setRequestStep(2);
                      }}
                      className={`p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${
                        leaveType === type.type
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-slate-100 hover:border-indigo-200"
                      }`}
                    >
                      <p
                        className={`text-sm font-black uppercase tracking-widest mb-2 ${
                          leaveType === type.type
                            ? "text-indigo-700"
                            : "text-slate-600"
                        }`}
                      >
                        {type.type}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        {type.total - type.used} Days Available
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {requestStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <h3 className="text-xl font-black text-slate-800">Duration</h3>

                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl w-fit">
                  <button
                    onClick={() => setIsHalfDay(false)}
                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      !isHalfDay
                        ? "bg-white shadow-sm text-indigo-600"
                        : "text-slate-400"
                    }`}
                  >
                    Full Days
                  </button>
                  <button
                    onClick={() => setIsHalfDay(true)}
                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      isHalfDay
                        ? "bg-white shadow-sm text-indigo-600"
                        : "text-slate-400"
                    }`}
                  >
                    Half Day
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  {!isHalfDay && (
                    <div className="space-y-4">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  )}
                </div>

                {calculateDays() > 0 && (
                  <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-center text-sm font-bold flex items-center justify-center gap-2">
                    <Clock size={18} /> You are requesting {calculateDays()}{" "}
                    days.
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setRequestStep(1)}
                    className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
                  >
                    Back
                  </button>
                  <button
                    disabled={calculateDays() === 0}
                    onClick={() => setRequestStep(3)}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
                  >
                    Next Step
                  </button>
                </div>
              </motion.div>
            )}

            {requestStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <h3 className="text-xl font-black text-slate-800">Reason</h3>

                <div className="flex gap-2 flex-wrap">
                  {[
                    "Family Emergency",
                    "Vacation",
                    "Medical Checkup",
                    "Personal",
                  ].map((t) => (
                    <button
                      key={t}
                      onClick={() => setReason(t)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-indigo-200 hover:text-indigo-600 transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please describe why you are requesting leave..."
                  className="w-full h-32 bg-slate-50 border-none rounded-2xl p-6 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none leading-relaxed"
                />

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setRequestStep(2)}
                    className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
                  >
                    Back
                  </button>
                  <button
                    disabled={!reason}
                    onClick={() => setRequestStep(4)}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl disabled:opacity-50 hover:scale-[1.02] transition-transform"
                  >
                    Next Step
                  </button>
                </div>
              </motion.div>
            )}

            {requestStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <h3 className="text-xl font-black text-slate-800">
                  Handover (Optional)
                </h3>
                <p className="text-sm text-slate-500">
                  Select a colleague who will cover for you.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {MOCK_EMPLOYEES.slice(1).map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => setHandoverEmployee(emp.id)}
                      className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                        handoverEmployee === emp.id
                          ? "border-indigo-600 bg-indigo-50 shadow-md"
                          : "border-slate-100 bg-white hover:border-slate-200"
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full bg-slate-200 bg-cover bg-center"
                        style={{ backgroundImage: `url(${emp.avatar})` }}
                      />
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-800">
                          {emp.name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          {emp.role}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setRequestStep(3)}
                    className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setRequestStep(5)}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-transform"
                  >
                    Skip / Next
                  </button>
                </div>
              </motion.div>
            )}

            {requestStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <h3 className="text-xl font-black text-slate-800">
                  Review Request
                </h3>

                <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Leave Type
                    </span>
                    <span className="text-sm font-black text-slate-800">
                      {leaveType}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Duration
                    </span>
                    <span className="text-sm font-black text-slate-800">
                      {calculateDays()} Days ({startDate} -{" "}
                      {isHalfDay ? "Half Day" : endDate})
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Reason
                    </span>
                    <span className="text-sm font-medium text-slate-800 max-w-[200px] text-right truncate">
                      {reason}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Net Balance
                    </span>
                    <span className="text-sm font-black text-emerald-600">
                      12 Days → {12 - calculateDays()} Days
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setRequestStep(4)}
                    className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleApply}
                    className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-200 hover:scale-[1.02] transition-transform"
                  >
                    Submit Request
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto">
      <Celebration active={showCelebration} />

      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">
            Leave Management
          </h1>
          <p className="text-slate-500 font-medium">
            Balance your work and life effectively.
          </p>
        </div>

        {(activeTab === "dashboard" || activeTab === "history") && (
          <button
            onClick={() => setLocalTab("apply")}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} /> New Request
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "apply" && renderApplicationForm()}
          {activeTab === "history" && (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100">
              <h2 className="text-2xl font-black text-slate-300 mb-4">
                Leave History
              </h2>
              <button
                onClick={() => setLocalTab("dashboard")}
                className="text-indigo-600 font-black uppercase tracking-widest text-xs"
              >
                Back to Dashboard
              </button>
            </div>
          )}
          {activeTab === "calendar" && (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100">
              <h2 className="text-2xl font-black text-slate-300 mb-4">
                Team Calendar View
              </h2>
              <button
                onClick={() => setLocalTab("dashboard")}
                className="text-indigo-600 font-black uppercase tracking-widest text-xs"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Leave;
