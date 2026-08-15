import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Shield,
  PieChart as PieChartIcon,
  TrendingUp,
  Activity,
  Coffee,
  ChevronRight,
  CheckCircle2,
  Zap,
  Calendar,
  User,
  X,
  LayoutGrid,
  Rocket,
  Wallet,
  Plus,
  Trash2,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { usePopup } from "../../components/PopupProvider";
import {
  useMyBenefitsSummary,
  useAvailableBenefitPlans,
  useEnrollInPlan,
  useCancelMyEnrollment,
  useAddDependent,
  useDeleteDependent,
  useWellnessPrograms,
  useJoinWellnessProgram,
  useUpdateMyProgramProgress,
  useLeaveWellnessProgram,
  useSubmitBenefitClaim,
} from "../../api/client";

const PLAN_ICONS: Record<string, React.ReactNode> = {
  Shield: <Shield size={28} />,
  Heart: <Heart size={28} />,
  PieChart: <PieChartIcon size={28} />,
  TrendingUp: <TrendingUp size={28} />,
  Activity: <Activity size={28} />,
  Coffee: <Coffee size={28} />,
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(val || 0);

const parseHighlights = (raw: any): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

type Tab = "summary" | "health" | "retirement" | "wellness" | "enrollment";

const Benefits: React.FC = () => {
  const { alert, prompt } = usePopup();
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  const { data: summary, isLoading } = useMyBenefitsSummary();
  const { data: availablePlans = [] } = useAvailableBenefitPlans();
  const { data: wellnessPrograms = [] } = useWellnessPrograms();

  const enrollInPlan = useEnrollInPlan();
  const cancelEnrollment = useCancelMyEnrollment();
  const addDependent = useAddDependent();
  const deleteDependent = useDeleteDependent();
  const joinProgram = useJoinWellnessProgram();
  const updateProgress = useUpdateMyProgramProgress();
  const leaveProgram = useLeaveWellnessProgram();
  const submitClaim = useSubmitBenefitClaim();

  const [claimModal, setClaimModal] = useState<{ kind: "health" | "wellness" } | null>(null);
  const [claimForm, setClaimForm] = useState({ category: "", provider: "", amount: "", description: "" });

  const benefits = summary?.benefits;
  const enrollments = summary?.enrollments || [];
  const dependents = summary?.dependents || [];
  const claims = summary?.claims || [];
  const baseSalary = summary?.baseSalary || 0;

  const activeEnrollments = enrollments.filter((e: any) => e.status === "enrolled");
  const enrolledPlanIds = new Set(activeEnrollments.map((e: any) => e.planId));

  const annualEmployerBenefitValue = activeEnrollments.reduce((sum: number, e: any) => sum + (e.plan?.employerCost || 0) * 12, 0);
  const annualRetirementContribution = ((benefits?.retirementContributionRate || 0) / 100) * baseSalary;
  const totalRewardsValue = baseSalary + annualEmployerBenefitValue + annualRetirementContribution;

  const compensationData = [
    { name: "Base Salary", value: baseSalary || 1, fill: "#4f46e5" },
    { name: "Benefits (Employer Paid)", value: annualEmployerBenefitValue, fill: "#10b981" },
    { name: "Retirement Contribution", value: annualRetirementContribution, fill: "#6366f1" },
  ].filter((d) => d.value > 0);

  const wellnessRemaining = (benefits?.wellnessBudget || 0) - (benefits?.wellnessUsed || 0);

  const handleEnroll = async (planId: string) => {
    try {
      await enrollInPlan.mutateAsync({ planId, coverageLevel: "Individual" });
    } catch (e: any) {
      await alert(e.message || "Failed to enroll.", "Error");
    }
  };

  const handleCancel = async (enrollmentId: string) => {
    try {
      await cancelEnrollment.mutateAsync(enrollmentId);
    } catch (e: any) {
      await alert(e.message || "Failed to cancel enrollment.", "Error");
    }
  };

  const handleAddDependent = async () => {
    const name = await prompt("Dependent's full name:", "", "Add Dependent");
    if (!name) return;
    const relationship = await prompt("Relationship (Spouse, Child, Parent, Other):", "Spouse", "Add Dependent");
    if (!relationship) return;
    const dateOfBirth = await prompt("Date of birth (YYYY-MM-DD, optional):", "", "Add Dependent");
    try {
      await addDependent.mutateAsync({ name, relationship, dateOfBirth: dateOfBirth || undefined });
    } catch (e: any) {
      await alert(e.message || "Failed to add dependent.", "Error");
    }
  };

  const handleJoinToggle = async (program: any) => {
    try {
      if (program.myParticipation && program.myParticipation.status !== "dropped") {
        await leaveProgram.mutateAsync(program.id);
      } else {
        await joinProgram.mutateAsync(program.id);
      }
    } catch (e: any) {
      await alert(e.message || "Something went wrong.", "Error");
    }
  };

  const handleBumpProgress = async (program: any) => {
    const current = program.myParticipation?.progress || 0;
    const step = Math.max(1, Math.round((program.goalTarget || 10) * 0.1));
    try {
      await updateProgress.mutateAsync({ programId: program.id, progress: current + step });
    } catch (e: any) {
      await alert(e.message || "Failed to update progress.", "Error");
    }
  };

  const openClaimModal = (kind: "health" | "wellness") => {
    setClaimForm({ category: "", provider: "", amount: "", description: "" });
    setClaimModal({ kind });
  };

  const handleSubmitClaim = async () => {
    if (!claimModal) return;
    const amount = Number(claimForm.amount);
    if (!claimForm.category || !amount || amount <= 0) {
      await alert("Category and a valid amount are required.", "Missing Info");
      return;
    }
    try {
      await submitClaim.mutateAsync({
        kind: claimModal.kind,
        category: claimForm.category,
        amount,
        provider: claimForm.provider || undefined,
        description: claimForm.description || undefined,
      });
      setClaimModal(null);
    } catch (e: any) {
      await alert(e.message || "Failed to submit claim.", "Error");
    }
  };

  const renderSummary = () => (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
          <div className="flex-1 space-y-6 relative z-10">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Rewards Value (Annual)</p>
              <h2 className="text-4xl font-black text-slate-800 tracking-tighter">{formatCurrency(totalRewardsValue)}</h2>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Shield size={14} /> {activeEnrollments.length} Active Plan{activeEnrollments.length === 1 ? "" : "s"}
              </div>
              <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Wallet size={14} /> {formatCurrency(wellnessRemaining)} Wellness Left
              </div>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-md">
              Your total compensation includes your base salary plus the employer-paid cost of your enrolled benefits and retirement contributions.
            </p>
          </div>
          <div className="w-full md:w-64 h-64 shrink-0">
            {compensationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={compensationData} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                    {compensationData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 text-xs font-black uppercase tracking-widest text-center">No compensation data yet</div>
            )}
          </div>
        </motion.div>

        <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
          <Zap className="absolute -bottom-8 -right-8 w-48 h-48 text-indigo-500/10 rotate-12" />
          <h3 className="text-xl font-black mb-8 flex items-center gap-3"><Calendar className="text-indigo-400" /> Open Enrollment</h3>
          <div className="space-y-6 mb-10">
            <div>
              <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Available Plans</p>
              <p className="text-3xl font-black">{availablePlans.filter((p: any) => !enrolledPlanIds.has(p.id)).length} to review</p>
            </div>
            <p className="text-xs text-indigo-100 font-medium leading-relaxed">
              Browse the plan catalog and enroll in health, retirement, and wellness benefits offered by your company.
            </p>
          </div>
          <button onClick={() => setActiveTab("enrollment")} className="w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-sm uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">
            View Enrollment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activeEnrollments.length === 0 ? (
          <div className="lg:col-span-3 text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-slate-400 font-bold uppercase tracking-widest text-xs">
            You're not enrolled in any benefits yet — visit the Enrollment tab to get started.
          </div>
        ) : (
          activeEnrollments.map((e: any) => (
            <motion.div key={e.id} whileHover={{ y: -5 }} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all relative group">
              <div className={`w-14 h-14 bg-${e.plan?.color || "indigo"}-50 text-${e.plan?.color || "indigo"}-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform`}>
                {PLAN_ICONS[e.plan?.icon] || <Shield size={28} />}
              </div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-black text-slate-800">{e.plan?.name || "Plan"}</h3>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{e.status}</span>
              </div>
              <p className="text-sm font-bold text-slate-400 mb-6">{e.plan?.provider || "ZenHR Perk"}</p>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Monthly Cost</p>
                  <p className="text-sm font-black text-slate-800">{formatCurrency(e.plan?.employeeCost || 0)}</p>
                </div>
                <ChevronRight size={20} className="text-slate-300" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );

  const healthPlan = activeEnrollments.find((e: any) => e.plan?.type === "health");
  const healthClaims = claims.filter((c: any) => c.kind === "health");

  const renderHealth = () => (
    <div className="space-y-10 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10"><Shield size={120} /></div>
            <div className="flex items-center gap-4 mb-10">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center shadow-inner"><Shield size={32} /></div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">Health Insurance</h2>
                <p className="text-sm text-slate-500 font-medium italic">
                  {healthPlan ? `${healthPlan.plan?.provider} • ${healthPlan.plan?.planTier || healthPlan.plan?.name}` : (benefits?.healthProvider ? `${benefits.healthProvider} • ${benefits.healthPlan}` : "No health plan on file")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Coverage Level</p>
                <p className="text-lg font-black text-slate-800">{healthPlan?.coverageLevel || benefits?.healthCoverage || "N/A"}</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Annual Limit</p>
                <p className="text-lg font-black text-slate-800">{formatCurrency(healthPlan?.plan?.coverageLimit || 0)}</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Monthly Premium</p>
                <p className="text-lg font-black text-slate-800">{formatCurrency(healthPlan?.plan?.employeeCost || benefits?.healthPremium || 0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">Recent Claims</h3>
              <button onClick={() => openClaimModal("health")} className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all">
                New Claim Request
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-10 py-5">Date</th>
                    <th className="px-8 py-5">Category</th>
                    <th className="px-8 py-5">Provider</th>
                    <th className="px-8 py-5 text-right">Amount</th>
                    <th className="px-8 py-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {healthClaims.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12 text-slate-300 font-black uppercase tracking-widest text-xs">No claims submitted yet</td></tr>
                  ) : healthClaims.map((claim: any) => (
                    <tr key={claim.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-10 py-5"><span className="text-xs font-bold text-slate-800">{new Date(claim.submittedAt).toLocaleDateString()}</span></td>
                      <td className="px-8 py-5"><span className="text-xs font-bold text-slate-500 uppercase">{claim.category}</span></td>
                      <td className="px-8 py-5"><span className="text-xs font-bold text-slate-800">{claim.provider || "—"}</span></td>
                      <td className="px-8 py-5 text-right font-mono text-sm font-black text-slate-800">{formatCurrency(claim.amount)}</td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                            claim.status === "approved" ? "bg-emerald-50 text-emerald-600" : claim.status === "rejected" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                          }`}>{claim.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Dependents</h3>
              <button onClick={handleAddDependent} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">+ Add</button>
            </div>
            <div className="space-y-4">
              {dependents.length === 0 ? (
                <p className="text-xs text-slate-300 font-bold uppercase tracking-widest text-center py-6">No dependents added</p>
              ) : dependents.map((dep: any) => (
                <div key={dep.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm"><User size={20} /></div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-800">{dep.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{dep.relationship}{dep.dateOfBirth ? ` • ${dep.dateOfBirth}` : ""}</p>
                  </div>
                  <button onClick={() => deleteDependent.mutate(dep.id)} className="w-8 h-8 bg-white text-slate-300 hover:text-rose-500 rounded-lg flex items-center justify-center transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {healthPlan?.plan && parseHighlights(healthPlan.plan.highlights).length > 0 && (
            <div className="bg-indigo-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
              <Shield className="absolute -bottom-8 -right-8 w-48 h-48 text-white/10 rotate-12" />
              <h4 className="text-xl font-black mb-8 flex items-center gap-3"><CheckCircle2 size={24} /> Plan Highlights</h4>
              <div className="space-y-6">
                {parseHighlights(healthPlan.plan.highlights).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs font-bold text-indigo-100">
                    <CheckCircle2 size={16} className="text-emerald-400" /> {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderRetirement = () => (
    <div className="space-y-10 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 text-indigo-100/50"><PieChartIcon size={100} /></div>
            <h3 className="text-2xl font-black text-slate-800 mb-10 flex items-center gap-4">
              <PieChartIcon className="text-indigo-600" /> {benefits?.retirementPlan || "Pension Plan"}
            </h3>
            <div className="grid grid-cols-2 gap-6 mb-10">
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Current Balance</div>
                <div className="text-3xl font-black text-slate-800">{formatCurrency(benefits?.retirementBalance || 0)}</div>
              </div>
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Your Contribution</div>
                <div className="text-3xl font-black text-emerald-500">{benefits?.retirementContributionRate || 0}% <span className="text-base text-slate-400">/ paycheck</span></div>
              </div>
            </div>
            <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2.5rem]">
              <h4 className="text-lg font-black text-slate-800 mb-2">Employer Match</h4>
              <p className="text-sm text-slate-600 font-medium">
                ZenHR matches your contributions up to {benefits?.employerMatchRate || 0}% of your salary — worth an estimated {formatCurrency(annualRetirementContribution)} this year.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <TrendingUp className="absolute -bottom-8 -right-8 w-40 h-40 text-indigo-500/10 rotate-12" />
            <h4 className="text-xl font-black mb-6">Equity</h4>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-bold text-indigo-100"><span>Granted</span><span>{(benefits?.equityGranted || 0).toLocaleString()} units</span></div>
              <div className="flex justify-between text-xs font-bold text-indigo-100"><span>Vested</span><span>{(benefits?.equityVested || 0).toLocaleString()} units</span></div>
              <div className="flex justify-between text-xs font-bold text-emerald-400"><span>Est. Value</span><span>{formatCurrency(benefits?.equityValue || 0)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWellness = () => (
    <div className="space-y-10 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 text-indigo-100/50"><Activity size={100} /></div>
            <h3 className="text-2xl font-black text-slate-800 mb-10 flex items-center gap-4"><Activity className="text-amber-500" /> Wellness Programs</h3>
            <div className="space-y-8">
              {wellnessPrograms.length === 0 ? (
                <p className="text-center py-10 text-slate-300 font-black uppercase tracking-widest text-xs">No active wellness programs right now</p>
              ) : wellnessPrograms.map((program: any) => {
                const joined = program.myParticipation && program.myParticipation.status !== "dropped";
                const progress = program.myParticipation?.progress || 0;
                return (
                  <div key={program.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative group">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-lg font-black text-slate-800 mb-1">{program.title}</h4>
                        <p className="text-xs text-slate-500 font-medium">{program.participantCount} member{program.participantCount === 1 ? "" : "s"} • {program.category}</p>
                      </div>
                      <button onClick={() => handleJoinToggle(program)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${joined ? "bg-emerald-50 text-emerald-600" : "bg-indigo-600 text-white shadow-lg"}`}>
                        {joined ? "Leave" : "Join Challenge"}
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Progress</span>
                        <span>{progress} / {program.goalTarget} {program.goalLabel}</span>
                      </div>
                      <div className="w-full h-3 bg-white rounded-full overflow-hidden p-0.5">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${program.goalTarget ? Math.min(100, (progress / program.goalTarget) * 100) : 0}%` }} className="h-full bg-amber-500 rounded-full" />
                      </div>
                      {joined && (
                        <button onClick={() => handleBumpProgress(program)} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                          + Log Progress
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <Rocket className="absolute -bottom-8 -right-8 w-40 h-40 text-indigo-500/10 rotate-12" />
            <h4 className="text-xl font-black mb-8">Wellness Budget</h4>
            <div className="bg-white p-6 rounded-[2rem] flex flex-col items-center justify-center mb-8">
              <div className="text-xs text-slate-400 font-black uppercase tracking-widest mb-2">Available Balance</div>
              <div className="text-4xl font-black text-slate-800 mb-4">{formatCurrency(wellnessRemaining)}</div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 mb-2">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${benefits?.wellnessBudget ? Math.min(100, ((benefits.wellnessUsed || 0) / benefits.wellnessBudget) * 100) : 0}%` }}></div>
              </div>
              <div className="text-xs font-bold text-slate-500 flex justify-between w-full">
                <span>Used: {formatCurrency(benefits?.wellnessUsed || 0)}</span>
                <span>Total: {formatCurrency(benefits?.wellnessBudget || 0)}</span>
              </div>
            </div>
            <button onClick={() => openClaimModal("wellness")} className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all">
              Submit Wellness Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEnrollment = () => (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 p-12 text-white">
          <h2 className="text-3xl font-black mb-2 tracking-tighter">Benefits Enrollment</h2>
          <p className="text-indigo-100 font-medium">Browse and enroll in the benefit plans your company offers.</p>
        </div>

        <div className="p-12">
          {availablePlans.length === 0 ? (
            <p className="text-center py-16 text-slate-300 font-black uppercase tracking-widest text-xs">No plans are open for enrollment right now</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {availablePlans.map((plan: any) => {
                const enrolled = enrolledPlanIds.has(plan.id);
                const myEnrollment = activeEnrollments.find((e: any) => e.planId === plan.id);
                return (
                  <div key={plan.id} className={`p-8 rounded-[2.5rem] border-4 transition-all ${enrolled ? "border-indigo-600 bg-indigo-50/20 shadow-xl shadow-indigo-100" : "border-slate-100 bg-slate-50"}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 bg-${plan.color}-100 text-${plan.color}-600 rounded-xl flex items-center justify-center`}>
                        {PLAN_ICONS[plan.icon] || <Shield size={20} />}
                      </div>
                      <h4 className="text-lg font-black text-slate-800">{plan.name}</h4>
                    </div>
                    <p className="text-indigo-600 font-black mb-2 uppercase text-xs tracking-widest">{formatCurrency(plan.employeeCost)}/mo Cost</p>
                    <p className="text-xs text-slate-500 font-medium mb-6">{plan.description || `${plan.provider || "In-house"} ${plan.planTier ? `• ${plan.planTier}` : ""}`}</p>
                    {parseHighlights(plan.highlights).length > 0 && (
                      <ul className="space-y-3 mb-8">
                        {parseHighlights(plan.highlights).map((f: string, j: number) => (
                          <li key={j} className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <CheckCircle2 size={16} className="text-emerald-500" /> {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      onClick={() => enrolled ? handleCancel(myEnrollment.id) : handleEnroll(plan.id)}
                      disabled={enrollInPlan.isPending || cancelEnrollment.isPending}
                      className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 ${enrolled ? "bg-white text-rose-500 border-2 border-rose-100 hover:bg-rose-50" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                    >
                      {enrolled ? "Waive This Plan" : "Enroll in This Plan"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-4 mb-1">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <Heart size={24} fill="currentColor" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Benefits & Wellbeing</h1>
          </div>
          <p className="text-slate-500 font-medium">Empowering your life beyond the workplace.</p>
        </div>

        <div className="flex bg-white p-2 rounded-3xl border border-slate-200 shadow-sm w-max overflow-x-auto scrollbar-hide">
          {[
            { id: "summary", name: "Overview", icon: <LayoutGrid size={18} /> },
            { id: "health", name: "Health & Life", icon: <Shield size={18} /> },
            { id: "retirement", name: "Retirement", icon: <PieChartIcon size={18} /> },
            { id: "wellness", name: "Wellness", icon: <Activity size={18} /> },
            { id: "enrollment", name: "Enrollment", icon: <Zap size={18} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
                activeTab === tab.id ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.4, ease: "easeOut" }}>
          {isLoading ? (
            <div className="text-center py-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
          ) : (
            <>
              {activeTab === "summary" && renderSummary()}
              {activeTab === "health" && renderHealth()}
              {activeTab === "retirement" && renderRetirement()}
              {activeTab === "wellness" && renderWellness()}
              {activeTab === "enrollment" && renderEnrollment()}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Claim modal (health or wellness) */}
      <AnimatePresence>
        {claimModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{claimModal.kind === "health" ? "New Health Claim" : "Submit Wellness Claim"}</h3>
                <button onClick={() => setClaimModal(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              {claimModal.kind === "wellness" && (
                <p className="text-xs font-bold text-slate-400 mb-6">Remaining budget: {formatCurrency(wellnessRemaining)}</p>
              )}
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Category</label>
                  <input value={claimForm.category} onChange={(e) => setClaimForm({ ...claimForm, category: e.target.value })} placeholder={claimModal.kind === "health" ? "e.g. Consultation, Pharmacy" : "e.g. Gym Membership, Mental Health"} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{claimModal.kind === "health" ? "Hospital / Provider" : "Vendor (optional)"}</label>
                  <input value={claimForm.provider} onChange={(e) => setClaimForm({ ...claimForm, provider: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Amount (₦)</label>
                  <input type="number" value={claimForm.amount} onChange={(e) => setClaimForm({ ...claimForm, amount: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Notes (optional)</label>
                  <textarea value={claimForm.description} onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })} rows={3} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setClaimModal(null)} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                <button onClick={handleSubmitClaim} disabled={submitClaim.isPending} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2">
                  <Plus size={16} /> {submitClaim.isPending ? "Submitting..." : "Submit Claim"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Benefits;
