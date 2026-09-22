import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  CheckCircle2,
  Clock,
  Trophy,
  Briefcase,
  ChevronRight,
  Calendar,
  Plus,
  AlertCircle,
  Zap,
  Heart,
  BarChart3,
  TrendingUp,
  MapPin,
  Coffee,
  Star,
  X,
  Check,
  Filter,
  Download,
  Search,
  MoreHorizontal,
  CalendarDays,
  User,
  LayoutGrid,
  Timer,
  Laptop,
  ShieldCheck,
  Target,
  Presentation,
  ChevronDown,
  Eye,
  Mail,
  Phone,
  Trash2,
  FileText,
  Share2,
  DollarSign,
  ArrowRight,
  Landmark,
  Info,
  PieChart as PieIcon,
  HelpCircle,
  Flag,
  Megaphone,
  Send,
  Rocket,
  Video,
  ListChecks,
  FileCheck,
  Umbrella,
  Save,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from "recharts";
import { useNavigation } from "../../context/NavigationContext";
import { useAuth } from "../../context/AuthContext";
import {
  useTeamPendingLeaves,
  useUpdateTeamLeaveStatus,
  useMyJobRequisitions,
  useCreateJobRequisition,
  useDepartments,
  useLocations,
  useMyDirectReports,
  useMyTeamAttendanceToday,
  useTeamGoals,
  useAssignTeamGoal,
  useTeamPendingAssessments,
  useSubmitManagerReview,
  useTeamPerformanceAnalytics,
  useTeamPendingPeerApprovals,
  useApprovePeerNomination,
  useAssessmentEvidence,
  useActiveCycleAssessment,
} from "../../api/client";
import EmployeeDetailModal from "./components/EmployeeDetailModal";
import ApprovalCenter from "./components/ApprovalCenter";
import { StageTimeline, DeadlineBanner } from "../../components/StageTimeline";

