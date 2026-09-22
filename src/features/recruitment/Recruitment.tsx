import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  MoreHorizontal,
  Search,
  Plus,
  Briefcase,
  ExternalLink,
  Calendar,
  Users,
  Clock,
  Filter,
  ChevronRight,
  X,
  CheckCircle2,
  FileText,
  Download,
  Mail,
  Phone,
  MapPin,
  Send,
  AlertCircle,
  PieChart as PieIcon,
  BarChart as BarIcon,
  TrendingUp,
  ChevronLeft,
  ArrowRight,
  Video,
  Target,
  Award,
  Globe,
  Github,
  Linkedin,
  MessageSquare,
  Trash2,
  List,
  LayoutGrid,
  Check,
  History,
  Share2,
  Zap,
  Rocket,
  Building2,
  Sparkles,
  Settings,
  User,
  GripVertical,
  CheckSquare,
  FilePlus,
  UserCheck,
  ShieldCheck,
  Timer,
  BarChart3,
  Edit3,
  ClipboardList,
  Trash,
  BriefcaseBusiness,
  FileUp,
  FilterX,
  Eye,
  Megaphone,
  UserPlus,
  Wallet,
  LayoutTemplate,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { Candidate, JobRequisition, Interview } from "../../types/index";
import { useAuth } from "../../context/AuthContext";
import {
  useJobRequisitions,
  useCreateJobRequisition,
  useApproveJobRequisition,
  useRejectJobRequisition,
  useDeleteJobRequisition,
  useDepartments,
  useCreateDepartment,
  useLocations,
  useCreateLocation,
  useCandidates,
  useCandidate,
  useCreateCandidate,
  useUpdateCandidateStatus,
  useSendCandidateMessage,
  useInterviews,
  useScheduleInterview,
  useSubmitScorecard,
  useOffers,
  useCreateOffer,
  useSendOffer,
  useRespondToOffer,
  candidateResumeUrl,
  downloadAuthenticatedBlob,
  useDirectory,
  useRecruitmentReport,
} from "../../api/client";
import { RecruitmentAnalyticsBody } from "./RecruitmentAnalytics";

const daysAgoLabel = (dateStr?: string) => {
  if (!dateStr) return "Applied recently";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return "Applied today";
  if (days === 1) return "Applied 1d ago";
  return `Applied ${days}d ago`;
};

const openExternalUrl = (url?: string) => {
  if (!url) return;
  const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  window.open(href, "_blank", "noopener,noreferrer");
};

