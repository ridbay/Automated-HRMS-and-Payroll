import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  FileText,
  Settings,
  History,
  ChevronRight,
  Download,
  CheckCircle2,
  AlertCircle,
  Printer,
  Send,
  Calculator,
  ShieldCheck,
  LayoutGrid,
  Clock,
  ShieldAlert,
  Banknote,
  Users,
  Lock,
  Unlock,
  FileCheck,
  ChevronDown,
  Gavel,
  Landmark,
  TrendingUp,
  X,
  DollarSign,
  Loader2,
  Trash2,
  Pencil,
  Zap,
} from "lucide-react";
import { useNavigation } from "../../context/NavigationContext";
import { useAuth } from "../../context/AuthContext";
import { usePopup } from "../../components/PopupProvider";
import {
  useEmployees,
  usePayrollDashboard,
  usePayrollPreview,
  useRecomputePayrollPreview,
  useSubmitPayrollRun,
  usePayrollRuns,
  usePayrollRun,
  useApprovePayrollRun,
  useRejectPayrollRun,
  useMarkPayrollRunPaid,
  useDisbursePayrollRun,
  downloadPayrollBankFile,
  useComplianceTasks,
  useCompleteComplianceTask,
  useTaxBrackets,
  useUpdateTaxBrackets,
  useLoans,
  useCreateLoan,
  useDeleteLoan,
  useLoanRepayments,
  useSalaryComponents,
  useCreateSalaryComponent,
  useDeleteSalaryComponent,
  usePayGrades,
  useCreatePayGrade,
  useDeletePayGrade,
  usePayrollSettings,
  useUpdatePayrollSettings,
} from "../../api/client";

const WRITE_ROLES = ["SUPER_ADMIN", "HR_ADMIN", "PAYROLL_OFFICER"];

const formatCurrency = (val: number | undefined | null) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(val || 0);

const periodLabel = (month: number, year: number) =>
  new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-500 border-slate-200",
  pending_approval: "bg-amber-50 text-amber-600 border-amber-100",
  approved: "bg-indigo-50 text-indigo-600 border-indigo-100",
  paid: "bg-emerald-50 text-emerald-600 border-emerald-100",
  rejected: "bg-rose-50 text-rose-600 border-rose-100",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved · Ready to Pay",
  paid: "Paid",
  rejected: "Rejected",
};

