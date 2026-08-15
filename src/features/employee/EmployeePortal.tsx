import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Calendar,
  DollarSign,
  Trophy,
  ChevronRight,
  FileText,
  Users,
  Star,
  Ticket,
  Receipt,
  Bell,
  Settings,
  Loader2,
  Umbrella,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Target,
  FileCheck,
  Grid,
  ThumbsUp,
} from "lucide-react";
import Celebration from "../../components/Celebration";
import { useNavigation } from "../../context/NavigationContext";
import { useAuth } from "../../context/AuthContext";
import {
  useMyLeave,
  useMyAttendance,
  useMyPerformanceSummary,
  useMyPayslips,
  useShoutouts,
  useClockIn,
  useClockOut,
} from "../../api/client";

const QuickActionBtn = ({
  icon: Icon,
  label,
  onClick,
  color = "indigo",
  disabled = false,
}: any) => (
  <motion.button
    whileHover={disabled ? undefined : { scale: 1.05 }}
    whileTap={disabled ? undefined : { scale: 0.95 }}
    onClick={onClick}
    disabled={disabled}
    className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group h-32 w-full disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <div
      className={`p-3 bg-${color}-50 text-${color}-600 rounded-xl mb-3 group-hover:scale-110 transition-transform`}
    >
      {disabled ? <Loader2 size={24} className="animate-spin" /> : <Icon size={24} />}
    </div>
    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center leading-tight group-hover:text-indigo-600 transition-colors">
      {label}
    </span>
  </motion.button>
);

