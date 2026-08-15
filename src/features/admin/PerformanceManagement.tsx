import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  TrendingUp,
  Target,
  Star,
  Heart,
  Calendar,
  Plus,
  X,
  Play,
  Square,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Ghost,
  Users2,
  Settings2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  useReviewCycles,
  useCreateReviewCycle,
  useActivateReviewCycle,
  useCloseReviewCycle,
  useDeleteReviewCycle,
  useAdminPerformanceAnalytics,
  useAdminAssessments,
  useSubmitManagerReview,
  useAdminGoals,
  useCreateCompanyGoal,
  useShoutouts,
  useCycleStages,
  useUpdateCycleStage,
  useAdminPeerReviews,
  useDepartments,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { usePopup } from '../../components/PopupProvider';
import { StageTimeline, DeadlineBanner } from '../../components/StageTimeline';

const DIST_COLORS = ['#ef4444', '#f97316', '#3b82f6', '#8b5cf6', '#10b981'];

const CYCLE_STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  upcoming: 'bg-slate-100 text-slate-500 border-slate-200',
  closed: 'bg-slate-100 text-slate-400 border-slate-200',
};

const ASSESSMENT_STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-500',
  submitted: 'bg-amber-50 text-amber-600',
  under_review: 'bg-amber-50 text-amber-600',
  completed: 'bg-emerald-50 text-emerald-600',
};

const emptyCycleForm = { name: '', startDate: '', endDate: '', selfReviewDueDate: '', managerReviewDueDate: '' };
const emptyGoalForm = { title: '', description: '', scope: 'company', departmentId: '', dueDate: '' };

