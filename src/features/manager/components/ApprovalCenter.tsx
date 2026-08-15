import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Umbrella, History } from "lucide-react";

interface ApprovalCenterProps {
  approvals: any;
  onLeaveAction?: (id: string, status: "approved" | "rejected") => void;
  isLeaveActionPending?: boolean;
}

const ApprovalCenter: React.FC<ApprovalCenterProps> = ({
  approvals,
  onLeaveAction,
  isLeaveActionPending,
}) => {
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

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

        {req.impact && (
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 max-w-xs">
            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">
              Team Impact
            </p>
            <p className="text-xs font-bold text-slate-700 leading-tight">
              {req.impact}
            </p>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50 rounded-2xl mb-8">
        <p className="text-xs text-slate-600 italic">"{req.reason}"</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onLeaveAction?.(req.id, "rejected")}
          disabled={isLeaveActionPending}
          className="flex-1 py-3 bg-white border border-slate-200 text-rose-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-colors disabled:opacity-50"
        >
          Reject
        </button>
        <button
          onClick={() => onLeaveAction?.(req.id, "approved")}
          disabled={isLeaveActionPending}
          className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          Approve
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
            Pending ({approvals.leave?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "history" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-indigo-600"}`}
          >
            <History size={14} /> History
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
        <AnimatePresence mode="popLayout">
          {activeTab === "pending" && (
            <>
              {approvals.leave.length === 0 ? (
                <div className="col-span-full p-12 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                  <Umbrella className="mx-auto w-16 h-16 text-slate-300 mb-4" />
                  <h4 className="text-slate-400 font-bold uppercase tracking-widest">
                    Nothing pending
                  </h4>
                  <p className="text-xs text-slate-400 mt-2">
                    Your team's leave requests will show up here.
                  </p>
                </div>
              ) : (
                approvals.leave.map((l: any) => (
                  <div key={l.id}>{renderLeaveCard(l)}</div>
                ))
              )}
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