const timeAgo = (iso?: string | null) => {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const periodLabel = (month?: number, year?: number) =>
  month && year ? new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" }) : "";

const EmployeePortal: React.FC = () => {
  const { setActiveTab } = useNavigation();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [celebrating, setCelebrating] = useState(false);

  const me = user;
  const displayName = me?.name?.split(" ")[0] ?? "there";

  const { data: leaveData, isLoading: leaveLoading } = useMyLeave();
  const { data: attendanceData, isLoading: attendanceLoading } = useMyAttendance();
  const { data: perfSummary, isLoading: perfLoading } = useMyPerformanceSummary();
  const { data: payslips = [], isLoading: payslipsLoading } = useMyPayslips();
  const { data: shoutouts = [] } = useShoutouts();
  const clockIn = useClockIn();
  const clockOut = useClockOut();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const isClockedIn = !!attendanceData?.activeSession;
  const clockActionPending = clockIn.isPending || clockOut.isPending;

  const toggleClock = () => {
    if (isClockedIn) {
      clockOut.mutate({});
    } else {
      clockIn.mutate(
        {},
        {
          onSuccess: () => {
            setCelebrating(true);
          },
        },
      );
    }
  };

  // --- Leave balance ---------------------------------------------------
  const balances = leaveData?.balances || [];
  const primaryBalance = useMemo(
    () => balances.find((b: any) => b.type === "Annual Leave") || balances[0],
    [balances],
  );
  const remainingLeave = primaryBalance ? Math.max(0, (primaryBalance.total || 0) - (primaryBalance.used || 0)) : 0;
  const leavePct = primaryBalance?.total
    ? Math.min(100, Math.round(((primaryBalance.total - primaryBalance.used) / primaryBalance.total) * 100))
    : 0;

  // --- Attendance this month --------------------------------------------
  const monthKey = currentTime.toISOString().slice(0, 7);
  const monthRecords = (attendanceData?.history || []).filter((h: any) => h.date?.startsWith(monthKey));
  const onTimeCount = monthRecords.filter((h: any) => h.status === "present").length;
  const attendedCount = monthRecords.filter((h: any) => ["present", "late", "half_day"].includes(h.status)).length;
  const attendancePct = monthRecords.length > 0 ? Math.round((attendedCount / monthRecords.length) * 100) : null;

  // --- Performance --------------------------------------------------
  const rating = perfSummary?.avgRating ?? null;

  // --- Payroll --------------------------------------------------
  const latestPayslip = payslips?.[0];
  const nextPayDate = new Date();
  nextPayDate.setDate(25);
  if (nextPayDate < currentTime) nextPayDate.setMonth(nextPayDate.getMonth() + 1);
  const daysToPayroll = Math.max(0, Math.ceil((nextPayDate.getTime() - currentTime.getTime()) / 86400000));

  // --- Upcoming leave --------------------------------------------------
  const upcomingLeaves = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (leaveData?.requests || [])
      .filter((r: any) => r.status !== "rejected" && r.status !== "cancelled" && r.endDate >= today)
      .sort((a: any, b: any) => a.startDate.localeCompare(b.startDate))
      .slice(0, 3);
  }, [leaveData]);

  // --- Recent activity feed (merged from leave, payslips, shoutouts) ---
  const activityFeed = useMemo(() => {
    const items: { title: string; time: string; ts: number; desc: string; icon: any; color: string }[] = [];

    for (const r of (leaveData?.requests || []).slice(0, 5)) {
      const ts = new Date(r.appliedOn || r.startDate).getTime() || 0;
      if (r.status === "approved") {
        items.push({
          title: "Leave Approved",
          time: timeAgo(r.appliedOn),
          ts,
          desc: `Your ${r.type} request for ${r.startDate} - ${r.endDate} was approved.`,
          icon: CheckCircle2,
          color: "emerald",
        });
      } else if (r.status === "pending") {
        items.push({
          title: "Leave Pending",
          time: timeAgo(r.appliedOn),
          ts,
          desc: `Your ${r.type} request for ${r.startDate} - ${r.endDate} is awaiting approval.`,
          icon: AlertCircle,
          color: "amber",
        });
      } else if (r.status === "rejected") {
        items.push({
          title: "Leave Rejected",
          time: timeAgo(r.appliedOn),
          ts,
          desc: `Your ${r.type} request for ${r.startDate} - ${r.endDate} was rejected.`,
          icon: AlertCircle,
          color: "rose",
        });
      }
    }

    for (const p of (payslips || []).slice(0, 2)) {
      items.push({
        title: "New Payslip",
        time: timeAgo(p.paidAt || p.createdAt),
        ts: new Date(p.paidAt || p.createdAt).getTime() || 0,
        desc: `Payslip for ${periodLabel(p.periodMonth, p.periodYear)} is now available.`,
        icon: DollarSign,
        color: "indigo",
      });
    }

    for (const s of (shoutouts || []).filter((s: any) => s.toEmployeeId === me?.id).slice(0, 5)) {
      items.push({
        title: "Recognition Received",
        time: timeAgo(s.createdAt),
        ts: new Date(s.createdAt).getTime() || 0,
        desc: s.message,
        icon: ThumbsUp,
        color: "violet",
      });
    }

    return items.sort((a, b) => b.ts - a.ts).slice(0, 5);
  }, [leaveData, payslips, shoutouts, me?.id]);

  const isLoading = leaveLoading || attendanceLoading || perfLoading || payslipsLoading;

  return (
    <div className="space-y-8 pb-20">
      <Celebration active={celebrating} />

      {/* 1. Welcome Banner */}
      <section className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              {me?.avatar ? (
                <img
                  src={me.avatar}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] object-cover ring-4 ring-white shadow-xl"
                  alt="Profile"
                />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] ring-4 ring-white shadow-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-4xl">
                  {me?.name?.[0]?.toUpperCase()}
                </div>
              )}
              <button
                onClick={() => setActiveTab("profile")}
                className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-110 transition-transform"
              >
                <Settings size={14} />
              </button>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">
                {formatDate(currentTime)}
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter mb-1">
                Welcome back, {displayName}!
              </h1>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${isClockedIn ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
                />
                <p className="text-sm font-medium text-slate-500">
                  {isClockedIn && attendanceData?.activeSession?.clockIn
                    ? `Clocked in at ${new Date(attendanceData.activeSession.clockIn).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
                    : "You are currently off the clock"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 w-full md:w-auto">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Current Time
              </p>
              <p className="text-4xl font-black text-slate-800 tracking-tighter tabular-nums">
                {formatTime(currentTime)}
              </p>
            </div>
            <button
              onClick={toggleClock}
              disabled={clockActionPending}
              className={`w-full md:w-auto px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:hover:scale-100 ${
                isClockedIn
                  ? "bg-rose-50 text-rose-500 hover:bg-rose-100"
                  : "bg-indigo-600 text-white shadow-indigo-200"
              }`}
            >
              {clockActionPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Clock size={16} />
              )}
              {clockActionPending ? "Please wait…" : isClockedIn ? "Clock Out" : "Clock In Now"}
            </button>
          </div>
        </div>
      </section>

      {/* 2. Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Leave Balance */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Umbrella size={64} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
            {primaryBalance?.type || "Leave Balance"}
          </p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-4xl font-black text-slate-800 tracking-tighter">
              {leaveLoading ? "…" : remainingLeave}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Days Left
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${leavePct}%` }} />
          </div>
          <button
            onClick={() => setActiveTab("leave")}
            className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
          >
            Request Leave <ChevronRight size={12} />
          </button>
        </motion.div>

        {/* Attendance */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Calendar size={64} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
            Attendance
          </p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-4xl font-black text-slate-800 tracking-tighter">
              {attendanceLoading ? "…" : attendancePct === null ? "—" : `${attendancePct}%`}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              This Month
            </span>
          </div>
          <div className="flex items-center gap-1 mb-4">
            <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-black uppercase">
              {onTimeCount} On Time
            </div>
            <div className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md text-[9px] font-black uppercase">
              {monthRecords.length} Days
            </div>
          </div>
          <button
            onClick={() => setActiveTab("attendance")}
            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
          >
            View History <ChevronRight size={12} />
          </button>
        </motion.div>

        {/* Performance */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Trophy size={64} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
            Performance
          </p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-4xl font-black text-slate-800 tracking-tighter">
              {perfLoading ? "…" : rating ?? "—"}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              / 5.0
            </span>
          </div>
          <div className="flex text-amber-400 gap-0.5 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={12}
                fill="currentColor"
                className={!rating || i > Math.round(rating) ? "text-slate-200" : ""}
              />
            ))}
          </div>
          <button
            onClick={() => setActiveTab("performance")}
            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
          >
            View Goals <ChevronRight size={12} />
          </button>
        </motion.div>

        {/* Payroll */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-200 relative overflow-hidden group"
        >
          <div className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-110 transition-transform">
            <Wallet size={80} />
          </div>
          <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-4">
            Next Payroll
          </p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-4xl font-black tracking-tighter">{daysToPayroll}</span>
            <span className="text-[10px] font-bold text-indigo-200 uppercase">
              Days Left
            </span>
          </div>
          <p className="text-[10px] text-indigo-200 font-medium mb-4">
            {latestPayslip
              ? `Last payslip: ${periodLabel(latestPayslip.periodMonth, latestPayslip.periodYear)}`
              : payslipsLoading
                ? "Loading payslips…"
                : "No payslips yet"}
          </p>
          <button
            onClick={() => setActiveTab("my-payroll")}
            className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all bg-white/10 w-fit px-3 py-1.5 rounded-lg hover:bg-white/20"
          >
            View Payslip <ChevronRight size={12} />
          </button>
        </motion.div>
      </div>

      {/* 3. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Actions & Upcoming */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions Grid */}
          <section>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Grid size={18} className="text-indigo-600" /> Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickActionBtn
                icon={Clock}
                label={isClockedIn ? "Clock Out" : "Punch In"}
                color="emerald"
                onClick={toggleClock}
                disabled={clockActionPending}
              />
              <QuickActionBtn
                icon={Umbrella}
                label="Request Leave"
                color="amber"
                onClick={() => setActiveTab("leave")}
              />
              <QuickActionBtn
                icon={Receipt}
                label="Submit Claim"
                color="rose"
                onClick={() => setActiveTab("benefits")}
              />
              <QuickActionBtn
                icon={FileText}
                label="View Payslips"
                color="indigo"
                onClick={() => setActiveTab("my-payroll")}
              />
              <QuickActionBtn
                icon={Target}
                label="My Goals"
                color="violet"
                onClick={() => setActiveTab("performance")}
              />
              <QuickActionBtn
                icon={FileCheck}
                label="Documents"
                color="blue"
                onClick={() => setActiveTab("documents")}
              />
              <QuickActionBtn
                icon={Users}
                label="Team Directory"
                color="cyan"
                onClick={() => setActiveTab("directory")}
              />
              <QuickActionBtn
                icon={Ticket}
                label="Support Ticket"
                color="slate"
                onClick={() => setActiveTab("help")}
              />
            </div>
          </section>

          {/* Upcoming Leave */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-6 mb-8 border-b border-slate-100 pb-4 overflow-x-auto">
              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest pb-2 border-b-2 border-indigo-600 whitespace-nowrap">
                Upcoming Leaves
              </span>
            </div>

            {leaveLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="animate-spin text-indigo-400" size={24} />
              </div>
            ) : upcomingLeaves.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Umbrella size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold">No upcoming leave scheduled.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingLeaves.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{item.type}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          {item.startDate} - {item.endDate} • {item.days} {item.days === 1 ? "Day" : "Days"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        item.status === "approved"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setActiveTab("leave")}
              className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
            >
              View Full Calendar
            </button>
          </section>
        </div>

        {/* Right Col: Feed */}
        <div className="space-y-8">
          {/* Activity Feed */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-full">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Bell size={18} className="text-indigo-600" /> Recent Activity
            </h3>

            {isLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="animate-spin text-indigo-400" size={24} />
              </div>
            ) : activityFeed.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Bell size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold">Nothing new yet.</p>
              </div>
            ) : (
              <div className="space-y-8 relative">
                <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-100" />
                {activityFeed.map((item, i) => (
                  <div key={i} className="relative pl-14 group">
                    <div
                      className={`absolute left-0 top-0 w-12 h-12 bg-white border-2 border-${item.color}-100 text-${item.color}-500 rounded-2xl flex items-center justify-center z-10 shadow-sm group-hover:scale-110 transition-transform`}
                    >
                      <item.icon size={20} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      {item.time}
                    </p>
                    <h4 className="text-sm font-black text-slate-800 leading-tight mb-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default EmployeePortal;