const Recruitment: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "requisitions"
    | "pipeline"
    | "interviews"
    | "offers"
    | "analytics"
  >("dashboard");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "kanban">("grid");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null,
  );
  const [candidateDetailTab, setCandidateDetailTab] = useState<
    "profile" | "evaluation" | "interviews" | "timeline" | "message"
  >("profile");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [showJobPostingModal, setShowJobPostingModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleStep, setScheduleStep] = useState(1);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerStep, setOfferStep] = useState(1);

  const emptyScheduleForm = {
    candidateId: "",
    type: "Video" as Interview["type"],
    stage: "Technical" as Interview["stage"],
    dateTime: "",
    durationMinutes: 60,
    interviewerIds: [] as string[],
    meetingLink: "",
  };
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [scheduleFormError, setScheduleFormError] = useState<string | null>(null);

  const emptyOfferForm = {
    candidateId: "",
    title: "",
    department: "",
    salary: "",
    startDate: "",
    expiryDate: "",
  };
  const [offerForm, setOfferForm] = useState(emptyOfferForm);
  const [offerFormError, setOfferFormError] = useState<string | null>(null);

  const emptyReqForm = {
    title: "",
    department: "",
    location: "",
    employmentType: "Full-time",
    priority: "Medium" as "High" | "Medium" | "Low",
    targetHireDate: "",
    salaryMin: "",
    salaryMax: "",
    justification: "",
  };
  const [reqForm, setReqForm] = useState(emptyReqForm);
  const [reqFormError, setReqFormError] = useState<string | null>(null);

  const [showAddDept, setShowAddDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [showAddLoc, setShowAddLoc] = useState(false);
  const [newLocName, setNewLocName] = useState("");
  const [newLocAddress, setNewLocAddress] = useState("");

  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const emptyCandidateForm = {
    name: "",
    email: "",
    phone: "",
    currentTitle: "",
    source: "Career Page" as Candidate["source"],
  };
  const [candidateForm, setCandidateForm] = useState(emptyCandidateForm);
  const [candidateFormError, setCandidateFormError] = useState<string | null>(null);

  // Reused across the "Publish To Channels" checkboxes — only the channels
  // this app can actually act on (see the requisition submit handler).
  const [reqChannels, setReqChannels] = useState<string[]>(["Career Page"]);

  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);

  const [scoringInterviewId, setScoringInterviewId] = useState<string | null>(null);
  const emptyScorecardForm = {
    technical: 3,
    communication: 3,
    cultural: 3,
    notes: "",
    recommendation: "Maybe" as "Hire" | "Maybe" | "No Hire",
  };
  const [scorecardForm, setScorecardForm] = useState(emptyScorecardForm);

  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [scheduleCalendarCursor, setScheduleCalendarCursor] = useState(() => new Date());
  const [inviteEmailSubject, setInviteEmailSubject] = useState("");
  const [inviteEmailBody, setInviteEmailBody] = useState("");

  const [calendarCursor, setCalendarCursor] = useState(() => new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

  const { user } = useAuth();
  // Only HR Admin / Super Admin can open a requisition directly or review one
  // sitting in "Pending Approval"; Recruiters get read-only visibility here.
  const canManageRequisitions = user?.role === "SUPER_ADMIN" || user?.role === "HR_ADMIN";

  const { data: requisitions = [], isLoading: requisitionsLoading } = useJobRequisitions();
  const { data: departments = [] } = useDepartments();
  const createDepartment = useCreateDepartment();
  const { data: locations = [] } = useLocations();
  const createLocation = useCreateLocation();
  const { data: directory = [] } = useDirectory();
  const createRequisition = useCreateJobRequisition();
  const approveRequisition = useApproveJobRequisition();
  const rejectRequisition = useRejectJobRequisition();
  const deleteRequisitionMutation = useDeleteJobRequisition();

  const { data: candidates = [] } = useCandidates();
  const createCandidate = useCreateCandidate();
  const updateCandidateStatus = useUpdateCandidateStatus();
  const sendCandidateMessage = useSendCandidateMessage();
  const { data: interviews = [] } = useInterviews();
  const scheduleInterview = useScheduleInterview();
  const submitScorecard = useSubmitScorecard();
  const { data: offers = [] } = useOffers();
  const createOffer = useCreateOffer();
  const sendOffer = useSendOffer();
  const respondToOffer = useRespondToOffer();

  // The candidate list only carries base fields — timeline/interviews/scorecards
  // are joined server-side per candidate, so hydrate the full record once one
  // is selected. `candidateDetail` falls back to the lightweight list row
  // while this is in flight so the header renders immediately.
  const { data: fullSelectedCandidate } = useCandidate(selectedCandidate?.id ?? null);
  const candidateDetail: Candidate | null = selectedCandidate
    ? { ...selectedCandidate, ...(fullSelectedCandidate || {}) }
    : null;
  const { data: recruitmentReport } = useRecruitmentReport();

  const scorecardSummary = useMemo(() => {
    const entries = (candidateDetail?.interviews || []).flatMap((i: any) => i.scorecards || []);
    const avg = (key: "technical" | "communication" | "cultural") => {
      const vals = entries.map((s: any) => s[key]).filter((v: any) => v != null) as number[];
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    const recCounts: Record<string, number> = {};
    for (const s of entries) {
      if (s.recommendation === "Hire" || s.recommendation === "Maybe" || s.recommendation === "No Hire") {
        recCounts[s.recommendation] = (recCounts[s.recommendation] || 0) + 1;
      }
    }
    const overallRecommendation =
      Object.entries(recCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    return {
      entries,
      count: entries.length,
      technical: avg("technical"),
      communication: avg("communication"),
      cultural: avg("cultural"),
      overallRecommendation,
    };
  }, [candidateDetail]);

  const candidatesById = useMemo(
    () => new Map(candidates.map((c: Candidate) => [c.id, c])),
    [candidates],
  );

  const todayIso = new Date().toISOString().slice(0, 10);

  const calendarDays = useMemo(() => {
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first grid
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { date: Date | null; iso: string | null; interviewCount: number }[] = [];
    for (let i = 0; i < startOffset; i++) days.push({ date: null, iso: null, interviewCount: 0 });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const interviewCount = interviews.filter((it: Interview) => it.dateTime?.slice(0, 10) === iso).length;
      days.push({ date, iso, interviewCount });
    }
    return days;
  }, [calendarCursor, interviews]);

  const interviewerConflicts = useMemo(() => {
    if (!scheduleForm.dateTime || scheduleForm.interviewerIds.length === 0) return [];
    const start = new Date(scheduleForm.dateTime).getTime();
    if (!Number.isFinite(start)) return [];
    const end = start + scheduleForm.durationMinutes * 60000;
    const conflicts: { name: string; time: string }[] = [];
    const seen = new Set<string>();
    for (const it of interviews) {
      if (it.status === "Cancelled" || !it.dateTime) continue;
      const itStart = new Date(it.dateTime).getTime();
      const itEnd = itStart + (it.durationMinutes || 60) * 60000;
      if (start >= itEnd || end <= itStart) continue;
      for (const iid of it.interviewerIds || []) {
        if (!scheduleForm.interviewerIds.includes(iid)) continue;
        const person = directory.find((d: any) => d.id === iid);
        const time = new Date(it.dateTime).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
        const key = `${iid}-${it.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        conflicts.push({ name: person?.name || "An interviewer", time });
      }
    }
    return conflicts;
  }, [scheduleForm.dateTime, scheduleForm.durationMinutes, scheduleForm.interviewerIds, interviews, directory]);

  const timeSlotOptions = useMemo(() => {
    const slots = ["09:00", "11:00", "14:00", "16:00"];
    const day = scheduleForm.dateTime ? scheduleForm.dateTime.slice(0, 10) : null;
    if (!day) return [];
    return slots.map((time) => {
      const start = new Date(`${day}T${time}`).getTime();
      const end = start + scheduleForm.durationMinutes * 60000;
      const busy = interviews.some((it: Interview) => {
        if (it.status === "Cancelled" || !it.dateTime) return false;
        if (!(it.interviewerIds || []).some((id) => scheduleForm.interviewerIds.includes(id))) return false;
        const itStart = new Date(it.dateTime).getTime();
        const itEnd = itStart + (it.durationMinutes || 60) * 60000;
        return start < itEnd && end > itStart;
      });
      const label = new Date(`${day}T${time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      return { time, label, busy };
    });
  }, [scheduleForm.dateTime, scheduleForm.durationMinutes, scheduleForm.interviewerIds, interviews]);

  const calendarPanelInterviews = useMemo(() => {
    if (selectedCalendarDay) {
      return interviews
        .filter((it: Interview) => it.dateTime?.slice(0, 10) === selectedCalendarDay)
        .sort((a: Interview, b: Interview) => (a.dateTime || "").localeCompare(b.dateTime || ""));
    }
    return interviews
      .filter((it: Interview) => it.status === "Scheduled")
      .sort((a: Interview, b: Interview) => (a.dateTime || "").localeCompare(b.dateTime || ""))
      .slice(0, 5);
  }, [interviews, selectedCalendarDay]);

  const dashboardStats = useMemo(() => {
    const now = new Date();
    const openReqs = requisitions.filter((r) => r.status === "Open");
    const urgentOpen = openReqs.filter((r) => r.priority === "High").length;

    const appliedThisMonth = candidates.filter((c: Candidate) => {
      if (!c.appliedDate) return false;
      const d = new Date(c.appliedDate);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth()
      );
    }).length;

    const todayStr = now.toISOString().slice(0, 10);
    const interviewsToday = interviews.filter(
      (i: Interview) => i.dateTime?.slice(0, 10) === todayStr,
    ).length;

    const pendingOffers = offers.filter((o: any) => o.status === "sent");
    const expiringSoon = pendingOffers.filter((o: any) => {
      if (!o.expiryDate) return false;
      const daysLeft =
        (new Date(o.expiryDate).getTime() - now.getTime()) / 86400000;
      return daysLeft >= 0 && daysLeft <= 7;
    }).length;

    const hiredCount = candidates.filter(
      (c: Candidate) => c.status === "hired",
    ).length;
    const conversionRate = candidates.length
      ? Math.round((hiredCount / candidates.length) * 100)
      : 0;

    return {
      openPositions: openReqs.length,
      urgentOpen,
      totalApplicants: candidates.length,
      appliedThisMonth,
      interviewsTotal: interviews.length,
      interviewsToday,
      offersPending: pendingOffers.length,
      expiringSoon,
      hiredCount,
      conversionRate,
    };
  }, [requisitions, candidates, interviews, offers]);

  const funnelData = useMemo(() => {
    const stages: { key: Candidate["status"]; name: string; fill: string }[] = [
      { key: "applied", name: "Applied", fill: "#6366f1" },
      { key: "screening", name: "Screening", fill: "#818cf8" },
      { key: "interview", name: "Interview", fill: "#f59e0b" },
      { key: "offer", name: "Offer", fill: "#10b981" },
      { key: "hired", name: "Hired", fill: "#8b5cf6" },
    ];
    return stages.map((s) => ({
      name: s.name,
      fill: s.fill,
      value: candidates.filter((c: Candidate) => c.status === s.key).length,
    }));
  }, [candidates]);

  const sourceData = useMemo(() => {
    const total = candidates.length;
    if (!total) return [];
    const counts = candidates.reduce((acc: Record<string, number>, c: Candidate) => {
      acc[c.source] = (acc[c.source] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: Math.round(((count as number) / total) * 100),
    }));
  }, [candidates]);

  const openScheduleModal = () => {
    setScheduleForm({ ...emptyScheduleForm, candidateId: selectedCandidate?.id || "" });
    setScheduleFormError(null);
    setScheduleStep(1);
    setInviteEmailSubject("");
    setInviteEmailBody("");
    setShowScheduleModal(true);
  };

  const buildDefaultInviteEmail = (kind: "Standard Invite" | "Technical Prep" | "Casual Chat" = "Standard Invite") => {
    const candidate = candidates.find((c: Candidate) => c.id === scheduleForm.candidateId);
    const firstName = candidate?.name?.split(" ")[0] || "there";
    const roleTitle = currentJob?.title || "the role";
    const when = scheduleForm.dateTime
      ? new Date(scheduleForm.dateTime).toLocaleString("en-NG", { dateStyle: "full", timeStyle: "short" })
      : "a time we'll confirm shortly";
    const where = scheduleForm.meetingLink ? `\n\nDetails: ${scheduleForm.meetingLink}` : "";
    const intros: Record<string, string> = {
      "Standard Invite": `We'd like to schedule a ${scheduleForm.stage} interview with you for ${roleTitle} on ${when}.`,
      "Technical Prep": `Ahead of your ${scheduleForm.stage} interview for ${roleTitle} on ${when}, please come ready to walk through your recent work — no need to prepare slides.`,
      "Casual Chat": `Let's find some time to chat about ${roleTitle}. We've set up a relaxed ${scheduleForm.stage.toLowerCase()} conversation for ${when}.`,
    };
    setInviteEmailSubject(`Interview Invitation: ${roleTitle}`);
    setInviteEmailBody(`Hi ${firstName},\n\n${intros[kind]}${where}\n\nLooking forward to speaking with you.`);
  };

  const handleSendInvites = () => {
    if (!scheduleForm.candidateId) {
      setScheduleFormError("Pick a candidate for this interview.");
      return;
    }
    if (!scheduleForm.dateTime) {
      setScheduleFormError("Pick a date & time.");
      return;
    }
    setScheduleFormError(null);
    scheduleInterview.mutate(
      { ...scheduleForm, emailSubject: inviteEmailSubject, emailBody: inviteEmailBody },
      {
        onSuccess: () => setShowScheduleModal(false),
        onError: (err: any) => setScheduleFormError(err.message || "Failed to schedule interview."),
      },
    );
  };

  useEffect(() => {
    if (scheduleStep === 5 && !inviteEmailSubject && !inviteEmailBody) {
      buildDefaultInviteEmail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleStep]);

  const openOfferModal = () => {
    setOfferForm({
      ...emptyOfferForm,
      candidateId: selectedCandidate?.id || "",
      title: selectedCandidate?.currentTitle || "",
    });
    setOfferFormError(null);
    setOfferStep(1);
    setShowOfferModal(true);
  };

  const handleSendOffer = () => {
    if (!offerForm.candidateId || !offerForm.title.trim() || !offerForm.salary) {
      setOfferFormError("Candidate, title and salary are required.");
      return;
    }
    setOfferFormError(null);
    createOffer.mutate(
      {
        candidateId: offerForm.candidateId,
        title: offerForm.title.trim(),
        department: offerForm.department || undefined,
        salary: Number(String(offerForm.salary).replace(/[^\d.]/g, "")),
        startDate: offerForm.startDate || undefined,
        expiryDate: offerForm.expiryDate || undefined,
      },
      {
        onSuccess: (created: any) => {
          sendOffer.mutate(created.id, {
            onSuccess: () => setShowOfferModal(false),
            onError: (err: any) => setOfferFormError(err.message || "Offer created but failed to send."),
          });
        },
        onError: (err: any) => setOfferFormError(err.message || "Failed to create offer."),
      },
    );
  };

  const handleSubmitRequisition = () => {
    if (!reqForm.title.trim() || !reqForm.department || !reqForm.location) {
      setReqFormError("Job title, department and location are required.");
      return;
    }
    setReqFormError(null);

    const budgetRange =
      reqForm.salaryMin || reqForm.salaryMax
        ? `₦${Number(reqForm.salaryMin || 0).toLocaleString()} - ₦${Number(reqForm.salaryMax || 0).toLocaleString()}`
        : undefined;

    createRequisition.mutate(
      {
        title: reqForm.title.trim(),
        department: reqForm.department,
        location: reqForm.location,
        employmentType: reqForm.employmentType as JobRequisition["employmentType"],
        priority: reqForm.priority,
        targetHireDate: reqForm.targetHireDate || undefined,
        justification: reqForm.justification.trim() || undefined,
        budgetRange,
        isPubliclyListed: reqChannels.includes("Career Page"),
        channels: reqChannels,
      },
      {
        onSuccess: () => {
          setShowJobPostingModal(false);
          setReqForm(emptyReqForm);
          setShowAddDept(false);
          setShowAddLoc(false);
          setReqChannels(["Career Page"]);
        },
        onError: (err: any) => setReqFormError(err.message || "Failed to submit requisition."),
      },
    );
  };

  const handleAddDepartment = () => {
    if (!newDeptName.trim()) return;
    createDepartment.mutate(
      { name: newDeptName.trim() },
      {
        onSuccess: (created: any) => {
          setReqForm((f) => ({ ...f, department: created?.name || newDeptName.trim() }));
          setNewDeptName("");
          setShowAddDept(false);
        },
      },
    );
  };

  const handleAddLocation = () => {
    if (!newLocName.trim() || !newLocAddress.trim()) return;
    createLocation.mutate(
      { name: newLocName.trim(), address: newLocAddress.trim() },
      {
        onSuccess: (created: any) => {
          setReqForm((f) => ({ ...f, location: created?.name || newLocName.trim() }));
          setNewLocName("");
          setNewLocAddress("");
          setShowAddLoc(false);
        },
      },
    );
  };

  const candidateStageOrder = ["applied", "screening", "interview", "offer", "hired"] as const;

  const advanceCandidateStage = (candidate: Candidate) => {
    const idx = candidateStageOrder.indexOf(candidate.status as any);
    const next = candidateStageOrder[idx + 1];
    if (next) updateCandidateStatus.mutate({ id: candidate.id, status: next });
  };

  const openAddCandidateModal = () => {
    setCandidateForm(emptyCandidateForm);
    setCandidateFormError(null);
    setShowAddCandidateModal(true);
  };

  const handleAddCandidate = () => {
    if (!candidateForm.name.trim() || !candidateForm.email.trim()) {
      setCandidateFormError("Name and email are required.");
      return;
    }
    setCandidateFormError(null);
    createCandidate.mutate(
      {
        name: candidateForm.name.trim(),
        email: candidateForm.email.trim(),
        phone: candidateForm.phone.trim() || undefined,
        currentTitle: candidateForm.currentTitle.trim() || undefined,
        source: candidateForm.source,
        requisitionId: currentJob?.id || undefined,
      },
      {
        onSuccess: () => {
          setShowAddCandidateModal(false);
          setCandidateForm(emptyCandidateForm);
        },
        onError: (err: any) => setCandidateFormError(err.message || "Failed to add candidate."),
      },
    );
  };

  const handleSendMessage = () => {
    if (!candidateDetail) return;
    if (!messageSubject.trim() || !messageBody.trim()) {
      setMessageError("Subject and message are required.");
      return;
    }
    setMessageError(null);
    sendCandidateMessage.mutate(
      { id: candidateDetail.id, subject: messageSubject.trim(), body: messageBody.trim() },
      {
        onSuccess: () => {
          setMessageSubject("");
          setMessageBody("");
        },
        onError: (err: any) => setMessageError(err.message || "Failed to send message."),
      },
    );
  };

  const handleSubmitScorecard = (interviewId: string) => {
    submitScorecard.mutate(
      { interviewId, ...scorecardForm },
      {
        onSuccess: () => {
          setScoringInterviewId(null);
          setScorecardForm(emptyScorecardForm);
        },
      },
    );
  };

  const teamMembers = directory.slice(0, 3);
  const filteredTeamMembers = useMemo(
    () =>
      directory
        .filter((m: any) => m.name.toLowerCase().includes(teamSearchQuery.toLowerCase()))
        .slice(0, 9),
    [directory, teamSearchQuery],
  );
  const currentJob = requisitions.find((r) => r.id === activeJobId) || requisitions[0];

  const formatCurrency = (val: number | string) => {
    const num =
      typeof val === "string" ? parseFloat(val.replace(/[^\d.]/g, "")) : val;
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(num);
  };

  const renderDashboard = () => (
    <div className="space-y-10 pb-20">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[
          {
            label: "Open Positions",
            val: String(dashboardStats.openPositions),
            sub: `${dashboardStats.urgentOpen} Urgent`,
            icon: <Briefcase />,
            color: "indigo",
          },
          {
            label: "Total Applicants",
            val: String(dashboardStats.totalApplicants),
            sub:
              dashboardStats.appliedThisMonth > 0
                ? `+${dashboardStats.appliedThisMonth} this mo`
                : "No new applicants",
            icon: <Users />,
            color: "emerald",
          },
          {
            label: "Interviews",
            val: String(dashboardStats.interviewsTotal),
            sub: `Today: ${dashboardStats.interviewsToday}`,
            icon: <Calendar />,
            color: "amber",
          },
          {
            label: "Offers Pending",
            val: String(dashboardStats.offersPending),
            sub:
              dashboardStats.expiringSoon > 0
                ? `${dashboardStats.expiringSoon} Expiring`
                : "None expiring",
            icon: <Zap />,
            color: "rose",
          },
          {
            label: "Time to Hire",
            val:
              recruitmentReport?.summary?.avgTimeToFill != null
                ? `${recruitmentReport.summary.avgTimeToFill}d`
                : "—",
            sub:
              recruitmentReport?.summary?.avgDaysOpen != null
                ? `Open Avg: ${recruitmentReport.summary.avgDaysOpen}d`
                : "—",
            icon: <Clock />,
            color: "violet",
          },
          {
            label: "Conv. Rate",
            val: `${dashboardStats.conversionRate}%`,
            sub: `${dashboardStats.hiredCount} Hired`,
            icon: <TrendingUp />,
            color: "sky",
          },
        ].map((m, i) => (
          <motion.div
            whileHover={{ y: -5 }}
            key={i}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm group"
          >
            <div
              className={`w-10 h-10 bg-${m.color}-50 text-${m.color}-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
            >
              {m.icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {m.label}
            </p>
            <h4 className="text-2xl font-black text-slate-800 tracking-tighter tabular-nums">
              {m.val}
            </h4>
            <p className="text-[10px] font-bold text-slate-400 mt-2">{m.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Analytics Funnel */}
        <section className="lg:col-span-2 bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-800">
                Hiring Velocity Funnel
              </h3>
              <p className="text-sm text-slate-400 font-medium">
                Current candidate distribution by pipeline stage.
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase">
                LinkedIn Source
              </button>
              <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase">
                Referrals
              </button>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelData}
                layout="vertical"
                margin={{ left: 40, right: 40 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f1f5f9"
                />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 800, fill: "#64748b" }}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={40}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Source Breakdown */}
        <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-black text-slate-800 mb-10">
            Sourcing Effectiveness
          </h3>
          {sourceData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center min-h-[250px] text-center">
              <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
                No candidates yet
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          ["#6366f1", "#10b981", "#f59e0b", "#ef4444"][index % 4]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="space-y-4 mt-6">
            {sourceData.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: [
                        "#6366f1",
                        "#10b981",
                        "#f59e0b",
                        "#ef4444",
                      ][i],
                    }}
                  />
                  <span className="text-[11px] font-black text-slate-500 uppercase">
                    {s.name}
                  </span>
                </div>
                <span className="text-sm font-black text-slate-800">
                  {s.value}%
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const [reqFilters, setReqFilters] = useState({
    dept: "All",
    loc: "All",
    prio: "All",
  });

  const filteredRequisitions = requisitions.filter((req) => {
    return (
      (reqFilters.dept === "All" || req.department === reqFilters.dept) &&
      (reqFilters.loc === "All" || req.location === reqFilters.loc) &&
      (reqFilters.prio === "All" || req.priority === reqFilters.prio)
    );
  });

  const renderRequisitions = () => (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2.5 rounded-xl transition-all ${viewMode === "grid" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2.5 rounded-xl transition-all ${viewMode === "list" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"}`}
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`p-2.5 rounded-xl transition-all ${viewMode === "kanban" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"}`}
          >
            <LayoutTemplate size={18} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search REQs..."
              className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-[1.5rem] outline-none text-sm font-bold w-48 focus:w-64 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
            />
          </div>

          <select
            value={reqFilters.dept}
            onChange={(e) =>
              setReqFilters({ ...reqFilters, dept: e.target.value })
            }
            className="pl-4 pr-10 py-3.5 bg-white border border-slate-200 rounded-[1.5rem] text-xs font-black uppercase tracking-widest text-slate-600 outline-none hover:border-indigo-300 transition-all shadow-sm cursor-pointer appearance-none"
            style={{ backgroundImage: "none" }}
          >
            <option value="All">All Depts</option>
            {departments.map((d: any) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={reqFilters.prio}
            onChange={(e) =>
              setReqFilters({ ...reqFilters, prio: e.target.value })
            }
            className="pl-4 pr-10 py-3.5 bg-white border border-slate-200 rounded-[1.5rem] text-xs font-black uppercase tracking-widest text-slate-600 outline-none hover:border-indigo-300 transition-all shadow-sm cursor-pointer appearance-none"
          >
            <option value="All">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {canManageRequisitions && (
            <button
              onClick={() => setShowJobPostingModal(true)}
              className="px-6 py-3.5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              <FilePlus size={18} />{" "}
              <span className="hidden sm:inline">New Req</span>
            </button>
          )}
        </div>
      </div>

      {requisitionsLoading ? (
        <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Loading requisitions…
          </p>
        </div>
      ) : viewMode === "kanban" ? (
        <div className="flex gap-6 overflow-x-auto pb-10 scrollbar-hide px-2">
          {["Pending Approval", "Open", "On Hold", "Filled", "Cancelled", "Rejected"].map((status) => {
            const statusColor =
              status === "Open"
                ? "emerald"
                : status === "On Hold"
                  ? "amber"
                  : status === "Filled"
                    ? "indigo"
                    : status === "Pending Approval"
                      ? "sky"
                      : status === "Rejected"
                        ? "rose"
                        : "slate";
            const items = filteredRequisitions.filter(
              (r) => r.status === status,
            );

            return (
              <div key={status} className="shrink-0 w-80 flex flex-col gap-6">
                <div className="flex justify-between items-center px-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full bg-${statusColor}-500`}
                    />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">
                      {status}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black">
                    {items.length}
                  </span>
                </div>

                <div className="flex-1 space-y-4 min-h-[500px] p-2 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                  {items.map((req) => (
                    <motion.div
                      layoutId={req.id}
                      key={req.id}
                      whileHover={{ y: -4 }}
                      className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-indigo-400 transition-all relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span
                          className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${req.priority === "High" ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-500"}`}
                        >
                          {req.priority}
                        </span>
                        <button
                          onClick={() => {
                            setActiveJobId(req.id);
                            setActiveTab("pipeline");
                          }}
                          className="text-slate-300 hover:text-indigo-600"
                          title="View pipeline"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                      <h4 className="text-sm font-black text-slate-800 mb-1">
                        {req.title}
                      </h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                        {req.department}
                      </p>

                      <div className="flex items-center gap-2 mb-6">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white"
                            />
                          ))}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">
                          +{" "}
                          {req.applicantsByStage.applied +
                            req.applicantsByStage.screening +
                            req.applicantsByStage.interview}{" "}
                          Candidates
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <img
                            src={req.managerAvatar || `https://i.pravatar.cc/150?u=${req.id}`}
                            className="w-6 h-6 rounded-lg object-cover"
                          />
                          <span className="text-[9px] font-black text-slate-500">
                            {req.hiringManager.split(" ")[0]}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-black ${req.daysOpen > 30 ? "text-rose-500" : "text-emerald-500"}`}
                        >
                          {req.daysOpen}d
                        </span>
                      </div>

                      {status === "Pending Approval" && canManageRequisitions && (
                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                          <button
                            disabled={rejectRequisition.isPending}
                            onClick={() => {
                              const reason = window.prompt("Reason for rejecting this requisition? (optional)") || undefined;
                              rejectRequisition.mutate({ id: req.id, reason });
                            }}
                            className="flex-1 py-2.5 bg-white border border-slate-200 text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                          <button
                            disabled={approveRequisition.isPending}
                            onClick={() => approveRequisition.mutate(req.id)}
                            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                        </div>
                      )}

                      {req.status === "Rejected" && req.rejectionReason && (
                        <p className="mt-4 pt-4 border-t border-slate-50 text-[9px] font-bold text-rose-500 italic leading-relaxed">
                          "{req.rejectionReason}"
                        </p>
                      )}
                    </motion.div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest py-10">
                      Nothing here
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRequisitions.map((req) => (
            <motion.div
              key={req.id}
              layout
              whileHover={{ y: -8 }}
              className="bg-white rounded-[3.5rem] p-10 border border-slate-200 shadow-sm relative group overflow-hidden"
            >
              <div
                className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity`}
              >
                <Briefcase size={120} strokeWidth={1} />
              </div>
              <div className="flex justify-between items-start mb-8">
                <span
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                    req.priority === "High"
                      ? "bg-rose-50 text-rose-600"
                      : "bg-slate-50 text-slate-500"
                  }`}
                >
                  {req.priority} Priority
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest ${
                      req.status === "Open"
                        ? "text-emerald-500"
                        : req.status === "Pending Approval"
                          ? "text-sky-500"
                          : req.status === "Rejected"
                            ? "text-rose-500"
                            : "text-amber-500"
                    }`}
                  >
                    {req.status}
                  </span>
                  <button
                    onClick={() => {
                      setActiveJobId(req.id);
                      setActiveTab("pipeline");
                    }}
                    className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                    title="View pipeline"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                {req.title}
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">
                {req.department} • {req.location}
              </p>

              {/* Pipeline Breakdown */}
              <div className="grid grid-cols-5 gap-1.5 mb-10">
                {[
                  { l: "App", v: req.applicantsByStage.applied, c: "indigo" },
                  { l: "Scr", v: req.applicantsByStage.screening, c: "sky" },
                  { l: "Int", v: req.applicantsByStage.interview, c: "amber" },
                  { l: "Off", v: req.applicantsByStage.offer, c: "emerald" },
                  { l: "Hir", v: req.applicantsByStage.hired, c: "violet" },
                ].map((s, i) => (
                  <div
                    key={i}
                    className={`py-4 bg-${s.c}-50 rounded-2xl text-center border border-${s.c}-100/50`}
                  >
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">
                      {s.l}
                    </p>
                    <p className={`text-lg font-black text-${s.c}-600`}>
                      {s.v}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={
                        req.managerAvatar || "https://i.pravatar.cc/150?u=man"
                      }
                      className="w-8 h-8 rounded-lg object-cover shadow-md"
                    />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                  </div>
                  <span className="text-[10px] font-black text-slate-600 uppercase">
                    HM: {req.hiringManager}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black uppercase ${req.daysOpen > 45 ? "text-rose-500" : "text-slate-400"}`}
                  >
                    {req.daysOpen}d Open
                  </span>
                  <button
                    onClick={() => {
                      setActiveJobId(req.id);
                      setActiveTab("pipeline");
                    }}
                    className="p-3 bg-slate-900 text-white rounded-xl shadow-xl hover:bg-indigo-600 transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              {req.status === "Pending Approval" && canManageRequisitions && (
                <div className="flex gap-3 mt-6 pt-6 border-t border-slate-100">
                  <button
                    disabled={rejectRequisition.isPending}
                    onClick={() => {
                      const reason = window.prompt("Reason for rejecting this requisition? (optional)") || undefined;
                      rejectRequisition.mutate({ id: req.id, reason });
                    }}
                    className="flex-1 py-3 bg-white border border-slate-200 text-rose-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    disabled={approveRequisition.isPending}
                    onClick={() => approveRequisition.mutate(req.id)}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                </div>
              )}
              {req.status === "Rejected" && req.rejectionReason && (
                <p className="mt-6 pt-6 border-t border-slate-100 text-xs font-bold text-rose-500 italic leading-relaxed">
                  "{req.rejectionReason}"
                </p>
              )}
            </motion.div>
          ))}
          {filteredRequisitions.length === 0 && (
            <div className="col-span-full p-16 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
              <Briefcase className="mx-auto w-14 h-14 text-slate-300 mb-4" />
              <h4 className="text-slate-400 font-bold uppercase tracking-widest text-sm">
                No requisitions yet
              </h4>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-10 py-6 w-12">
                  <div className="w-4 h-4 border-2 border-slate-200 rounded" />
                </th>
                <th className="px-10 py-6">Requisition Info</th>
                <th className="px-8 py-6">Manager</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-center">Pipeline (Total)</th>
                <th className="px-8 py-6">Priority</th>
                <th className="px-8 py-6">Time Open</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRequisitions.map((req) => (
                <tr
                  key={req.id}
                  className="group hover:bg-slate-50/30 transition-all"
                >
                  <td className="px-10 py-5">
                    <div className="w-4 h-4 border-2 border-slate-200 rounded group-hover:border-indigo-400" />
                  </td>
                  <td className="px-10 py-5">
                    <div>
                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                        {req.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {req.id} • {req.location}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          req.managerAvatar || "https://i.pravatar.cc/150?u=man"
                        }
                        className="w-8 h-8 rounded-lg"
                      />
                      <span className="text-xs font-bold text-slate-700">
                        {req.hiringManager}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span
                      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${
                        req.status === "Open"
                          ? "bg-emerald-50 text-emerald-600"
                          : req.status === "Pending Approval"
                            ? "bg-sky-50 text-sky-600"
                            : req.status === "Rejected"
                              ? "bg-rose-50 text-rose-600"
                              : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-sm font-black text-indigo-600">
                        {req.applicantsByStage.applied +
                          req.applicantsByStage.screening +
                          req.applicantsByStage.interview +
                          req.applicantsByStage.offer}
                      </span>
                      <Users size={12} className="text-slate-300" />
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span
                      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${req.priority === "High" ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-500"}`}
                    >
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span
                      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${req.daysOpen > 30 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}
                    >
                      {req.daysOpen} Days
                    </span>
                  </td>
                  <td className="px-10 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      {req.status === "Pending Approval" && canManageRequisitions && (
                        <>
                          <button
                            disabled={rejectRequisition.isPending}
                            onClick={() => {
                              const reason = window.prompt("Reason for rejecting this requisition? (optional)") || undefined;
                              rejectRequisition.mutate({ id: req.id, reason });
                            }}
                            className="px-3 py-3 bg-white border rounded-xl text-rose-500 hover:bg-rose-50 shadow-sm text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                          >
                            Reject
                          </button>
                          <button
                            disabled={approveRequisition.isPending}
                            onClick={() => approveRequisition.mutate(req.id)}
                            className="px-3 py-3 bg-indigo-600 text-white rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                          >
                            Approve
                          </button>
                        </>
                      )}
                      {canManageRequisitions && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete requisition "${req.title}"? This can't be undone.`)) {
                              deleteRequisitionMutation.mutate(req.id);
                            }
                          }}
                          className="p-3 bg-white border rounded-xl text-slate-400 hover:text-rose-600 shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setActiveJobId(req.id);
                          setActiveTab("pipeline");
                        }}
                        className="p-3 bg-white border rounded-xl text-slate-400 hover:text-indigo-600 shadow-sm"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRequisitions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-10 py-16 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    No requisitions yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderPipeline = () => {
    const columns = [
      { id: "applied", label: "New Apps", color: "indigo" },
      { id: "screening", label: "Screening", color: "sky" },
      { id: "interview", label: "Interview", color: "amber" },
      { id: "offer", label: "Offer", color: "emerald" },
      { id: "hired", label: "Hired", color: "violet" },
      { id: "rejected", label: "Rejected", color: "rose" },
    ];

    return (
      <div className="space-y-10 pb-20 overflow-x-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.8rem] flex items-center justify-center shadow-inner">
              <Briefcase size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Active Pipeline
              </p>
              <h2 className="text-2xl font-black text-slate-800">
                {currentJob?.title || "Job Selection"}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {teamMembers.map((m) => (
                <img
                  key={m.id}
                  src={m.avatar}
                  className="w-10 h-10 rounded-2xl border-4 border-white shadow-md ring-1 ring-slate-100"
                />
              ))}
              {directory.length > teamMembers.length && (
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-white text-[10px] font-black">
                  +{directory.length - teamMembers.length}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-10 scrollbar-hide px-2">
          {columns.map((col) => (
            <div key={col.id} className="shrink-0 w-80 flex flex-col gap-6">
              <div className="flex justify-between items-center px-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full bg-${col.color}-500`}
                  />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">
                    {col.label}
                  </h3>
                </div>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black">
                  {candidates.filter((c: Candidate) => c.status === col.id).length}
                </span>
              </div>

              <div className="flex-1 space-y-4 min-h-[600px] p-2 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                {candidates
                  .filter((c: Candidate) => c.status === col.id)
                  .map((cand: Candidate) => (
                  <motion.div
                    key={cand.id}
                    layoutId={cand.id}
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, info) => {
                      const idx = columns.findIndex((c2) => c2.id === col.id);
                      const nextCol =
                        info.offset.x > 100
                          ? columns[idx + 1]
                          : info.offset.x < -100
                            ? columns[idx - 1]
                            : null;
                      if (nextCol) {
                        updateCandidateStatus.mutate({ id: cand.id, status: nextCol.id });
                      }
                    }}
                    whileHover={{
                      scale: 1.02,
                      y: -4,
                      boxShadow:
                        "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                      zIndex: 10,
                    }}
                    whileDrag={{
                      scale: 1.1,
                      zIndex: 50,
                      cursor: "grabbing",
                      boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
                    }}
                    onClick={() => setSelectedCandidate(cand)}
                    className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing group hover:border-indigo-400 transition-all relative overflow-hidden"
                  >
                    <div
                      className={`absolute top-0 right-0 w-12 h-12 bg-${col.color}-50 rounded-bl-3xl -mr-6 -mt-6 group-hover:scale-150 transition-transform`}
                    />
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        <img
                          src={
                            cand.avatar ||
                            `https://ui-avatars.com/api/?name=${cand.name}`
                          }
                          className="w-12 h-12 rounded-xl object-cover shadow-lg pointer-events-none"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-lg flex items-center justify-center shadow-md">
                          <Star
                            size={10}
                            fill="#f59e0b"
                            className="text-amber-500"
                          />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 leading-none group-hover:text-indigo-600 transition-colors pointer-events-none">
                          {cand.name}
                        </h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 pointer-events-none">
                          {daysAgoLabel(cand.appliedDate)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pointer-events-none">
                      <p className="text-xs font-bold text-slate-600 truncate">
                        {cand.currentTitle}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {cand.skills.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[8px] font-black uppercase rounded tracking-tighter"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-50">
                      <div className="flex items-center gap-1.5 pointer-events-none">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${(cand.experienceYears || 0) > 5 ? "bg-indigo-500" : "bg-slate-300"}`}
                        />
                        <span className="text-[9px] font-black text-slate-400 uppercase">
                          {cand.source}
                        </span>
                      </div>
                      <div
                        className="flex gap-1 relative z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            window.location.href = `mailto:${cand.email}`;
                          }}
                          className="p-2 bg-slate-50 text-slate-300 group-hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"
                          title={`Email ${cand.name}`}
                        >
                          <Mail size={12} />
                        </button>
                        <button
                          onClick={() => advanceCandidateStage(cand)}
                          disabled={cand.status === "hired" || cand.status === "rejected"}
                          className="p-2 bg-slate-50 text-slate-300 group-hover:text-amber-500 rounded-lg hover:bg-amber-50 transition-all disabled:opacity-30 disabled:pointer-events-none"
                          title="Advance to next stage"
                        >
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {col.id === "applied" && (
                  <button
                    onClick={openAddCandidateModal}
                    className="w-full py-6 border-2 border-dashed border-slate-200 text-slate-300 hover:border-indigo-200 hover:text-indigo-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <Plus
                      size={20}
                      className="group-hover:scale-110 transition-transform"
                    />
                    Add Candidate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderOffers = () => (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">
            Offer Ledger
          </h2>
          <p className="text-sm text-slate-500 font-medium italic">
            Tracking extensions, negotiations, and formal sign-offs.
          </p>
        </div>
        <button
          onClick={openOfferModal}
          className="px-8 py-3.5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2"
        >
          <Plus size={18} /> Generate Offer Letter
        </button>
      </div>

      {offers.length === 0 ? (
        <div className="py-24 text-center text-slate-400 font-bold text-sm">
          No offers yet. Move a candidate to the pipeline and generate one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {offers.map((offer: any) => {
            const candidate = candidatesById.get(offer.candidateId);
            const color =
              offer.status === "accepted" ? "emerald" : offer.status === "declined" || offer.status === "rescinded" ? "rose" : "amber";
            return (
              <motion.div
                key={offer.id}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group"
              >
                <div
                  className={`absolute top-0 right-0 w-16 h-16 bg-${color}-50 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform`}
                />
                <div className="flex justify-between items-start mb-8">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner">
                    <Zap size={28} className={`text-${color}-500`} fill="currentColor" />
                  </div>
                  <span
                    className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                      offer.status === "accepted"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-slate-50 text-slate-500 border-slate-100"
                    }`}
                  >
                    {offer.status.replace("_", " ")}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-1">{candidate?.name || "Unknown candidate"}</h3>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6">{offer.title}</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400 uppercase">Annual Package</span>
                    <span className="text-slate-800">{formatCurrency(offer.salary)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400 uppercase">Expires</span>
                    <span className="font-black text-slate-800">{offer.expiryDate || "—"}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-10">
                  {offer.status === "sent" ? (
                    <>
                      <button
                        onClick={() => respondToOffer.mutate({ id: offer.id, decision: "accepted" })}
                        className="flex-1 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                      >
                        Mark Accepted
                      </button>
                      <button
                        onClick={() => respondToOffer.mutate({ id: offer.id, decision: "declined" })}
                        className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                      >
                        Mark Declined
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => candidate && setSelectedCandidate(candidate)}
                      className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                      View Candidate
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Recruiter Master Header */}
      <div className="flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-100 group">
            <Rocket
              size={28}
              fill="currentColor"
              className="group-hover:scale-110 transition-transform"
            />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
              Recruitment OS
            </h1>
            <p className="text-slate-500 font-medium">
              {dashboardStats.totalApplicants > 0 ? (
                <>
                  Candidate conversion rate is currently at{" "}
                  <b className="text-emerald-500">
                    {dashboardStats.conversionRate}%
                  </b>
                  .
                </>
              ) : (
                "No candidate pipeline activity yet."
              )}
            </p>
          </div>
        </div>

        <div className="flex bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-sm w-full lg:w-auto overflow-x-auto scrollbar-hide">
          {[
            {
              id: "dashboard",
              name: "Dashboard",
              icon: <LayoutPanelLeft size={18} />,
            },
            {
              id: "requisitions",
              name: "Open Jobs",
              icon: <Briefcase size={18} />,
            },
            { id: "pipeline", name: "Kanban", icon: <LayoutGrid size={18} /> },
            {
              id: "interviews",
              name: "Interviews",
              icon: <Calendar size={18} />,
            },
            { id: "offers", name: "Offers", icon: <Award size={18} /> },
            {
              id: "analytics",
              name: "Intelligence",
              icon: <TrendingUp size={18} />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.4 }}
        >
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "requisitions" && renderRequisitions()}
          {activeTab === "pipeline" && renderPipeline()}
          {activeTab === "offers" && renderOffers()}
          {activeTab === "analytics" && <RecruitmentAnalyticsBody />}
          {activeTab === "interviews" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
              <div className="lg:col-span-3 bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-12">
                  <h3 className="text-2xl font-black text-slate-800">
                    Global Interview Calendar
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCalendarCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                      className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <span className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">
                      {calendarCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </span>
                    <button
                      onClick={() => setCalendarCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                      className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-4">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (d) => (
                      <div
                        key={d}
                        className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest pb-4"
                      >
                        {d}
                      </div>
                    ),
                  )}
                  {calendarDays.map((day, i) => {
                    const isToday = day.iso === todayIso;
                    const isSelected = day.iso && day.iso === selectedCalendarDay;
                    return (
                      <div
                        key={i}
                        onClick={() => day.iso && setSelectedCalendarDay(isSelected ? null : day.iso)}
                        className={`h-24 rounded-2xl border flex flex-col p-3 transition-all relative group ${
                          !day.iso
                            ? "border-transparent"
                            : isSelected
                              ? "border-indigo-600 bg-indigo-50 ring-4 ring-indigo-500/10 shadow-xl cursor-pointer"
                              : isToday
                                ? "border-indigo-600 bg-indigo-50/20 ring-4 ring-indigo-500/5 shadow-xl cursor-pointer"
                                : "border-slate-100 hover:bg-slate-50 cursor-pointer"
                        }`}
                      >
                        {day.date && (
                          <>
                            <span className="text-xs font-black text-slate-400">
                              {day.date.getDate()}
                            </span>
                            {day.interviewCount > 0 && (
                              <div className="mt-auto space-y-1">
                                <div className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[8px] font-black uppercase truncate shadow-sm">
                                  Interview ({day.interviewCount})
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-10">
                <section className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                  <Clock className="absolute -bottom-8 -right-8 w-40 h-40 text-indigo-500/10 rotate-12" />
                  <h4 className="text-xl font-black mb-8 text-indigo-400 flex items-center gap-3">
                    <Video size={20} />{" "}
                    {selectedCalendarDay
                      ? new Date(selectedCalendarDay).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "Upcoming Syncs"}
                  </h4>
                  <div className="space-y-6">
                    {calendarPanelInterviews.length === 0 && (
                      <p className="text-xs text-white/40 font-bold">
                        {selectedCalendarDay ? "No interviews on this day." : "No interviews scheduled yet."}
                      </p>
                    )}
                    {calendarPanelInterviews.map((it: Interview) => (
                      <div
                        key={it.id}
                        className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm group hover:bg-white/10 transition-all cursor-pointer"
                        onClick={() => {
                          const c = candidatesById.get(it.candidateId);
                          if (c) setSelectedCandidate(c);
                        }}
                      >
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">
                          {it.stage} Round
                        </p>
                        <p className="text-sm font-black mb-6">
                          {candidatesById.get(it.candidateId)?.name || "Candidate"}
                        </p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Clock size={12} className="text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {it.dateTime ? new Date(it.dateTime).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "TBD"}
                            </span>
                          </div>
                          <button className="p-2 bg-indigo-600 text-white rounded-lg group-hover:scale-110 transition-transform">
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={openScheduleModal}
                    className="w-full mt-10 py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Plus size={16} /> New Interview
                  </button>
                </section>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Candidate Detail Slide-over */}
      <AnimatePresence>
        {candidateDetail && (
          <div className="fixed inset-0 z-[150] overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCandidate(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl flex flex-col"
            >
              <div className="p-10 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <img
                      src={
                        candidateDetail.avatar ||
                        `https://ui-avatars.com/api/?name=${candidateDetail.name}`
                      }
                      className="w-24 h-24 rounded-[2.5rem] object-cover border-8 border-white shadow-2xl"
                    />
                    <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg border-2 border-indigo-50 ring-4 ring-white">
                      <span className="text-[10px] font-black text-indigo-600">
                        {candidateDetail.rating}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">
                      {candidateDetail.name}
                    </h2>
                    <p className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em]">
                      {candidateDetail.currentTitle} •{" "}
                      {candidateDetail.experienceYears || 0}y Experience
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        {candidateDetail.status}
                      </span>
                      <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        {candidateDetail.source}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  {candidateDetail.resumeFileKey && (
                    <button
                      onClick={() =>
                        downloadAuthenticatedBlob(
                          candidateResumeUrl(candidateDetail.id),
                          `${candidateDetail.name.replace(/\s+/g, "_")}_Resume`,
                        )
                      }
                      className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all shadow-sm"
                      title="Download resume"
                    >
                      <Download size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedCandidate(null)}
                    className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 rounded-2xl transition-all shadow-sm"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="px-10 border-b border-slate-100 flex gap-12 shrink-0">
                {[
                  {
                    id: "profile",
                    label: "Full Profile",
                    icon: <User size={14} />,
                  },
                  {
                    id: "evaluation",
                    label: "Evaluation",
                    icon: <Target size={14} />,
                  },
                  {
                    id: "interviews",
                    label: "Interviews",
                    icon: <Calendar size={14} />,
                  },
                  {
                    id: "timeline",
                    label: "Timeline",
                    icon: <History size={14} />,
                  },
                  {
                    id: "message",
                    label: "Comm Thread",
                    icon: <Mail size={14} />,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCandidateDetailTab(tab.id as any)}
                    className={`py-6 text-[10px] font-black uppercase tracking-[0.2em] relative flex items-center gap-2 transition-all ${candidateDetailTab === tab.id ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    {tab.icon} {tab.label}
                    {candidateDetailTab === tab.id && (
                      <motion.div
                        layoutId="candTab"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full"
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={candidateDetailTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {candidateDetailTab === "profile" && (
                      <div className="space-y-12">
                        <section className="grid grid-cols-2 gap-12">
                          <div className="space-y-8">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                              Contact Information
                            </h3>
                            <div className="space-y-6">
                              <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center">
                                  <Mail size={20} />
                                </div>
                                <span className="text-sm font-bold text-slate-700">
                                  {candidateDetail.email}
                                </span>
                              </div>
                              <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center">
                                  <Phone size={20} />
                                </div>
                                <span className="text-sm font-bold text-slate-700">
                                  {candidateDetail.phone}
                                </span>
                              </div>
                              <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center">
                                  <MapPin size={20} />
                                </div>
                                <span className="text-sm font-bold text-slate-700">
                                  {candidateDetail.location}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-8">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                              Social Footprint
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                              <button
                                onClick={() => openExternalUrl(candidateDetail.linkedinUrl)}
                                disabled={!candidateDetail.linkedinUrl}
                                className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:border-indigo-200 transition-all group text-center disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <Linkedin
                                  size={28}
                                  className="mx-auto mb-3 text-slate-300 group-hover:text-indigo-600"
                                />
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                  LinkedIn
                                </span>
                              </button>
                              <button
                                onClick={() => openExternalUrl(candidateDetail.githubUrl)}
                                disabled={!candidateDetail.githubUrl}
                                className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:border-indigo-200 transition-all group text-center disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <Github
                                  size={28}
                                  className="mx-auto mb-3 text-slate-300 group-hover:text-slate-900"
                                />
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                  GitHub
                                </span>
                              </button>
                              <button
                                onClick={() => openExternalUrl(candidateDetail.portfolioUrl)}
                                disabled={!candidateDetail.portfolioUrl}
                                className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:border-indigo-200 transition-all group text-center disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <Globe
                                  size={28}
                                  className="mx-auto mb-3 text-slate-300 group-hover:text-emerald-500"
                                />
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                  Web
                                </span>
                              </button>
                            </div>
                          </div>
                        </section>

                        <section className="bg-indigo-600 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-100">
                          <div className="absolute top-0 right-0 p-12 text-white/5 rotate-12">
                            <Rocket size={150} />
                          </div>
                          <h3 className="text-sm font-black text-indigo-200 uppercase tracking-[0.2em] mb-10">
                            Technical Skill Match
                          </h3>
                          <div className="flex flex-wrap gap-4 relative z-10">
                            {candidateDetail.skills.map((s) => (
                              <span
                                key={s}
                                className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl"
                              >
                                {s}
                              </span>
                            ))}
                            <button className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center transition-all">
                              <Plus size={20} />
                            </button>
                          </div>
                        </section>

                        <section className="space-y-8">
                          <div className="flex justify-between items-center">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                              Resume
                            </h3>
                            {candidateDetail.resumeFileKey && (
                              <button
                                type="button"
                                onClick={() => downloadAuthenticatedBlob(candidateResumeUrl(candidateDetail.id), `${candidateDetail.name.replace(/\s+/g, '_')}_Resume`)}
                                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Download size={14} /> Download Document
                              </button>
                            )}
                          </div>
                          <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 min-h-[200px] relative flex items-center justify-center">
                            {candidateDetail.resumeFileKey ? (
                              <button
                                type="button"
                                onClick={() => downloadAuthenticatedBlob(candidateResumeUrl(candidateDetail.id), `${candidateDetail.name.replace(/\s+/g, '_')}_Resume`)}
                                className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
                              >
                                <Download size={16} /> Download Resume
                              </button>
                            ) : (
                              <p className="text-sm font-bold text-slate-400">No resume on file for this candidate.</p>
                            )}
                          </div>
                        </section>
                      </div>
                    )}

                    {candidateDetailTab === "evaluation" && (
                      <div className="space-y-12">
                        <section className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden relative">
                          <div className="flex items-center justify-between mb-12">
                            <h3 className="text-xl font-black text-slate-800">
                              Recruiter Scorecard
                            </h3>
                            <button
                              onClick={() => setCandidateDetailTab("interviews")}
                              className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all"
                              title="Log feedback for an interview"
                            >
                              <Edit3 size={20} />
                            </button>
                          </div>
                          {scorecardSummary.count === 0 ? (
                            <p className="text-sm text-slate-400 font-bold">
                              No scorecards submitted yet. Log feedback from the Interviews tab once a round is complete.
                            </p>
                          ) : (
                            <div className="space-y-10">
                              {[
                                { l: "Technical", v: scorecardSummary.technical, c: "indigo" },
                                { l: "Communication", v: scorecardSummary.communication, c: "emerald" },
                                { l: "Cultural Fit", v: scorecardSummary.cultural, c: "violet" },
                              ].map((m, i) => (
                                <div key={i} className="space-y-4">
                                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                                    <span className="text-slate-400">{m.l}</span>
                                    <span className={`text-${m.c}-600 font-mono`}>
                                      {m.v != null ? `${m.v.toFixed(1)} / 5.0` : "No ratings yet"}
                                    </span>
                                  </div>
                                  <div className="h-3 bg-slate-50 rounded-full overflow-hidden p-0.5">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${((m.v || 0) / 5) * 100}%` }}
                                      className={`h-full rounded-full bg-${m.c}-500 shadow-sm`}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>

                        {scorecardSummary.count > 0 && (
                          <section className="space-y-6">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                              Interviewer Feedback
                            </h4>
                            {scorecardSummary.entries.map((sc: any) => (
                              <div
                                key={sc.id}
                                className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm space-y-3"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-black text-slate-800">
                                    {sc.interviewerName || "Unknown interviewer"}
                                  </span>
                                  {sc.recommendation && (
                                    <span
                                      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                        sc.recommendation === "Hire"
                                          ? "bg-emerald-50 text-emerald-600"
                                          : sc.recommendation === "No Hire"
                                            ? "bg-rose-50 text-rose-600"
                                            : "bg-amber-50 text-amber-600"
                                      }`}
                                    >
                                      {sc.recommendation}
                                    </span>
                                  )}
                                </div>
                                {sc.notes && (
                                  <p className="text-xs text-slate-500 font-medium italic leading-relaxed">
                                    "{sc.notes}"
                                  </p>
                                )}
                              </div>
                            ))}
                          </section>
                        )}

                        <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl text-center relative overflow-hidden group">
                          <Award
                            size={64}
                            className="mx-auto mb-6 text-amber-400"
                          />
                          <h3 className="text-2xl font-black mb-2 tracking-tighter">
                            {scorecardSummary.overallRecommendation
                              ? `Recommendation: ${scorecardSummary.overallRecommendation}`
                              : "No recommendation yet"}
                          </h3>
                          <p className="text-indigo-200 text-sm font-medium mb-12 max-w-sm mx-auto leading-relaxed">
                            {scorecardSummary.count > 0
                              ? `Based on ${scorecardSummary.count} interviewer scorecard${scorecardSummary.count === 1 ? "" : "s"}.`
                              : "Log interview feedback to build a recommendation."}
                          </p>
                          <div className="flex gap-4 max-w-md mx-auto">
                            <button
                              onClick={openOfferModal}
                              className="flex-1 py-5 bg-white text-slate-900 rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-xl group-hover:scale-105 transition-all"
                            >
                              Extend Offer (₦)
                            </button>
                            <button
                              onClick={() => setSelectedCandidate(null)}
                              className="flex-1 py-5 bg-white/10 border border-white/20 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest hover:bg-white/20"
                            >
                              Keep in Pool
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {candidateDetailTab === "message" && (
                      <div className="space-y-8">
                        <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[550px]">
                          <div className="p-8 bg-slate-50 border-b border-slate-100">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                              Email Log
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">
                              Outbound only — sent via {candidateDetail.email}'s inbox has no reply channel here yet.
                            </p>
                          </div>
                          <div className="flex-1 p-10 space-y-6 overflow-y-auto scrollbar-hide">
                            {(candidateDetail.timeline || []).filter((t) => t.event.startsWith("Email sent:")).length === 0 && (
                              <p className="text-sm text-slate-400 font-bold text-center py-10">
                                No emails sent to this candidate yet.
                              </p>
                            )}
                            {(candidateDetail.timeline || [])
                              .filter((t) => t.event.startsWith("Email sent:"))
                              .map((t, i) => (
                                <div
                                  key={t.id || i}
                                  className="bg-slate-50 border border-slate-100 p-8 rounded-[2.5rem]"
                                >
                                  <p className="text-sm font-black text-slate-800 mb-2">
                                    {t.event.replace(/^Email sent:\s*/, "").replace(/^"|"$/g, "")}
                                  </p>
                                  {t.note && (
                                    <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                                      {t.note}
                                    </p>
                                  )}
                                  <p className="text-[9px] font-black uppercase text-slate-400 mt-4 pt-4 border-t border-slate-200">
                                    {t.actorName || "System"} •{" "}
                                    {t.createdAt ? new Date(t.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : ""}
                                  </p>
                                </div>
                              ))}
                          </div>
                          <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-3">
                            {messageError && (
                              <p className="text-xs font-bold text-rose-500">{messageError}</p>
                            )}
                            <input
                              type="text"
                              value={messageSubject}
                              onChange={(e) => setMessageSubject(e.target.value)}
                              placeholder="Subject"
                              className="w-full px-6 py-3 bg-white border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-sm shadow-inner"
                            />
                            <div className="flex gap-4">
                              <textarea
                                rows={2}
                                value={messageBody}
                                onChange={(e) => setMessageBody(e.target.value)}
                                placeholder="Write your message…"
                                className="flex-1 px-6 py-4 bg-white border-none rounded-[1.5rem] outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm shadow-inner resize-none"
                              />
                              <button
                                onClick={handleSendMessage}
                                disabled={sendCandidateMessage.isPending}
                                className="p-5 bg-indigo-600 text-white rounded-[1.8rem] shadow-2xl shadow-indigo-100 hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                              >
                                <Send size={24} fill="currentColor" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {candidateDetailTab === "timeline" && (
                      <div className="space-y-10 relative">
                        {(candidateDetail.timeline || []).length === 0 && (
                          <p className="text-sm text-slate-400 font-bold">No activity logged yet.</p>
                        )}
                        <div className="absolute left-10 top-0 bottom-0 w-1 bg-slate-50" />
                        {(candidateDetail.timeline || []).map((item, i) => (
                          <motion.div
                            key={item.id || i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="relative pl-24"
                          >
                            <div className="absolute left-4 top-1 w-12 h-12 bg-white rounded-2xl border-4 border-slate-50 shadow-xl flex items-center justify-center z-10 group hover:border-indigo-100 transition-all">
                              <Zap
                                size={24}
                                className="text-indigo-400 group-hover:animate-pulse"
                              />
                            </div>
                            <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 group hover:border-indigo-100 hover:bg-white transition-all">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="text-lg font-black text-slate-800">
                                  {item.event}
                                </h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  {item.createdAt ? new Date(item.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : ""}
                                </p>
                              </div>
                              {item.note && (
                                <p className="text-sm text-slate-500 font-medium italic leading-relaxed">
                                  "{item.note}"
                                </p>
                              )}
                              {item.actorName && (
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">
                                  — {item.actorName}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {candidateDetailTab === "interviews" && (
                      <div className="space-y-10">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          Interview History
                        </h3>
                        <div className="space-y-6">
                          {(candidateDetail.interviews || []).length === 0 && (
                            <p className="text-sm text-slate-400 font-bold">No interviews logged yet.</p>
                          )}
                          {(candidateDetail.interviews || []).map((it: Interview) => (
                            <div
                              key={it.id}
                              className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm"
                            >
                              <div className="flex flex-col md:flex-row gap-10">
                                <div className="flex-1 space-y-8">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">
                                        {it.stage} Round
                                      </p>
                                      <h4 className="text-2xl font-black text-slate-800">
                                        {it.type} Interview
                                      </h4>
                                    </div>
                                    <span
                                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                        it.status === "Completed"
                                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                          : it.status === "Cancelled"
                                            ? "bg-rose-50 text-rose-600 border-rose-100"
                                            : "bg-amber-50 text-amber-600 border-amber-100"
                                      }`}
                                    >
                                      {it.status}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-8">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                        <Calendar size={20} />
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase">
                                          Date & Time
                                        </p>
                                        <p className="text-sm font-bold text-slate-700">
                                          {it.dateTime ? new Date(it.dateTime).toLocaleString() : "TBD"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                        <Users size={20} />
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase">
                                          Interviewers
                                        </p>
                                        <p className="text-sm font-bold text-slate-700">
                                          {(it.interviewerIds || []).length} assigned
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    if (scoringInterviewId === it.id) {
                                      setScoringInterviewId(null);
                                    } else {
                                      setScoringInterviewId(it.id);
                                      setScorecardForm(emptyScorecardForm);
                                    }
                                  }}
                                  className="w-full md:w-64 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center text-center hover:border-indigo-200 transition-all"
                                >
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                    Internal Scorecard
                                  </p>
                                  <div className="w-20 h-20 bg-white rounded-[1.5rem] shadow-xl flex items-center justify-center mb-4">
                                    {(it.scorecards || []).length > 0 ? (
                                      <CheckCircle2 size={32} className="text-emerald-500" />
                                    ) : (
                                      <Clock size={32} className="text-slate-300" />
                                    )}
                                  </div>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {(it.scorecards || []).length > 0
                                      ? `${it.scorecards!.length} scorecard${it.scorecards!.length === 1 ? "" : "s"} — add yours`
                                      : "Log feedback"}
                                  </span>
                                </button>
                              </div>

                              {scoringInterviewId === it.id && (
                                <div className="mt-8 pt-8 border-t border-slate-100 space-y-6">
                                  {(
                                    [
                                      ["technical", "Technical"],
                                      ["communication", "Communication"],
                                      ["cultural", "Cultural Fit"],
                                    ] as const
                                  ).map(([key, label]) => (
                                    <div key={key} className="space-y-2">
                                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>{label}</span>
                                        <span>{scorecardForm[key]} / 5</span>
                                      </div>
                                      <input
                                        type="range"
                                        min={1}
                                        max={5}
                                        value={scorecardForm[key]}
                                        onChange={(e) =>
                                          setScorecardForm((f) => ({ ...f, [key]: Number(e.target.value) }))
                                        }
                                        className="w-full accent-indigo-600"
                                      />
                                    </div>
                                  ))}
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      Recommendation
                                    </label>
                                    <div className="flex gap-3">
                                      {(["Hire", "Maybe", "No Hire"] as const).map((r) => (
                                        <button
                                          key={r}
                                          type="button"
                                          onClick={() => setScorecardForm((f) => ({ ...f, recommendation: r }))}
                                          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                            scorecardForm.recommendation === r
                                              ? "bg-indigo-600 text-white"
                                              : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                          }`}
                                        >
                                          {r}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      Notes
                                    </label>
                                    <textarea
                                      rows={3}
                                      value={scorecardForm.notes}
                                      onChange={(e) => setScorecardForm((f) => ({ ...f, notes: e.target.value }))}
                                      placeholder="What stood out in this round?"
                                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-medium text-sm resize-none"
                                    />
                                  </div>
                                  <div className="flex justify-end gap-3">
                                    <button
                                      type="button"
                                      onClick={() => setScoringInterviewId(null)}
                                      className="px-6 py-3 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      disabled={submitScorecard.isPending}
                                      onClick={() => handleSubmitScorecard(it.id)}
                                      className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50"
                                    >
                                      {submitScorecard.isPending ? "Submitting…" : "Submit Scorecard"}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Fixed Footer Actions */}
              <div className="p-10 border-t border-slate-100 bg-white flex gap-4 shrink-0 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.1)]">
                <button
                  onClick={() => {
                    updateCandidateStatus.mutate({ id: candidateDetail.id, status: "rejected" });
                    setSelectedCandidate(null);
                  }}
                  className="px-10 py-5 bg-white border border-slate-200 text-rose-500 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-sm hover:bg-rose-50 transition-all flex items-center gap-2"
                >
                  <Trash size={18} /> Reject
                </button>
                <div className="flex-1" />
                <button
                  onClick={openScheduleModal}
                  className="px-12 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-sm flex items-center gap-2"
                >
                  <Calendar size={18} /> Schedule
                </button>
                <button
                  onClick={() => advanceCandidateStage(candidateDetail)}
                  disabled={candidateDetail.status === "hired" || candidateDetail.status === "rejected"}
                  className="px-14 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40 disabled:hover:scale-100"
                >
                  Advance Stage <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Job Posting Modal */}
      <AnimatePresence>
        {showJobPostingModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowJobPostingModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[4rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="bg-indigo-600 p-10 text-white flex justify-between items-start shrink-0">
                <div>
                  <h2 className="text-3xl font-black mb-1 tracking-tighter">
                    Draft Requisition
                  </h2>
                  <p className="text-indigo-100 text-sm font-medium">
                    Define role parameters and sourcing strategy.
                  </p>
                </div>
                <button
                  onClick={() => setShowJobPostingModal(false)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-10 scrollbar-hide">
                {reqFormError && (
                  <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold">
                    {reqFormError}
                  </div>
                )}
                <section className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={reqForm.title}
                      onChange={(e) => setReqForm({ ...reqForm, title: e.target.value })}
                      placeholder="e.g. Senior Frontend Engineer"
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Department
                    </label>
                    <select
                      value={reqForm.department}
                      onChange={(e) => setReqForm({ ...reqForm, department: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                    >
                      <option value="">
                        {departments.length === 0 ? "No departments yet" : "Select department"}
                      </option>
                      {departments.map((d: any) => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                    {showAddDept ? (
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          autoFocus
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          placeholder="New department name"
                          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-800"
                        />
                        <button
                          type="button"
                          disabled={createDepartment.isPending || !newDeptName.trim()}
                          onClick={handleAddDepartment}
                          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                        >
                          {createDepartment.isPending ? "Adding…" : "Add"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowAddDept(false); setNewDeptName(""); }}
                          className="px-3 py-2.5 bg-slate-50 text-slate-400 rounded-xl"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddDept(true)}
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                      >
                        + Add new department
                      </button>
                    )}
                  </div>
                </section>

                <section className="grid grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Location
                    </label>
                    <select
                      value={reqForm.location}
                      onChange={(e) => setReqForm({ ...reqForm, location: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                    >
                      <option value="">
                        {locations.length === 0 ? "No locations yet" : "Select location"}
                      </option>
                      {locations.map((l: any) => (
                        <option key={l.id} value={l.name}>{l.name}</option>
                      ))}
                    </select>
                    {showAddLoc ? (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          autoFocus
                          value={newLocName}
                          onChange={(e) => setNewLocName(e.target.value)}
                          placeholder="Location name (e.g. Lagos HQ)"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-800"
                        />
                        <input
                          type="text"
                          value={newLocAddress}
                          onChange={(e) => setNewLocAddress(e.target.value)}
                          placeholder="Address"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-800"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={createLocation.isPending || !newLocName.trim() || !newLocAddress.trim()}
                            onClick={handleAddLocation}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                          >
                            {createLocation.isPending ? "Adding…" : "Add Location"}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowAddLoc(false); setNewLocName(""); setNewLocAddress(""); }}
                            className="px-3 py-2.5 bg-slate-50 text-slate-400 rounded-xl"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddLoc(true)}
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                      >
                        + Add new location
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Priority
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
                </section>

                <section className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Target Salary Range (Annual ₦)
                  </label>
                  <div className="grid grid-cols-2 gap-8">
                    <input
                      type="number"
                      value={reqForm.salaryMin}
                      onChange={(e) => setReqForm({ ...reqForm, salaryMin: e.target.value })}
                      placeholder="Min (₦)"
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                    />
                    <input
                      type="number"
                      value={reqForm.salaryMax}
                      onChange={(e) => setReqForm({ ...reqForm, salaryMax: e.target.value })}
                      placeholder="Max (₦)"
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                    />
                  </div>
                </section>

                <section className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Job Description / Justification
                  </label>
                  <textarea
                    rows={6}
                    value={reqForm.justification}
                    onChange={(e) => setReqForm({ ...reqForm, justification: e.target.value })}
                    placeholder="Describe the role responsibilities and requirements..."
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-3xl outline-none font-medium text-sm resize-none"
                  />
                </section>

                <section className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Publish To Channels
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold mb-6">
                    Career Page lists it on your public careers site; Internal Board posts an announcement to Slack, if connected.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {["Career Page", "Internal Board"].map((channel) => (
                      <label
                        key={channel}
                        className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 cursor-pointer hover:border-indigo-300 transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={reqChannels.includes(channel)}
                          onChange={(e) =>
                            setReqChannels((chs) =>
                              e.target.checked ? [...chs, channel] : chs.filter((c) => c !== channel),
                            )
                          }
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                        />
                        <span className="text-xs font-black text-slate-700">
                          {channel}
                        </span>
                      </label>
                    ))}
                  </div>
                </section>
              </div>

              <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 shrink-0">
                <button
                  onClick={() => {
                    setShowJobPostingModal(false);
                    setReqForm(emptyReqForm);
                    setReqFormError(null);
                    setShowAddDept(false);
                    setNewDeptName("");
                    setShowAddLoc(false);
                    setNewLocName("");
                    setNewLocAddress("");
                  }}
                  className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  disabled={createRequisition.isPending}
                  onClick={handleSubmitRequisition}
                  className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Megaphone size={16} /> {createRequisition.isPending ? "Publishing…" : "Publish Requisition"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Candidate Modal */}
      <AnimatePresence>
        {showAddCandidateModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCandidateModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="bg-indigo-600 p-10 text-white flex justify-between items-start shrink-0">
                <div>
                  <h2 className="text-2xl font-black mb-1 tracking-tighter">
                    Add Candidate
                  </h2>
                  <p className="text-indigo-100 text-sm font-medium">
                    {currentJob ? `Adding to ${currentJob.title}` : "Adding to the talent pool"}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddCandidateModal(false)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-10 space-y-6">
                {candidateFormError && (
                  <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold">
                    {candidateFormError}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={candidateForm.name}
                    onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
                    placeholder="e.g. Amaka Obi"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Email
                  </label>
                  <input
                    type="email"
                    value={candidateForm.email}
                    onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                    placeholder="candidate@example.com"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={candidateForm.phone}
                      onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                      placeholder="Optional"
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Current Title
                    </label>
                    <input
                      type="text"
                      value={candidateForm.currentTitle}
                      onChange={(e) => setCandidateForm({ ...candidateForm, currentTitle: e.target.value })}
                      placeholder="Optional"
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Source
                  </label>
                  <select
                    value={candidateForm.source}
                    onChange={(e) => setCandidateForm({ ...candidateForm, source: e.target.value as Candidate["source"] })}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                  >
                    <option value="Career Page">Career Page</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Referral">Referral</option>
                    <option value="Job Board">Job Board</option>
                  </select>
                </div>
              </div>

              <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 shrink-0">
                <button
                  onClick={() => setShowAddCandidateModal(false)}
                  className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  disabled={createCandidate.isPending}
                  onClick={handleAddCandidate}
                  className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Plus size={16} /> {createCandidate.isPending ? "Adding…" : "Add Candidate"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interview Scheduling Wizard Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowScheduleModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-[4rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="bg-indigo-600 p-10 text-white flex justify-between items-start shrink-0">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Calendar size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black mb-1 tracking-tighter">
                      Schedule Interview
                    </h2>
                    <p className="text-indigo-100 text-sm font-medium">
                      Orchestrate the perfect meeting panel.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="px-12 py-8 bg-slate-50 border-b border-slate-100 flex gap-4 shrink-0 overflow-x-auto">
                {[
                  { s: 1, l: "Logistics", i: <Settings size={14} /> },
                  { s: 2, l: "The Panel", i: <Users size={14} /> },
                  { s: 3, l: "Timing", i: <Clock size={14} /> },
                  { s: 4, l: "Venue", i: <MapPin size={14} /> },
                  { s: 5, l: "Invites", i: <Mail size={14} /> },
                ].map((step) => (
                  <div
                    key={step.s}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all ${scheduleStep === step.s ? "bg-indigo-600 text-white shadow-lg" : scheduleStep > step.s ? "bg-emerald-50 text-emerald-600" : "bg-white text-slate-300"}`}
                  >
                    {scheduleStep > step.s ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <span className="font-black text-xs bg-white/20 px-1.5 rounded">
                        {step.s}
                      </span>
                    )}
                    <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      {step.i} {step.l}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={scheduleStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-10"
                  >
                    {scheduleStep === 1 && (
                      <section className="grid grid-cols-2 gap-12">
                        <div className="col-span-2 space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                            Candidate
                          </label>
                          <select
                            value={scheduleForm.candidateId}
                            onChange={(e) => setScheduleForm((f) => ({ ...f, candidateId: e.target.value }))}
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                          >
                            <option value="">Select a candidate…</option>
                            {candidates.map((c: Candidate) => (
                              <option key={c.id} value={c.id}>
                                {c.name} — {c.currentTitle || "Candidate"}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">
                            Interview Type
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            {(
                              [
                                { label: "Video Call", value: "Video" },
                                { label: "In-Person", value: "In-person" },
                                { label: "Phoner", value: "Phone" },
                                { label: "Panel", value: "Panel" },
                              ] as { label: string; value: Interview["type"] }[]
                            ).map((t) => (
                              <button
                                key={t.value}
                                type="button"
                                onClick={() => setScheduleForm((f) => ({ ...f, type: t.value }))}
                                className={`p-6 border rounded-[2rem] transition-all text-left group ${
                                  scheduleForm.type === t.value
                                    ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500"
                                    : "bg-slate-50 border-slate-100 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500"
                                }`}
                              >
                                <Video
                                  size={24}
                                  className={`mb-4 ${scheduleForm.type === t.value ? "text-indigo-600" : "text-slate-300 group-hover:text-indigo-600"}`}
                                />
                                <span className="text-sm font-black text-slate-700 block">{t.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-8">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">
                              Stage Context
                            </label>
                            <select
                              value={scheduleForm.stage}
                              onChange={(e) => setScheduleForm((f) => ({ ...f, stage: e.target.value as Interview["stage"] }))}
                              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                            >
                              <option value="Technical">Technical Deep Dive</option>
                              <option value="Cultural">Culture Fit</option>
                              <option value="Screening">Hiring Manager Screen</option>
                              <option value="Final">Executive Final</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">
                              Duration
                            </label>
                            <div className="flex gap-4">
                              {[30, 45, 60, 90].map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => setScheduleForm((f) => ({ ...f, durationMinutes: d }))}
                                  className={`flex-1 py-3 border rounded-xl text-xs font-black transition-all ${
                                    scheduleForm.durationMinutes === d
                                      ? "bg-indigo-600 border-indigo-600 text-white"
                                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  {d}m
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">
                              Date & Time
                            </label>
                            <input
                              type="datetime-local"
                              value={scheduleForm.dateTime}
                              onChange={(e) => setScheduleForm((f) => ({ ...f, dateTime: e.target.value }))}
                              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                            />
                          </div>
                        </div>
                      </section>
                    )}

                    {scheduleStep === 2 && (
                      <section className="space-y-8">
                        <div className="relative">
                          <Search
                            className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"
                            size={20}
                          />
                          <input
                            type="text"
                            value={teamSearchQuery}
                            onChange={(e) => setTeamSearchQuery(e.target.value)}
                            placeholder="Search team members..."
                            className="w-full pl-16 pr-6 py-5 bg-slate-50 border-none rounded-[2rem] outline-none font-bold text-slate-800"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                          {filteredTeamMembers.length === 0 && (
                            <p className="col-span-3 text-sm text-slate-400 font-bold text-center py-6">
                              No team members match "{teamSearchQuery}".
                            </p>
                          )}
                          {filteredTeamMembers.map((m: any) => (
                            <label
                              key={m.id}
                              className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-[2rem] cursor-pointer hover:border-indigo-200 transition-all group"
                            >
                              <input
                                type="checkbox"
                                checked={scheduleForm.interviewerIds.includes(m.id)}
                                onChange={(e) =>
                                  setScheduleForm((f) => ({
                                    ...f,
                                    interviewerIds: e.target.checked
                                      ? [...f.interviewerIds, m.id]
                                      : f.interviewerIds.filter((id) => id !== m.id),
                                  }))
                                }
                                className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                              />
                              <img
                                src={m.avatar}
                                className="w-12 h-12 rounded-xl object-cover"
                              />
                              <div>
                                <p className="text-sm font-black text-slate-800">
                                  {m.name}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  {m.role}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                        {interviewerConflicts.length > 0 && (
                          <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                            <AlertCircle
                              className="text-amber-500 shrink-0 mt-1"
                              size={20}
                            />
                            <div className="space-y-1">
                              <h4 className="text-sm font-black text-amber-800 mb-1">
                                Availability Conflict
                              </h4>
                              {interviewerConflicts.map((c, i) => (
                                <p key={i} className="text-xs text-amber-700 font-medium">
                                  {c.name} already has an interview around {c.time}.
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </section>
                    )}

                    {scheduleStep === 3 && (
                      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                          <div className="flex justify-between items-center mb-6">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                              {scheduleCalendarCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                            </h4>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setScheduleCalendarCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                                className="p-2 bg-white rounded-lg shadow-sm"
                              >
                                <ChevronLeft size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setScheduleCalendarCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                                className="p-2 bg-white rounded-lg shadow-sm"
                              >
                                <ChevronRight size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-2">
                            {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                              <div key={d}>{d}</div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-2">
                            {(() => {
                              const year = scheduleCalendarCursor.getFullYear();
                              const month = scheduleCalendarCursor.getMonth();
                              const startOffset = new Date(year, month, 1).getDay();
                              const daysInMonth = new Date(year, month + 1, 0).getDate();
                              const selectedIso = scheduleForm.dateTime ? scheduleForm.dateTime.slice(0, 10) : null;
                              const cells: React.ReactNode[] = [];
                              for (let i = 0; i < startOffset; i++) cells.push(<div key={`pad-${i}`} />);
                              for (let d = 1; d <= daysInMonth; d++) {
                                const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                                const isSelected = iso === selectedIso;
                                cells.push(
                                  <button
                                    key={iso}
                                    type="button"
                                    onClick={() => {
                                      const time = scheduleForm.dateTime ? scheduleForm.dateTime.slice(11, 16) : "09:00";
                                      setScheduleForm((f) => ({ ...f, dateTime: `${iso}T${time}` }));
                                    }}
                                    className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${isSelected ? "bg-indigo-600 text-white shadow-lg" : "hover:bg-white hover:shadow-sm text-slate-600"}`}
                                  >
                                    {d}
                                  </button>,
                                );
                              }
                              return cells;
                            })()}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {scheduleForm.dateTime ? "Time" : "Pick a day first"}
                          </label>
                          {scheduleForm.dateTime &&
                            timeSlotOptions.map((slot) => (
                              <button
                                key={slot.time}
                                type="button"
                                onClick={() =>
                                  setScheduleForm((f) => ({ ...f, dateTime: `${f.dateTime.slice(0, 10)}T${slot.time}` }))
                                }
                                className={`w-full p-5 border rounded-2xl text-left transition-all flex justify-between items-center group ${
                                  scheduleForm.dateTime.slice(11, 16) === slot.time
                                    ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500"
                                    : "bg-white border-slate-200 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500"
                                }`}
                              >
                                <span className="font-black text-sm text-slate-700">{slot.label}</span>
                                <span
                                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                    slot.busy ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                                  }`}
                                >
                                  {slot.busy ? "Conflict" : "Free"}
                                </span>
                              </button>
                            ))}
                        </div>
                      </section>
                    )}

                    {scheduleStep === 4 && (
                      <section className="space-y-8">
                        <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 flex items-center gap-6">
                          <div className="w-16 h-16 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
                            <Video size={32} />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-black text-indigo-900 mb-1">
                              {scheduleForm.type === "In-person" ? "Location" : "Meeting Link"}
                            </h4>
                            <p className="text-sm font-medium text-indigo-700">
                              {scheduleForm.type === "In-person"
                                ? "Add the room or office address below."
                                : "Paste your video call link below — it'll be included in the invite."}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Meeting Link / Location
                          </label>
                          <input
                            type="text"
                            value={scheduleForm.meetingLink}
                            onChange={(e) => setScheduleForm((f) => ({ ...f, meetingLink: e.target.value }))}
                            placeholder="e.g. https://meet.google.com/... or Glass Room 3, Lagos HQ"
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                          />
                        </div>
                      </section>
                    )}

                    {scheduleStep === 5 && (
                      <section className="space-y-8">
                        <div className="flex gap-4 overflow-x-auto pb-4">
                          {(["Standard Invite", "Technical Prep", "Casual Chat"] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => buildDefaultInviteEmail(t)}
                              className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 whitespace-nowrap hover:bg-slate-50"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-4">
                          <div className="flex gap-4 border-b border-slate-200 pb-4 items-center">
                            <span className="text-xs font-black text-slate-400 w-16">
                              To:
                            </span>
                            <span className="text-sm font-bold text-slate-800">
                              {candidates.find((c: Candidate) => c.id === scheduleForm.candidateId)?.email || "No candidate selected"}
                            </span>
                          </div>
                          <div className="flex gap-4 border-b border-slate-200 pb-4 items-center">
                            <span className="text-xs font-black text-slate-400 w-16">
                              Subject:
                            </span>
                            <input
                              type="text"
                              value={inviteEmailSubject}
                              onChange={(e) => setInviteEmailSubject(e.target.value)}
                              className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-800"
                            />
                          </div>
                          <textarea
                            value={inviteEmailBody}
                            onChange={(e) => setInviteEmailBody(e.target.value)}
                            className="w-full h-40 bg-transparent border-none outline-none font-medium text-sm text-slate-600 resize-none leading-relaxed"
                          />
                        </div>
                      </section>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="p-10 bg-white border-t border-slate-100 flex flex-col gap-4 shrink-0">
                {scheduleFormError && (
                  <p className="text-xs font-bold text-rose-500 text-center">{scheduleFormError}</p>
                )}
                <div className="flex justify-between items-center">
                  <button
                    onClick={() =>
                      scheduleStep > 1
                        ? setScheduleStep((s) => s - 1)
                        : setShowScheduleModal(false)
                    }
                    className="px-8 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100"
                  >
                    {scheduleStep === 1 ? "Cancel" : "Back"}
                  </button>
                  <button
                    disabled={scheduleInterview.isPending}
                    onClick={() => (scheduleStep < 5 ? setScheduleStep((s) => s + 1) : handleSendInvites())}
                    className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {scheduleStep === 5 ? (scheduleInterview.isPending ? "Sending…" : "Send Invites") : "Continue"}{" "}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Offer Creation Wizard Modal */}
      <AnimatePresence>
        {showOfferModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOfferModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-[4rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="bg-emerald-600 p-10 text-white flex justify-between items-start shrink-0">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Zap size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black mb-1 tracking-tighter">
                      Extend Job Offer
                    </h2>
                    <p className="text-emerald-100 text-sm font-medium">
                      Draft, approve, and send the formal offer.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOfferModal(false)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="px-12 py-8 bg-slate-50 border-b border-slate-100 flex gap-4 shrink-0 justify-center">
                {[
                  { s: 1, l: "Terms & Comp", i: <Briefcase size={14} /> },
                  { s: 2, l: "Approval Chain", i: <ShieldCheck size={14} /> },
                  { s: 3, l: "Letter Preview", i: <FileText size={14} /> },
                ].map((step) => (
                  <div
                    key={step.s}
                    className={`flex items-center gap-3 px-8 py-3 rounded-xl transition-all ${offerStep === step.s ? "bg-emerald-600 text-white shadow-lg" : offerStep > step.s ? "bg-emerald-50 text-emerald-600" : "bg-white text-slate-300"}`}
                  >
                    {offerStep > step.s ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <span className="font-black text-xs bg-white/20 px-1.5 rounded">
                        {step.s}
                      </span>
                    )}
                    <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      {step.i} {step.l}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={offerStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-10"
                  >
                    {offerStep === 1 && (
                      <section className="grid grid-cols-2 gap-12">
                        <div className="space-y-8">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Candidate
                            </label>
                            <select
                              value={offerForm.candidateId}
                              onChange={(e) => setOfferForm((f) => ({ ...f, candidateId: e.target.value }))}
                              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                            >
                              <option value="">Select a candidate…</option>
                              {candidates.map((c: Candidate) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mt-4">
                              Role Title
                            </label>
                            <input
                              type="text"
                              value={offerForm.title}
                              onChange={(e) => setOfferForm((f) => ({ ...f, title: e.target.value }))}
                              placeholder="e.g. Senior React Developer"
                              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Start Date
                            </label>
                            <input
                              type="date"
                              value={offerForm.startDate}
                              onChange={(e) => setOfferForm((f) => ({ ...f, startDate: e.target.value }))}
                              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Offer Expires
                            </label>
                            <input
                              type="date"
                              value={offerForm.expiryDate}
                              onChange={(e) => setOfferForm((f) => ({ ...f, expiryDate: e.target.value }))}
                              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                            />
                          </div>
                        </div>
                        <div className="space-y-8">
                          <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 space-y-6">
                            <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                              <Wallet size={16} /> Compensation
                            </h4>
                            <div className="space-y-4">
                              <div>
                                <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">
                                  Annual Gross Salary
                                </label>
                                <div className="relative">
                                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-300 font-black">
                                    ₦
                                  </span>
                                  <input
                                    type="text"
                                    value={offerForm.salary}
                                    onChange={(e) => setOfferForm((f) => ({ ...f, salary: e.target.value }))}
                                    placeholder="14,500,000"
                                    className="w-full pl-10 pr-6 py-4 bg-white border-none rounded-2xl outline-none font-black text-indigo-700 shadow-sm"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">
                                    Stock Options
                                  </label>
                                  <input
                                    type="text"
                                    defaultValue="1,500"
                                    className="w-full px-6 py-4 bg-white border-none rounded-2xl outline-none font-black text-indigo-700 shadow-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">
                                    Sign-on Bonus
                                  </label>
                                  <input
                                    type="text"
                                    defaultValue="500,000"
                                    className="w-full px-6 py-4 bg-white border-none rounded-2xl outline-none font-black text-indigo-700 shadow-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>
                    )}

                    {offerStep === 2 && (
                      <section className="space-y-8">
                        <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100">
                          <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 text-center">
                            Required Approvals
                          </h4>
                          <div className="flex items-center justify-center relative">
                            <div className="absolute top-1/2 left-20 right-20 h-1 bg-slate-200 -z-10" />
                            {[
                              {
                                r: "Hiring Manager",
                                s: "Approved",
                                n: "Tunde Bakare",
                              },
                              { r: "Finance", s: "Pending", n: "Ngozi Okonjo" },
                              {
                                r: "HR Director",
                                s: "Waiting",
                                n: "Funke Akindele",
                              },
                            ].map((a, i) => (
                              <div
                                key={i}
                                className="flex-1 flex flex-col items-center gap-4"
                              >
                                <div
                                  className={`w-12 h-12 rounded-full border-4 flex items-center justify-center bg-white shadow-lg ${a.s === "Approved" ? "border-emerald-500 text-emerald-500" : a.s === "Pending" ? "border-amber-500 text-amber-500" : "border-slate-200 text-slate-300"}`}
                                >
                                  {a.s === "Approved" ? (
                                    <CheckCircle2 size={20} />
                                  ) : a.s === "Pending" ? (
                                    <Clock size={20} />
                                  ) : (
                                    <User size={20} />
                                  )}
                                </div>
                                <div className="text-center">
                                  <p className="text-xs font-black text-slate-800 uppercase">
                                    {a.r}
                                  </p>
                                  <p className="text-[10px] font-bold text-slate-400">
                                    {a.n}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-12 text-center">
                            <button className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">
                              Trigger Approval Request
                            </button>
                          </div>
                        </div>
                      </section>
                    )}

                    {offerStep === 3 && (
                      <section className="grid grid-cols-1 lg:grid-cols-3 gap-10 h-[500px]">
                        <div className="lg:col-span-2 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 overflow-y-auto scrollbar-hide">
                          <div className="bg-white p-12 shadow-sm min-h-[800px] max-w-2xl mx-auto">
                            <div className="flex justify-between items-center mb-12">
                              <div className="w-12 h-12 bg-indigo-600 rounded-lg" />
                              <p className="text-xs font-bold text-slate-400">
                                May 24, 2024
                              </p>
                            </div>
                            <h1 className="text-2xl font-serif font-bold text-slate-800 mb-8">
                              Employment Offer
                            </h1>
                            <div className="space-y-6 text-sm text-slate-600 leading-relaxed font-serif">
                              <p>
                                Dear {candidatesById.get(offerForm.candidateId)?.name || "Candidate"},
                              </p>
                              <p>
                                We are pleased to offer you the position of{" "}
                                <strong>{offerForm.title || "the role"}</strong> at ZenHR.
                              </p>
                              <p>
                                Your starting annual compensation will be{" "}
                                <strong>₦{Number(String(offerForm.salary).replace(/[^\d.]/g, "")) ? Number(String(offerForm.salary).replace(/[^\d.]/g, "")).toLocaleString() : "—"}</strong>
                                {offerForm.startDate ? `, starting ${offerForm.startDate}` : ""}.
                              </p>
                              <p>
                                We believe your skills and experience will be an
                                ideal fit for our creative team.
                              </p>
                            </div>
                            <div className="mt-20 pt-10 border-t border-slate-200 grid grid-cols-2 gap-20">
                              <div>
                                <div className="h-10 border-b border-slate-800 mb-2" />
                                <p className="text-xs font-serif italic">
                                  For: ZenHR Systems
                                </p>
                              </div>
                              <div>
                                <div className="h-10 border-b border-slate-800 mb-2" />
                                <p className="text-xs font-serif italic">
                                  Accepted By:{" "}
                                  {candidatesById.get(offerForm.candidateId)?.name || "Candidate"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-6">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Settings
                          </h4>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-2xl">
                              <span className="text-xs font-bold text-slate-700">
                                Expiry Date
                              </span>
                              <span className="text-xs font-black text-slate-400">
                                {offerForm.expiryDate || "Not set"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-2xl">
                              <span className="text-xs font-bold text-slate-700">
                                Allow Negotiation
                              </span>
                              <div className="w-10 h-6 bg-emerald-500 rounded-full relative">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                              </div>
                            </div>
                          </div>
                          <button className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 flex items-center justify-center gap-2">
                            <Download size={14} /> Download PDF
                          </button>
                        </div>
                      </section>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="p-10 bg-white border-t border-slate-100 flex flex-col gap-4 shrink-0">
                {offerFormError && <p className="text-xs font-bold text-rose-500 text-center">{offerFormError}</p>}
                <div className="flex justify-between items-center">
                  <button
                    onClick={() =>
                      offerStep > 1
                        ? setOfferStep((s) => s - 1)
                        : setShowOfferModal(false)
                    }
                    className="px-8 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100"
                  >
                    {offerStep === 1 ? "Cancel" : "Back"}
                  </button>
                  <button
                    disabled={createOffer.isPending || sendOffer.isPending}
                    onClick={() => (offerStep < 3 ? setOfferStep((s) => s + 1) : handleSendOffer())}
                    className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {offerStep === 3 ? (createOffer.isPending || sendOffer.isPending ? "Sending…" : "Send Offer") : "Continue"}{" "}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LayoutPanelLeft = ({ size }: { size: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
  </svg>
);

export default Recruitment;
