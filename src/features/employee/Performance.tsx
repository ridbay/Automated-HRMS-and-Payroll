import React, { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import {
  useShoutouts,
  useSendShoutout,
  useActiveCycleAssessment,
  createAssessment,
  updateAssessment,
  submitAssessment,
  useMyGoals,
  useCreateGoal,
  useUpdateGoal,
  useMyPerformanceSummary,
  useMyObjectives,
  useDirectory,
  useMyProfile,
  useMyAssessments,
  useMyNominations,
  useNominatePeers,
  useReviewsAssignedToMe,
  useSubmitPeerReview,
  useSubmitUpwardReview,
  useMyReceivedReviews,
  useAssessmentEvidence,
  useUploadEvidence,
} from "../../api/client";
import { motion, AnimatePresence } from "framer-motion";
import AssessmentWizard from "./AssessmentWizard";
import { StageTimeline, DeadlineBanner } from "../../components/StageTimeline";
import {
  Trophy,
  Target,
  TrendingUp,
  Users,
  Award,
  Calendar,
  Star,
  MessageSquare,
  Plus,
  CheckCircle2,
  Zap,
  Heart,
  Map as MapIcon,
  ArrowRight,
  User,
  Flame,
  Sparkles,
  X,
  Send,
  Rocket,
  Ghost,
} from "lucide-react";
import {
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import Celebration from "../../components/Celebration";

const Performance: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: shoutouts = [] } = useShoutouts();
  const sendShoutout = useSendShoutout();
  const { data: cycleData } = useActiveCycleAssessment();
  const activeAssessment = cycleData?.assessment;
  const activeCycle = cycleData?.activeCycle;
  const { data: summary } = useMyPerformanceSummary();
  const { data: myGoals = [] } = useMyGoals();
  const { data: myObjectives = [] } = useMyObjectives();
  const { data: profile } = useMyProfile();
  const { data: myAssessments = [] } = useMyAssessments();
  const { data: directory = [] } = useDirectory();

  // Growth tab data: most recent assessment that actually has skill ratings
  // on it (falls back to the active cycle's in-progress one), and the
  // matching directory record for the employee's manager.
  const latestAssessmentWithRatings = myAssessments.find((a: any) => (a.skillRatings || []).length > 0) || activeAssessment;
  const skillRadarData = (latestAssessmentWithRatings?.skillRatings || []).map((s: any) => ({
    subject: s.skill,
    current: s.rating,
    target: Math.min(s.rating + 1, 5),
  }));
  const latestDevelopmentGoals = (myAssessments.find((a: any) => (a.developmentGoals || []).length > 0) || activeAssessment)?.developmentGoals || [];
  const managerRecord = directory.find((e: any) => e.id === profile?.managerId);
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();

  // 360 (peer + upward) reviews
  const { data: myNominations = [] } = useMyNominations();
  const nominatePeers = useNominatePeers();
  const { data: reviewsAssignedToMe = [] } = useReviewsAssignedToMe();
  const submitPeerReview = useSubmitPeerReview();
  const submitUpwardReview = useSubmitUpwardReview();
  const { data: receivedReviewsData } = useMyReceivedReviews();
  const receivedReviews = receivedReviewsData?.reviews || [];

  const [nominateQuery, setNominateQuery] = useState("");
  const [selectedPeers, setSelectedPeers] = useState<{ id: string; name: string; lastName: string }[]>([]);
  const nominatedIds = new Set(myNominations.map((n: any) => n.reviewerId));
  const nominateResults = nominateQuery.trim()
    ? directory.filter((e: any) =>
      e.id !== user?.id &&
      !nominatedIds.has(e.id) &&
      !selectedPeers.some((p) => p.id === e.id) &&
      `${e.name || ""} ${e.lastName || ""}`.toLowerCase().includes(nominateQuery.trim().toLowerCase())
    ).slice(0, 6)
    : [];

  const handleSubmitNominations = () => {
    if (selectedPeers.length === 0) return;
    nominatePeers.mutate(selectedPeers.map((p) => p.id), {
      onSuccess: () => setSelectedPeers([]),
    });
  };

  const [writingReview, setWritingReview] = useState<any>(null);
  const emptyReviewForm = { rating: "", strengths: "", improvements: "", comment: "" };
  const [reviewWriteForm, setReviewWriteForm] = useState(emptyReviewForm);

  const handleSubmitWrittenReview = () => {
    if (!writingReview || !reviewWriteForm.rating) return;
    if (writingReview.direction === "upward") {
      submitUpwardReview.mutate(reviewWriteForm, { onSuccess: () => setWritingReview(null) });
    } else {
      submitPeerReview.mutate({ id: writingReview.id, ...reviewWriteForm }, { onSuccess: () => setWritingReview(null) });
    }
  };

  // Evidence attached to the active self-assessment.
  const { data: myEvidence = [] } = useAssessmentEvidence(activeAssessment?.id);
  const uploadEvidence = useUploadEvidence();
  const handleUploadEvidence = (file: File, name: string, type: string) => {
    if (!activeAssessment?.id) return;
    uploadEvidence.mutate({ assessmentId: activeAssessment.id, file, name, type });
  };
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "goals" | "reviews" | "feedback" | "growth"
  >("dashboard");
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showAssessmentWizard, setShowAssessmentWizard] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  // New objective form state
  const emptyGoalForm = { title: "", description: "", category: "individual", dueDate: "" };
  const [goalForm, setGoalForm] = useState(emptyGoalForm);

  const handleCreateGoal = () => {
    if (!goalForm.title.trim()) return;
    createGoalMutation.mutate(
      { title: goalForm.title.trim(), description: goalForm.description.trim() || undefined, scope: goalForm.category, dueDate: goalForm.dueDate || undefined },
      {
        onSuccess: () => {
          setShowGoalModal(false);
          setGoalForm(emptyGoalForm);
          triggerCelebration();
        },
      }
    );
  };

  const handleMarkGoalComplete = (goal: any) => {
    updateGoalMutation.mutate(
      { id: goal.id, data: { progress: 100, status: "completed" } },
      { onSuccess: () => triggerCelebration() }
    );
  };

  const handleToggleKeyResult = (goal: any, index: number) => {
    const updated = (goal.keyResults || []).map((kr: any, i: number) =>
      i === index ? { ...kr, completed: !kr.completed } : kr
    );
    updateGoalMutation.mutate({ id: goal.id, data: { keyResults: updated } });
  };

  // Recipient search state
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [recipientResults, setRecipientResults] = useState<
    { id: string; name: string; lastName: string }[]
  >([]);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const recipientRef = useRef<HTMLDivElement>(null);

  // Shoutout form state
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [shoutoutMessage, setShoutoutMessage] = useState("");

  const handleSendShoutout = () => {
    if (!recipientQuery.trim() || !selectedType || !shoutoutMessage.trim()) return;
    sendShoutout.mutate(
      {
        toEmployeeName: recipientQuery.trim(),
        toEmployeeId: recipientId || undefined,
        type: selectedType,
        message: shoutoutMessage.trim(),
      },
      {
        onSuccess: () => {
          setShowFeedbackModal(false);
          setRecipientQuery("");
          setRecipientId(null);
          setSelectedType(null);
          setShoutoutMessage("");
          triggerCelebration();
        },
      }
    );
  };

  // NOTE: this used to hit `/admin/employees?search=`, which is gated to
  // SUPER_ADMIN/HR_ADMIN — any regular employee or manager searching for a
  // shoutout recipient got a silent 403. The directory endpoint is open to
  // every authenticated employee, so filter that client-side instead.
  useEffect(() => {
    const q = recipientQuery.trim().toLowerCase();
    if (!q) {
      setRecipientResults([]);
      setShowRecipientDropdown(false);
      return;
    }
    const matches = directory.filter((e: any) =>
      `${e.name || ""} ${e.lastName || ""}`.toLowerCase().includes(q)
    );
    setRecipientResults(matches.slice(0, 8));
    setShowRecipientDropdown(matches.length > 0);
  }, [recipientQuery, directory]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        recipientRef.current &&
        !recipientRef.current.contains(e.target as Node)
      ) {
        setShowRecipientDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const triggerCelebration = () => {
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 3000);
  };

  const refreshAssessmentData = () => {
    queryClient.invalidateQueries({ queryKey: ['activeCycleAssessment'] });
    queryClient.invalidateQueries({ queryKey: ['myAssessments'] });
    queryClient.invalidateQueries({ queryKey: ['myPerformanceSummary'] });
  };

  const handleSaveAssessment = async (data: any) => {
    try {
      if (activeAssessment?.id) {
        await updateAssessment(activeAssessment.id, data);
      } else {
        // cycleId/cycleName are resolved server-side from whichever cycle is active.
        await createAssessment(data);
      }
      refreshAssessmentData();
    } catch (error) {
      console.error('Failed to save assessment:', error);
    }
  };

  const handleSubmitAssessment = async (id: string) => {
    try {
      await submitAssessment(id);
      refreshAssessmentData();
      setShowAssessmentWizard(false);
      triggerCelebration();
    } catch (error) {
      console.error('Failed to submit assessment:', error);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8 pb-20">
      {activeCycle?.stages?.length > 0 && (
        <div className="space-y-4">
          <DeadlineBanner stages={activeCycle.stages} cycleName={activeCycle.name} />
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <StageTimeline stages={activeCycle.stages} />
          </div>
        </div>
      )}

      {/* Performance Overview Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Latest Rating
          </p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tighter">
            {summary?.avgRating ? summary.avgRating.toFixed(1) : "—"}{" "}
            <span className="text-sm font-medium text-slate-400">/ 5.0</span>
          </h3>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Target size={20} />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Goal Completion Rate
          </p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tighter">
            {summary?.goalCompletionRate ?? 0}%
          </h3>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Star size={20} />
            </div>
            {(summary?.pendingTeamReviews ?? 0) > 0 && (
              <div className="w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {summary?.pendingTeamReviews}
              </div>
            )}
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Team Reviews Pending
          </p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tighter">
            {summary?.pendingTeamReviews ?? 0}
          </h3>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-indigo-600 p-6 rounded-3xl shadow-xl shadow-indigo-100 text-white relative overflow-hidden"
        >
          <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10" />
          <div className="relative z-10">
            <div className="p-2 bg-white/20 text-white rounded-xl w-fit mb-4">
              <Heart size={20} fill="currentColor" />
            </div>
            <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1">
              Continuous Feedback
            </p>
            <h3 className="text-3xl font-black tracking-tighter">
              {(summary?.shoutoutsSent ?? 0) + (summary?.shoutoutsReceived ?? 0)}{" "}
              <span className="text-xs font-medium text-indigo-200">
                Shoutouts
              </span>
            </h3>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Goals at a glance */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-800">
                My Goals at a Glance
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Progress on your most recently updated objectives.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("goals")}
              className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
            >
              View All
            </button>
          </div>
          {myGoals.length === 0 ? (
            <div className="py-16 text-center">
              <Target size={40} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">
                No goals set yet — head to Objectives to create one.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {myGoals.slice(0, 5).map((goal: any) => (
                <div key={goal.id}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-black text-slate-800">{goal.title}</p>
                    <span className="text-xs font-black text-slate-600">{goal.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${goal.status === "completed" ? "bg-emerald-500" : goal.status === "at_risk" ? "bg-amber-500" : "bg-indigo-600"}`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Recognition */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
            <Heart className="text-rose-500" /> Recent Recognition
          </h3>
          <div className="space-y-6 flex-1">
            {shoutouts.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium">
                No shoutouts yet — be the first to send one!
              </p>
            ) : (
              shoutouts.slice(0, 4).map((fb: any) => (
                <div key={fb.id} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <Sparkles size={16} className="text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 leading-snug">
                      To <span className="text-indigo-600">{fb.toEmployeeName}</span>: "{fb.message}"
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">#{fb.type}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => setActiveTab("feedback")}
            className="w-full mt-10 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all"
          >
            Give Recognition
          </button>
        </div>
      </div>

      {/* Review Cycle Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Calendar className="text-indigo-600" /> Review Cycle
          </h3>
          {activeCycle && (
            <span className="text-xs font-bold text-slate-400">{activeCycle.name}</span>
          )}
        </div>
        {!activeCycle ? (
          <p className="text-sm text-slate-400 font-medium">
            No review cycle is open right now — check back once HR starts one.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <p className="text-xs font-black text-slate-800 mb-1">My Self-Assessment</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">
                {activeCycle.selfReviewDueDate ? `Due ${activeCycle.selfReviewDueDate}` : "No due date set"}
              </p>
              <span
                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${summary?.myCycleStatus === "completed"
                  ? "bg-emerald-50 text-emerald-600"
                  : summary?.myCycleStatus
                    ? "bg-amber-50 text-amber-600"
                    : "bg-slate-100 text-slate-500"
                  }`}
              >
                {summary?.myCycleStatus ? summary.myCycleStatus.replace("_", " ") : "Not started"}
              </span>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <p className="text-xs font-black text-slate-800 mb-1">Manager Reviews Due</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                {activeCycle.managerReviewDueDate || "No due date set"}
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <p className="text-xs font-black text-slate-800 mb-1">Cycle Window</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                {activeCycle.startDate || "—"} → {activeCycle.endDate || "—"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Strategic OKRs</h2>
          <p className="text-sm text-slate-500 font-medium">
            Aligning individual growth with the ZenHR mission.
          </p>
        </div>
        <button
          onClick={() => setShowGoalModal(true)}
          className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={20} strokeWidth={3} /> New Objective
        </button>
      </div>

      {myGoals.length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm py-24 text-center">
          <Target size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No objectives yet — set your first one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {myGoals.map((goal: any) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative"
            >
              {goal.progress === 100 && (
                <div className="absolute top-6 right-8 text-emerald-500 animate-bounce">
                  <Award size={24} fill="currentColor" />
                </div>
              )}

              <div className="flex gap-2 mb-6">
                <span
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${goal.priority === "high"
                    ? "bg-rose-50 text-rose-500"
                    : "bg-slate-100 text-slate-500"
                    }`}
                >
                  {goal.priority} Priority
                </span>
                <span
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${goal.status === "completed"
                    ? "bg-emerald-50 text-emerald-600"
                    : goal.status === "at_risk"
                      ? "bg-rose-50 text-rose-500"
                      : "bg-amber-50 text-amber-600"
                    }`}
                >
                  {goal.status.replace("_", " ")}
                </span>
                {goal.assignedById && (
                  <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-500">
                    Assigned
                  </span>
                )}
              </div>

              <h3 className="text-lg font-black text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors">
                {goal.title}
              </h3>
              {goal.description && (
                <p className="text-xs text-slate-500 font-medium mb-8 leading-relaxed h-12 overflow-hidden">
                  {goal.description}
                </p>
              )}

              <div className="space-y-3 mb-10">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Progress
                  </span>
                  <span className="text-xl font-black text-slate-800">
                    {goal.progress}%
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    className={`h-full rounded-full ${goal.status === "at_risk" ? "bg-amber-500" : "bg-indigo-600"}`}
                  />
                </div>
              </div>

              {goal.keyResults && goal.keyResults.length > 0 && (
                <div className="space-y-3 mb-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Key Results
                  </p>
                  {goal.keyResults.map((kr: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleToggleKeyResult(goal, idx)}
                      className="flex items-center gap-3 w-full text-left"
                    >
                      {kr.completed ? (
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-slate-200 rounded-md shrink-0" />
                      )}
                      <span
                        className={`text-xs font-bold ${kr.completed ? "text-slate-400 line-through" : "text-slate-600"}`}
                      >
                        {kr.text}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Calendar size={14} /> {goal.dueDate ? `Due ${goal.dueDate}` : "No due date"}
                </div>
                {goal.status !== "completed" && (
                  <button
                    onClick={() => handleMarkGoalComplete(goal)}
                    className="px-4 py-2 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-xl transition-all"
                    title="Mark as complete"
                  >
                    <CheckCircle2 size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Goal Alignment Visualization */}
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
        <Sparkles className="absolute top-10 right-10 text-indigo-400/20 w-32 h-32" />
        <h3 className="text-2xl font-black mb-12 flex items-center gap-3">
          <MapIcon className="text-indigo-400" /> Strategic Alignment
        </h3>
        {myObjectives.length === 0 ? (
          <p className="text-slate-400 font-medium relative">
            No strategic objectives have been set yet — check back once HR publishes one.
          </p>
        ) : (
          <div className="space-y-8 relative">
            {myObjectives.map((obj: any) => (
              <div key={obj.id} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] max-w-xl backdrop-blur-sm flex items-start gap-6">
                <div className={`w-16 h-16 ${obj.scope === 'department' ? 'bg-emerald-600' : 'bg-indigo-600'} rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-2xl`}>
                  {obj.scope === 'department' ? <Users size={28} /> : <Rocket size={28} />}
                </div>
                <div className="flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${obj.scope === 'department' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                    {obj.scope === 'department' ? `${obj.departmentName || 'Department'} Objective` : 'Company Objective'}
                  </p>
                  <h4 className="text-xl font-black mb-4">{obj.title}</h4>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${obj.progress}%` }} />
                  </div>
                  <p className="text-xs font-bold text-slate-400 mt-2">{obj.progress}% complete</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      <Celebration active={celebrating} />
      {/* Performance Module Navigation */}
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
              <Trophy size={20} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
              Performance & Growth
            </h1>
          </div>
          <p className="text-slate-500 font-medium">
            Nurturing excellence through continuous feedback and clear
            alignment.
          </p>
        </div>

        <div className="flex bg-white p-2 rounded-3xl border border-slate-200 shadow-sm w-max overflow-x-auto scrollbar-hide">
          {[
            {
              id: "dashboard",
              name: "Analytics",
              icon: <TrendingUp size={18} />,
            },
            { id: "goals", name: "Objectives", icon: <Target size={18} /> },
            { id: "feedback", name: "Shoutouts", icon: <Heart size={18} /> },
            { id: "growth", name: "Growth Map", icon: <MapIcon size={18} /> },
            { id: "reviews", name: "Reviews", icon: <Star size={18} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main View Transition Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "goals" && renderGoals()}
          {activeTab === "feedback" && (
            <div className="max-w-4xl mx-auto space-y-10 pb-20">
              <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">
                    ZenHR Wall of Praise
                  </h2>
                  <p className="text-sm text-slate-500 font-medium italic">
                    Celebrating wins, big and small.
                  </p>
                </div>
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="px-8 py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-indigo-200 hover:scale-110 active:scale-95 transition-all"
                >
                  <Sparkles size={22} fill="currentColor" /> Give Recognition
                </button>
              </div>
              <div className="space-y-8 relative">
                <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-slate-100 hidden md:block" />
                {shoutouts.length === 0 ? (
                  <div className="text-center py-12">
                    <Ghost size={48} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No shoutouts yet. Be the first to give recognition!</p>
                  </div>
                ) : (
                  shoutouts.map((fb: any, idx: number) => (
                    <motion.div
                      key={fb.id}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      className="relative flex flex-col md:flex-row gap-8"
                    >
                      <div className="shrink-0 relative z-10 hidden md:block">
                        <div className="w-20 h-20 bg-white rounded-3xl p-1.5 shadow-xl border border-slate-100">
                          <div className="w-full h-full rounded-2xl bg-indigo-100 flex items-center justify-center">
                            <User size={32} className="text-indigo-400" />
                          </div>
                        </div>
                      </div>
                      <div
                        className={`bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex-1 relative group hover:border-indigo-100 transition-all ${fb.type === "praise" ? "bg-indigo-50/20" : ""
                          }`}
                      >
                        {fb.type === "praise" && (
                          <div className="absolute top-8 right-10 text-indigo-500 animate-pulse">
                            <Zap size={24} fill="currentColor" />
                          </div>
                        )}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="md:hidden w-12 h-12 rounded-xl overflow-hidden shadow-md bg-indigo-100 flex items-center justify-center">
                            <User size={20} className="text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">
                              <span className="text-indigo-600">Anonymous</span>
                              <span className="text-slate-300 mx-2 font-normal">
                                sent to
                              </span>
                              {fb.toEmployeeName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                              {new Date(fb.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-6 top-0 h-full w-1 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                          <p className="text-slate-600 text-lg font-medium leading-relaxed italic">
                            "{fb.message}"
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-4 mt-8 pt-8 border-t border-slate-50">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                              #{fb.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                              <MessageSquare size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}
          {activeTab === "growth" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pb-20">
              <div className="lg:col-span-2 space-y-10">
                <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-12">
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4">
                      <Flame className="text-rose-500" /> Development Goals
                    </h3>
                    <span className="px-5 py-2 bg-slate-50 text-slate-500 rounded-[1.2rem] text-xs font-black uppercase tracking-widest border border-slate-100">
                      From latest self-assessment
                    </span>
                  </div>
                  {latestDevelopmentGoals.length === 0 ? (
                    <div className="mb-16 p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center">
                      <p className="text-sm text-slate-500 font-medium">
                        No development goals on file yet — set some in your next self-assessment.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                      {latestDevelopmentGoals.map((dg: any, i: number) => (
                        <div key={i} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative group">
                          <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg text-indigo-600 group-hover:scale-110 transition-transform">
                            <Target size={24} />
                          </div>
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">
                            {dg.category || "Development"}
                          </p>
                          <h5 className="text-lg font-black text-slate-800 mb-3">
                            {dg.title}
                          </h5>
                          {dg.targetDate && (
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                              Target: {dg.targetDate}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <section>
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">
                        Skills Self-Rating
                      </h4>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-indigo-600" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Current
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-indigo-100" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Growth Target
                          </span>
                        </div>
                      </div>
                    </div>
                    {skillRadarData.length === 0 ? (
                      <div className="h-[200px] w-full bg-slate-50/50 rounded-[3rem] flex items-center justify-center">
                        <p className="text-sm text-slate-400 font-medium">Rate your skills in a self-assessment to see them here.</p>
                      </div>
                    ) : (
                      <div className="h-[450px] w-full bg-slate-50/50 rounded-[3rem] p-10 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={skillRadarData}>
                            <PolarGrid stroke="#e2e8f0" strokeWidth={2} />
                            <PolarAngleAxis
                              dataKey="subject"
                              tick={{
                                fontSize: 10,
                                fontWeight: 800,
                                fill: "#64748b",
                              }}
                            />
                            <PolarRadiusAxis angle={30} domain={[0, 5]} hide />
                            <Radar
                              name="Current"
                              dataKey="current"
                              stroke="var(--brand-primary)"
                              fill="var(--brand-primary)"
                              fillOpacity={0.6}
                              dot={{ fill: "var(--brand-primary)", r: 4 }}
                            />
                            <Radar
                              name="Growth Target"
                              dataKey="target"
                              stroke="var(--brand-primary)"
                              strokeDasharray="4 4"
                              fill="var(--brand-primary)"
                              fillOpacity={0.1}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: "20px",
                                border: "none",
                                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                                fontSize: "10px",
                              }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </section>
                </div>
              </div>
              <div className="space-y-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-indigo-600 p-10 rounded-[3.5rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden"
                >
                  <Award className="absolute -bottom-8 -right-8 w-48 h-48 text-white/10 rotate-12" />
                  <div className="relative z-10">
                    <h4 className="text-xl font-black mb-8 flex items-center gap-3">
                      <Users size={24} /> Your Manager
                    </h4>
                    {profile?.managerName ? (
                      <>
                        <div className="flex items-center gap-6 mb-10 bg-white/10 p-6 rounded-[2rem] border border-white/20 backdrop-blur-md">
                          <img
                            src={managerRecord?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.managerName)}&background=random`}
                            className="w-16 h-16 rounded-[1.2rem] object-cover border-2 border-white/50"
                          />
                          <div>
                            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">
                              Growth Partner
                            </p>
                            <p className="text-lg font-black tracking-tight leading-tight">
                              {profile.managerName}
                            </p>
                            {managerRecord?.role && (
                              <p className="text-xs text-indigo-100 font-medium">{managerRecord.role}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (managerRecord) {
                              setRecipientQuery(`${managerRecord.name} ${managerRecord.lastName || ""}`.trim());
                              setRecipientId(managerRecord.id);
                            } else {
                              setRecipientQuery(profile.managerName);
                            }
                            setShowFeedbackModal(true);
                          }}
                          className="w-full py-5 bg-white text-indigo-600 rounded-[1.8rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg hover:bg-indigo-50 transition-all"
                        >
                          Send Recognition <ArrowRight size={18} />
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-indigo-100 font-medium">
                        No manager is assigned to you yet.
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          )}
          {activeTab === "reviews" && (
            <div className="space-y-10 pb-20">
              <div className="bg-white p-24 rounded-[4rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                {!activeCycle ? (
                  <>
                    <motion.div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-300 mb-10 shadow-inner">
                      <Star size={64} strokeWidth={1.5} />
                    </motion.div>
                    <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter">
                      No Review Cycle Open
                    </h3>
                    <p className="text-slate-500 max-w-sm font-medium text-lg leading-relaxed">
                      HR hasn't started a performance review cycle yet. Check back soon.
                    </p>
                  </>
                ) : activeAssessment ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-inner ${activeAssessment.status === 'completed' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}
                    >
                      <CheckCircle2 size={64} strokeWidth={1.5} />
                    </motion.div>
                    <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter">
                      {activeAssessment.status === 'completed' ? 'Review Complete' : 'Assessment in Progress'}
                    </h3>
                    <p className="text-slate-500 max-w-sm font-medium text-lg leading-relaxed mb-2">
                      Your self-assessment for {activeAssessment.cycleName}
                    </p>
                    <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${activeAssessment.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                      activeAssessment.status === 'submitted' || activeAssessment.status === 'under_review' ? 'bg-amber-100 text-amber-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                      {activeAssessment.status.replace('_', ' ')}
                    </span>

                    {activeAssessment.status === 'completed' && activeAssessment.managerReviewReleased === false && (
                      <div className="mt-10 w-full max-w-md p-6 bg-amber-50 border border-amber-100 rounded-[2rem] text-center">
                        <p className="text-sm text-amber-700 font-medium">Your manager has completed their review — it'll be available once HR releases results for this cycle.</p>
                      </div>
                    )}
                    {activeAssessment.status === 'completed' && activeAssessment.managerRating && (
                      <div className="mt-10 w-full max-w-md p-8 bg-slate-50 rounded-[2.5rem] text-left">
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Manager Rating</p>
                        <p className="text-lg font-black text-slate-800 mb-4">{activeAssessment.managerRating.replace(/_/g, ' ')}</p>
                        {activeAssessment.managerComment && (
                          <p className="text-sm text-slate-600 font-medium italic">"{activeAssessment.managerComment}"</p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-4 mt-12">
                      <button
                        onClick={() => setShowAssessmentWizard(true)}
                        className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
                      >
                        {activeAssessment.status === 'draft' ? 'Continue Assessment' : 'View Assessment'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="w-32 h-32 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-300 mb-10 shadow-inner"
                    >
                      <Star size={64} strokeWidth={1.5} />
                    </motion.div>
                    <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter">
                      Review Cycle Open
                    </h3>
                    <p className="text-slate-500 max-w-sm font-medium text-lg leading-relaxed">
                      The {activeCycle.name} appraisal window is open. Prepare your self-reflections early!
                    </p>
                    <div className="flex gap-4 mt-12">
                      <button
                        onClick={() => setShowAssessmentWizard(true)}
                        className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
                      >
                        Prepare My Assessment
                      </button>
                    </div>
                  </>
                )}
              </div>

              {myAssessments.length > 0 && (
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Review History</h4>
                  <div className="divide-y divide-slate-50">
                    {myAssessments.map((a: any) => (
                      <div key={a.id} className="py-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{a.cycleName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{a.status.replace('_', ' ')}</p>
                        </div>
                        <p className="text-xs font-black text-slate-600">
                          {a.managerRating?.replace(/_/g, ' ') || a.selfRating?.replace(/_/g, ' ') || '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 360: Select Peer Reviewers */}
              {activeCycle && (
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Select Peer Reviewers</h4>
                  <p className="text-xs text-slate-400 font-medium mb-6">Nominate colleagues to review you this cycle — your manager approves each one before they can write it.</p>
                  <div className="relative mb-4">
                    <input
                      type="text"
                      value={nominateQuery}
                      onChange={(e) => setNominateQuery(e.target.value)}
                      placeholder="Search colleagues to nominate…"
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold"
                    />
                    {nominateResults.length > 0 && (
                      <ul className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-30 overflow-hidden">
                        {nominateResults.map((emp: any) => (
                          <li
                            key={emp.id}
                            onClick={() => {
                              setSelectedPeers([...selectedPeers, { id: emp.id, name: emp.name, lastName: emp.lastName }]);
                              setNominateQuery("");
                            }}
                            className="px-5 py-3 cursor-pointer hover:bg-indigo-50 transition-colors text-sm font-semibold text-slate-800"
                          >
                            {emp.name} {emp.lastName}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {selectedPeers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedPeers.map((p) => (
                        <span key={p.id} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold">
                          {p.name} {p.lastName}
                          <button onClick={() => setSelectedPeers(selectedPeers.filter((sp) => sp.id !== p.id))}>
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {selectedPeers.length > 0 && (
                    <button
                      onClick={handleSubmitNominations}
                      disabled={nominatePeers.isPending}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg disabled:opacity-50 mb-6"
                    >
                      {nominatePeers.isPending ? "Nominating…" : `Nominate ${selectedPeers.length}`}
                    </button>
                  )}
                  {myNominations.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-slate-50">
                      {myNominations.map((n: any) => (
                        <div key={n.id} className="flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-700">{n.reviewerName} {n.reviewerLastName}</p>
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${n.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : n.status === 'rejected' ? 'bg-rose-50 text-rose-500' : n.status === 'submitted' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                            {n.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 360: Reviews To Write */}
              {activeCycle && (reviewsAssignedToMe.length > 0 || profile?.managerId) && (
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Reviews To Write</h4>
                  <div className="space-y-3">
                    {reviewsAssignedToMe.map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <p className="text-sm font-bold text-slate-700">
                          Peer review for <span className="font-black text-slate-900">{r.revieweeName} {r.revieweeLastName}</span>
                        </p>
                        <button
                          onClick={() => { setWritingReview(r); setReviewWriteForm(emptyReviewForm); }}
                          className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          Write Review
                        </button>
                      </div>
                    ))}
                    {profile?.managerId && (
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <p className="text-sm font-bold text-slate-700">
                          Upward review for <span className="font-black text-slate-900">{profile.managerName || "your manager"}</span>
                        </p>
                        <button
                          onClick={() => { setWritingReview({ direction: "upward", revieweeName: profile.managerName }); setReviewWriteForm(emptyReviewForm); }}
                          className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          Write Review
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 360: Feedback received about me */}
              {activeCycle && (
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">360 Feedback Received</h4>
                  {receivedReviewsData?.released === false ? (
                    <p className="text-sm text-slate-400 font-medium">Available once HR releases results for this cycle.</p>
                  ) : receivedReviews.length === 0 ? (
                    <p className="text-sm text-slate-400 font-medium">No peer or upward feedback submitted about you yet this cycle.</p>
                  ) : (
                    <div className="space-y-4">
                      {receivedReviews.map((r: any, i: number) => (
                        <div key={i} className="p-6 bg-slate-50 rounded-2xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-3 py-1 bg-white rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 shadow-sm">Anonymous {r.direction}</span>
                            <span className="text-xs font-black text-slate-600">{r.rating?.replace(/_/g, ' ')}</span>
                          </div>
                          {r.strengths && <p className="text-xs text-slate-600 font-medium mb-1"><span className="font-black">Strengths:</span> {r.strengths}</p>}
                          {r.improvements && <p className="text-xs text-slate-600 font-medium mb-1"><span className="font-black">Could improve:</span> {r.improvements}</p>}
                          {r.comment && <p className="text-sm text-slate-600 font-medium italic mt-2">"{r.comment}"</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Goal Creation Modal */}
      <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGoalModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10 bg-indigo-600 text-white flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black mb-1">
                    Set Strategic Objective
                  </h2>
                  <p className="text-indigo-100 text-sm font-medium">
                    Define high-impact goals that drive growth.
                  </p>
                </div>
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Objective Title
                  </label>
                  <input
                    type="text"
                    value={goalForm.title}
                    onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                    placeholder="e.g. Master the new Wallet Engine architecture"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-black text-slate-800"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={goalForm.description}
                    onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                    placeholder="What does success look like?"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-3xl outline-none font-medium resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Goal Category
                    </label>
                    <select
                      value={goalForm.category}
                      onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-600"
                    >
                      <option value="individual">Individual</option>
                      <option value="team">Team</option>
                      <option value="department">Department</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={goalForm.dueDate}
                      onChange={(e) => setGoalForm({ ...goalForm, dueDate: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-600"
                    />
                  </div>
                </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="px-8 py-4 bg-white text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  disabled={!goalForm.title.trim() || createGoalMutation.isPending}
                  onClick={handleCreateGoal}
                  className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                  {createGoalMutation.isPending ? "Creating…" : "Establish Goal"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Give Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFeedbackModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10 bg-indigo-600 text-white flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black mb-1">Send a Shoutout</h2>
                  <p className="text-indigo-100 text-sm font-medium">
                    Appreciation is the catalyst for brilliance.
                  </p>
                </div>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Recipient
                  </label>
                  <div className="relative" ref={recipientRef}>
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10"
                      size={18}
                    />
                    <input
                      type="text"
                      value={recipientQuery}
                      onChange={(e) => {
                        setRecipientQuery(e.target.value);
                        setRecipientId(null);
                      }}
                      onFocus={() =>
                        recipientResults.length > 0 &&
                        setShowRecipientDropdown(true)
                      }
                      placeholder="Who deserves recognition today?"
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold"
                    />
                    {showRecipientDropdown && recipientResults.length > 0 && (
                      <motion.ul
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                      >
                        {recipientResults.map((emp) => (
                          <li
                            key={emp.id}
                            onMouseDown={() => {
                              setRecipientQuery(
                                `${emp.name}${emp.lastName ? " " + emp.lastName : ""}`,
                              );
                              setRecipientId(emp.id);
                              setShowRecipientDropdown(false);
                            }}
                            className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-indigo-50 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs shrink-0">
                              {emp.name?.[0]?.toUpperCase()}
                              {emp.lastName?.[0]?.toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-800 text-sm">
                              {emp.name} {emp.lastName}
                            </span>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Praise 👏", value: "praise" },
                    { label: "Bravo 💡", value: "bravo" },
                    { label: "Gratitude 🙏", value: "gratitude" },
                  ].map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => setSelectedType(value)}
                      className={`py-4 border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedType === value
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                        : "bg-slate-50 border-transparent hover:border-indigo-400 hover:bg-white text-slate-600"
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    The Message
                  </label>
                  <textarea
                    rows={5}
                    value={shoutoutMessage}
                    onChange={(e) => setShoutoutMessage(e.target.value)}
                    placeholder="Tell them why they're awesome..."
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium resize-none"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleSendShoutout}
                    disabled={
                      !recipientQuery.trim() ||
                      !selectedType ||
                      !shoutoutMessage.trim() ||
                      sendShoutout.isPending
                    }
                    className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                  >
                    {sendShoutout.isPending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} fill="currentColor" /> Send Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Write Peer/Upward Review Modal */}
      <AnimatePresence>
        {writingReview && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setWritingReview(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10 bg-indigo-600 text-white flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black mb-1">
                    {writingReview.direction === "upward" ? "Upward Review" : "Peer Review"}
                  </h2>
                  <p className="text-indigo-100 text-sm font-medium">
                    For {writingReview.revieweeName} {writingReview.revieweeLastName || ""}
                  </p>
                </div>
                <button onClick={() => setWritingReview(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rating</label>
                  <select
                    value={reviewWriteForm.rating}
                    onChange={(e) => setReviewWriteForm({ ...reviewWriteForm, rating: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700"
                  >
                    <option value="">Select rating…</option>
                    <option value="unsatisfactory">Unsatisfactory</option>
                    <option value="needs_improvement">Needs Improvement</option>
                    <option value="meets_expectations">Meets Expectations</option>
                    <option value="exceeds_expectations">Exceeds Expectations</option>
                    <option value="exceptional">Exceptional</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strengths</label>
                  <textarea
                    rows={3}
                    value={reviewWriteForm.strengths}
                    onChange={(e) => setReviewWriteForm({ ...reviewWriteForm, strengths: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-medium resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Could improve</label>
                  <textarea
                    rows={3}
                    value={reviewWriteForm.improvements}
                    onChange={(e) => setReviewWriteForm({ ...reviewWriteForm, improvements: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-medium resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Additional comments</label>
                  <textarea
                    rows={3}
                    value={reviewWriteForm.comment}
                    onChange={(e) => setReviewWriteForm({ ...reviewWriteForm, comment: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-3xl outline-none font-medium resize-none"
                  />
                </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                <button onClick={() => setWritingReview(null)} className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                <button
                  disabled={!reviewWriteForm.rating || submitPeerReview.isPending || submitUpwardReview.isPending}
                  onClick={handleSubmitWrittenReview}
                  className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                  {submitPeerReview.isPending || submitUpwardReview.isPending ? "Submitting…" : "Submit Review"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assessment Wizard */}
      <AssessmentWizard
        isOpen={showAssessmentWizard}
        onClose={() => setShowAssessmentWizard(false)}
        cycleName={activeCycle?.name || ""}
        existingAssessment={activeAssessment}
        goals={myGoals}
        evidence={myEvidence}
        onUploadEvidence={handleUploadEvidence}
        uploadingEvidence={uploadEvidence.isPending}
        onSave={handleSaveAssessment}
        onSubmit={handleSubmitAssessment}
      />
    </div>
  );
};

export default Performance;
