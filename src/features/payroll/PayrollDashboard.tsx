import React from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  Wallet,
  Users,
  Receipt,
  ShieldCheck,
  Landmark,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "../../context/NavigationContext";
import {
  usePayrollDashboard,
  useComplianceTasks,
  useCompleteComplianceTask,
  useLoans,
  downloadRemittanceSchedule,
} from "../../api/client";

// complianceTasks.type -> the remittance schedule endpoint's type param
// ('tax' is the DB/UI label for what the PAYE schedule covers).
const REMITTANCE_TYPE_BY_TASK_TYPE: Record<string, "paye" | "pension" | "nhf" | "nsitf" | "itf"> = {
  tax: "paye",
  pension: "pension",
  nhf: "nhf",
  nsitf: "nsitf",
  itf: "itf",
};

const formatCurrency = (val: number | undefined | null) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(val || 0);

const RUN_STATUS_STYLES: Record<string, string> = {
  submitted: "bg-sky-50 text-sky-600",
  approved: "bg-indigo-50 text-indigo-600",
  paid: "bg-emerald-50 text-emerald-600",
  rejected: "bg-rose-50 text-rose-600",
};

const PayrollDashboard: React.FC = () => {
  const { user } = useAuth();
  const { setActiveTab } = useNavigation();
  const queryClient = useQueryClient();

  const now = new Date();
  const { data: dashboard, isLoading } = usePayrollDashboard(now.getMonth() + 1, now.getFullYear());
  const { data: complianceTasks = [] } = useComplianceTasks();
  const { data: loans = [] } = useLoans();
  const completeTask = useCompleteComplianceTask();

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  const {
    periodMonth = now.getMonth() + 1,
    periodYear = now.getFullYear(),
    currentRun,
    employeeCount = 0,
    totalGross = 0,
    totalNet = 0,
    totalTaxes = 0,
    totalPension = 0,
    exceptions = [],
    pendingComplianceCount = 0,
    upcomingRemittances = [],
    activeLoanCount = 0,
    activeLoanBalance = 0,
    recentRuns = [],
  } = dashboard || {};

  const periodLabel = new Date(periodYear, periodMonth - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  const stats = [
    {
      label: "Employees on Payroll",
      value: employeeCount,
      icon: <Users className="text-indigo-600" />,
      bg: "bg-indigo-50",
    },
    {
      label: "Gross Pay",
      value: formatCurrency(totalGross),
      icon: <Wallet className="text-emerald-600" />,
      bg: "bg-emerald-50",
    },
    {
      label: "Net Pay",
      value: formatCurrency(totalNet),
      icon: <Receipt className="text-violet-600" />,
      bg: "bg-violet-50",
    },
    {
      label: "Tax + Pension",
      value: formatCurrency(totalTaxes + totalPension),
      icon: <Landmark className="text-amber-600" />,
      bg: "bg-amber-50",
    },
    {
      label: "Active Loans",
      value: `${activeLoanCount} (${formatCurrency(activeLoanBalance)})`,
      icon: <ShieldCheck className="text-rose-600" />,
      bg: "bg-rose-50",
    },
    {
      label: "Pending Compliance",
      value: pendingComplianceCount,
      icon: <AlertTriangle className={pendingComplianceCount > 0 ? "text-orange-600" : "text-emerald-600"} />,
      bg: pendingComplianceCount > 0 ? "bg-orange-50" : "bg-emerald-50",
    },
  ];

  const handleCompleteTask = (id: string) => {
    completeTask.mutate(
      { id },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payrollDashboard"] }) },
    );
  };

  const navigateTo = (tab: string, section?: string) => {
    if (typeof window !== "undefined") {
      const url = section ? `/payroll?tab=${tab}&section=${section}` : `/payroll?tab=${tab}`;
      window.history.pushState(null, "", url);
    }
    setActiveTab("payroll");
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
              <Wallet size={20} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
              Payroll Control Center
            </h1>
          </div>
          <p className="text-slate-500 font-medium italic">
            Welcome, {user?.name || "Payroll Officer"}. Snapshot for {periodLabel}.
          </p>
        </div>
        <button
          onClick={() => setActiveTab("payroll")}
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all flex items-center gap-2"
        >
          Go to Payroll <ArrowRight size={16} />
        </button>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
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
            <h4 className="text-xl font-black text-slate-800 tracking-tighter">{s.value}</h4>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Current Run Status */}
          <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
              {periodLabel} Run
            </h3>
            {currentRun ? (
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${RUN_STATUS_STYLES[currentRun.status] || "bg-slate-50 text-slate-500"}`}>
                    {currentRun.status}
                  </span>
                  <p className="text-2xl font-black text-slate-800 mt-3">{formatCurrency(currentRun.totalNet)} net</p>
                  <p className="text-xs text-slate-400 font-bold mt-1">
                    {currentRun.status === "paid" && currentRun.paidAt
                      ? `Paid ${new Date(currentRun.paidAt).toLocaleDateString()}`
                      : currentRun.status === "approved"
                        ? "Approved — ready to be marked as paid"
                        : currentRun.status === "rejected"
                          ? "Rejected — needs review"
                          : "Submitted — awaiting approval"}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("payroll")}
                  className="px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-2"
                >
                  Manage Run <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-2xl font-black text-slate-800">{formatCurrency(totalNet)} net (preview)</p>
                  <p className="text-xs text-slate-400 font-bold mt-1">
                    No run submitted yet for {periodLabel} — figures shown are a live preview.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("payroll")}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                >
                  Submit Run <ChevronRight size={14} />
                </button>
              </div>
            )}

            {exceptions.length > 0 && (
              <div className="mt-8 pt-8 border-t border-slate-100 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {exceptions.length} exception{exceptions.length === 1 ? "" : "s"} to resolve before running payroll
                </p>
                {exceptions.slice(0, 5).map((ex: any, i: number) => (
                  <div
                    key={i}
                    className={`p-4 rounded-2xl border flex items-center justify-between ${ex.severity === "red" ? "bg-rose-50/50 border-rose-100" : "bg-amber-50/50 border-amber-100"}`}
                  >
                    <div>
                      <p className="text-xs font-black text-slate-800">{ex.employeeName}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">{ex.issue}</p>
                    </div>
                    <span className="text-[9px] font-black uppercase text-slate-400">{ex.type}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Runs */}
          <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
              Recent Runs
            </h3>
            {recentRuns.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium">No payroll runs yet.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentRuns.map((r: any) => (
                  <div key={r.id} className="py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-800">
                        {new Date(r.periodYear, r.periodMonth - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" })}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {formatCurrency(r.totalNet)} net
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${RUN_STATUS_STYLES[r.status] || "bg-slate-50 text-slate-500"}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-10">
          {/* Compliance */}
          <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Upcoming Remittances
              </h3>
              {pendingComplianceCount > 0 && (
                <span className="w-6 h-6 bg-orange-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center">
                  {pendingComplianceCount}
                </span>
              )}
            </div>
            {upcomingRemittances.length === 0 ? (
              <div className="p-6 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
                <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-400 opacity-50" />
                <p className="text-xs font-bold">No pending compliance tasks.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingRemittances.map((t: any) => {
                  const remittanceType = REMITTANCE_TYPE_BY_TASK_TYPE[t.type];
                  return (
                    <div key={t.id} className="p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-800 truncate">{t.title}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1 mt-1">
                            <Clock size={10} /> Due {t.dueDate}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {remittanceType && t.payrollRunId && (
                            <button
                              onClick={() => downloadRemittanceSchedule(t.payrollRunId, remittanceType).catch(() => {})}
                              className="px-3 py-1.5 bg-white border border-slate-200 text-indigo-600 rounded-lg text-[9px] font-black uppercase hover:bg-indigo-50 transition-all"
                            >
                              Schedule
                            </button>
                          )}
                          <button
                            onClick={() => handleCompleteTask(t.id)}
                            disabled={completeTask.isPending}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-emerald-600 rounded-lg text-[9px] font-black uppercase hover:bg-emerald-50 transition-all disabled:opacity-50"
                          >
                            Mark Done
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Payroll Configuration & Management quick access */}
          <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
              Payroll Setup & Rules
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-6">
              Configure statutory compliance, salary rules, pay grade bands, and staff loans.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigateTo("loans")}
                className="p-3.5 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-2xl text-left transition-all group"
              >
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-1">Loans & Adv</span>
                <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-900">Staff Loans →</span>
              </button>
              <button
                onClick={() => navigateTo("settings", "general")}
                className="p-3.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 rounded-2xl text-left transition-all group"
              >
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Config</span>
                <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-900">General Rules →</span>
              </button>
              <button
                onClick={() => navigateTo("settings", "components")}
                className="p-3.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200 rounded-2xl text-left transition-all group"
              >
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-1">Components</span>
                <span className="text-xs font-bold text-slate-700 group-hover:text-amber-900">Components →</span>
              </button>
              <button
                onClick={() => navigateTo("settings", "grades")}
                className="p-3.5 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 rounded-2xl text-left transition-all group"
              >
                <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block mb-1">Grading</span>
                <span className="text-xs font-bold text-slate-700 group-hover:text-purple-900">Pay Grades →</span>
              </button>
            </div>
          </section>

          {/* Loans */}
          <section className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <ShieldCheck className="absolute -bottom-6 -right-6 w-32 h-32 text-indigo-500/20 rotate-12" />
            <h3 className="text-xs font-black text-indigo-300 uppercase tracking-[0.2em] mb-6 relative z-10">
              Active Loans
            </h3>
            <div className="relative z-10 space-y-3 mb-6 max-h-56 overflow-y-auto scrollbar-hide">
              {loans.filter((l: any) => l.status === "active").length === 0 ? (
                <p className="text-xs text-indigo-200 font-bold">No active loans.</p>
              ) : (
                loans
                  .filter((l: any) => l.status === "active")
                  .slice(0, 5)
                  .map((l: any) => (
                    <div key={l.id} className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                      <p className="text-sm font-bold">{l.employeeName}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] font-black uppercase text-indigo-300">Balance</span>
                        <span className="text-xs font-bold">{formatCurrency(l.remainingBalance)}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
            <button
              onClick={() => navigateTo("loans")}
              className="relative z-10 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl"
            >
              Manage Loans
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PayrollDashboard;
