import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Shield,
  PieChart as PieChartIcon,
  TrendingUp,
  Activity,
  Coffee,
  Plus,
  X,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  Trash2,
  Pencil,
  UserPlus,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import {
  useBenefitsOverview,
  useBenefitPlans,
  useCreateBenefitPlan,
  useUpdateBenefitPlan,
  useDeleteBenefitPlan,
  useAdminEnrollments,
  useAdminEnrollEmployee,
  useAdminUpdateEnrollmentStatus,
  useAdminWellnessPrograms,
  useCreateWellnessProgram,
  useUpdateWellnessProgram,
  useDeleteWellnessProgram,
  useWellnessProgramParticipants,
  useAdminBenefitClaims,
  useReviewBenefitClaim,
  useEmployees,
} from "../../api/client";
import { usePopup } from "../../components/PopupProvider";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(val || 0);

const PLAN_ICONS: Record<string, React.ReactNode> = {
  Shield: <Shield size={22} />,
  Heart: <Heart size={22} />,
  PieChart: <PieChartIcon size={22} />,
  TrendingUp: <TrendingUp size={22} />,
  Activity: <Activity size={22} />,
  Coffee: <Coffee size={22} />,
};

const PLAN_TYPES = ["health", "retirement", "life", "wellness", "perk", "fsa", "equity"];
const PLAN_COLORS = ["indigo", "emerald", "rose", "amber", "sky", "violet"];

type Tab = "plans" | "enrollments" | "wellness" | "claims";

const emptyPlanForm = {
  name: "", type: "health", provider: "", planTier: "", description: "",
  employerCost: 0, employeeCost: 0, coverageLimit: 0, eligibility: "All Employees",
  icon: "Shield", color: "indigo", status: "active",
};

const emptyProgramForm = {
  title: "", description: "", category: "fitness", goalLabel: "Steps", goalTarget: 0,
  startDate: "", endDate: "", status: "active",
};