const Payroll: React.FC = () => {
  const { setActiveTab: setGlobalTab } = useNavigation();
  const { user } = useAuth();
  const { alert: popupAlert, confirm, prompt } = usePopup();
  const canManage = !!user && WRITE_ROLES.includes(user.role);
  const isViewOnly = !canManage;

  const now = new Date();
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "wizard" | "compliance" | "loans" | "history" | "settings"
  >("dashboard");
  const [wizardStep, setWizardStep] = useState(1);
  const [overrides, setOverrides] = useState<Record<string, { bonuses?: number; otherDeductions?: number }>>({});
  const [livePreview, setLivePreview] = useState<any>(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [scheduleLoanId, setScheduleLoanId] = useState<string | null>(null);
  const [settingsSection, setSettingsSection] = useState<"general" | "components" | "grades">("general");

  const shiftPeriod = (delta: number) => {
    let m = periodMonth + delta;
    let y = periodYear;
    if (m > 12) { m = 1; y += 1; }
    if (m < 1) { m = 12; y -= 1; }
    setPeriodMonth(m);
    setPeriodYear(y);
    setLivePreview(null);
    setOverrides({});
  };

  const { data: employees } = useEmployees();
  const { data: dashboard, isLoading: isDashboardLoading } = usePayrollDashboard(periodMonth, periodYear);
  const { data: runs } = usePayrollRuns();

  const latestRunForPeriod = useMemo(() => {
    if (!runs) return null;
    const matches = runs.filter((r: any) => r.periodMonth === periodMonth && r.periodYear === periodYear);
    if (matches.length === 0) return null;
    return [...matches].sort((a: any, b: any) => (a.createdAt < b.createdAt ? 1 : -1))[0];
  }, [runs, periodMonth, periodYear]);

  const activeRunSummary = latestRunForPeriod && latestRunForPeriod.status !== "rejected" ? latestRunForPeriod : null;
  const { data: runDetail } = usePayrollRun(activeRunSummary?.id);
  const { data: previewData, isLoading: isPreviewLoading } = usePayrollPreview(periodMonth, periodYear);
  const recomputeMutation = useRecomputePayrollPreview();
  const submitMutation = useSubmitPayrollRun();
  const approveMutation = useApprovePayrollRun();
  const rejectMutation = useRejectPayrollRun();
  const markPaidMutation = useMarkPayrollRunPaid();
  const disburseMutation = useDisbursePayrollRun();

  const { data: complianceTasks } = useComplianceTasks(activeTab === "compliance" || activeTab === "dashboard" || wizardStep === 7);
  const completeComplianceMutation = useCompleteComplianceTask();
  const { data: taxBrackets } = useTaxBrackets(activeTab === "compliance");
  const updateTaxBracketsMutation = useUpdateTaxBrackets();
  const [bracketDraft, setBracketDraft] = useState<any[] | null>(null);
  const brackets = bracketDraft ?? taxBrackets ?? [];

  const { data: loans } = useLoans(activeTab === "loans" || wizardStep === 3);
  const createLoanMutation = useCreateLoan();
  const deleteLoanMutation = useDeleteLoan();
  const { data: scheduleRepayments } = useLoanRepayments(scheduleLoanId || undefined);

  const { data: salaryComponents } = useSalaryComponents(activeTab === "settings" && settingsSection === "components");
  const createComponentMutation = useCreateSalaryComponent();
  const deleteComponentMutation = useDeleteSalaryComponent();
  const { data: payGrades } = usePayGrades(activeTab === "settings" && settingsSection === "grades");
  const createGradeMutation = useCreatePayGrade();
  const deleteGradeMutation = useDeletePayGrade();
  const { data: payrollSettings } = usePayrollSettings(activeTab === "settings" && settingsSection === "general");
  const updateSettingsMutation = useUpdatePayrollSettings();
  const [settingsDraft, setSettingsDraft] = useState<any | null>(null);

  const isRunLocked = !!activeRunSummary;
  const wizardData = isRunLocked ? runDetail : livePreview || previewData;
  const payslips: any[] = wizardData?.payslips || [];
  const isWizardLoading = isRunLocked ? !runDetail : isPreviewLoading;
  // Red-severity exceptions block submission server-side (missing bank details,
  // unconfigured salary, below minimum wage) — surface that before the user hits
  // Submit and gets a rejection, rather than only after.
  const blockingExceptions: any[] = (wizardData?.exceptions || []).filter((ex: any) => ex.severity === "red");

  const employeeName = (id?: string) => {
    if (!id) return "—";
    const emp = employees?.find((e: any) => e.id === id);
    return emp ? `${emp.name} ${emp.lastName || ""}`.trim() : id;
  };

  const handleBonusChange = (employeeId: string, value: number) => {
    const next = { ...overrides, [employeeId]: { ...overrides[employeeId], bonuses: value } };
    setOverrides(next);
  };

  const recompute = (next: Record<string, any>) => {
    recomputeMutation.mutate(
      { periodMonth, periodYear, overrides: next },
      { onSuccess: (data) => setLivePreview(data) }
    );
  };

  const handleSubmitRun = async () => {
    if (!(await confirm(`Submit ${periodLabel(periodMonth, periodYear)} payroll for approval? This locks in ${payslips.length} payslips for review.`))) return;
    submitMutation.mutate(
      { periodMonth, periodYear, overrides },
      {
        onSuccess: () => {
          setLivePreview(null);
          popupAlert("Payroll run submitted for approval.", "Submitted");
        },
        onError: (e: any) => popupAlert(e.message, "Error"),
      }
    );
  };

  const handleApprove = async () => {
    if (!activeRunSummary) return;
    if (!(await confirm("Approve this payroll run? It will become eligible for payment."))) return;
    approveMutation.mutate(activeRunSummary.id, { onError: (e: any) => popupAlert(e.message, "Error") });
  };

  const handleReject = async () => {
    if (!activeRunSummary) return;
    const reason = await prompt("Reason for rejecting this run:", "", "Reject Payroll Run");
    if (reason === null) return;
    rejectMutation.mutate({ runId: activeRunSummary.id, reason }, { onError: (e: any) => popupAlert(e.message, "Error") });
  };

  const handleMarkPaid = async () => {
    if (!activeRunSummary) return;
    if (!(await confirm(`Mark ${periodLabel(periodMonth, periodYear)} payroll as paid? This finalizes disbursement and schedules statutory remittances.`))) return;
    markPaidMutation.mutate(activeRunSummary.id, {
      onSuccess: () => setWizardStep(7),
      onError: (e: any) => popupAlert(e.message, "Error"),
    });
  };

  const handleDisburseMonnify = async () => {
    if (!activeRunSummary) return;
    if (!(await confirm(`Disburse ${periodLabel(periodMonth, periodYear)} payroll via Monnify batch transfer? Funds will be paid directly to employee accounts.`))) return;
    disburseMutation.mutate(activeRunSummary.id, {
      onSuccess: (data: any) => {
        popupAlert(`Disbursement initiated via Monnify! Status: ${data.status || 'Processing'}. Reference: ${data.batchReference || data.reference || 'Complete'}`, "Disbursement Submitted");
        setWizardStep(7);
      },
      onError: (e: any) => popupAlert(e.message, "Disbursement Error"),
    });
  };

  const goToRun = (run: any) => {
    setPeriodMonth(run.periodMonth);
    setPeriodYear(run.periodYear);
    setActiveTab("wizard");
    setWizardStep(5);
  };

  const saveBrackets = () => {
    updateTaxBracketsMutation.mutate(brackets, {
      onSuccess: () => { setBracketDraft(null); popupAlert("Tax brackets updated.", "Saved"); },
      onError: (e: any) => popupAlert(e.message, "Error"),
    });
  };

  const settings = settingsDraft ?? payrollSettings;

  const renderDashboard = () => (
    <div className="space-y-8 pb-20">
      <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-40"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3">
              <button onClick={() => shiftPeriod(-1)} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors">
                <ChevronDown size={16} className="rotate-90" />
              </button>
              <h1 className="text-4xl font-black text-slate-800 tracking-tighter">
                {periodLabel(periodMonth, periodYear)} Payroll
              </h1>
              <button onClick={() => shiftPeriod(1)} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors">
                <ChevronDown size={16} className="-rotate-90" />
              </button>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border ${STATUS_STYLES[activeRunSummary?.status || "draft"]}`}>
                {activeRunSummary ? STATUS_LABELS[activeRunSummary.status] : "No Run Yet · Preview"}
              </span>
              {activeRunSummary?.dueDate && (
                <p className="text-sm font-bold text-slate-400">Due {new Date(activeRunSummary.dueDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>
          {!isViewOnly && (
            <button
              onClick={() => { setActiveTab("wizard"); setWizardStep(activeRunSummary ? 5 : 1); }}
              className="px-10 py-4 bg-indigo-600 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Calculator size={18} /> {activeRunSummary ? "Continue Processing" : "Start Payroll Run"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Employees", val: dashboard?.employeeCount, icon: <Users />, color: "indigo", isCurrency: false },
          { label: "Gross Payroll", val: dashboard?.totalGross, icon: <TrendingUp />, color: "emerald", isCurrency: true },
          { label: "Total Deductions", val: (dashboard?.totalTaxes || 0) + (dashboard?.totalPension || 0) + (dashboard?.totalLoanDeductions || 0), icon: <DollarSign />, color: "rose", isCurrency: true },
          { label: "Net Payroll", val: dashboard?.totalNet, icon: <Banknote />, color: "violet", isCurrency: true },
        ].map((m, i) => (
          <motion.div
            whileHover={{ y: -5 }}
            key={i}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform" />
            <div>
              <div className={`w-10 h-10 bg-${m.color}-50 text-${m.color}-600 rounded-xl flex items-center justify-center mb-6`}>
                {m.icon}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
              <h4 className="text-2xl font-black text-slate-800 tracking-tighter tabular-nums">
                {isDashboardLoading ? "—" : m.isCurrency ? formatCurrency(m.val) : (m.val ?? 0)}
              </h4>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="text-xl font-black text-slate-800">Payroll Exceptions</h3>
                <p className="text-xs text-slate-400 font-medium">Items to resolve before approval.</p>
              </div>
              <div className="w-8 h-8 bg-rose-500 text-white rounded-xl flex items-center justify-center text-[10px] font-black">
                {dashboard?.exceptions?.length || 0}
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {(!dashboard?.exceptions || dashboard.exceptions.length === 0) && (
                <div className="p-10 text-center text-sm text-slate-400 font-bold">No exceptions — every active employee is payroll-ready.</div>
              )}
              {dashboard?.exceptions?.slice(0, 8).map((ex: any, i: number) => (
                <div key={i} className="p-8 flex items-center justify-between group hover:bg-slate-50/50 transition-all">
                  <div className="flex items-center gap-6">
                    <div className={`w-2 h-10 rounded-full ${ex.severity === "red" ? "bg-rose-500" : "bg-amber-500"}`} />
                    <div>
                      <p className="text-sm font-black text-slate-800">{ex.employeeName}</p>
                      <p className={`text-xs font-bold ${ex.severity === "red" ? "text-rose-600" : "text-amber-600"}`}>{ex.issue}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ex.type}</span>
                    <button
                      onClick={() => setGlobalTab("workforce")}
                      className="px-5 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase hover:border-indigo-600 hover:text-indigo-600 transition-all"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <ShieldCheck className="absolute -bottom-8 -right-8 w-40 h-40 text-indigo-500/10 rotate-12" />
            <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-indigo-400">
              <ShieldAlert size={20} /> Compliance Status
            </h3>
            <div className="space-y-6 mb-10">
              {(dashboard?.upcomingRemittances || []).length === 0 && (
                <p className="text-xs font-bold text-slate-500">No pending remittances right now.</p>
              )}
              {(dashboard?.upcomingRemittances || []).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-slate-300">{c.title}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase">{new Date(c.dueDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveTab("compliance")} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
              View Compliance
            </button>
          </section>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">Active Loans</h4>
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-500">Employees with active loans</span>
              <span className="font-black text-slate-800">{dashboard?.activeLoanCount ?? 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-4 mt-4">
              <span className="font-bold text-slate-500">Outstanding balance</span>
              <span className="font-black text-indigo-600">{formatCurrency(dashboard?.activeLoanBalance)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWizard = () => (
    <div className="max-w-6xl mx-auto pb-20">
      {latestRunForPeriod?.status === "rejected" && (
        <div className="mb-6 p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-4">
          <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-black text-rose-700">Previous run for this period was rejected</p>
            <p className="text-xs text-rose-500 font-medium mt-1">{latestRunForPeriod.rejectedReason || "No reason provided."} You can adjust and resubmit below.</p>
          </div>
        </div>
      )}
      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-10 text-white flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-2">Payroll Run Wizard</h2>
            <p className="text-slate-400 text-sm font-medium">
              {periodLabel(periodMonth, periodYear)} · Step {wizardStep} of 7
            </p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
              <div key={s} className={`w-8 h-1.5 rounded-full transition-all duration-500 ${wizardStep >= s ? "bg-indigo-500" : "bg-slate-700"}`} />
            ))}
          </div>
        </div>

        <div className="flex bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-hide">
          {[
            { id: 1, label: "Attendance", icon: <Clock /> },
            { id: 2, label: "Earnings", icon: <Calculator /> },
            { id: 3, label: "Deductions", icon: <DollarSign /> },
            { id: 4, label: "Net Pay", icon: <Banknote /> },
            { id: 5, label: "Review", icon: <ShieldCheck /> },
            { id: 6, label: "Payment", icon: <Send /> },
            { id: 7, label: "Post-Payroll", icon: <History /> },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setWizardStep(s.id)}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${wizardStep === s.id ? "bg-white border-indigo-600 text-indigo-600" : "border-transparent text-slate-400"}`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        <div className="p-12 min-h-[600px]">
          {isWizardLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="animate-spin text-indigo-600" size={48} />
            </div>
          ) : (
          <AnimatePresence mode="wait">
            <motion.div key={wizardStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {wizardStep === 1 && (
                <div className="space-y-8">
                  <h3 className="text-xl font-black text-slate-800">Attendance & Time Review</h3>
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                        <tr>
                          <th className="px-10 py-6">Employee</th>
                          <th className="px-8 py-6">Days Present</th>
                          <th className="px-8 py-6">Absences</th>
                          <th className="px-8 py-6">Overtime</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {payslips.map((entry: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-10 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs">
                                  {entry.employeeName?.[0]}
                                </div>
                                <div>
                                  <span className="text-sm font-bold text-slate-800">{entry.employeeName}</span>
                                  {entry.isProrated && (
                                    <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-black uppercase align-middle">Prorated</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-sm font-bold text-slate-600">{entry.presentDays} / {entry.workingDays}</td>
                            <td className={`px-8 py-5 text-sm font-bold ${entry.absentDays ? "text-rose-500" : "text-slate-400"}`}>{entry.absentDays || 0} days</td>
                            <td className="px-8 py-5 text-sm font-bold text-emerald-600">{(entry.overtimeHours || 0).toFixed(1)}h</td>
                          </tr>
                        ))}
                        {payslips.length === 0 && (
                          <tr><td colSpan={4} className="px-10 py-10 text-center text-sm text-slate-400 font-bold">No active employees to process.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-800">Earnings Calculation</h3>
                    {isRunLocked && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Locked — run already submitted</span>}
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {payslips.map((entry: any, idx: number) => (
                      <div key={idx} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden group">
                        <div className="p-8 flex items-center justify-between bg-slate-50/50">
                          <div className="flex items-center gap-6">
                            <h4 className="text-lg font-black text-slate-800">{entry.employeeName}</h4>
                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-400">{entry.department}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Gross Estimate</p>
                            <p className="text-xl font-black text-indigo-600 tabular-nums">{formatCurrency(entry.grossPay)}</p>
                          </div>
                        </div>
                        <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                          {[
                            { l: "Basic Salary", v: entry.basicSalary },
                            { l: "Allowances", v: entry.allowances },
                            { l: "Overtime (hrs)", v: entry.overtimeHours || 0, hrs: true },
                          ].map((item, i) => (
                            <div key={i} className="space-y-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.l}</p>
                              <div className="w-full bg-slate-50 px-4 py-2 rounded-xl text-sm font-black text-slate-500">
                                {item.hrs ? `${item.v}h` : formatCurrency(item.v)}
                              </div>
                            </div>
                          ))}
                          <div className="space-y-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bonuses</p>
                            <input
                              type="number"
                              min={0}
                              disabled={isRunLocked || isViewOnly}
                              value={overrides[entry.employeeId]?.bonuses ?? entry.bonuses ?? 0}
                              onChange={(e) => handleBonusChange(entry.employeeId, Number(e.target.value))}
                              onBlur={() => recompute(overrides)}
                              className="w-full bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-black text-slate-700 focus:ring-2 focus:ring-indigo-500/10 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {recomputeMutation.isPending && <p className="text-xs text-indigo-500 font-bold flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Recalculating…</p>}
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-10">
                  <h3 className="text-xl font-black text-slate-800">Deductions Processing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Statutory (Auto-Calculated)</h4>
                      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <ShieldCheck className="absolute -bottom-8 -right-8 w-32 h-32 text-indigo-500/10 rotate-12" />
                        <div className="space-y-8">
                          <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Total PAYE Tax</p>
                            <p className="text-4xl font-black tabular-nums">{formatCurrency(wizardData?.totalTaxes)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Total Pension</p>
                            <p className="text-3xl font-black tabular-nums">{formatCurrency(wizardData?.totalPension)}</p>
                          </div>
                        </div>
                      </div>
                    </section>
                    <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Active Loan Deductions</h4>
                      <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
                        {payslips.filter((p) => p.loanDeductions > 0).length === 0 && (
                          <p className="text-xs text-slate-400 font-bold p-6 bg-slate-50 rounded-2xl">No employees have active loan deductions this period.</p>
                        )}
                        {payslips.filter((p) => p.loanDeductions > 0).map((p: any, i: number) => (
                          <div key={i} className="p-6 bg-white border border-slate-200 rounded-[2rem] flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                <Gavel size={24} />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-800">{p.employeeName}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Installment: {formatCurrency(p.loanDeductions)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-10">
                  <h3 className="text-xl font-black text-slate-800">Net Pay Summary</h3>
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                        <tr>
                          <th className="px-10 py-6">Employee</th>
                          <th className="px-8 py-6">Gross Pay</th>
                          <th className="px-8 py-6">Total Deductions</th>
                          <th className="px-8 py-6">Net Pay</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {payslips.map((entry: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-10 py-5"><p className="text-sm font-bold text-slate-800">{entry.employeeName}</p></td>
                            <td className="px-8 py-5 text-sm font-bold text-slate-600">{formatCurrency(entry.grossPay)}</td>
                            <td className="px-8 py-5 text-sm font-bold text-rose-500">
                              -{formatCurrency(entry.taxDeductions + entry.pensionDeductions + entry.loanDeductions + (entry.otherDeductions || 0))}
                            </td>
                            <td className="px-8 py-5 text-sm font-black text-emerald-600">{formatCurrency(entry.netPay)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {wizardStep === 5 && (
                <div className="space-y-10">
                  <h3 className="text-xl font-black text-slate-800">Review & Approval</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-slate-50 p-12 rounded-[3.5rem] space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-6">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Employees</span>
                        <span className="text-xl font-black text-slate-800">{wizardData?.employeeCount ?? payslips.length}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-6">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Company Gross</span>
                        <span className="text-xl font-black text-slate-800">{formatCurrency(wizardData?.totalGross)}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-6">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Tax + Pension</span>
                        <span className="text-xl font-black text-rose-500">{formatCurrency((wizardData?.totalTaxes || 0) + (wizardData?.totalPension || 0))}</span>
                      </div>
                      <div className="flex justify-between items-center pt-4">
                        <span className="text-lg font-black text-slate-800 uppercase tracking-widest">Final Net Payout</span>
                        <span className="text-3xl font-black text-indigo-600">{formatCurrency(wizardData?.totalNet)}</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-[3.5rem] border border-slate-200 p-10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck size={120} /></div>
                      <h4 className="text-xl font-black text-slate-800 mb-8">Approval Workflow</h4>
                      <div className="space-y-6 mb-10">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeRunSummary ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-300"}`}>
                            <CheckCircle2 size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-800">Submitted</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {activeRunSummary ? `${employeeName(activeRunSummary.submittedBy)} · ${new Date(activeRunSummary.submittedAt).toLocaleString()}` : "Not submitted yet"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeRunSummary?.approvedAt ? "bg-emerald-500 text-white" : activeRunSummary?.status === "rejected" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-300"}`}>
                            {activeRunSummary?.status === "rejected" ? <X size={16} /> : <CheckCircle2 size={16} />}
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-800">
                              {activeRunSummary?.status === "rejected" ? "Rejected" : "Approved"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {activeRunSummary?.approvedAt
                                ? `${employeeName(activeRunSummary.approvedBy)} · ${new Date(activeRunSummary.approvedAt).toLocaleString()}`
                                : activeRunSummary?.rejectedReason || "Pending"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeRunSummary?.status === "paid" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-300"}`}>
                            <CheckCircle2 size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-800">Paid</p>
                            <p className="text-[10px] text-slate-400 font-medium">{activeRunSummary?.paidAt ? new Date(activeRunSummary.paidAt).toLocaleString() : "Pending"}</p>
                          </div>
                        </div>
                      </div>

                      {isViewOnly ? (
                        <p className="text-xs text-slate-400 font-bold text-center">Your role has read-only access to payroll processing.</p>
                      ) : !activeRunSummary ? (
                        <>
                          {blockingExceptions.length > 0 && (
                            <div className="mb-4 p-5 bg-rose-50 border border-rose-200 rounded-2xl">
                              <p className="text-xs font-black text-rose-700 uppercase tracking-widest mb-2">
                                {blockingExceptions.length} blocking exception{blockingExceptions.length > 1 ? "s" : ""} — resolve before submitting
                              </p>
                              <ul className="space-y-1">
                                {blockingExceptions.slice(0, 5).map((ex: any, i: number) => (
                                  <li key={i} className="text-[11px] text-rose-600 font-bold">{ex.employeeName}: {ex.issue}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <button onClick={handleSubmitRun} disabled={submitMutation.isPending || payslips.length === 0 || blockingExceptions.length > 0} className="w-full px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                            {submitMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} Submit for Approval
                          </button>
                        </>
                      ) : activeRunSummary.status === "pending_approval" ? (
                        <div className="flex gap-4">
                          <button onClick={handleReject} disabled={rejectMutation.isPending} className="flex-1 px-8 py-5 bg-white border border-rose-200 text-rose-600 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-rose-50 transition-all">
                            Reject
                          </button>
                          <button onClick={handleApprove} disabled={approveMutation.isPending} className="flex-1 px-8 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
                            {approveMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Unlock size={18} />} Approve
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setWizardStep(6)} className="w-full px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                          <Lock size={18} /> Go to Payment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 6 && (
                <div className="space-y-10">
                  <h3 className="text-xl font-black text-slate-800">Payment Processing</h3>
                  {!activeRunSummary || activeRunSummary.status === "pending_approval" ? (
                    <div className="p-12 bg-slate-50 rounded-[3rem] text-center">
                      <Lock className="mx-auto text-slate-300 mb-4" size={40} />
                      <p className="text-sm font-black text-slate-500">This run must be approved before payment can be processed.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl">
                            <Landmark size={32} />
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-slate-800">Bank Disbursement File</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase">CSV · Bank name, account, net pay</p>
                          </div>
                        </div>
                        <button
                          onClick={() => downloadPayrollBankFile(activeRunSummary.id).catch((e) => popupAlert(e.message, "Error"))}
                          className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3"
                        >
                          <Download size={18} /> Download Bank File
                        </button>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
                        <Wallet className="absolute -bottom-10 -right-10 w-48 h-48 text-white/10 rotate-12" />
                        <h4 className="text-2xl font-black mb-2">{activeRunSummary.status === "paid" ? "Payroll Paid" : "Disbursement Options"}</h4>
                        <p className="text-indigo-100 text-sm font-medium mb-8 leading-relaxed">
                          {activeRunSummary.status === "paid"
                            ? `Marked paid on ${new Date(activeRunSummary.paidAt).toLocaleString()}. Payslips are now visible to employees.`
                            : "Disburse automated bank transfers directly via Monnify, or manually mark as paid once manual bank transfers are completed."}
                        </p>
                        {activeRunSummary.status !== "paid" && !isViewOnly && (
                          <div className="flex flex-col gap-3">
                            <button
                              onClick={handleDisburseMonnify}
                              disabled={disburseMutation.isPending || markPaidMutation.isPending}
                              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                              {disburseMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />} Disburse via Monnify
                            </button>
                            <button
                              onClick={handleMarkPaid}
                              disabled={markPaidMutation.isPending || disburseMutation.isPending}
                              className="w-full py-4 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-[1.8rem] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                              {markPaidMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} Mark Manually as Paid
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {wizardStep === 7 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  {activeRunSummary?.status === "paid" ? (
                    <>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-32 h-32 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-10 shadow-2xl shadow-emerald-500/20">
                        <CheckCircle2 size={64} />
                      </motion.div>
                      <h2 className="text-4xl font-black text-slate-800 mb-4">Payroll Cycle Complete!</h2>
                      <p className="text-slate-500 max-w-lg mb-12 text-lg font-medium">
                        {payslips.length} payslips generated and {formatCurrency(activeRunSummary.totalNet)} disbursed for {periodLabel(periodMonth, periodYear)}.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                        {(complianceTasks || []).filter((t: any) => t.payrollRunId === activeRunSummary.id).map((t: any) => (
                          <div key={t.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-left">
                            <div className={`w-10 h-10 ${t.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"} rounded-xl flex items-center justify-center mb-6`}>
                              {t.type === "tax" ? <Landmark /> : <FileCheck />}
                            </div>
                            <h5 className="text-sm font-black text-slate-800 mb-1">{t.title}</h5>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Due {new Date(t.dueDate).toLocaleDateString()} · {formatCurrency(t.amount)}</p>
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${t.status === "completed" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>{t.status}</span>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => { setActiveTab("dashboard"); setWizardStep(1); }} className="mt-16 px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl">
                        Return to Dashboard
                      </button>
                    </>
                  ) : (
                    <p className="text-sm font-black text-slate-400">This run hasn't been paid yet — complete Payment (step 6) first.</p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          )}
        </div>

        <div className="p-10 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <button onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))} disabled={wizardStep === 1} className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest disabled:opacity-30">
            Previous
          </button>
          {wizardStep < 7 && (
            <button onClick={() => setWizardStep((prev) => Math.min(7, prev + 1))} className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all">
              Next Step
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderCompliance = () => (
    <div className="space-y-10 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><ShieldCheck className="text-indigo-600" /> Tax Configuration</h3>
            {!isViewOnly && (
              <button onClick={() => setBracketDraft([...(brackets || []), { minIncome: 0, maxIncome: null, ratePercent: 0 }])} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100">
                <Plus size={16} />
              </button>
            )}
          </div>
          <div className="space-y-3">
            {brackets.map((b: any, i: number) => (
              <div key={i} className="flex items-center gap-2 p-4 bg-slate-50 rounded-2xl">
                <input type="number" value={b.minIncome} disabled={isViewOnly} onChange={(e) => setBracketDraft(brackets.map((x, xi) => xi === i ? { ...x, minIncome: Number(e.target.value) } : x))} className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold" />
                <span className="text-xs text-slate-400">to</span>
                <input type="number" value={b.maxIncome ?? ""} placeholder="∞" disabled={isViewOnly} onChange={(e) => setBracketDraft(brackets.map((x, xi) => xi === i ? { ...x, maxIncome: e.target.value === "" ? null : Number(e.target.value) } : x))} className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold" />
                <input type="number" value={b.ratePercent} disabled={isViewOnly} onChange={(e) => setBracketDraft(brackets.map((x, xi) => xi === i ? { ...x, ratePercent: Number(e.target.value) } : x))} className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-black text-indigo-600 ml-auto" />
                <span className="text-xs font-bold text-slate-400">%</span>
                {!isViewOnly && (
                  <button onClick={() => setBracketDraft(brackets.filter((_, xi) => xi !== i))} className="text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button>
                )}
              </div>
            ))}
            {!isViewOnly && (
              <button onClick={saveBrackets} disabled={updateTaxBracketsMutation.isPending || !bracketDraft} className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all disabled:opacity-40">
                {updateTaxBracketsMutation.isPending ? "Saving…" : "Save Tax Brackets"}
              </button>
            )}
          </div>
        </section>
        <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3"><Landmark className="text-emerald-600" /> Remittance History</h3>
          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
            {(!complianceTasks || complianceTasks.length === 0) && <p className="text-xs text-slate-400 font-bold">No remittance tasks yet — they're generated automatically when a run is marked paid.</p>}
            {complianceTasks?.map((r: any) => (
              <div key={r.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-slate-800">{r.title}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Due {new Date(r.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="text-sm font-black text-slate-800 tabular-nums">{formatCurrency(r.amount)}</p>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${r.status === "completed" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>{r.status}</span>
                  </div>
                  {r.status === "pending" && !isViewOnly && (
                    <button
                      onClick={async () => {
                        const reference = await prompt("Reference / receipt number (optional):", "", "Mark as Filed");
                        if (reference === null) return;
                        completeComplianceMutation.mutate({ id: r.id, reference });
                      }}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase text-slate-500 hover:border-indigo-600 hover:text-indigo-600"
                    >
                      Mark Filed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const renderLoans = () => (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800">Active Loan Portfolio</h2>
        {!isViewOnly && (
          <button onClick={() => setShowLoanModal(true)} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2">
            <Plus size={16} /> New Loan Setup
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(loans || []).map((loan: any) => (
          <div key={loan.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Gavel size={28} />
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{loan.status}</span>
                {!isViewOnly && (
                  <button
                    onClick={async () => { if (await confirm(`Delete this loan for ${loan.employeeName}?`)) deleteLoanMutation.mutate(loan.id); }}
                    className="text-slate-300 hover:text-rose-500"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1">{loan.employeeName}</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-8">Principal: {formatCurrency(loan.principal)}</p>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400 uppercase">Monthly Deduction</span>
                <span className="text-slate-800">{formatCurrency(loan.monthlyInstallment)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400 uppercase">Remaining Balance</span>
                <span className="text-slate-800">{formatCurrency(loan.remainingBalance)}</span>
              </div>
            </div>
            <button onClick={() => setScheduleLoanId(loan.id)} className="w-full mt-8 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
              View Recovery Schedule
            </button>
          </div>
        ))}
        {(!loans || loans.length === 0) && (
          <div className="col-span-full text-center py-20 bg-white rounded-[3rem] border border-slate-100 text-sm font-bold text-slate-400">No loans set up yet.</div>
        )}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-8 pb-20">
      <h2 className="text-2xl font-black text-slate-800">Payroll Run History</h2>
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
            <tr>
              <th className="px-10 py-6">Period</th>
              <th className="px-8 py-6">Status</th>
              <th className="px-8 py-6">Employees</th>
              <th className="px-8 py-6">Gross</th>
              <th className="px-8 py-6">Net</th>
              <th className="px-8 py-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {(runs || []).map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="px-10 py-5 text-sm font-black text-slate-800">{periodLabel(r.periodMonth, r.periodYear)}</td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${STATUS_STYLES[r.status]}`}>{STATUS_LABELS[r.status]}</span>
                </td>
                <td className="px-8 py-5 text-sm font-bold text-slate-600">{r.employeeCount}</td>
                <td className="px-8 py-5 text-sm font-bold text-slate-600">{formatCurrency(r.totalGross)}</td>
                <td className="px-8 py-5 text-sm font-black text-emerald-600">{formatCurrency(r.totalNet)}</td>
                <td className="px-8 py-5 text-right">
                  <button onClick={() => goToRun(r)} className="px-4 py-2 bg-white border border-slate-200 text-slate-500 rounded-lg text-[10px] font-black uppercase hover:border-indigo-600 hover:text-indigo-600">View</button>
                </td>
              </tr>
            ))}
            {(!runs || runs.length === 0) && (
              <tr><td colSpan={6} className="px-10 py-16 text-center text-sm text-slate-400 font-bold">No payroll runs yet. Process your first run from the Dashboard.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-10 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-4">
          {[
            { id: "general", label: "General Configuration" },
            { id: "components", label: "Salary Components" },
            { id: "grades", label: "Pay Grades" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSettingsSection(item.id as any)}
              className={`w-full text-left px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${settingsSection === item.id ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-10">
          {settingsSection === "general" && (
            <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3"><Settings className="text-indigo-600" /> General Configuration</h3>
              {settings && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { key: "cutoffDay", label: "Payroll Cutoff Day", type: "number" },
                    { key: "paymentDay", label: "Payment Disbursement Day", type: "number" },
                    { key: "workingDaysPerMonth", label: "Working Days / Month", type: "number" },
                    { key: "pensionEmployeeRate", label: "Pension Rate — Employee (%)", type: "number" },
                    { key: "pensionEmployerRate", label: "Pension Rate — Employer (%)", type: "number" },
                    { key: "nhfRate", label: "NHF Rate — of Basic (%)", type: "number" },
                    { key: "nsitfRate", label: "NSITF Rate — Employer, of Gross (%)", type: "number" },
                    { key: "itfRate", label: "ITF Levy — Employer, of Gross (%)", type: "number" },
                    { key: "minWageAnnual", label: "Minimum Wage (Annual, ₦)", type: "number" },
                  ].map((f) => (
                    <div key={f.key} className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.label}</label>
                      <input
                        type="number"
                        disabled={isViewOnly}
                        value={settings[f.key] ?? 0}
                        onChange={(e) => setSettingsDraft({ ...settings, [f.key]: Number(e.target.value) })}
                        className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700 disabled:text-slate-400"
                      />
                    </div>
                  ))}
                  <div className="md:col-span-2 flex flex-col md:flex-row gap-4 pt-4">
                    {[
                      { key: "prorationEnabled", label: "Proration Logic", sub: "Auto-calc for joiners/leavers" },
                      { key: "applyConsolidatedReliefAllowance", label: "Apply CRA", sub: "Consolidated Relief Allowance in PAYE" },
                      { key: "nhfEnabled", label: "NHF Deduction", sub: "National Housing Fund — deducted from net pay" },
                      { key: "nsitfEnabled", label: "NSITF Contribution", sub: "Employer-paid, tracked for remittance only" },
                      { key: "itfEnabled", label: "ITF Levy", sub: "Employer-paid, tracked for remittance only" },
                    ].map((t) => (
                      <div key={t.key} className="flex-1 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-black text-slate-800">{t.label}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{t.sub}</p>
                        </div>
                        <button
                          disabled={isViewOnly}
                          onClick={() => setSettingsDraft({ ...settings, [t.key]: !settings[t.key] })}
                          className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${settings[t.key] ? "bg-indigo-600 justify-end" : "bg-slate-300 justify-start"}`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {!isViewOnly && (
                    <div className="md:col-span-2">
                      <button
                        onClick={() => updateSettingsMutation.mutate(settings, { onSuccess: () => { setSettingsDraft(null); popupAlert("Payroll settings saved.", "Saved"); } })}
                        disabled={updateSettingsMutation.isPending || !settingsDraft}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-40"
                      >
                        {updateSettingsMutation.isPending ? "Saving…" : "Save Settings"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {settingsSection === "components" && (
            <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><LayoutGrid className="text-emerald-500" /> Salary Components</h3>
                {!isViewOnly && (
                  <button
                    onClick={async () => {
                      const name = await prompt("Component name:", "", "New Salary Component");
                      if (!name) return;
                      createComponentMutation.mutate({ name, type: "earning", calculationType: "fixed", value: 0, taxable: true });
                    }}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all"
                  >
                    + Add Component
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {(salaryComponents || []).map((c: any) => (
                  <div key={c.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all">
                    <div>
                      <p className="text-sm font-black text-slate-800 flex items-center gap-2">{c.name} {c.statutory && <Lock size={12} className="text-slate-300" />}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${c.type === "earning" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>{c.type}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase bg-white px-2 py-0.5 rounded border border-slate-100">{c.taxable ? "Taxable" : "Pre-Tax"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xs font-bold font-mono text-slate-600">{c.calculationType === "fixed" ? formatCurrency(c.value) : `${c.value}% of ${c.calculationType.replace("percentage_of_", "")}`}</p>
                      {!isViewOnly && !c.statutory && (
                        <button onClick={async () => { if (await confirm(`Delete "${c.name}"?`)) deleteComponentMutation.mutate(c.id); }} className="text-slate-300 hover:text-rose-500">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {settingsSection === "grades" && (
            <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><TrendingUp className="text-amber-500" /> Pay Grade Structures</h3>
                {!isViewOnly && (
                  <button
                    onClick={async () => {
                      const name = await prompt("Grade name (e.g. Senior L4):", "", "New Pay Grade");
                      if (!name) return;
                      createGradeMutation.mutate({ name, level: (payGrades?.length || 0) + 1, minSalary: 0, maxSalary: 0 });
                    }}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all text-xs"
                  >
                    + New Grade
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(payGrades || []).map((g: any) => (
                  <div key={g.id} className="p-6 border border-slate-200 rounded-2xl flex justify-between items-center group hover:bg-slate-50 hover:border-indigo-200 transition-all">
                    <div>
                      <span className="font-black text-slate-700 text-sm">{g.name}</span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{formatCurrency(g.minSalary)} – {formatCurrency(g.maxSalary)}</p>
                    </div>
                    {!isViewOnly && (
                      <button onClick={async () => { if (await confirm(`Delete "${g.name}"?`)) deleteGradeMutation.mutate(g.id); }} className="text-slate-300 hover:text-rose-500">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {(!payGrades || payGrades.length === 0) && <p className="text-xs text-slate-400 font-bold">No pay grades defined yet.</p>}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Payroll Administration</h1>
          <p className="text-slate-500 font-medium">Compliance, processing, and financial governance.{isViewOnly && " (Read-only access)"}</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full lg:w-auto overflow-x-auto scrollbar-hide">
          {[
            { id: "dashboard", name: "Dashboard", icon: <LayoutGrid size={18} /> },
            { id: "wizard", name: "Processing", icon: <Calculator size={18} /> },
            { id: "compliance", name: "Compliance", icon: <ShieldCheck size={18} /> },
            { id: "loans", name: "Loans", icon: <Gavel size={18} /> },
            { id: "history", name: "History", icon: <History size={18} /> },
            ...(isViewOnly ? [] : [{ id: "settings", name: "Salary Setup", icon: <Settings size={18} /> }]),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "text-slate-500 hover:bg-slate-50"}`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "wizard" && renderWizard()}
          {activeTab === "compliance" && renderCompliance()}
          {activeTab === "loans" && renderLoans()}
          {activeTab === "history" && renderHistory()}
          {activeTab === "settings" && !isViewOnly && renderSettings()}
        </motion.div>
      </AnimatePresence>

      {showLoanModal && (
        <LoanModal
          employees={employees || []}
          onClose={() => setShowLoanModal(false)}
          onSubmit={(payload) => createLoanMutation.mutate(payload, { onSuccess: () => setShowLoanModal(false), onError: (e: any) => popupAlert(e.message, "Error") })}
          isPending={createLoanMutation.isPending}
        />
      )}

      {scheduleLoanId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setScheduleLoanId(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800">Recovery Schedule</h2>
              <button onClick={() => setScheduleLoanId(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-3">
              {(scheduleRepayments || []).length === 0 && <p className="text-sm text-slate-400 font-bold text-center py-8">No repayments recorded yet — they're logged automatically when payroll runs are marked paid.</p>}
              {scheduleRepayments?.map((r: any) => (
                <div key={r.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="text-sm font-black text-slate-800">{formatCurrency(r.amount)}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(r.paidAt).toLocaleDateString()}</p>
                  </div>
                  <p className="text-xs font-bold text-slate-500">Balance: {formatCurrency(r.balanceAfter)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LoanModal: React.FC<{ employees: any[]; onClose: () => void; onSubmit: (p: any) => void; isPending: boolean }> = ({ employees, onClose, onSubmit, isPending }) => {
  const [form, setForm] = useState({ employeeId: "", principal: "", interestRatePercent: "0", durationMonths: "12", purpose: "" });
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800">New Loan Setup</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</label>
            <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none font-bold text-sm">
              <option value="">Select employee…</option>
              {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name} {e.lastName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Principal (₦)</label>
              <input type="number" value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interest (%)</label>
              <input type="number" value={form.interestRatePercent} onChange={(e) => setForm({ ...form, interestRatePercent: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration (months)</label>
            <input type="number" value={form.durationMonths} onChange={(e) => setForm({ ...form, durationMonths: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purpose (optional)</label>
            <input type="text" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" />
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-xs uppercase tracking-widest text-slate-500">Cancel</button>
          <button
            disabled={!form.employeeId || !form.principal || isPending}
            onClick={() => onSubmit({ ...form, principal: Number(form.principal), interestRatePercent: Number(form.interestRatePercent), durationMonths: Number(form.durationMonths) })}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-40"
          >
            {isPending ? "Creating…" : "Create Loan"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payroll;
