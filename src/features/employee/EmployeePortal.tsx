import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Calendar,
  DollarSign,
  Trophy,
  Plus,
  ChevronRight,
  FileText,
  Users,
  Zap,
  Heart,
  Shield,
  Star,
  Award,
  Target,
  Ticket,
  Receipt,
  Sparkles,
  Timer,
  MapPin,
  Download,
  Bell,
  MessageSquare,
  Briefcase,
  Settings,
  Map,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  ChevronDown,
  Search,
  Home,
  LogOut,
  Umbrella,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Wallet,
  Banknote,
  Coffee,
  FileCheck,
  ShieldCheck,
  Sun,
  Grid,
} from "lucide-react";
import {
  MOCK_LEAVE_BALANCES,
  MOCK_EMPLOYEES,
  MOCK_GOALS,
  MOCK_PAYROLL_ENTRIES,
} from "../../data/mocks";
import Celebration from "../../components/Celebration";
import { useNavigation } from "../../context/NavigationContext";

const QuickActionBtn = ({
  icon: Icon,
  label,
  onClick,
  color = "indigo",
}: any) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group h-32 w-full"
  >
    <div
      className={`p-3 bg-${color}-50 text-${color}-600 rounded-xl mb-3 group-hover:scale-110 transition-transform`}
    >
      <Icon size={24} />
    </div>
    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center leading-tight group-hover:text-indigo-600 transition-colors">
      {label}
    </span>
  </motion.button>
);

const EmployeePortal: React.FC = () => {
  const { setActiveTab } = useNavigation();
  const [activeTab, setLocalActiveTab] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const me = MOCK_EMPLOYEES[0]; // Self
  const nextPayDate = new Date();
  nextPayDate.setDate(25); // Assume 25th

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const toggleClock = () => {
    if (!isClockedIn) setCelebrating(true);
    setIsClockedIn(!isClockedIn);
  };

  return (
    <div className="space-y-8 pb-20">
      <Celebration active={celebrating} />

      {/* 1. Welcome Banner */}
      <section className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src={me.avatar}
                className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] object-cover ring-4 ring-white shadow-xl"
                alt="Profile"
              />
              <button className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-110 transition-transform">
                <Settings size={14} />
              </button>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">
                {formatDate(currentTime)}
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter mb-1">
                Welcome back, {me.name.split(" ")[0]}!
              </h1>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${isClockedIn ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
                />
                <p className="text-sm font-medium text-slate-500">
                  {isClockedIn
                    ? `Clocked in at 9:00 AM`
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
              className={`w-full md:w-auto px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 ${
                isClockedIn
                  ? "bg-rose-50 text-rose-500 hover:bg-rose-100"
                  : "bg-indigo-600 text-white shadow-indigo-200"
              }`}
            >
              <Clock size={16} /> {isClockedIn ? "Clock Out" : "Clock In Now"}
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
            Leave Balance
          </p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-4xl font-black text-slate-800 tracking-tighter">
              12
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Days
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
            <div className="h-full bg-emerald-500 w-[60%]" />
          </div>
          <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
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
              98%
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              This Month
            </span>
          </div>
          <div className="flex items-center gap-1 mb-4">
            <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-black uppercase">
              On Time
            </div>
            <div className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md text-[9px] font-black uppercase">
              20 Days
            </div>
          </div>
          <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
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
              4.8
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
                className={i > 4 ? "text-slate-200" : ""}
              />
            ))}
          </div>
          <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
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
            <span className="text-4xl font-black tracking-tighter">5</span>
            <span className="text-[10px] font-bold text-indigo-200 uppercase">
              Days Left
            </span>
          </div>
          <p className="text-[10px] text-indigo-200 font-medium mb-4">
            Est. Date: {nextPayDate.toLocaleDateString()}
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
                label="Punch In/Out"
                color="emerald"
                onClick={toggleClock}
              />
              <QuickActionBtn
                icon={Umbrella}
                label="Request Leave"
                color="amber"
                onClick={() => setActiveTab("leave")}
              />
              <QuickActionBtn
                icon={Receipt}
                label="Submit Expense"
                color="rose"
              />
              <QuickActionBtn
                icon={FileText}
                label="View Payslips"
                color="indigo"
                onClick={() => setActiveTab("my-payroll")}
              />
              <QuickActionBtn icon={Target} label="My Goals" color="violet" />
              <QuickActionBtn icon={FileCheck} label="Documents" color="blue" />
              <QuickActionBtn
                icon={Users}
                label="Team Directory"
                color="cyan"
              />
              <QuickActionBtn
                icon={Ticket}
                label="Support Ticket"
                color="slate"
              />
            </div>
          </section>

          {/* Upcoming Tabs */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-6 mb-8 border-b border-slate-100 pb-4 overflow-x-auto">
              <button className="text-xs font-black text-indigo-600 uppercase tracking-widest pb-2 border-b-2 border-indigo-600 whitespace-nowrap">
                Upcoming Leaves
              </button>
              <button className="text-xs font-black text-slate-400 uppercase tracking-widest pb-2 hover:text-slate-600 whitespace-nowrap">
                Holidays
              </button>
              <button className="text-xs font-black text-slate-400 uppercase tracking-widest pb-2 hover:text-slate-600 whitespace-nowrap">
                Team Avail.
              </button>
            </div>

            <div className="space-y-4">
              {[
                {
                  type: "Annual Leave",
                  date: "Aug 12 - Aug 15",
                  days: "3 Days",
                  status: "Approved",
                },
                {
                  type: "Medical Appt",
                  date: "Sep 02",
                  days: "Half Day",
                  status: "Pending",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">
                        {item.type}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {item.date} • {item.days}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      item.status === "Approved"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
              <button className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                View Full Calendar
              </button>
            </div>
          </section>
        </div>

        {/* Right Col: Feed */}
        <div className="space-y-8">
          {/* Activity Feed */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-full">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Bell size={18} className="text-indigo-600" /> Recent Activity
            </h3>
            <div className="space-y-8 relative">
              <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-100" />

              {[
                {
                  title: "Leave Approved",
                  time: "2 hours ago",
                  desc: "Your request for Aug 12-15 was approved.",
                  icon: CheckCircle2,
                  color: "emerald",
                },
                {
                  title: "New Payslip",
                  time: "Yesterday",
                  desc: "Payslip for July 2024 is now available.",
                  icon: DollarSign,
                  color: "indigo",
                },
                {
                  title: "Team Outing",
                  time: "2 days ago",
                  desc: "Don't forget the team lunch this Friday!",
                  icon: Coffee,
                  color: "amber",
                },
                {
                  title: "Goal Update",
                  time: "Last week",
                  desc: 'You completed "Q3 Design Review".',
                  icon: Target,
                  color: "violet",
                },
              ].map((item, i) => (
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
            <button className="w-full mt-8 py-4 bg-slate-50 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-colors">
              View All Notifications
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default EmployeePortal;