const BenefitsAdmin: React.FC = () => {
  const { alert, confirm, prompt } = usePopup();
  const [tab, setTab] = useState<Tab>("plans");

  const { data: overview } = useBenefitsOverview();
  const { data: plans = [], isLoading: plansLoading } = useBenefitPlans();
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useAdminEnrollments();
  const { data: programs = [], isLoading: programsLoading } = useAdminWellnessPrograms();
  const { data: employees = [] } = useEmployees();

  const [claimStatusFilter, setClaimStatusFilter] = useState<string>("pending");
  const { data: claims = [], isLoading: claimsLoading } = useAdminBenefitClaims({ status: claimStatusFilter || undefined });

  const createPlan = useCreateBenefitPlan();
  const updatePlan = useUpdateBenefitPlan();
  const deletePlan = useDeleteBenefitPlan();

  const enrollEmployee = useAdminEnrollEmployee();
  const updateEnrollmentStatus = useAdminUpdateEnrollmentStatus();

  const createProgram = useCreateWellnessProgram();
  const updateProgram = useUpdateWellnessProgram();
  const deleteProgram = useDeleteWellnessProgram();

  const reviewClaim = useReviewBenefitClaim();

  // ---------------- Plan modal ----------------
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState<any>(emptyPlanForm);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const openCreatePlan = () => {
    setEditingPlanId(null);
    setPlanForm(emptyPlanForm);
    setPlanModalOpen(true);
  };
  const openEditPlan = (plan: any) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      name: plan.name, type: plan.type, provider: plan.provider || "", planTier: plan.planTier || "",
      description: plan.description || "", employerCost: plan.employerCost || 0, employeeCost: plan.employeeCost || 0,
      coverageLimit: plan.coverageLimit || 0, eligibility: plan.eligibility || "All Employees",
      icon: plan.icon || "Shield", color: plan.color || "indigo", status: plan.status || "active",
    });
    setPlanModalOpen(true);
  };

  const savePlan = async () => {
    if (!planForm.name.trim()) { await alert("Plan name is required.", "Missing Info"); return; }
    try {
      if (editingPlanId) {
        await updatePlan.mutateAsync({ planId: editingPlanId, data: planForm });
      } else {
        await createPlan.mutateAsync(planForm);
      }
      setPlanModalOpen(false);
    } catch (e: any) {
      await alert(e.message || "Something went wrong.", "Error");
    }
  };

  const handleDeletePlan = async (plan: any) => {
    const ok = await confirm(`Delete "${plan.name}"? This cannot be undone.`, "Delete Plan");
    if (!ok) return;
    try {
      await deletePlan.mutateAsync(plan.id);
    } catch (e: any) {
      await alert(e.message || "Failed to delete plan.", "Error");
    }
  };

  // ---------------- Enroll modal ----------------
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ employeeId: "", planId: "", coverageLevel: "Individual" });

  const handleEnroll = async () => {
    if (!enrollForm.employeeId || !enrollForm.planId) { await alert("Select an employee and a plan.", "Missing Info"); return; }
    try {
      await enrollEmployee.mutateAsync(enrollForm);
      setEnrollModalOpen(false);
      setEnrollForm({ employeeId: "", planId: "", coverageLevel: "Individual" });
    } catch (e: any) {
      await alert(e.message || "Failed to enroll employee.", "Error");
    }
  };

  const handleEnrollmentStatus = async (enrollmentId: string, status: "enrolled" | "waived" | "cancelled") => {
    try {
      await updateEnrollmentStatus.mutateAsync({ enrollmentId, status });
    } catch (e: any) {
      await alert(e.message || "Failed to update enrollment.", "Error");
    }
  };

  // ---------------- Wellness program modal ----------------
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [programForm, setProgramForm] = useState<any>(emptyProgramForm);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [viewingParticipantsFor, setViewingParticipantsFor] = useState<string | null>(null);
  const { data: participants = [] } = useWellnessProgramParticipants(viewingParticipantsFor || undefined);

  const openCreateProgram = () => {
    setEditingProgramId(null);
    setProgramForm(emptyProgramForm);
    setProgramModalOpen(true);
  };
  const openEditProgram = (program: any) => {
    setEditingProgramId(program.id);
    setProgramForm({
      title: program.title, description: program.description || "", category: program.category,
      goalLabel: program.goalLabel || "Steps", goalTarget: program.goalTarget || 0,
      startDate: program.startDate || "", endDate: program.endDate || "", status: program.status,
    });
    setProgramModalOpen(true);
  };

  const saveProgram = async () => {
    if (!programForm.title.trim()) { await alert("Program title is required.", "Missing Info"); return; }
    try {
      if (editingProgramId) {
        await updateProgram.mutateAsync({ programId: editingProgramId, data: programForm });
      } else {
        await createProgram.mutateAsync(programForm);
      }
      setProgramModalOpen(false);
    } catch (e: any) {
      await alert(e.message || "Something went wrong.", "Error");
    }
  };

  const handleDeleteProgram = async (program: any) => {
    const ok = await confirm(`Delete "${program.title}"? All participant progress will be lost.`, "Delete Program");
    if (!ok) return;
    try {
      await deleteProgram.mutateAsync(program.id);
    } catch (e: any) {
      await alert(e.message || "Failed to delete program.", "Error");
    }
  };

  // ---------------- Claims ----------------
  const handleReviewClaim = async (claim: any, status: "approved" | "rejected") => {
    const notes = await prompt(
      status === "approved" ? "Add an optional approval note:" : "Reason for rejecting this claim:",
      "",
      status === "approved" ? "Approve Claim" : "Reject Claim"
    );
    if (notes === null) return;
    try {
      await reviewClaim.mutateAsync({ claimId: claim.id, status, notes: notes || undefined });
    } catch (e: any) {
      await alert(e.message || "Failed to review claim.", "Error");
    }
  };

  const stats = [
    { label: "Active Plans", value: overview?.activePlans ?? "—", icon: <Shield className="text-indigo-600" />, bg: "bg-indigo-50" },
    { label: "Enrolled Employees", value: overview?.totalEnrollments ?? "—", icon: <Users className="text-emerald-600" />, bg: "bg-emerald-50" },
    { label: "Pending Claims", value: overview?.pendingClaims ?? "—", icon: <ClipboardList className="text-amber-600" />, bg: "bg-amber-50" },
    { label: "Monthly Employer Spend", value: overview ? formatCurrency(overview.monthlyEmployerSpend) : "—", icon: <Wallet className="text-rose-600" />, bg: "bg-rose-50" },
  ];

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
              <Heart size={20} fill="currentColor" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Benefits & Wellbeing</h1>
          </div>
          <p className="text-slate-500 font-medium italic">Manage HMO/pension plans, enrollments, wellness programs and claims.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div key={i} whileHover={{ y: -5 }} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center mb-4`}>{s.icon}</div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <h4 className="text-2xl font-black text-slate-800 tracking-tighter tabular-nums">{s.value}</h4>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-2 rounded-3xl border border-slate-200 shadow-sm w-max overflow-x-auto scrollbar-hide">
        {[
          { id: "plans", name: "Plan Catalog", icon: <Shield size={18} /> },
          { id: "enrollments", name: "Enrollments", icon: <Users size={18} /> },
          { id: "wellness", name: "Wellness Programs", icon: <Activity size={18} /> },
          { id: "claims", name: "Claims", icon: <ClipboardList size={18} /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as Tab)}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
              tab === t.id ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            }`}
          >
            {t.icon} {t.name}
            {t.id === "claims" && (overview?.pendingClaims ?? 0) > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded-full">{overview?.pendingClaims}</span>
            )}
          </button>
        ))}
      </div>

      {/* ---------------- Plans ---------------- */}
      {tab === "plans" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={openCreatePlan} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all flex items-center gap-2">
              <Plus size={18} /> Add Plan
            </button>
          </div>

          {plansLoading ? (
            <div className="text-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" /></div>
          ) : plans.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-slate-400 font-bold uppercase tracking-widest text-xs">
              No benefit plans yet — add your first HMO, pension, or perk plan.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan: any) => (
                <motion.div key={plan.id} whileHover={{ y: -4 }} className="bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm relative group">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 bg-${plan.color}-50 text-${plan.color}-600 rounded-2xl flex items-center justify-center shadow-inner`}>
                      {PLAN_ICONS[plan.icon] || <Shield size={22} />}
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${plan.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                      {plan.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mb-1">{plan.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">{plan.provider || "In-house"} {plan.planTier ? `• ${plan.planTier}` : ""}</p>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 mb-4">
                    <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold uppercase tracking-wide">Employer Cost</span><span className="font-black text-slate-800">{formatCurrency(plan.employerCost)}/mo</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold uppercase tracking-wide">Employee Cost</span><span className="font-black text-slate-800">{formatCurrency(plan.employeeCost)}/mo</span></div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditPlan(plan)} className="flex-1 py-2.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                      <Pencil size={14} /> Edit
                    </button>
                    <button onClick={() => handleDeletePlan(plan)} className="flex-1 py-2.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------- Enrollments ---------------- */}
      {tab === "enrollments" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => setEnrollModalOpen(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all flex items-center gap-2">
              <UserPlus size={18} /> Enroll Employee
            </button>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5">Employee</th>
                    <th className="px-8 py-5">Plan</th>
                    <th className="px-8 py-5">Coverage</th>
                    <th className="px-8 py-5 text-center">Status</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {enrollmentsLoading ? (
                    <tr><td colSpan={5} className="text-center py-16 text-slate-300 font-black uppercase tracking-widest text-xs">Loading...</td></tr>
                  ) : enrollments.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-16 text-slate-300 font-black uppercase tracking-widest text-xs">No enrollments yet</td></tr>
                  ) : (
                    enrollments.map((e: any) => (
                      <tr key={e.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            {e.employeeAvatar ? <img src={e.employeeAvatar} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-black">{(e.employeeName || "?").charAt(0)}</div>}
                            <div>
                              <p className="text-xs font-black text-slate-800">{e.employeeName}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{e.employeeDepartment || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5"><span className="text-xs font-bold text-slate-700">{e.plan?.name || "—"}</span></td>
                        <td className="px-8 py-5"><span className="text-xs font-bold text-slate-500">{e.coverageLevel}</span></td>
                        <td className="px-8 py-5 text-center">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                            e.status === "enrolled" ? "bg-emerald-50 text-emerald-600" : e.status === "waived" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-400"
                          }`}>{e.status}</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {e.status !== "enrolled" ? (
                            <button onClick={() => handleEnrollmentStatus(e.id, "enrolled")} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">Reactivate</button>
                          ) : (
                            <button onClick={() => handleEnrollmentStatus(e.id, "waived")} className="px-4 py-2 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all">Waive</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Wellness Programs ---------------- */}
      {tab === "wellness" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={openCreateProgram} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all flex items-center gap-2">
              <Sparkles size={18} /> Add Program
            </button>
          </div>

          {programsLoading ? (
            <div className="text-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" /></div>
          ) : programs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-slate-400 font-bold uppercase tracking-widest text-xs">
              No wellness programs yet — launch a step challenge or fitness program.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((p: any) => (
                <motion.div key={p.id} whileHover={{ y: -4 }} className="bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner"><Activity size={22} /></div>
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${p.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>{p.status}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mb-1">{p.title}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">{p.category} • Goal: {p.goalTarget} {p.goalLabel}</p>
                  <button onClick={() => setViewingParticipantsFor(p.id)} className="w-full py-2.5 bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all mb-3">
                    {p.participantCount} Participant{p.participantCount === 1 ? "" : "s"}
                  </button>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditProgram(p)} className="flex-1 py-2.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                      <Pencil size={14} /> Edit
                    </button>
                    <button onClick={() => handleDeleteProgram(p)} className="flex-1 py-2.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------- Claims ---------------- */}
      {tab === "claims" && (
        <div className="space-y-6">
          <div className="flex gap-2">
            {["pending", "approved", "rejected", ""].map((s) => (
              <button
                key={s || "all"}
                onClick={() => setClaimStatusFilter(s)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  claimStatusFilter === s ? "bg-slate-800 text-white shadow-lg" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {s || "All"}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5">Employee</th>
                    <th className="px-8 py-5">Kind</th>
                    <th className="px-8 py-5">Category</th>
                    <th className="px-8 py-5 text-right">Amount</th>
                    <th className="px-8 py-5 text-center">Status</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {claimsLoading ? (
                    <tr><td colSpan={6} className="text-center py-16 text-slate-300 font-black uppercase tracking-widest text-xs">Loading...</td></tr>
                  ) : claims.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-16 text-slate-300 font-black uppercase tracking-widest text-xs">No claims here</td></tr>
                  ) : (
                    claims.map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-8 py-5">
                          <p className="text-xs font-black text-slate-800">{c.employeeName}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{c.employeeDepartment || "—"}</p>
                        </td>
                        <td className="px-8 py-5"><span className="text-xs font-bold text-slate-500 capitalize">{c.kind}</span></td>
                        <td className="px-8 py-5"><span className="text-xs font-bold text-slate-700">{c.category}</span></td>
                        <td className="px-8 py-5 text-right font-mono text-sm font-black text-slate-800">{formatCurrency(c.amount)}</td>
                        <td className="px-8 py-5 text-center">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                            c.status === "approved" ? "bg-emerald-50 text-emerald-600" : c.status === "rejected" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                          }`}>{c.status}</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {c.status === "pending" ? (
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => handleReviewClaim(c, "approved")} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all"><CheckCircle2 size={16} /></button>
                              <button onClick={() => handleReviewClaim(c, "rejected")} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all"><XCircle size={16} /></button>
                            </div>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{c.reviewedByName ? `by ${c.reviewedByName}` : "—"}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= Modals ================= */}

      {/* Plan modal */}
      <AnimatePresence>
        {planModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{editingPlanId ? "Edit Plan" : "New Benefit Plan"}</h3>
                <button onClick={() => setPlanModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Plan Name</label>
                  <input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="e.g. Premium Health Cover" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Type</label>
                  <select value={planForm.type} onChange={(e) => setPlanForm({ ...planForm, type: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all capitalize">
                    {PLAN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Provider</label>
                  <input value={planForm.provider} onChange={(e) => setPlanForm({ ...planForm, provider: e.target.value })} placeholder="e.g. AXA Mansard" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Plan Tier</label>
                  <input value={planForm.planTier} onChange={(e) => setPlanForm({ ...planForm, planTier: e.target.value })} placeholder="e.g. Gold PPO" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Eligibility</label>
                  <input value={planForm.eligibility} onChange={(e) => setPlanForm({ ...planForm, eligibility: e.target.value })} placeholder="e.g. All Employees" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Employer Cost (₦/mo)</label>
                  <input type="number" value={planForm.employerCost} onChange={(e) => setPlanForm({ ...planForm, employerCost: Number(e.target.value) })} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Employee Cost (₦/mo)</label>
                  <input type="number" value={planForm.employeeCost} onChange={(e) => setPlanForm({ ...planForm, employeeCost: Number(e.target.value) })} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Coverage Limit (₦)</label>
                  <input type="number" value={planForm.coverageLimit} onChange={(e) => setPlanForm({ ...planForm, coverageLimit: Number(e.target.value) })} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Status</label>
                  <select value={planForm.status} onChange={(e) => setPlanForm({ ...planForm, status: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Icon</label>
                  <select value={planForm.icon} onChange={(e) => setPlanForm({ ...planForm, icon: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all">
                    {Object.keys(PLAN_ICONS).map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Color</label>
                  <select value={planForm.color} onChange={(e) => setPlanForm({ ...planForm, color: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all capitalize">
                    {PLAN_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
                  <textarea value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} rows={3} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setPlanModalOpen(false)} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                <button onClick={savePlan} disabled={createPlan.isPending || updatePlan.isPending} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50">
                  {createPlan.isPending || updatePlan.isPending ? "Saving..." : editingPlanId ? "Save Changes" : "Create Plan"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enroll modal */}
      <AnimatePresence>
        {enrollModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Enroll Employee</h3>
                <button onClick={() => setEnrollModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Employee</label>
                  <select value={enrollForm.employeeId} onChange={(e) => setEnrollForm({ ...enrollForm, employeeId: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all">
                    <option value="">Select employee...</option>
                    {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.name} {emp.lastName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Plan</label>
                  <select value={enrollForm.planId} onChange={(e) => setEnrollForm({ ...enrollForm, planId: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all">
                    <option value="">Select plan...</option>
                    {plans.filter((p: any) => p.status === "active").map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Coverage Level</label>
                  <select value={enrollForm.coverageLevel} onChange={(e) => setEnrollForm({ ...enrollForm, coverageLevel: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all">
                    <option value="Individual">Individual</option>
                    <option value="Family">Family</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setEnrollModalOpen(false)} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                <button onClick={handleEnroll} disabled={enrollEmployee.isPending} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50">
                  {enrollEmployee.isPending ? "Enrolling..." : "Enroll"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Program modal */}
      <AnimatePresence>
        {programModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{editingProgramId ? "Edit Program" : "New Wellness Program"}</h3>
                <button onClick={() => setProgramModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Title</label>
                  <input value={programForm.title} onChange={(e) => setProgramForm({ ...programForm, title: e.target.value })} placeholder="e.g. 10k Steps Daily" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Category</label>
                  <select value={programForm.category} onChange={(e) => setProgramForm({ ...programForm, category: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all capitalize">
                    {["fitness", "mental-health", "financial", "nutrition", "other"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Status</label>
                  <select value={programForm.status} onChange={(e) => setProgramForm({ ...programForm, status: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all">
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Goal Label</label>
                  <input value={programForm.goalLabel} onChange={(e) => setProgramForm({ ...programForm, goalLabel: e.target.value })} placeholder="e.g. Steps" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Goal Target</label>
                  <input type="number" value={programForm.goalTarget} onChange={(e) => setProgramForm({ ...programForm, goalTarget: Number(e.target.value) })} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Start Date</label>
                  <input type="date" value={programForm.startDate} onChange={(e) => setProgramForm({ ...programForm, startDate: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">End Date</label>
                  <input type="date" value={programForm.endDate} onChange={(e) => setProgramForm({ ...programForm, endDate: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
                  <textarea value={programForm.description} onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })} rows={3} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setProgramModalOpen(false)} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                <button onClick={saveProgram} disabled={createProgram.isPending || updateProgram.isPending} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50">
                  {createProgram.isPending || updateProgram.isPending ? "Saving..." : editingProgramId ? "Save Changes" : "Create Program"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Participants modal */}
      <AnimatePresence>
        {viewingParticipantsFor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Participants</h3>
                <button onClick={() => setViewingParticipantsFor(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              {participants.length === 0 ? (
                <p className="text-center py-10 text-slate-300 font-black uppercase tracking-widest text-xs">No participants yet</p>
              ) : (
                <div className="space-y-3">
                  {participants.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {p.employeeAvatar ? <img src={p.employeeAvatar} className="w-9 h-9 rounded-full" /> : <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-slate-400 text-[10px] font-black">{(p.employeeName || "?").charAt(0)}</div>}
                      <div className="flex-1">
                        <p className="text-xs font-black text-slate-800">{p.employeeName}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{p.progress} progress • {p.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BenefitsAdmin;