const PerformanceManagement: React.FC = () => {
  const { user } = useAuth();
  const { confirm } = usePopup();
  const [activeTab, setActiveTab] = useState<'overview' | 'cycles' | 'reviews' | '360' | 'goals' | 'recognition'>('overview');

  const { data: cyclesData } = useReviewCycles();
  const cycles = cyclesData?.cycles || [];
  const ratingScale = cyclesData?.ratingScale || [];
  const activeCycle = cycles.find((c: any) => c.status === 'active');

  const [analyticsCycleId, setAnalyticsCycleId] = useState<string>('');
  const effectiveCycleId = analyticsCycleId || activeCycle?.id || '';
  const { data: analytics } = useAdminPerformanceAnalytics(effectiveCycleId || undefined);
  const { data: activeCycleStages = [] } = useCycleStages(activeCycle?.id);

  const createCycle = useCreateReviewCycle();
  const activateCycle = useActivateReviewCycle();
  const closeCycle = useCloseReviewCycle();
  const deleteCycle = useDeleteReviewCycle();

  const [showCycleModal, setShowCycleModal] = useState(false);
  const [cycleForm, setCycleForm] = useState(emptyCycleForm);
  const [cycleError, setCycleError] = useState<string | null>(null);

  // --- Stage editor ---
  const [editingStagesCycle, setEditingStagesCycle] = useState<any>(null);
  const { data: editingStages = [] } = useCycleStages(editingStagesCycle?.id);
  const [stageDrafts, setStageDrafts] = useState<Record<string, { startDate: string; dueDate: string }>>({});
  const updateStage = useUpdateCycleStage();

  const openStageEditor = (cycle: any) => {
    setEditingStagesCycle(cycle);
    setStageDrafts({});
  };

  const stageDraftFor = (stage: any) =>
    stageDrafts[stage.id] || { startDate: stage.startDate || '', dueDate: stage.dueDate || '' };

  const handleSaveStages = () => {
    if (!editingStagesCycle) return;
    editingStages.forEach((stage: any) => {
      const draft = stageDrafts[stage.id];
      if (!draft) return;
      updateStage.mutate({
        cycleId: editingStagesCycle.id,
        stageId: stage.id,
        data: { startDate: draft.startDate || null, dueDate: draft.dueDate || null },
      });
    });
    setEditingStagesCycle(null);
  };

  // --- 360 reviews browse ---
  const { data: peerReviewsData } = useAdminPeerReviews(effectiveCycleId || undefined);
  const peerReviews = peerReviewsData?.reviews || [];

  const handleCreateCycle = () => {
    if (!cycleForm.name.trim()) {
      setCycleError('Cycle name is required.');
      return;
    }
    setCycleError(null);
    createCycle.mutate(cycleForm, {
      onSuccess: () => {
        setShowCycleModal(false);
        setCycleForm(emptyCycleForm);
      },
      onError: (err: any) => setCycleError(err.message || 'Failed to create cycle.'),
    });
  };

  // --- Reviews browse ---
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('');
  const { data: assessmentsData } = useAdminAssessments({ cycleId: effectiveCycleId || undefined, status: reviewStatusFilter || undefined });
  const assessments = assessmentsData?.assessments || [];
  const submitReview = useSubmitManagerReview();

  const [reviewingAssessment, setReviewingAssessment] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  const openReviewModal = (assessment: any) => {
    setReviewingAssessment(assessment);
    setReviewRating(assessment.managerRating || '');
    setReviewComment(assessment.managerComment || '');
  };

  const handleSubmitReview = () => {
    if (!reviewingAssessment || !reviewRating) return;
    submitReview.mutate(
      { id: reviewingAssessment.id, managerRating: reviewRating, managerComment: reviewComment },
      { onSuccess: () => setReviewingAssessment(null) }
    );
  };

  // --- Goals browse ---
  const [goalScopeFilter, setGoalScopeFilter] = useState<string>('');
  const [goalDepartmentFilter, setGoalDepartmentFilter] = useState<string>('');
  const { data: companyGoals = [] } = useAdminGoals(goalScopeFilter || undefined, goalDepartmentFilter || undefined);
  const { data: departments = [] } = useDepartments();
  const createCompanyGoal = useCreateCompanyGoal();
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState(emptyGoalForm);
  const [goalError, setGoalError] = useState<string | null>(null);

  const handleCreateGoal = () => {
    if (!goalForm.title.trim() || !user?.id) return;
    if (goalForm.scope === 'department' && !goalForm.departmentId) {
      setGoalError('Pick which department this objective belongs to.');
      return;
    }
    setGoalError(null);
    createCompanyGoal.mutate(
      { ...goalForm, employeeOwnerId: user.id },
      {
        onSuccess: () => {
          setShowGoalModal(false);
          setGoalForm(emptyGoalForm);
        },
        onError: (err: any) => setGoalError(err.message || 'Failed to create objective.'),
      }
    );
  };

  // --- Recognition wall ---
  const { data: shoutouts = [] } = useShoutouts();

  const statCards = useMemo(
    () => [
      {
        label: 'Avg. Rating',
        value: analytics?.avgRating ? `${analytics.avgRating} / 5` : '—',
        icon: <Star size={20} />,
        bg: 'bg-amber-50 text-amber-600',
      },
      {
        label: 'Pending Manager Reviews',
        value: analytics?.pendingManagerReview ?? 0,
        icon: <Clock size={20} />,
        bg: 'bg-rose-50 text-rose-500',
      },
      {
        label: 'Reviews Completed',
        value: analytics?.completedReviews ?? 0,
        icon: <CheckCircle2 size={20} />,
        bg: 'bg-emerald-50 text-emerald-600',
      },
      {
        label: 'Goal Completion Rate',
        value: `${analytics?.goalStats?.completionRate ?? 0}%`,
        icon: <Target size={20} />,
        bg: 'bg-indigo-50 text-indigo-600',
      },
    ],
    [analytics]
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
              <Trophy size={20} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Performance & Growth</h1>
          </div>
          <p className="text-slate-500 font-medium">
            Company-wide review cycles, ratings, goals and recognition.
          </p>
        </div>

        <div className="flex bg-white p-2 rounded-3xl border border-slate-200 shadow-sm w-max overflow-x-auto scrollbar-hide">
          {[
            { id: 'overview', name: 'Overview', icon: <TrendingUp size={18} /> },
            { id: 'cycles', name: 'Review Cycles', icon: <Calendar size={18} /> },
            { id: 'reviews', name: 'Reviews', icon: <Star size={18} /> },
            { id: '360', name: '360 Reviews', icon: <Users2 size={18} /> },
            { id: 'goals', name: 'Goals', icon: <Target size={18} /> },
            { id: 'recognition', name: 'Recognition', icon: <Heart size={18} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
          {activeTab === 'overview' && (
            <div className="space-y-8 pb-20">
              {activeCycle && activeCycleStages.length > 0 && (
                <div className="space-y-4">
                  <DeadlineBanner stages={activeCycleStages} cycleName={activeCycle.name} />
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <StageTimeline stages={activeCycleStages} />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 font-medium">
                  Scoped to{' '}
                  <span className="font-black text-slate-700">{analytics?.cycle?.name || 'no active cycle'}</span>
                </p>
                {cycles.length > 0 && (
                  <select
                    value={effectiveCycleId}
                    onChange={(e) => setAnalyticsCycleId(e.target.value)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none"
                  >
                    {cycles.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {statCards.map((s, i) => (
                  <motion.div key={i} whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-4`}>{s.icon}</div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{s.value}</h3>
                  </motion.div>
                ))}
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-1">Rating Distribution</h3>
                <p className="text-xs text-slate-400 font-medium mb-8">Latest manager (or self, if not yet reviewed) rating per employee this cycle.</p>
                <div className="h-[280px] w-full">
                  {analytics?.distribution ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.distribution} margin={{ top: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="count" radius={[12, 12, 0, 0]} barSize={60}>
                          {analytics.distribution.map((_: any, idx: number) => (
                            <Cell key={idx} fill={DIST_COLORS[idx] || '#94a3b8'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">No ratings recorded yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cycles' && (
            <div className="space-y-8 pb-20">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Review Cycles</h2>
                  <p className="text-sm text-slate-500 font-medium">Exactly one cycle is active at a time — that's what employees self-assess against.</p>
                </div>
                <button
                  onClick={() => setShowCycleModal(true)}
                  className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
                >
                  <Plus size={20} strokeWidth={3} /> New Cycle
                </button>
              </div>

              {cycles.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <Calendar size={48} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No review cycles yet — create one to open self-assessments.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cycles.map((cycle: any) => (
                    <div key={cycle.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-5">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-black text-slate-800">{cycle.name}</h3>
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${CYCLE_STATUS_STYLES[cycle.status]}`}>
                          {cycle.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-bold space-y-1">
                        {cycle.startDate && <p>Runs {cycle.startDate} → {cycle.endDate || '—'}</p>}
                        {cycle.selfReviewDueDate && <p>Self-review due {cycle.selfReviewDueDate}</p>}
                        {cycle.managerReviewDueDate && <p>Manager review due {cycle.managerReviewDueDate}</p>}
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-slate-50">
                        {cycle.status !== 'active' && (
                          <button
                            onClick={() => activateCycle.mutate(cycle.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all"
                          >
                            <Play size={14} /> Activate
                          </button>
                        )}
                        {cycle.status === 'active' && (
                          <button
                            onClick={() => closeCycle.mutate(cycle.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                          >
                            <Square size={14} /> Close
                          </button>
                        )}
                        <button
                          onClick={() => openStageEditor(cycle)}
                          className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"
                          title="Manage stage timeline"
                        >
                          <Settings2 size={14} />
                        </button>
                        <button
                          onClick={async () => {
                            if (await confirm(`Delete "${cycle.name}"? This only works if no assessments have been logged against it.`)) {
                              deleteCycle.mutate(cycle.id);
                            }
                          }}
                          className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6 pb-20">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">All Reviews</h2>
                  <p className="text-sm text-slate-500 font-medium">Browse and, where needed, complete a manager review yourself.</p>
                </div>
                <div className="flex gap-3">
                  <select
                    value={effectiveCycleId}
                    onChange={(e) => setAnalyticsCycleId(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none"
                  >
                    <option value="">All cycles</option>
                    {cycles.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={reviewStatusFilter}
                    onChange={(e) => setReviewStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none"
                  >
                    <option value="">All statuses</option>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                {assessments.length === 0 ? (
                  <div className="text-center py-20">
                    <Star size={48} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No assessments match these filters.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-8 py-4">Employee</th>
                          <th className="px-4 py-4">Cycle</th>
                          <th className="px-4 py-4">Status</th>
                          <th className="px-4 py-4">Self Rating</th>
                          <th className="px-4 py-4">Manager Rating</th>
                          <th className="px-8 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {assessments.map((a: any) => (
                          <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-4">
                              <p className="text-sm font-black text-slate-800">{a.employeeName} {a.employeeLastName}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{a.department}</p>
                            </td>
                            <td className="px-4 py-4 text-xs font-bold text-slate-500">{a.cycleName}</td>
                            <td className="px-4 py-4">
                              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${ASSESSMENT_STATUS_STYLES[a.status] || 'bg-slate-100 text-slate-500'}`}>
                                {a.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-xs font-bold text-slate-600">{a.selfRating?.replace(/_/g, ' ') || '—'}</td>
                            <td className="px-4 py-4 text-xs font-bold text-slate-600">{a.managerRating?.replace(/_/g, ' ') || '—'}</td>
                            <td className="px-8 py-4 text-right">
                              <button
                                onClick={() => openReviewModal(a)}
                                className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                              >
                                {a.status === 'completed' ? 'Edit Review' : 'Review'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === '360' && (
            <div className="space-y-6 pb-20">
              <div>
                <h2 className="text-2xl font-black text-slate-800">360 Reviews</h2>
                <p className="text-sm text-slate-500 font-medium">Peer nominations and upward reviews across the company for {analytics?.cycle?.name || 'the selected cycle'}.</p>
              </div>
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                {peerReviews.length === 0 ? (
                  <div className="text-center py-20">
                    <Users2 size={48} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No peer or upward reviews yet this cycle.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-8 py-4">Reviewee</th>
                          <th className="px-4 py-4">Direction</th>
                          <th className="px-4 py-4">Status</th>
                          <th className="px-4 py-4">Rating</th>
                          <th className="px-8 py-4">Submitted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {peerReviews.map((r: any) => (
                          <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-4 text-sm font-black text-slate-800">{r.revieweeName} {r.revieweeLastName}</td>
                            <td className="px-4 py-4">
                              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${r.direction === 'upward' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                {r.direction}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${r.status === 'submitted' ? 'bg-emerald-50 text-emerald-600' : r.status === 'rejected' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-600'}`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-xs font-bold text-slate-600">{r.rating?.replace(/_/g, ' ') || '—'}</td>
                            <td className="px-8 py-4 text-xs font-bold text-slate-400">{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-6 pb-20">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Company-wide Goals</h2>
                  <p className="text-sm text-slate-500 font-medium">Set top-level objectives, and see every team's OKRs in one place.</p>
                </div>
                <div className="flex gap-3">
                  <select
                    value={goalScopeFilter}
                    onChange={(e) => setGoalScopeFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none"
                  >
                    <option value="">All scopes</option>
                    <option value="company">Company</option>
                    <option value="department">Department</option>
                    <option value="team">Team</option>
                    <option value="individual">Individual</option>
                  </select>
                  {goalScopeFilter === 'department' && (
                    <select
                      value={goalDepartmentFilter}
                      onChange={(e) => setGoalDepartmentFilter(e.target.value)}
                      className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none"
                    >
                      <option value="">All departments</option>
                      {departments.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() => setShowGoalModal(true)}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
                  >
                    <Plus size={16} strokeWidth={3} /> Set Objective
                  </button>
                </div>
              </div>

              {companyGoals.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <Target size={48} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No goals match these filters yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {companyGoals.map((g: any) => (
                    <div key={g.id} className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{g.scope}</span>
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${g.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {g.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-800">{g.title}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        {g.scope === 'department' && g.departmentName ? g.departmentName : `${g.employeeName} ${g.employeeLastName} · ${g.department}`}
                      </p>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600" style={{ width: `${g.progress}%` }} />
                      </div>
                      <p className="text-right text-xs font-black text-slate-600">{g.progress}%</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'recognition' && (
            <div className="max-w-4xl mx-auto space-y-6 pb-20">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Sparkles className="text-indigo-500" /> Company Recognition Wall</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Every shoutout sent across the company, newest first.</p>
              </div>
              {shoutouts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <Ghost size={40} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No shoutouts yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {shoutouts.map((fb: any) => (
                    <div key={fb.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-black text-slate-800">
                          <span className="text-indigo-600">Someone</span> <span className="text-slate-300 font-normal mx-1">→</span> {fb.toEmployeeName}
                        </p>
                        <span className="px-3 py-1 bg-slate-50 rounded-lg text-[9px] font-black uppercase text-slate-500">#{fb.type}</span>
                      </div>
                      <p className="text-sm text-slate-600 font-medium italic">"{fb.message}"</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-3">{new Date(fb.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* New Cycle Modal */}
      <AnimatePresence>
        {showCycleModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCycleModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden">
              <div className="p-10 bg-indigo-600 text-white flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black mb-1">New Review Cycle</h2>
                  <p className="text-indigo-100 text-sm font-medium">e.g. "H2 2026" or "Q1 2027"</p>
                </div>
                <button onClick={() => setShowCycleModal(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X size={20} /></button>
              </div>
              <div className="p-10 space-y-6">
                {cycleError && <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold">{cycleError}</div>}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cycle Name</label>
                  <input
                    type="text"
                    value={cycleForm.name}
                    onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })}
                    placeholder="H2 2026"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-black text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</label>
                    <input type="date" value={cycleForm.startDate} onChange={(e) => setCycleForm({ ...cycleForm, startDate: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</label>
                    <input type="date" value={cycleForm.endDate} onChange={(e) => setCycleForm({ ...cycleForm, endDate: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Self-Review Due</label>
                    <input type="date" value={cycleForm.selfReviewDueDate} onChange={(e) => setCycleForm({ ...cycleForm, selfReviewDueDate: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manager Review Due</label>
                    <input type="date" value={cycleForm.managerReviewDueDate} onChange={(e) => setCycleForm({ ...cycleForm, managerReviewDueDate: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700" />
                  </div>
                </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                <button onClick={() => setShowCycleModal(false)} className="px-8 py-4 bg-white text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                <button
                  disabled={createCycle.isPending}
                  onClick={handleCreateCycle}
                  className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                  {createCycle.isPending ? 'Creating…' : 'Create Cycle'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manager Review Modal */}
      <AnimatePresence>
        {reviewingAssessment && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setReviewingAssessment(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden">
              <div className="p-10 bg-indigo-600 text-white flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black mb-1">Review {reviewingAssessment.employeeName} {reviewingAssessment.employeeLastName}</h2>
                  <p className="text-indigo-100 text-sm font-medium">{reviewingAssessment.cycleName}</p>
                </div>
                <button onClick={() => setReviewingAssessment(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X size={20} /></button>
              </div>
              <div className="p-10 space-y-6">
                {reviewingAssessment.selfRating && (
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Self Rating</p>
                    <p className="text-sm font-bold text-slate-700">{reviewingAssessment.selfRating.replace(/_/g, ' ')}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manager Rating</label>
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
                    placeholder="Share context behind this rating…"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-3xl outline-none font-medium resize-none"
                  />
                </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                <button onClick={() => setReviewingAssessment(null)} className="px-8 py-4 bg-white text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                <button
                  disabled={!reviewRating || submitReview.isPending}
                  onClick={handleSubmitReview}
                  className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                  {submitReview.isPending ? 'Saving…' : 'Submit Review'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Set Objective Modal */}
      <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGoalModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden">
              <div className="p-10 bg-indigo-600 text-white flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black mb-1">Set Strategic Objective</h2>
                  <p className="text-indigo-100 text-sm font-medium">You'll be listed as the sponsor — teams align under this.</p>
                </div>
                <button onClick={() => setShowGoalModal(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X size={20} /></button>
              </div>
              <div className="p-10 space-y-6">
                {goalError && <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold">{goalError}</div>}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objective Title</label>
                  <input
                    type="text"
                    value={goalForm.title}
                    onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                    placeholder="e.g. Africa's Leading Payroll Engine"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-black text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                  <textarea
                    rows={3}
                    value={goalForm.description}
                    onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-3xl outline-none font-medium resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scope</label>
                    <select
                      value={goalForm.scope}
                      onChange={(e) => setGoalForm({ ...goalForm, scope: e.target.value, departmentId: e.target.value === 'department' ? goalForm.departmentId : '' })}
                      className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700"
                    >
                      <option value="company">Company</option>
                      <option value="department">Department</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Date</label>
                    <input type="date" value={goalForm.dueDate} onChange={(e) => setGoalForm({ ...goalForm, dueDate: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700" />
                  </div>
                </div>
                {goalForm.scope === 'department' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</label>
                    <select
                      value={goalForm.departmentId}
                      onChange={(e) => setGoalForm({ ...goalForm, departmentId: e.target.value })}
                      className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700"
                    >
                      <option value="">Select a department…</option>
                      {departments.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 font-medium">Only visible to employees in this department, alongside any company-wide objectives.</p>
                  </div>
                )}
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                <button onClick={() => setShowGoalModal(false)} className="px-8 py-4 bg-white text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                <button
                  disabled={!goalForm.title.trim() || (goalForm.scope === 'department' && !goalForm.departmentId) || createCompanyGoal.isPending}
                  onClick={handleCreateGoal}
                  className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                  {createCompanyGoal.isPending ? 'Creating…' : 'Establish Objective'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stage Timeline Editor */}
      <AnimatePresence>
        {editingStagesCycle && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingStagesCycle(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-10 bg-indigo-600 text-white flex justify-between items-start shrink-0">
                <div>
                  <h2 className="text-2xl font-black mb-1">Stage Timeline</h2>
                  <p className="text-indigo-100 text-sm font-medium">{editingStagesCycle.name} — set each stage's window. Leave dates blank for "always open."</p>
                </div>
                <button onClick={() => setEditingStagesCycle(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X size={20} /></button>
              </div>
              <div className="p-10 space-y-4 overflow-y-auto scrollbar-hide">
                {editingStages.map((stage: any) => {
                  const draft = stageDraftFor(stage);
                  return (
                    <div key={stage.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                      <p className="flex-1 text-sm font-bold text-slate-700">{stage.name}</p>
                      <input
                        type="date"
                        value={draft.startDate}
                        onChange={(e) => setStageDrafts({ ...stageDrafts, [stage.id]: { ...draft, startDate: e.target.value } })}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                      />
                      <span className="text-slate-300 text-xs">→</span>
                      <input
                        type="date"
                        value={draft.dueDate}
                        onChange={(e) => setStageDrafts({ ...stageDrafts, [stage.id]: { ...draft, dueDate: e.target.value } })}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 shrink-0">
                <button onClick={() => setEditingStagesCycle(null)} className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                <button
                  onClick={handleSaveStages}
                  className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100"
                >
                  Save Timeline
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PerformanceManagement;