const ManagerDashboard: React.FC = () => {
  // -------------------------------------------------------------------------
  // STATE & DATA
  // -------------------------------------------------------------------------
  const { activeTab } = useNavigation();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<
    "dashboard" | "team" | "approvals" | "performance" | "meetings"
  >("dashboard");
  const [activeApprovalTab, setActiveApprovalTab] = useState<
    "leave" | "expenses" | "time" | "requisition"
  >("leave"); // Kept for legacy if needed, but ApprovalCenter handles internal state

  React.useEffect(() => {
    if (activeTab === "workforce") setActiveSection("team");
    else if (activeTab === "approvals") setActiveSection("approvals");
    else if (activeTab === "performance") setActiveSection("performance");
    else if (activeTab === "goals") setActiveSection("performance");
    else if (activeTab === "reports") setActiveSection("performance");
    else if (activeTab === "manager-dashboard") setActiveSection("dashboard");
  }, [activeTab]);
  const [viewingEmployee, setViewingEmployee] = useState<any>(null);

  // Real direct reports — replaces the old hardcoded mock roster everywhere
  // in this dashboard (team grid, presence widget, approval avatars, etc).
  const { data: teamMembers = [] } = useMyDirectReports();
  const { data: teamAttendanceToday = [] } = useMyTeamAttendanceToday();

  const { data: teamPendingLeaves = [] } = useTeamPendingLeaves();
  const updateLeaveStatus = useUpdateTeamLeaveStatus();

  // Performance & Growth: direct reports' goals, pending self-assessment
  // reviews, and this manager's team rating distribution.
  const { data: teamGoals = [] } = useTeamGoals();
  const assignGoal = useAssignTeamGoal();
  const { data: teamPendingData } = useTeamPendingAssessments();
  const pendingReviews = teamPendingData?.pending || [];
  const ratingScale = teamPendingData?.ratingScale || [];
  const submitManagerReview = useSubmitManagerReview();
  const { data: teamAnalytics } = useTeamPerformanceAnalytics();

  // 360 reviews: peer nominees awaiting this manager's approval, and the
  // cycle timeline (reused from the employee-facing "my active cycle" call
  // — a manager is also an employee with their own self-review to do).
  const { data: pendingPeerApprovals = [] } = useTeamPendingPeerApprovals();
  const approvePeerNomination = useApprovePeerNomination();
  const { data: cycleData } = useActiveCycleAssessment();
  const activeCycle = cycleData?.activeCycle;

  const [showAssignGoalModal, setShowAssignGoalModal] = useState(false);
  const emptyAssignGoalForm = { employeeId: "", title: "", description: "", priority: "medium", dueDate: "" };
  const [assignGoalForm, setAssignGoalForm] = useState(emptyAssignGoalForm);

  const [reviewingAssessment, setReviewingAssessment] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const { data: reviewingEvidence = [] } = useAssessmentEvidence(reviewingAssessment?.id);

  const handleAssignGoal = () => {
    if (!assignGoalForm.employeeId || !assignGoalForm.title.trim()) return;
    assignGoal.mutate(assignGoalForm, {
      onSuccess: () => {
        setShowAssignGoalModal(false);
        setAssignGoalForm(emptyAssignGoalForm);
      },
    });
  };

  const handleSubmitManagerReview = () => {
    if (!reviewingAssessment || !reviewRating) return;
    submitManagerReview.mutate(
      { id: reviewingAssessment.id, managerRating: reviewRating, managerComment: reviewComment },
      {
        onSuccess: () => {
          setReviewingAssessment(null);
          setReviewRating("");
          setReviewComment("");
        },
      }
    );
  };

  // Requisitions ("Requirement" requests) this manager has raised, plus the
  // form to submit a new one. HR Admin/Super Admin review & approve these
  // from the Recruitment module.
  const [showRequisitionModal, setShowRequisitionModal] = useState(false);
  const emptyReqForm = {
    title: "",
    department: "",
    location: "",
    priority: "Medium" as "High" | "Medium" | "Low",
    targetHireDate: "",
    budgetRange: "",
    justification: "",
  };
  const [reqForm, setReqForm] = useState(emptyReqForm);
  const [reqFormError, setReqFormError] = useState<string | null>(null);

  const { data: myRequisitions = [], isLoading: myRequisitionsLoading } = useMyJobRequisitions();
  const { data: departments = [] } = useDepartments();
  const { data: locations = [] } = useLocations();
  const createRequisition = useCreateJobRequisition();

  const handleSubmitRequisition = () => {
    if (!reqForm.title.trim() || !reqForm.department || !reqForm.location) {
      setReqFormError("Job title, department and location are required.");
      return;
    }
    setReqFormError(null);
    createRequisition.mutate(
      {
        title: reqForm.title.trim(),
        department: reqForm.department,
        location: reqForm.location,
        priority: reqForm.priority,
        targetHireDate: reqForm.targetHireDate || undefined,
        budgetRange: reqForm.budgetRange.trim() || undefined,
        justification: reqForm.justification.trim() || undefined,
      } as any,
      {
        onSuccess: () => {
          setShowRequisitionModal(false);
          setReqForm(emptyReqForm);
        },
        onError: (err: any) => setReqFormError(err.message || "Failed to submit request."),
      },
    );
  };

  // Real, manager-scoped pending leave requests (see LeaveService.getPendingTeamLeaveRequests).
  // `impact` has no backing data yet — the card falls back gracefully.
  // Expense/time-correction/requisition approval queues aren't backed by any
  // schema in this app yet, so they're intentionally left out here rather
  // than shown with fabricated, non-functional data.
  const approvalsData = {
    leave: (teamPendingLeaves || []).map((r: any) => ({
      id: r.id,
      name: `${r.name} ${r.lastName || ""}`.trim(),
      type: r.type,
      range: `${r.startDate} - ${r.endDate}`,
      days: r.days,
      reason: r.reason,
      avatar: r.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name || "Employee")}&background=random`,
    })),
  };

  // No meeting-scheduling feature exists in the backend yet — the tab shows
  // an honest empty state rather than fabricated 1-on-1s.
  const meetings: { id: string; with: string; date: string; type: string }[] = [];

  const pendingApprovalsCount =
    teamPendingLeaves.length + pendingReviews.length + pendingPeerApprovals.length;

  const presentTodayCount = teamAttendanceToday.filter((t: any) =>
    ["present", "late", "clocked-out"].includes(t.status),
  ).length;
  const lateTodayCount = teamAttendanceToday.filter((t: any) => t.status === "late").length;
  const presencePct = teamMembers.length > 0 ? Math.round((presentTodayCount / teamMembers.length) * 100) : null;

  const openRequisitionsCount = myRequisitions.filter((r: any) => r.status === "Open" || r.status === "Pending Approval").length;

  const currentHour = new Date().getHours();
  const currentGreeting = currentHour < 12 ? "morning" : currentHour < 18 ? "afternoon" : "evening";

  // -------------------------------------------------------------------------
  // RENDER LARGGETS SECTIONS
  // -------------------------------------------------------------------------

  const renderDashboard = () => (
    <div className="space-y-10">
      {/* 1. Welcome & Stats */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
            Managerial Hub
          </h1>
          <p className="text-slate-500 font-medium">
            {`Good ${currentGreeting}, ${(user?.name || "there").split(" ")[0]}. `}
            {pendingApprovalsCount > 0 ? (
              <>
                You have <b className="text-indigo-600">{pendingApprovalsCount}</b>{" "}
                {pendingApprovalsCount === 1 ? "action" : "actions"} requiring attention today.
              </>
            ) : (
              "You're all caught up — no pending actions today."
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSection("approvals")}
            className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-rose-100 flex items-center gap-2 relative"
          >
            <ListChecks size={16} /> {pendingApprovalsCount} Approvals
            {pendingApprovalsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveSection("meetings")}
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:scale-105 transition-all"
          >
            <Plus size={18} /> Schedule Sync
          </button>
        </div>
      </section>

      {/* 2. Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {[
          {
            label: "Team Size",
            val: teamMembers.length,
            sub: `${presentTodayCount} present today`,
            icon: <Users className="text-indigo-600" />,
            bg: "bg-indigo-50",
          },
          {
            label: "Pending",
            val: pendingApprovalsCount,
            sub: "Approvals Needed",
            icon: <CheckCircle2 className="text-emerald-600" />,
            bg: "bg-emerald-50",
          },
          {
            label: "Presence",
            val: presencePct === null ? "—" : `${presencePct}%`,
            sub: lateTodayCount > 0 ? `${lateTodayCount} Late Arrivals` : "No late arrivals",
            icon: <Clock className="text-amber-600" />,
            bg: "bg-amber-50",
          },
          {
            label: "Avg Rating",
            val: teamAnalytics?.avgRating ?? "—",
            sub: teamAnalytics?.avgRating ? "This cycle" : "No ratings yet",
            icon: <Trophy className="text-violet-600" />,
            bg: "bg-violet-50",
          },
          {
            label: "Hiring",
            val: openRequisitionsCount,
            sub: `${myRequisitions.length} total requests`,
            icon: <Briefcase className="text-rose-600" />,
            bg: "bg-rose-50",
          },
        ].map((s, i) => (
          <motion.div
            whileHover={{ y: -5 }}
            key={i}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm group"
          >
            <div
              className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 transition-transform`}
            >
              {s.icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {s.label}
            </p>
            <h4 className="text-2xl font-black text-slate-800 tracking-tighter">
              {s.val}
            </h4>
            <p className="text-[10px] font-bold text-slate-400 mt-2">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* 3. Main Content: Approvals & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Priority Approvals */}
          <section className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                Priority Approvals
              </h3>
              <button
                onClick={() => setActiveSection("approvals")}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                View Full List <ChevronRight size={14} />
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {approvalsData.leave.slice(0, 2).map((req) => (
                <div
                  key={req.id}
                  className="p-8 hover:bg-slate-50/50 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-6">
                    <img
                      src={req.avatar}
                      className="w-14 h-14 rounded-[1.5rem] object-cover ring-4 ring-white shadow-xl"
                    />
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-sm font-black text-slate-800">
                          {req.name}
                        </h4>
                        <span className="px-3 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-500">
                          Leave
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {req.type} • {req.range}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateLeaveStatus.mutate({ id: req.id, status: "rejected" })}
                      disabled={updateLeaveStatus.isPending}
                      className="p-3 bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm disabled:opacity-50"
                    >
                      <X size={18} />
                    </button>
                    <button
                      onClick={() => updateLeaveStatus.mutate({ id: req.id, status: "approved" })}
                      disabled={updateLeaveStatus.isPending}
                      className="p-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all shadow-lg disabled:opacity-50"
                    >
                      <Check size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Team Attendance Widget */}
          <section className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden p-10">
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">
              Team Presence Today
            </h3>
            {teamAttendanceToday.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Users size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold">No direct reports yet.</p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {teamAttendanceToday.map((m: any) => {
                  const statusMeta: Record<string, { dot: string; label: string }> = {
                    present: { dot: "bg-emerald-500", label: "Present" },
                    late: { dot: "bg-amber-500", label: "Late" },
                    "clocked-out": { dot: "bg-slate-400", label: "Done" },
                    absent: { dot: "bg-rose-400", label: "Absent" },
                  };
                  const meta = statusMeta[m.status] || statusMeta.absent;
                  return (
                    <div
                      key={m.employeeId}
                      className="min-w-[80px] flex flex-col items-center"
                    >
                      <div className="relative">
                        {m.avatar ? (
                          <img
                            src={m.avatar}
                            className="w-16 h-16 rounded-2xl object-cover mb-2"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl mb-2 bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-lg">
                            {m.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${meta.dot}`}
                        />
                      </div>
                      <p className="text-xs font-bold text-slate-700 text-center leading-tight">
                        {m.name?.split(" ")[0]}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">
                        {meta.label}
                      </p>
                    </div>
                  );
                })}
                <button
                  onClick={() => setActiveSection("team")}
                  className="min-w-[80px] h-[100px] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                >
                  <CalendarDays size={24} />
                  <span className="text-[9px] font-black uppercase mt-2">
                    View Team
                  </span>
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Right Col */}
        <div className="space-y-10">
          {/* My Hiring Requests ("Requirement" requests) */}
          <section className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <Briefcase className="absolute -bottom-6 -right-6 w-32 h-32 text-indigo-500/20 rotate-12" />
            <div className="flex items-center justify-between mb-6 relative">
              <h3 className="text-xl font-black">My Hiring Requests</h3>
              <button
                onClick={() => setShowRequisitionModal(true)}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                title="Request a new hire"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-4 mb-8 max-h-64 overflow-y-auto scrollbar-hide relative">
              {myRequisitionsLoading && (
                <p className="text-xs text-indigo-200 font-bold">Loading…</p>
              )}
              {!myRequisitionsLoading && myRequisitions.length === 0 && (
                <p className="text-xs text-indigo-200 font-bold">
                  No requests yet — raise one below to open a new position.
                </p>
              )}
              {myRequisitions.slice(0, 4).map((req) => (
                <div
                  key={req.id}
                  className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5"
                >
                  <p className="text-sm font-bold">{req.title}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] font-black uppercase text-indigo-300">
                      {req.department}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        req.status === "Open"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : req.status === "Rejected"
                            ? "bg-rose-500/20 text-rose-300"
                            : req.status === "Pending Approval"
                              ? "bg-sky-500/20 text-sky-300"
                              : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowRequisitionModal(true)}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl relative"
            >
              + Request New Hire
            </button>
          </section>

          {/* Performance Snapshot */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Trophy size={18} className="text-indigo-600" /> Team Pulse
            </h3>
            {teamAnalytics?.avgRating ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Trophy size={28} />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-800">
                    {teamAnalytics.avgRating} / 5.0
                  </p>
                  <p className="text-xs text-slate-500 font-bold">
                    Team average rating this cycle
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection("performance")}
                  className="ml-auto text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                >
                  Details
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-slate-400 font-bold">
                  No rated reviews yet this cycle.
                </p>
                <button
                  onClick={() => setActiveSection("performance")}
                  className="mt-3 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                >
                  Go to Performance
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );

  const renderTeam = () => (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">
            My Direct Reports
          </h2>
          <p className="text-sm text-slate-500 font-medium italic">
            Managing performance and growth for {teamMembers.length} members.
          </p>
        </div>
      </div>

      {teamMembers.length === 0 ? (
        <div className="p-16 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
          <Users className="mx-auto w-16 h-16 text-slate-300 mb-4" />
          <h4 className="text-slate-400 font-bold uppercase tracking-widest">
            No direct reports yet
          </h4>
          <p className="text-xs text-slate-400 mt-2">
            Employees assigned to you as their manager will show up here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {teamMembers.map((emp: any) => {
            const attendance = teamAttendanceToday.find((t: any) => t.employeeId === emp.id);
            const isPresent = attendance ? ["present", "late", "clocked-out"].includes(attendance.status) : false;
            const empGoals = teamGoals.filter((g: any) => g.employeeId === emp.id);
            const avgProgress = empGoals.length
              ? Math.round(empGoals.reduce((sum: number, g: any) => sum + (g.progress || 0), 0) / empGoals.length)
              : null;
            return (
              <motion.div
                key={emp.id}
                whileHover={{ y: -8 }}
                onClick={() => setViewingEmployee(emp)}
                className="bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer relative group overflow-hidden"
              >
                <div
                  className={`absolute top-0 left-0 w-full h-24 ${isPresent ? "bg-emerald-50" : "bg-amber-50"} transition-transform group-hover:scale-x-110`}
                />
                <div className="relative mb-6 pt-4">
                  <div className="relative mx-auto w-24 h-24">
                    {emp.avatar ? (
                      <img
                        src={emp.avatar}
                        className="w-full h-full rounded-[2rem] object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-full h-full rounded-[2rem] border-4 border-white shadow-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-2xl">
                        {emp.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div
                      className={`absolute -bottom-1 -right-1 w-6 h-6 border-2 border-white rounded-lg flex items-center justify-center shadow-md ${isPresent ? "bg-emerald-500" : "bg-amber-500"}`}
                    >
                      <ShieldCheck size={12} className="text-white" />
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1">
                    {emp.name} {emp.lastName}
                  </h3>
                  <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-6">
                    {emp.role}
                  </p>

                  <div className="space-y-3 mb-8">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                      <span>Goal Progress</span>
                      <span className="text-slate-800 font-black">
                        {avgProgress === null ? "No goals" : `${avgProgress}%`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${avgProgress ?? 0}%` }} />
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingEmployee(emp);
                    }}
                    className="w-full py-2.5 bg-slate-50 text-slate-500 hover:text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-10 pb-20">
      {activeCycle?.stages?.length > 0 && (
        <div className="space-y-4">
          <DeadlineBanner stages={activeCycle.stages} cycleName={activeCycle.name} />
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <StageTimeline stages={activeCycle.stages} />
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter">
            Team Performance
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Goals, reviews and growth for your direct reports.
          </p>
        </div>
        <button
          onClick={() => setShowAssignGoalModal(true)}
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2"
        >
          <Plus size={16} /> Assign Goal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-8">
            Team Rating Distribution
          </h3>
          <div className="h-64 w-full">
            {teamAnalytics?.distribution?.some((d: any) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamAnalytics.distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: "bold" }}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="var(--brand-primary)"
                    radius={[10, 10, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium text-center px-8">
                No completed reviews for your team yet this cycle.
              </div>
            )}
          </div>
        </section>

        <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-8">
            Pending Reviews {pendingReviews.length > 0 && <span className="text-indigo-600">({pendingReviews.length})</span>}
          </h3>
          <div className="space-y-6">
            {pendingReviews.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium">
                No self-assessments waiting on your review right now.
              </p>
            ) : (
              pendingReviews.map((a: any) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={a.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.employeeName || "Employee")}&background=random`}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div>
                      <p className="text-sm font-black text-slate-800">
                        {a.employeeName} {a.employeeLastName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        {a.cycleName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setReviewingAssessment(a);
                      setReviewRating("");
                      setReviewComment("");
                    }}
                    className="px-4 py-2 bg-white border border-slate-200 text-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-50"
                  >
                    Review
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
        <h3 className="text-xl font-black text-slate-800 mb-8">Team Goals & OKRs</h3>
        {teamGoals.length === 0 ? (
          <p className="text-sm text-slate-400 font-medium">
            No goals set for your direct reports yet — assign one to get started.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teamGoals.map((g: any) => (
              <div key={g.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                    {g.employeeName} {g.employeeLastName}
                  </p>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${g.status === "completed" ? "bg-emerald-100 text-emerald-600" : g.status === "at_risk" ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"}`}>
                    {g.status.replace("_", " ")}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-800 mb-3">{g.title}</h4>
                <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600" style={{ width: `${g.progress}%` }} />
                </div>
                <p className="text-right text-xs font-black text-slate-600 mt-2">{g.progress}%</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
        <h3 className="text-xl font-black text-slate-800 mb-8">
          Peer Reviewer Approvals {pendingPeerApprovals.length > 0 && <span className="text-indigo-600">({pendingPeerApprovals.length})</span>}
        </h3>
        {pendingPeerApprovals.length === 0 ? (
          <p className="text-sm text-slate-400 font-medium">
            No peer reviewer nominations waiting on your approval.
          </p>
        ) : (
          <div className="space-y-4">
            {pendingPeerApprovals.map((n: any) => (
              <div key={n.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <p className="text-sm font-medium text-slate-700">
                  <span className="font-black text-slate-800">{n.revieweeName} {n.revieweeLastName}</span> nominated{" "}
                  <span className="font-black text-slate-800">{n.reviewerName} {n.reviewerLastName}</span> as a peer reviewer
                </p>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => approvePeerNomination.mutate({ id: n.id, approve: false })}
                    className="p-2.5 bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={() => approvePeerNomination.mutate({ id: n.id, approve: true })}
                    className="p-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all"
                  >
                    <Check size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderMeetings = () => (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter">
            1-on-1 Meetings
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Manage syncs and performance discussions.
          </p>
        </div>
      </div>

      {meetings.length === 0 ? (
        <div className="p-16 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
          <Video className="mx-auto w-16 h-16 text-slate-300 mb-4" />
          <h4 className="text-slate-400 font-bold uppercase tracking-widest">
            No meetings scheduled
          </h4>
          <p className="text-xs text-slate-400 mt-2">
            Sync scheduling isn't wired up yet — check back soon.
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {meetings.map((m) => (
          <div
            key={m.id}
            className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors group"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Video size={24} />
              </div>
              <button className="text-slate-300 hover:text-rose-500">
                <MoreHorizontal />
              </button>
            </div>
            <h4 className="text-xl font-black text-slate-800 mb-2">{m.with}</h4>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
              {m.type}
            </p>

            <div className="flex items-center gap-2 text-slate-600 mb-8">
              <Clock size={16} />
              <span className="text-sm font-medium">{m.date}</span>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600">
                View Notes
              </button>
              <button className="px-4 bg-indigo-600 text-white rounded-xl shadow-lg">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      <div className="flex bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-sm w-fit overflow-x-auto scrollbar-hide">
        {[
          {
            id: "dashboard",
            label: "Management Hub",
            icon: <LayoutGrid size={18} />,
          },
          { id: "team", label: "My Team", icon: <Users size={18} /> },
          {
            id: "approvals",
            label: "Approvals",
            icon: <ListChecks size={18} />,
          },
          {
            id: "performance",
            label: "Performance",
            icon: <Trophy size={18} />,
          },
          { id: "meetings", label: "Meetings", icon: <Video size={18} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all whitespace-nowrap ${
              activeSection === tab.id
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                : "text-slate-400 hover:bg-slate-50"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.4 }}
        >
          {activeSection === "dashboard" && renderDashboard()}
          {activeSection === "team" && renderTeam()}
          {activeSection === "approvals" && (
            <ApprovalCenter
              approvals={approvalsData}
              onLeaveAction={(id, status) => updateLeaveStatus.mutate({ id, status })}
              isLeaveActionPending={updateLeaveStatus.isPending}
            />
          )}
          {activeSection === "performance" && renderPerformance()}
          {activeSection === "meetings" && renderMeetings()}
        </motion.div>
      </AnimatePresence>

      {/* Employee Detail Modal */}
      <AnimatePresence>
        {viewingEmployee && (
          <EmployeeDetailModal
            employee={viewingEmployee}
            onClose={() => setViewingEmployee(null)}
            goals={teamGoals.filter((g: any) => g.employeeId === viewingEmployee.id)}
            attendanceToday={teamAttendanceToday.find((t: any) => t.employeeId === viewingEmployee.id)}
          />
        )}
      </AnimatePresence>

      {/* Request New Hire ("Requirement") Modal */}
      <AnimatePresence>
        {showRequisitionModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRequisitionModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="bg-indigo-600 p-10 text-white flex justify-between items-start shrink-0">
                <div>
                  <h2 className="text-2xl font-black mb-1 tracking-tighter">
                    Request New Hire
                  </h2>
                  <p className="text-indigo-100 text-sm font-medium">
                    Submit a headcount request for HR/Admin review.
                  </p>
                </div>
                <button
                  onClick={() => setShowRequisitionModal(false)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-6 scrollbar-hide">
                {reqFormError && (
                  <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold">
                    {reqFormError}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={reqForm.title}
                    onChange={(e) => setReqForm({ ...reqForm, title: e.target.value })}
                    placeholder="e.g. Senior Product Designer"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Department
                    </label>
                    <select
                      value={reqForm.department}
                      onChange={(e) => setReqForm({ ...reqForm, department: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                    >
                      <option value="">Select department</option>
                      {departments.map((d: any) => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Location
                    </label>
                    <select
                      value={reqForm.location}
                      onChange={(e) => setReqForm({ ...reqForm, location: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                    >
                      <option value="">Select location</option>
                      {locations.map((l: any) => (
                        <option key={l.id} value={l.name}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Urgency
                    </label>
                    <select
                      value={reqForm.priority}
                      onChange={(e) => setReqForm({ ...reqForm, priority: e.target.value as any })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Target Hire Date
                    </label>
                    <input
                      type="date"
                      value={reqForm.targetHireDate}
                      onChange={(e) => setReqForm({ ...reqForm, targetHireDate: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Budget Range (optional)
                  </label>
                  <input
                    type="text"
                    value={reqForm.budgetRange}
                    onChange={(e) => setReqForm({ ...reqForm, budgetRange: e.target.value })}
                    placeholder="e.g. ₦1.2M - ₦1.8M"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Justification
                  </label>
                  <textarea
                    rows={4}
                    value={reqForm.justification}
                    onChange={(e) => setReqForm({ ...reqForm, justification: e.target.value })}
                    placeholder="Why is this hire needed right now?"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-3xl outline-none font-medium text-sm resize-none"
                  />
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 shrink-0">
                <button
                  onClick={() => {
                    setShowRequisitionModal(false);
                    setReqForm(emptyReqForm);
                    setReqFormError(null);
                  }}
                  className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  disabled={createRequisition.isPending}
                  onClick={handleSubmitRequisition}
                  className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {createRequisition.isPending ? "Submitting…" : "Submit Request"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Goal Modal */}
      <AnimatePresence>
        {showAssignGoalModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAssignGoalModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="bg-indigo-600 p-10 text-white flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black mb-1 tracking-tighter">Assign Goal</h2>
                  <p className="text-indigo-100 text-sm font-medium">Set a new objective for a direct report.</p>
                </div>
                <button onClick={() => setShowAssignGoalModal(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                  <X size={22} />
                </button>
              </div>
              <div className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Member</label>
                  <select
                    value={assignGoalForm.employeeId}
                    onChange={(e) => setAssignGoalForm({ ...assignGoalForm, employeeId: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                  >
                    <option value="">Select a direct report…</option>
                    {teamMembers.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.name} {r.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Goal Title</label>
                  <input
                    type="text"
                    value={assignGoalForm.title}
                    onChange={(e) => setAssignGoalForm({ ...assignGoalForm, title: e.target.value })}
                    placeholder="e.g. Ship the Q3 billing revamp"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</label>
                    <select
                      value={assignGoalForm.priority}
                      onChange={(e) => setAssignGoalForm({ ...assignGoalForm, priority: e.target.value })}
                      className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</label>
                    <input
                      type="date"
                      value={assignGoalForm.dueDate}
                      onChange={(e) => setAssignGoalForm({ ...assignGoalForm, dueDate: e.target.value })}
                      className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700"
                    />
                  </div>
                </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                <button onClick={() => setShowAssignGoalModal(false)} className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">
                  Cancel
                </button>
                <button
                  disabled={!assignGoalForm.employeeId || !assignGoalForm.title.trim() || assignGoal.isPending}
                  onClick={handleAssignGoal}
                  className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                  {assignGoal.isPending ? "Assigning…" : "Assign Goal"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manager Review Modal */}
      <AnimatePresence>
        {reviewingAssessment && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewingAssessment(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="bg-indigo-600 p-10 text-white flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black mb-1 tracking-tighter">
                    Review {reviewingAssessment.employeeName} {reviewingAssessment.employeeLastName}
                  </h2>
                  <p className="text-indigo-100 text-sm font-medium">{reviewingAssessment.cycleName}</p>
                </div>
                <button onClick={() => setReviewingAssessment(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                  <X size={22} />
                </button>
              </div>
              <div className="p-10 space-y-6">
                {reviewingAssessment.selfComment && (
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Self Comment</p>
                    <p className="text-sm font-medium text-slate-700">{reviewingAssessment.selfComment}</p>
                  </div>
                )}
                {reviewingAssessment.selfRating && (
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Self Rating</p>
                    <p className="text-sm font-bold text-slate-700">{reviewingAssessment.selfRating.replace(/_/g, " ")}</p>
                  </div>
                )}
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">KPI Evidence</p>
                  {reviewingEvidence.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium">No evidence documents were submitted for this assessment.</p>
                  ) : (
                    <div className="space-y-2">
                      {reviewingEvidence.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between bg-white px-4 py-3 rounded-xl">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={14} className="text-indigo-500 shrink-0" />
                            <span className="text-xs font-bold text-slate-700 truncate">{doc.name}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase shrink-0">{doc.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Rating</label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700"
                  >
                    <option value="">Select rating…</option>
                    {ratingScale.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comment</label>
                  <textarea
                    rows={5}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="What stood out this cycle?"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-3xl outline-none font-medium resize-none"
                  />
                </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                <button onClick={() => setReviewingAssessment(null)} className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">
                  Cancel
                </button>
                <button
                  disabled={!reviewRating || submitManagerReview.isPending}
                  onClick={handleSubmitManagerReview}
                  className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                  {submitManagerReview.isPending ? "Saving…" : "Submit Review"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManagerDashboard;
