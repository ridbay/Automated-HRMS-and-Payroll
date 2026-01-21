import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Umbrella,
  DollarSign,
  Clock,
  Briefcase,
  Check,
  X,
  ChevronRight,
  MessageSquare,
  FileText,
  History,
  Filter,
} from "lucide-react";

interface ApprovalCenterProps {
  approvals: any;
  formatCurrency: (val: number) => string;
}

const ApprovalCenter: React.FC<ApprovalCenterProps> = ({
  approvals,
  formatCurrency,
}) => {
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [filterType, setFilterType] = useState<"all" | "leave" | "expenses">(
    "all",
  );

  const renderLeaveCard = (req: any) => (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm group"
    >
      <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
        <div className="flex items-start gap-4">
          <img
            src={req.avatar}
            className="w-14 h-14 rounded-2xl object-cover"
          />
          <div>
            <h3 className="text-lg font-black text-slate-800">{req.name}</h3>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">
              {req.type}
            </p>
            <p className="text-xs text-slate-500">
              {req.range} • {req.days} Days
            </p>
          </div>
        </div>

        {/* Team Impact Section */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 max-w-xs">
          <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">
            Team Impact
          </p>
          <p className="text-xs font-bold text-slate-700 leading-tight mb-1">
            {req.impact || "Low Impact"}
          </p>
          <p className="text-[10px] text-slate-400">2 other members on leave</p>
        </div>
      </div>

      <div className="p-4 bg-slate-50 rounded-2xl mb-8">
        <p className="text-xs text-slate-600 italic">"{req.reason}"</p>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 py-3 bg-white border border-slate-200 text-rose-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-colors">
          Reject
        </button>
        <button className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-colors">
          Approve
        </button>
        <button className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:text-indigo-600 transition-colors">
          <MessageSquare size={18} />
        </button>
      </div>
    </motion.div>
  );

  const renderExpenseCard = (exp: any) => (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <img src={exp.avatar} className="w-12 h-12 rounded-xl object-cover" />
          <div>
            <h3 className="text-base font-black text-slate-800">{exp.name}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {exp.cat}
            </p>
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-xl font-black text-slate-800">
            {formatCurrency(exp.amount)}
          </h3>
          {exp.budget === "Within Budget" ? (
            <span className="text-[10px] font-bold text-emerald-500 uppercase bg-emerald-50 px-2 py-0.5 rounded">
              Within Budget
            </span>
          ) : (
            <span className="text-[10px] font-bold text-amber-500 uppercase bg-amber-50 px-2 py-0.5 rounded">
              Check Budget
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {exp.receipt && (
          <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-200">
            <FileText size={12} /> View Receipt
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <button className="flex-1 py-3 bg-white border border-slate-200 text-rose-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50">
          Reject
        </button>
        <button className="flex-2 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-700">
          Approve Payout
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      {/* Header / Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter">
            Approvals Center
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Manage team requests efficiently.
          </p>
        </div>

        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === "pending" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-indigo-600"}`}
          >
            Pending (4)
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "history" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-indigo-600"}`}
          >
            <History size={14} /> History
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {[
          { id: "all", label: "All Requests" },
          { id: "leave", label: "Leaves", icon: Umbrella },
          { id: "expenses", label: "Expenses", icon: DollarSign },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id as any)}
            className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${
              filterType === f.id
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300"
            }`}
          >
            {f.icon && <f.icon size={12} />} {f.label}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
        <AnimatePresence mode="popLayout">
          {activeTab === "pending" && (
            <>
              {(filterType === "all" || filterType === "leave") &&
                approvals.leave.map((l: any) => (
                  <div key={l.id}>{renderLeaveCard(l)}</div>
                ))}
              {(filterType === "all" || filterType === "expenses") &&
                approvals.expenses.map((e: any) => (
                  <div key={e.id}>{renderExpenseCard(e)}</div>
                ))}
            </>
          )}

          {activeTab === "history" && (
            <div className="col-span-full p-12 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
              <History className="mx-auto w-16 h-16 text-slate-300 mb-4" />
              <h4 className="text-slate-400 font-bold uppercase tracking-widest">
                No recent history
              </h4>
              <p className="text-xs text-slate-400 mt-2">
                Past approvals will appear here.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ApprovalCenter;
