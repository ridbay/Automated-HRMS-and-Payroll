import React, { useState, useMemo } from "react";
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
  Paperclip,
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
import {
  MOCK_REQUISITIONS,
  MOCK_CANDIDATES_DETAILED,
  MOCK_INTERVIEWS,
  MOCK_EMPLOYEES,
} from "../../data/mocks";
import { Candidate, JobRequisition, Interview } from "../../types/index";

const funnelData = [
  { name: "Applied", value: 450, fill: "#6366f1" },
  { name: "Screening", value: 230, fill: "#818cf8" },
  { name: "Interview", value: 120, fill: "#f59e0b" },
  { name: "Offer", value: 50, fill: "#10b981" },
  { name: "Hired", value: 30, fill: "#8b5cf6" },
];

const sourceData = [
  { name: "LinkedIn", value: 45 },
  { name: "Direct", value: 25 },
  { name: "Referral", value: 20 },
  { name: "Indeed", value: 10 },
];

const Recruitment: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "requisitions"
    | "pipeline"
    | "interviews"
    | "offers"
    | "analytics"
  >("dashboard");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null,
  );
  const [candidateDetailTab, setCandidateDetailTab] = useState<
    "profile" | "evaluation" | "interviews" | "timeline" | "message"
  >("profile");
  const [activeJobId, setActiveJobId] = useState<string | null>(
    MOCK_REQUISITIONS[0].id,
  );
  const [showJobPostingModal, setShowJobPostingModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleStep, setScheduleStep] = useState(1);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerStep, setOfferStep] = useState(1);

  const teamMembers = MOCK_EMPLOYEES.slice(0, 3);
  const currentJob = MOCK_REQUISITIONS.find((r) => r.id === activeJobId);

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
            val: "24",
            sub: "8 Urgent",
            icon: <Briefcase />,
            color: "indigo",
          },
          {
            label: "Total Applicants",
            val: "582",
            sub: "+12% this mo",
            icon: <Users />,
            color: "emerald",
          },
          {
            label: "Interviews",
            val: "18",
            sub: "Today: 4",
            icon: <Calendar />,
            color: "amber",
          },
          {
            label: "Offers Pending",
            val: "5",
            sub: "2 Expiring",
            icon: <Zap />,
            color: "rose",
          },
          {
            label: "Time to Hire",
            val: "18d",
            sub: "Target: 21d",
            icon: <Clock />,
            color: "violet",
          },
          {
            label: "Conv. Rate",
            val: "12%",
            sub: "+2% Trend",
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
                Candidate drop-off analysis per stage.
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

  const filteredRequisitions = MOCK_REQUISITIONS.filter((req) => {
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
            <option value="Engineering">Engineering</option>
            <option value="Product">Product</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
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

          <button
            onClick={() => setShowJobPostingModal(true)}
            className="px-6 py-3.5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <FilePlus size={18} />{" "}
            <span className="hidden sm:inline">New Req</span>
          </button>
        </div>
      </div>

      {viewMode === "kanban" ? (
        <div className="flex gap-6 overflow-x-auto pb-10 scrollbar-hide px-2">
          {["Open", "On Hold", "Filled", "Cancelled"].map((status) => {
            const statusColor =
              status === "Open"
                ? "emerald"
                : status === "On Hold"
                  ? "amber"
                  : status === "Filled"
                    ? "indigo"
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
                        <button className="text-slate-300 hover:text-indigo-600">
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
                            src={req.managerAvatar}
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
                    </motion.div>
                  ))}
                  <button className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-300 hover:border-indigo-200 hover:text-indigo-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all">
                    + Add Requisition
                  </button>
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
                    className={`text-[10px] font-black uppercase tracking-widest ${req.status === "Open" ? "text-emerald-500" : "text-amber-500"}`}
                  >
                    {req.status}
                  </span>
                  <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
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
            </motion.div>
          ))}
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
                      <button className="p-3 bg-white border rounded-xl text-slate-400 hover:text-indigo-600 shadow-sm">
                        <Edit3 size={16} />
                      </button>
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
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-white text-[10px] font-black">
                +2
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2" />
            <button className="px-6 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-2">
              <Settings size={14} /> Pipeline Setup
            </button>
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
                  {
                    MOCK_CANDIDATES_DETAILED.filter((c) => c.status === col.id)
                      .length
                  }
                </span>
              </div>

              <div className="flex-1 space-y-4 min-h-[600px] p-2 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                {MOCK_CANDIDATES_DETAILED.filter(
                  (c) => c.status === col.id,
                ).map((cand) => (
                  <motion.div
                    key={cand.id}
                    layoutId={cand.id}
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, info) => {
                      // Simulated drop logic
                      if (info.offset.x > 100) {
                        // Dragged right - simulate move to next stage
                        console.log(`Moved ${cand.name} to next stage`);
                      } else if (info.offset.x < -100) {
                        // Dragged left - simulate move to prev stage
                        console.log(`Moved ${cand.name} to prev stage`);
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
                          Applied 3d ago
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
                          className={`w-1.5 h-1.5 rounded-full ${cand.experience > 5 ? "bg-indigo-500" : "bg-slate-300"}`}
                        />
                        <span className="text-[9px] font-black text-slate-400 uppercase">
                          {cand.source}
                        </span>
                      </div>
                      <div
                        className="flex gap-1 relative z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button className="p-2 bg-slate-50 text-slate-300 group-hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all">
                          <Mail size={12} />
                        </button>
                        <button className="p-2 bg-slate-50 text-slate-300 group-hover:text-amber-500 rounded-lg hover:bg-amber-50 transition-all">
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                <button className="w-full py-6 border-2 border-dashed border-slate-200 text-slate-300 hover:border-indigo-200 hover:text-indigo-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-2 group">
                  <Plus
                    size={20}
                    className="group-hover:scale-110 transition-transform"
                  />
                  Add to {col.label}
                </button>
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
          onClick={() => setShowOfferModal(true)}
          className="px-8 py-3.5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2"
        >
          <Plus size={18} /> Generate Offer Letter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          {
            name: "Alex Rivera",
            role: "Senior React Developer",
            salary: 14500000,
            status: "Awaiting Candidate",
            expiry: "2 days",
            color: "amber",
          },
          {
            name: "Jordan Smith",
            role: "Backend Lead",
            salary: 18000000,
            status: "Negotiating",
            expiry: "5 days",
            color: "indigo",
          },
          {
            name: "Taylor Swift",
            role: "HR Manager",
            salary: 9500000,
            status: "Accepted",
            expiry: "N/A",
            color: "emerald",
          },
        ].map((offer, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group"
          >
            <div
              className={`absolute top-0 right-0 w-16 h-16 bg-${offer.color}-50 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform`}
            />
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner">
                <Zap
                  size={28}
                  className={`text-${offer.color}-500`}
                  fill="currentColor"
                />
              </div>
              <span
                className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                  offer.status === "Accepted"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-slate-50 text-slate-500 border-slate-100"
                }`}
              >
                {offer.status}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-1">
              {offer.name}
            </h3>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6">
              {offer.role}
            </p>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400 uppercase">Annual Package</span>
                <span className="text-slate-800">
                  {formatCurrency(offer.salary)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400 uppercase">Expires In</span>
                <span
                  className={`font-black ${offer.expiry === "2 days" ? "text-rose-500" : "text-slate-800"}`}
                >
                  {offer.expiry}
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-10">
              <button className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                Review Pack
              </button>
              <button className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all">
                <History size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
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
              Global talent velocity is currently at{" "}
              <b className="text-emerald-500">82%</b> efficiency.
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
          {activeTab === "analytics" && (
            <div className="space-y-10 pb-20">
              {/* Quick Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  {
                    l: "Time to Fill",
                    v: "18 Days",
                    t: "-12% vs LY",
                    c: "indigo",
                  },
                  { l: "Cost Per Hire", v: "₦450k", t: "+5% vs LY", c: "rose" },
                  {
                    l: "Quality of Hire",
                    v: "4.8/5",
                    t: "Top 1%",
                    c: "emerald",
                  },
                  {
                    l: "Offer Acceptance",
                    v: "92%",
                    t: "+8% vs LY",
                    c: "amber",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm"
                  >
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      {s.l}
                    </p>
                    <h3
                      className={`text-3xl font-black text-${s.c}-600 tracking-tighter mb-1`}
                    >
                      {s.v}
                    </h3>
                    <span className="px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase">
                      {s.t}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2">
                    <TrendingUp size={24} className="text-indigo-600" /> Hiring
                    Velocity
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={[
                          { n: "Jan", v: 4 },
                          { n: "Feb", v: 7 },
                          { n: "Mar", v: 5 },
                          { n: "Apr", v: 12 },
                          { n: "May", v: 8 },
                        ]}
                      >
                        <defs>
                          <linearGradient
                            id="colorHires"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#6366f1"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#6366f1"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="n"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 10,
                            fontWeight: 900,
                            fill: "#94a3b8",
                          }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 10,
                            fontWeight: 900,
                            fill: "#94a3b8",
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "16px",
                            border: "none",
                            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                          }}
                          cursor={{ stroke: "#6366f1", strokeWidth: 1 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="v"
                          stroke="#6366f1"
                          strokeWidth={4}
                          fillOpacity={1}
                          fill="url(#colorHires)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2">
                    <Target size={24} className="text-emerald-500" /> Recruiter
                    Performance
                  </h3>
                  <div className="space-y-6">
                    {[
                      {
                        n: "Sarah Connor",
                        h: 12,
                        s: 98,
                        img: "https://i.pravatar.cc/150?u=1",
                      },
                      {
                        n: "John Smith",
                        h: 8,
                        s: 92,
                        img: "https://i.pravatar.cc/150?u=2",
                      },
                      {
                        n: "Ellen Ripley",
                        h: 15,
                        s: 96,
                        img: "https://i.pravatar.cc/150?u=3",
                      },
                    ].map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-4 bg-slate-50 rounded-[2rem] border border-slate-100"
                      >
                        <img
                          src={r.img}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between mb-2">
                            <h4 className="text-sm font-black text-slate-800">
                              {r.n}
                            </h4>
                            <span className="text-[10px] font-black text-emerald-600 uppercase">
                              {r.s}% Sat.
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${(r.h / 20) * 100}%` }}
                            />
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                            {r.h} Hires (Target: 20)
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <section className="col-span-1 bg-slate-900 p-10 rounded-[3.5rem] text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-10 opacity-10">
                    <Globe size={100} />
                  </div>
                  <h3 className="text-lg font-black text-indigo-300 uppercase tracking-widest mb-6">
                    Diversity Metrics
                  </h3>
                  <div className="h-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { n: "M", v: 55 },
                            { n: "F", v: 42 },
                            { n: "NB", v: 3 },
                          ]}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="v"
                          stroke="none"
                        >
                          {[
                            { c: "#6366f1" },
                            { c: "#ec4899" },
                            { c: "#fbbf24" },
                          ].map((e, i) => (
                            <Cell key={i} fill={e.c} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-3xl font-black">42%</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">
                        Female Hires
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-center gap-4 mt-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-[9px] font-bold uppercase">
                        Male
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-pink-500" />
                      <span className="text-[9px] font-bold uppercase">
                        Female
                      </span>
                    </div>
                  </div>
                </section>

                <section className="col-span-2 bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Sparkles size={24} className="text-amber-500" /> Talent
                        Forecast
                      </h3>
                      <p className="text-xs font-bold text-slate-400 mt-2">
                        Predicted hiring needs based on Q3 roadmap.
                      </p>
                    </div>
                    <button className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                      View Headcount Plan
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { d: "Engineering", n: "+8", c: "indigo" },
                      { d: "Product", n: "+3", c: "rose" },
                      { d: "Sales", n: "+12", c: "emerald" },
                    ].map((d, i) => (
                      <div
                        key={i}
                        className={`p-6 bg-${d.c}-50 rounded-[2.5rem] border border-${d.c}-100 flex flex-col items-center justify-center text-center group hover:scale-105 transition-transform`}
                      >
                        <h4
                          className={`text-4xl font-black text-${d.c}-600 tracking-tighter mb-2`}
                        >
                          {d.n}
                        </h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {d.d}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}
          {activeTab === "interviews" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
              <div className="lg:col-span-3 bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-12">
                  <h3 className="text-2xl font-black text-slate-800">
                    Global Interview Calendar
                  </h3>
                  <div className="flex gap-2">
                    <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-colors">
                      <ChevronLeft size={20} />
                    </button>
                    <span className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">
                      May 2024
                    </span>
                    <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
                {/* Mock Calendar Grid */}
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
                  {Array.from({ length: 31 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-24 rounded-2xl border flex flex-col p-3 transition-all relative group ${i === 24 ? "border-indigo-600 bg-indigo-50/20 ring-4 ring-indigo-500/5 shadow-xl" : "border-slate-100 hover:bg-slate-50 cursor-pointer"}`}
                    >
                      <span className="text-xs font-black text-slate-400">
                        {i + 1}
                      </span>
                      {i === 24 && (
                        <div className="mt-auto space-y-1">
                          <div className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[8px] font-black uppercase truncate shadow-sm">
                            Interview (4)
                          </div>
                          <div className="px-2 py-1 bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase truncate shadow-sm">
                            Offer (1)
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-10">
                <section className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                  <Clock className="absolute -bottom-8 -right-8 w-40 h-40 text-indigo-500/10 rotate-12" />
                  <h4 className="text-xl font-black mb-8 text-indigo-400 flex items-center gap-3">
                    <Video size={20} /> Today's Syncs
                  </h4>
                  <div className="space-y-6">
                    {MOCK_INTERVIEWS.map((it) => (
                      <div
                        key={it.id}
                        className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm group hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">
                          {it.stage} Round
                        </p>
                        <p className="text-sm font-black mb-6">
                          {it.candidateName}
                        </p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Clock size={12} className="text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              2:00 PM (Lagos)
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
                    onClick={() => setShowScheduleModal(true)}
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
        {selectedCandidate && (
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
                        selectedCandidate.avatar ||
                        `https://ui-avatars.com/api/?name=${selectedCandidate.name}`
                      }
                      className="w-24 h-24 rounded-[2.5rem] object-cover border-8 border-white shadow-2xl"
                    />
                    <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg border-2 border-indigo-50 ring-4 ring-white">
                      <span className="text-[10px] font-black text-indigo-600">
                        {selectedCandidate.rating}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">
                      {selectedCandidate.name}
                    </h2>
                    <p className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em]">
                      {selectedCandidate.currentTitle} •{" "}
                      {selectedCandidate.experience}y Experience
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        {selectedCandidate.status}
                      </span>
                      <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        {selectedCandidate.source}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all shadow-sm">
                    <Download size={20} />
                  </button>
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
                                  {selectedCandidate.email}
                                </span>
                              </div>
                              <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center">
                                  <Phone size={20} />
                                </div>
                                <span className="text-sm font-bold text-slate-700">
                                  {selectedCandidate.phone}
                                </span>
                              </div>
                              <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center">
                                  <MapPin size={20} />
                                </div>
                                <span className="text-sm font-bold text-slate-700">
                                  {selectedCandidate.location}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-8">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                              Social Footprint
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                              <button className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:border-indigo-200 transition-all group text-center">
                                <Linkedin
                                  size={28}
                                  className="mx-auto mb-3 text-slate-300 group-hover:text-indigo-600"
                                />
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                  LinkedIn
                                </span>
                              </button>
                              <button className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:border-indigo-200 transition-all group text-center">
                                <Github
                                  size={28}
                                  className="mx-auto mb-3 text-slate-300 group-hover:text-slate-900"
                                />
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                  GitHub
                                </span>
                              </button>
                              <button className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:border-indigo-200 transition-all group text-center">
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
                            {selectedCandidate.skills.map((s) => (
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
                              Resume Preview
                            </h3>
                            <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                              <Download size={14} /> Full Document
                            </button>
                          </div>
                          <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 min-h-[300px] relative">
                            <div className="space-y-6 opacity-40">
                              <div className="h-6 w-3/4 bg-slate-300 rounded-full" />
                              <div className="h-4 w-full bg-slate-300 rounded-full" />
                              <div className="h-4 w-full bg-slate-300 rounded-full" />
                              <div className="h-4 w-1/2 bg-slate-300 rounded-full" />
                              <div className="h-20 w-full bg-white rounded-[2rem] border border-slate-200" />
                              <div className="h-4 w-full bg-slate-300 rounded-full" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-50/20 backdrop-blur-[2px] transition-opacity rounded-[3rem]">
                              <button className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:scale-105 transition-all">
                                Open PDF Viewer
                              </button>
                            </div>
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
                            <button className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all">
                              <Edit3 size={20} />
                            </button>
                          </div>
                          <div className="space-y-10">
                            {[
                              { l: "Technical Skill Set", v: 4.8, c: "indigo" },
                              {
                                l: "System Design Aptitude",
                                v: 4.5,
                                c: "emerald",
                              },
                              {
                                l: "Cultural Contribution",
                                v: 4.2,
                                c: "violet",
                              },
                              { l: "Project Ownership", v: 4.9, c: "amber" },
                            ].map((m, i) => (
                              <div key={i} className="space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                                  <span className="text-slate-400">{m.l}</span>
                                  <span className={`text-${m.c}-600 font-mono`}>
                                    {m.v} / 5.0
                                  </span>
                                </div>
                                <div className="h-3 bg-slate-50 rounded-full overflow-hidden p-0.5">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(m.v / 5) * 100}%` }}
                                    className={`h-full rounded-full bg-${m.c}-500 shadow-sm`}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>

                        <section className="grid grid-cols-2 gap-10">
                          <div className="p-10 bg-emerald-50 rounded-[3rem] border border-emerald-100 space-y-6">
                            <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em]">
                              Identified Strengths
                            </h4>
                            <ul className="space-y-5">
                              {[
                                "Exceptional architecture vision",
                                "Active mentor in OSS",
                                "Strong product mindset",
                              ].map((s) => (
                                <li
                                  key={s}
                                  className="flex items-center gap-4 text-xs font-black text-emerald-800"
                                >
                                  <CheckCircle2
                                    size={18}
                                    className="shrink-0"
                                  />{" "}
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-10 bg-rose-50 rounded-[3rem] border border-rose-100 space-y-6">
                            <h4 className="text-[11px] font-black text-rose-600 uppercase tracking-[0.2em]">
                              Potential Concerns
                            </h4>
                            <ul className="space-y-5">
                              {[
                                "Notice period over 60 days",
                                "Upper bracket salary expectation",
                              ].map((c) => (
                                <li
                                  key={c}
                                  className="flex items-center gap-4 text-xs font-black text-rose-800"
                                >
                                  <AlertCircle size={18} className="shrink-0" />{" "}
                                  {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </section>

                        <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl text-center relative overflow-hidden group">
                          <Award
                            size={64}
                            className="mx-auto mb-6 text-amber-400 animate-bounce"
                          />
                          <h3 className="text-2xl font-black mb-2 tracking-tighter">
                            Recommendation: Strong Hire
                          </h3>
                          <p className="text-indigo-200 text-sm font-medium mb-12 max-w-sm mx-auto leading-relaxed italic">
                            "Candidate demonstrated top 1% proficiency during
                            the architecture deep dive sessions."
                          </p>
                          <div className="flex gap-4 max-w-md mx-auto">
                            <button
                              onClick={() => setShowOfferModal(true)}
                              className="flex-1 py-5 bg-white text-slate-900 rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-xl group-hover:scale-105 transition-all"
                            >
                              Extend Offer (₦)
                            </button>
                            <button className="flex-1 py-5 bg-white/10 border border-white/20 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest hover:bg-white/20">
                              Keep in Pool
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {candidateDetailTab === "message" && (
                      <div className="space-y-8">
                        <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[550px]">
                          <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                              Communication Ledger
                            </h3>
                            <div className="flex gap-2">
                              <button className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">
                                Slash Commands
                              </button>
                            </div>
                          </div>
                          <div className="flex-1 p-10 space-y-10 overflow-y-auto scrollbar-hide">
                            <div className="flex flex-col items-end">
                              <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] rounded-tr-none max-w-[85%] shadow-2xl shadow-indigo-100">
                                <p className="text-sm font-medium leading-relaxed">
                                  Hello Alex, we were impressed by your
                                  technical screen results! We'd like to
                                  schedule a final round with our VP of
                                  Engineering, Diana Prince.
                                </p>
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                                  <p className="text-[9px] font-black uppercase opacity-60">
                                    Recruiter • May 22, 10:42 AM
                                  </p>
                                  <CheckCircle2
                                    size={12}
                                    className="opacity-60"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-start">
                              <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2.5rem] rounded-tl-none max-w-[85%]">
                                <p className="text-sm font-medium text-slate-800 leading-relaxed">
                                  Hi Marcus, that sounds great. I am available
                                  this Friday afternoon or any time next
                                  Tuesday. Looking forward to meeting Diana!
                                </p>
                                <p className="text-[9px] font-black uppercase text-slate-400 mt-4 pt-4 border-t border-slate-100">
                                  Alex Rivera • May 22, 02:15 PM
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                placeholder="Type a message or use slash commands..."
                                className="w-full pl-6 pr-12 py-5 bg-white border-none rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm shadow-inner"
                              />
                              <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-indigo-600">
                                <Paperclip size={20} />
                              </button>
                            </div>
                            <button className="p-5 bg-indigo-600 text-white rounded-[1.8rem] shadow-2xl shadow-indigo-100 hover:scale-110 active:scale-95 transition-all">
                              <Send size={24} fill="currentColor" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {candidateDetailTab === "timeline" && (
                      <div className="space-y-10 relative">
                        <div className="absolute left-10 top-0 bottom-0 w-1 bg-slate-50" />
                        {selectedCandidate.timeline.map((item, i) => (
                          <motion.div
                            key={i}
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
                                  {item.date}
                                </p>
                              </div>
                              {item.note && (
                                <p className="text-sm text-slate-500 font-medium italic leading-relaxed">
                                  "{item.note}"
                                </p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {candidateDetailTab === "interviews" && (
                      <div className="space-y-10">
                        <div className="flex justify-between items-center">
                          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Interview History
                          </h3>
                          <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                            + Log Internal Feedback
                          </button>
                        </div>
                        <div className="space-y-6">
                          {MOCK_INTERVIEWS.filter(
                            (it) => it.candidateId === selectedCandidate.id,
                          ).map((it) => (
                            <div
                              key={it.id}
                              className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-10"
                            >
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
                                  <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
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
                                        {new Date(it.dateTime).toLocaleString()}
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
                                        {it.interviewers.join(", ")}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="w-full md:w-64 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                  Internal Scorecard
                                </p>
                                <div className="w-20 h-20 bg-white rounded-[1.5rem] shadow-xl flex items-center justify-center mb-4">
                                  <span className="text-3xl font-black text-indigo-600">
                                    4.8
                                  </span>
                                </div>
                                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                                  Full Feedback (3)
                                </button>
                              </div>
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
                <button className="px-10 py-5 bg-white border border-slate-200 text-rose-500 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-sm hover:bg-rose-50 transition-all flex items-center gap-2">
                  <Trash size={18} /> Reject
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="px-12 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-sm flex items-center gap-2"
                >
                  <Calendar size={18} /> Schedule
                </button>
                <button className="px-14 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
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
                <section className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Job Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Frontend Engineer"
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Department
                    </label>
                    <select className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800">
                      <option>Engineering</option>
                      <option>Design</option>
                      <option>Marketing</option>
                      <option>People Ops</option>
                    </select>
                  </div>
                </section>

                <section className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Target Salary Range (Annual ₦)
                  </label>
                  <div className="grid grid-cols-2 gap-8">
                    <input
                      type="number"
                      placeholder="Min (₦)"
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                    />
                    <input
                      type="number"
                      placeholder="Max (₦)"
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                    />
                  </div>
                </section>

                <section className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Job Description
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Describe the role responsibilities and requirements..."
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-3xl outline-none font-medium text-sm resize-none"
                  />
                </section>

                <section className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
                    Publish To Channels
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      "Career Page",
                      "LinkedIn",
                      "Indeed",
                      "Internal Board",
                      "Glassdoor",
                    ].map((channel) => (
                      <label
                        key={channel}
                        className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 cursor-pointer hover:border-indigo-300 transition-all"
                      >
                        <input
                          type="checkbox"
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
                  onClick={() => setShowJobPostingModal(false)}
                  className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                  Save Draft
                </button>
                <button className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                  <Megaphone size={16} /> Publish Requisition
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
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">
                            Interview Type
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            {["Video Call", "In-Person", "Phoner", "Panel"].map(
                              (t) => (
                                <button
                                  key={t}
                                  className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all text-left group focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                                >
                                  <Video
                                    size={24}
                                    className="mb-4 text-slate-300 group-hover:text-indigo-600 group-focus:text-indigo-600"
                                  />
                                  <span className="text-sm font-black text-slate-700 block">
                                    {t}
                                  </span>
                                </button>
                              ),
                            )}
                          </div>
                        </div>
                        <div className="space-y-8">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">
                              Stage Context
                            </label>
                            <select className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800">
                              <option>Technical Deep Dive</option>
                              <option>Culture Fit</option>
                              <option>Hiring Manager Screen</option>
                              <option>Executive Final</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">
                              Duration
                            </label>
                            <div className="flex gap-4">
                              {["30m", "45m", "60m", "90m"].map((d) => (
                                <button
                                  key={d}
                                  className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50"
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
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
                            placeholder="Search team members..."
                            className="w-full pl-16 pr-6 py-5 bg-slate-50 border-none rounded-[2rem] outline-none font-bold text-slate-800"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                          {teamMembers.map((m) => (
                            <label
                              key={m.id}
                              className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-[2rem] cursor-pointer hover:border-indigo-200 transition-all group"
                            >
                              <input
                                type="checkbox"
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
                        <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                          <AlertCircle
                            className="text-amber-500 shrink-0 mt-1"
                            size={20}
                          />
                          <div>
                            <h4 className="text-sm font-black text-amber-800 mb-1">
                              Availability Conflict
                            </h4>
                            <p className="text-xs text-amber-700 font-medium">
                              Tunde Bakare has a conflict between 2:00 PM - 3:00
                              PM on selected dates.
                            </p>
                          </div>
                        </div>
                      </section>
                    )}

                    {scheduleStep === 3 && (
                      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                          <div className="flex justify-between items-center mb-6">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                              May 2024
                            </h4>
                            <div className="flex gap-2">
                              <button className="p-2 bg-white rounded-lg shadow-sm">
                                <ChevronLeft size={16} />
                              </button>
                              <button className="p-2 bg-white rounded-lg shadow-sm">
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
                            {Array.from({ length: 31 }).map((_, i) => (
                              <button
                                key={i}
                                className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${i === 23 ? "bg-indigo-600 text-white shadow-lg" : "hover:bg-white hover:shadow-sm text-slate-600"}`}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Best Available Slots
                          </label>
                          {[
                            "09:00 AM - 10:00 AM",
                            "02:00 PM - 03:00 PM",
                            "04:30 PM - 05:30 PM",
                          ].map((slot) => (
                            <button
                              key={slot}
                              className="w-full p-5 bg-white border border-slate-200 rounded-2xl text-left hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all flex justify-between items-center group"
                            >
                              <span className="font-black text-sm text-slate-700">
                                {slot}
                              </span>
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                All Free
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
                              Auto-Generated Link
                            </h4>
                            <p className="text-sm font-medium text-indigo-700">
                              A secure Google Meet link will be created and
                              sent.
                            </p>
                          </div>
                          <div className="px-6 py-3 bg-white/50 rounded-xl text-xs font-mono font-bold text-indigo-800 border border-indigo-200">
                            meet.google.com/abc-xyz
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Or Specific Location
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Glass Room 3, Lagos HQ"
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                          />
                        </div>
                      </section>
                    )}

                    {scheduleStep === 5 && (
                      <section className="space-y-8">
                        <div className="flex gap-4 overflow-x-auto pb-4">
                          {[
                            "Standard Invite",
                            "Technical Prep",
                            "Casual Chat",
                          ].map((t) => (
                            <button
                              key={t}
                              className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 whitespace-nowrap hover:bg-slate-50"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-4">
                          <div className="flex gap-4 border-b border-slate-200 pb-4">
                            <span className="text-xs font-black text-slate-400 w-16">
                              To:
                            </span>
                            <span className="text-sm font-bold text-slate-800">
                              alex.rivera@example.com
                            </span>
                          </div>
                          <div className="flex gap-4 border-b border-slate-200 pb-4">
                            <span className="text-xs font-black text-slate-400 w-16">
                              Subject:
                            </span>
                            <span className="text-sm font-bold text-slate-800">
                              Interview Invitation: Senior React Developer @
                              ZenHR
                            </span>
                          </div>
                          <textarea
                            className="w-full h-40 bg-transparent border-none outline-none font-medium text-sm text-slate-600 resize-none leading-relaxed"
                            defaultValue={`Hi Alex,\n\nWe are excited to move forward! As discussed, we would like to schedule a Technical Deep Dive with our engineering team.\n\nPlease find the details attached.`}
                          />
                        </div>
                      </section>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="p-10 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
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
                  onClick={() =>
                    scheduleStep < 5
                      ? setScheduleStep((s) => s + 1)
                      : setShowScheduleModal(false)
                  } // In real app, close on finish
                  className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  {scheduleStep === 5 ? "Send Invites" : "Continue"}{" "}
                  <ArrowRight size={16} />
                </button>
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
                              Candidate & Role
                            </label>
                            <input
                              type="text"
                              defaultValue={
                                selectedCandidate?.name || "Chinedu Okeke"
                              }
                              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800"
                              readOnly
                            />
                            <input
                              type="text"
                              defaultValue="Senior React Developer"
                              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800 mt-2"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Start Date
                            </label>
                            <input
                              type="date"
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
                                    defaultValue="14,500,000"
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
                                Dear {selectedCandidate?.name || "Chinedu"},
                              </p>
                              <p>
                                We are pleased to offer you the position of{" "}
                                <strong>Senior React Developer</strong> at
                                ZenHR.
                              </p>
                              <p>
                                Your starting annual compensation will be{" "}
                                <strong>₦14,500,000</strong> paid in monthly
                                installments, along with <strong>1,500</strong>{" "}
                                stock options vesting over 4 years.
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
                                  {selectedCandidate?.name || "Candidate"}
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
                                7 Days
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

              <div className="p-10 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
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
                  onClick={() =>
                    offerStep < 3
                      ? setOfferStep((s) => s + 1)
                      : setShowOfferModal(false)
                  }
                  className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  {offerStep === 3 ? "Send Offer" : "Continue"}{" "}
                  <ArrowRight size={16} />
                </button>
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
