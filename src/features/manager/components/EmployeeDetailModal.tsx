import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Briefcase,
  Trophy,
  Clock,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Building2,
} from "lucide-react";

interface EmployeeDetailModalProps {
  employee: any;
  onClose: () => void;
  // Optional, manager-scoped extras the parent dashboard already has fetched —
  // there's no admin-level per-employee endpoint a manager is allowed to call,
  // so this modal only ever shows what the manager can legitimately see.
  goals?: any[];
  attendanceToday?: any;
}

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employee,
  onClose,
  goals = [],
  attendanceToday,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "performance" | "attendance"
  >("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: <Briefcase size={16} /> },
    { id: "performance", label: "Performance", icon: <Trophy size={16} /> },
    { id: "attendance", label: "Attendance", icon: <Clock size={16} /> },
  ];

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
                <Mail size={16} className="text-indigo-500 shrink-0" />
                <span className="text-sm font-bold truncate">
                  {employee.email || "Not provided"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Phone size={16} className="text-emerald-500 shrink-0" />
                <span className="text-sm font-bold">
                  {employee.phone || "Not provided"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin size={16} className="text-rose-500 shrink-0" />
                <span className="text-sm font-bold">
                  {employee.location || "Not provided"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-indigo-50 rounded-3xl space-y-4">
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">
              Department
            </h4>
            <div className="flex items-center gap-3 text-indigo-900">
              <Building2 size={18} />
              <span className="text-sm font-bold">
                {employee.department || "Unassigned"}
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-2 space-y-6">
          <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Briefcase size={16} /> Current Role
            </h4>
            <div className="relative">
              <h5 className="text-lg font-black text-slate-800">
                {employee.role || "—"}
              </h5>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                {employee.department || "Unassigned"} • Reports to {employee.managerName || "you"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Individual rating history isn't exposed at the team-member level yet —
          check the <strong>Performance</strong> tab for your team's rating
          distribution and pending reviews.
        </p>
      </div>

      <div className="p-8 bg-white border border-slate-100 rounded-3xl">
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">
          Goals ({goals.length})
        </h4>
        {goals.length === 0 ? (
          <p className="text-sm text-slate-400 font-medium">
            No goals assigned to {employee.name} yet.
          </p>
        ) : (
          <div className="space-y-4">
            {goals.map((g: any) => (
              <div key={g.id}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700">{g.title}</span>
                  <span className="text-indigo-500">{g.progress ?? 0}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${g.progress ?? 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderAttendance = () => {
    const statusMeta: Record<string, { label: string; color: string }> = {
      present: { label: "Present", color: "emerald" },
      late: { label: "Late", color: "amber" },
      "clocked-out": { label: "Done for the day", color: "slate" },
      absent: { label: "Absent", color: "rose" },
    };
    const meta = attendanceToday ? statusMeta[attendanceToday.status] || statusMeta.absent : null;

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className={`p-8 bg-${meta?.color || "slate"}-50 rounded-[2.5rem] border border-${meta?.color || "slate"}-100`}>
          <div className="flex items-center gap-4 mb-4">
            <ShieldCheck size={24} className={`text-${meta?.color || "slate"}-600`} />
            <div>
              <p className={`text-[10px] font-black text-${meta?.color || "slate"}-500 uppercase tracking-widest`}>
                Today
              </p>
              <h4 className={`text-xl font-black text-${meta?.color || "slate"}-900`}>
                {meta?.label || "No record yet"}
              </h4>
            </div>
          </div>
          {attendanceToday?.clockIn && (
            <p className="text-xs font-bold text-slate-500">
              Clocked in at {new Date(attendanceToday.clockIn).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
              {attendanceToday.clockOut &&
                ` • out at ${new Date(attendanceToday.clockOut).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`}
            </p>
          )}
        </div>

        <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Full attendance history is available from the Team Calendar / Attendance
            module for a company-wide view.
          </p>
        </div>
      </div>
    );
  };

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
              {employee.avatar ? (
                <img
                  src={employee.avatar}
                  className="w-20 h-20 rounded-[1.8rem] object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <div className="w-20 h-20 rounded-[1.8rem] border-4 border-white shadow-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-3xl">
                  {employee.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-black text-slate-800">
                  {employee.name} {employee.lastName}
                </h2>
                <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">
                  {employee.role}
                </p>
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
        </div>
      </motion.div>
    </div>
  );
};

export default EmployeeDetailModal;
