import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, TrendingUp, Users, FileText, Download,
  ArrowUpRight, ArrowDownRight, Layers, Briefcase, Wallet,
  Clock, Building2, MapPin, UserCheck, CalendarDays, Target,
  RefreshCw, AlertCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie, Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useReportsOverview, downloadReportCsv } from '../../api/client';

const formatCurrency = (val: number | undefined | null) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(val || 0);

const tooltipStyle = { borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 700 };
const axisTick = { fontSize: 10, fontWeight: 800, fill: '#94a3b8' };

// ---------------------------------------------------------------------
// Small reusable pieces
// ---------------------------------------------------------------------

const Kpi: React.FC<{ label: string; value: string | number; trend?: string; pos?: boolean }> = ({ label, value, trend, pos }) => (
  <motion.div whileHover={{ y: -4 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
    <div>
      <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{value}</h3>
      {trend && (
        <p className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${pos ? 'text-emerald-500' : 'text-rose-500'}`}>
          {pos ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {trend}
        </p>
      )}
    </div>
  </motion.div>
);

const Card: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className }) => (
  <div className={`bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm ${className || ''}`}>
    <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">{icon}{title}</h3>
    {children}
  </div>
);

const Empty: React.FC<{ label?: string }> = ({ label }) => (
  <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center text-slate-300 gap-2">
    <AlertCircle size={28} />
    <p className="text-xs font-bold text-slate-400">{label || 'No data yet'}</p>
  </div>
);

const DistributionBar: React.FC<{ data: { name: string; value: number; fill?: string }[]; height?: number }> = ({ data, height = 260 }) => {
  if (!data || data.length === 0) return <Empty />;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={110} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={18}>
            {data.map((d, i) => <Cell key={i} fill={d.fill || '#6366f1'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const DistributionPie: React.FC<{ data: { name: string; value: number; fill?: string }[]; height?: number }> = ({ data, height = 260 }) => {
  if (!data || data.length === 0) return <Empty />;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} innerRadius={60} outerRadius={90} paddingAngle={6} dataKey="value">
            {data.map((d, i) => <Cell key={i} fill={d.fill || '#6366f1'} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// ---------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------

type TabId = 'overview' | 'workforce' | 'recruitment' | 'payroll' | 'exports';

const Reports: React.FC = () => {
  const { user } = useAuth();
  const isPayrollOfficer = user?.role === 'PAYROLL_OFFICER';
  const { data, isLoading, isError, refetch, isFetching } = useReportsOverview();

  const availableTabs: { id: TabId; name: string; icon: React.ReactNode }[] = isPayrollOfficer
    ? [
      { id: 'payroll', name: 'Payroll', icon: <Wallet size={18} /> },
      { id: 'exports', name: 'Exports', icon: <Download size={18} /> },
    ]
    : [
      { id: 'overview', name: 'Overview', icon: <TrendingUp size={18} /> },
      { id: 'workforce', name: 'Workforce', icon: <Users size={18} /> },
      { id: 'recruitment', name: 'Recruitment', icon: <Briefcase size={18} /> },
      { id: 'payroll', name: 'Payroll', icon: <Wallet size={18} /> },
      { id: 'exports', name: 'Exports', icon: <Download size={18} /> },
    ];

  const [activeTab, setActiveTab] = useState<TabId>(availableTabs[0].id);

  const [exportBusy, setExportBusy] = useState<string | null>(null);
  const now = new Date();
  const [exportMonth, setExportMonth] = useState(now.getMonth() + 1);
  const [exportYear, setExportYear] = useState(now.getFullYear());

  const runExport = async (type: 'employees' | 'requisitions' | 'leave' | 'payroll') => {
    setExportBusy(type);
    try {
      await downloadReportCsv(type, type === 'payroll' ? { month: exportMonth, year: exportYear } : undefined);
    } catch (e: any) {
      alert(e.message || 'Export failed');
    } finally {
      setExportBusy(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-40">
        <RefreshCw className="animate-spin text-indigo-400" size={32} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 text-center">
        <AlertCircle className="text-rose-400" size={32} />
        <p className="text-slate-500 font-bold">Couldn't load reports right now.</p>
        <button onClick={() => refetch()} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">Retry</button>
      </div>
    );
  }

  const { workforce, recruitment, payroll, leaveAttendance, performance } = data;

  const renderOverview = () => (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Kpi label="Total Headcount" value={workforce.summary.totalHeadcount} />
        <Kpi
          label="Attrition (12mo)"
          value={`${workforce.summary.attritionRate}%`}
          trend={`${workforce.summary.exitsLast12Months} exits`}
          pos={workforce.summary.attritionRate < 10}
        />
        <Kpi label="Avg. Tenure" value={`${workforce.summary.avgTenureYears}y`} />
        <Kpi label="Open Positions" value={recruitment.summary.openPositions} />
        <Kpi label="Monthly Payroll" value={formatCurrency(payroll.summary.monthlyRunRate)} />
        <Kpi
          label="Pending Compliance"
          value={payroll.summary.pendingComplianceCount}
          trend={payroll.summary.pendingComplianceCount > 0 ? formatCurrency(payroll.summary.pendingComplianceAmount) : 'All clear'}
          pos={payroll.summary.pendingComplianceCount === 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-black text-slate-800">Headcount Trend</h3>
            <p className="text-xs text-slate-400 font-medium">Hires vs. exits over the last 12 months</p>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={workforce.headcountTrend}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={axisTick} />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }} />
                <Area type="monotone" dataKey="total" name="Headcount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#totalGrad)" />
                <Bar dataKey="hires" name="Hires" fill="#10b981" barSize={10} radius={[4, 4, 0, 0]} />
                <Bar dataKey="exits" name="Exits" fill="#f43f5e" barSize={10} radius={[4, 4, 0, 0]} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Card title="Department Mix" icon={<Layers className="text-indigo-600" size={20} />}>
          <DistributionPie data={workforce.departmentDistribution} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Requisition Pipeline" icon={<Briefcase className="text-amber-500" size={20} />}>
          <DistributionBar data={recruitment.statusBreakdown} />
        </Card>
        <Card title="Payroll Cost Trend" icon={<Wallet className="text-emerald-500" size={20} />}>
          {payroll.costTrend.length === 0 ? <Empty label="No paid payroll runs yet" /> : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={payroll.costTrend}>
                  <defs>
                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={axisTick} />
                  <YAxis hide />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => formatCurrency(Number(v))} />
                  <Area type="monotone" dataKey="net" name="Net Pay" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#netGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );

  const renderWorkforce = () => (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Active" value={workforce.summary.activeCount} />
        <Kpi label="Onboarding" value={workforce.summary.onboardingCount} />
        <Kpi label="On Notice" value={workforce.summary.onNoticeCount} />
        <Kpi label="New Hires (mo)" value={workforce.summary.newHiresThisMonth} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Gender Diversity" icon={<Users className="text-indigo-600" size={20} />}>
          <DistributionPie data={workforce.genderDistribution} />
        </Card>
        <Card title="Tenure Distribution" icon={<Clock className="text-indigo-600" size={20} />}>
          {workforce.tenureDistribution.every((d: any) => d.value === 0) ? <Empty /> : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workforce.tenureDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} />
                  <YAxis hide />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card title="Employment Type" icon={<Building2 className="text-slate-500" size={20} />}>
          <DistributionBar data={workforce.employmentTypeDistribution} height={220} />
        </Card>
        <Card title="Locations" icon={<MapPin className="text-slate-500" size={20} />}>
          <DistributionBar data={workforce.locationDistribution} height={220} />
        </Card>
        <Card title="Status Breakdown" icon={<UserCheck className="text-slate-500" size={20} />}>
          <DistributionBar data={workforce.statusBreakdown} height={220} />
        </Card>
      </div>

      {workforce.exitReasonBreakdown.length > 0 && (
        <Card title="Exit Reasons (all-time)" icon={<ArrowDownRight className="text-rose-500" size={20} />}>
          <DistributionBar data={workforce.exitReasonBreakdown} height={200} />
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Leave Utilization (YTD)" icon={<CalendarDays className="text-amber-500" size={20} />}>
          <DistributionBar data={leaveAttendance.leaveByType} height={220} />
        </Card>
        <Card title="Goals by Status" icon={<Target className="text-emerald-500" size={20} />}>
          {performance.totalGoals === 0 ? <Empty label="No goals logged yet" /> : (
            <>
              <DistributionPie data={performance.goalsByStatus} height={200} />
              <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">
                Avg progress: <span className="text-slate-700">{performance.avgGoalProgress}%</span>
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );

  const renderRecruitment = () => (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Kpi label="Total Requisitions" value={recruitment.summary.totalRequisitions} />
        <Kpi label="Open Positions" value={recruitment.summary.openPositions} />
        <Kpi label="Filled (mo)" value={recruitment.summary.filledThisMonth} />
        <Kpi label="Avg. Days Open" value={recruitment.summary.avgDaysOpen} />
        <Kpi label="Avg. Time to Fill" value={recruitment.summary.avgTimeToFill !== null ? `${recruitment.summary.avgTimeToFill}d` : '—'} />
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6">Requisitions Opened vs. Filled</h3>
        {recruitment.monthlyTrend.every((m: any) => m.opened === 0 && m.filled === 0) ? <Empty /> : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recruitment.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={axisTick} />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }} />
                <Bar dataKey="opened" name="Opened" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={18} />
                <Bar dataKey="filled" name="Filled" fill="#10b981" radius={[8, 8, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card title="By Status" icon={<Briefcase className="text-indigo-600" size={20} />}>
          <DistributionBar data={recruitment.statusBreakdown} height={220} />
        </Card>
        <Card title="By Department" icon={<Layers className="text-indigo-600" size={20} />}>
          <DistributionBar data={recruitment.byDepartment} height={220} />
        </Card>
        <Card title="By Priority" icon={<AlertCircle className="text-amber-500" size={20} />}>
          <DistributionPie data={recruitment.byPriority} height={220} />
        </Card>
      </div>
    </div>
  );

  const renderPayroll = () => (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Monthly Run-Rate" value={formatCurrency(payroll.summary.monthlyRunRate)} />
        <Kpi
          label="Last Paid Run"
          value={payroll.summary.lastPaidRunNet !== null ? formatCurrency(payroll.summary.lastPaidRunNet) : '—'}
          trend={payroll.summary.lastPaidRunPeriod || undefined}
          pos
        />
        <Kpi label="Pending Compliance" value={payroll.summary.pendingComplianceCount} />
        <Kpi label="Pending Amount" value={formatCurrency(payroll.summary.pendingComplianceAmount)} />
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6">Cost Trend (Paid Runs)</h3>
        {payroll.costTrend.length === 0 ? <Empty label="No paid payroll runs yet" /> : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={payroll.costTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={axisTick} />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => formatCurrency(Number(v))} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }} />
                <Area type="monotone" dataKey="gross" name="Gross" stroke="#6366f1" fill="#6366f1" fillOpacity={0.08} strokeWidth={2} />
                <Area type="monotone" dataKey="net" name="Net" stroke="#10b981" fill="#10b981" fillOpacity={0.12} strokeWidth={2} />
                <Area type="monotone" dataKey="tax" name="Tax" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Cost by Department (Run-Rate)" icon={<Layers className="text-indigo-600" size={20} />}>
          <DistributionBar data={payroll.costByDepartment.map((d: any) => ({ ...d, value: d.value }))} />
        </Card>
        <Card title="Annual Salary Bands" icon={<Wallet className="text-emerald-500" size={20} />}>
          <DistributionBar data={payroll.salaryBands} />
        </Card>
      </div>

      <Card title="Compliance (Statutory Remittances)" icon={<FileText className="text-rose-500" size={20} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="flex gap-8">
            <div>
              <p className="text-3xl font-black text-slate-800">{payroll.complianceSummary.pending}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
            </div>
            <div>
              <p className="text-3xl font-black text-emerald-500">{payroll.complianceSummary.completed}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</p>
            </div>
          </div>
          <DistributionBar data={payroll.complianceSummary.byType} height={160} />
        </div>
      </Card>
    </div>
  );

  const exportCards: { type: 'employees' | 'requisitions' | 'leave' | 'payroll'; title: string; desc: string; icon: React.ReactNode; visible: boolean }[] = [
    { type: 'employees', title: 'Workforce Roster', desc: 'Every employee on record: dept, role, status, hire date, salary.', icon: <Users className="text-indigo-600" />, visible: !isPayrollOfficer },
    { type: 'requisitions', title: 'Job Requisitions', desc: 'All open, filled and pending requisitions with time-open.', icon: <Briefcase className="text-amber-500" />, visible: !isPayrollOfficer },
    { type: 'leave', title: 'Leave Requests', desc: 'Full leave request history across the company.', icon: <CalendarDays className="text-emerald-500" />, visible: !isPayrollOfficer },
    { type: 'payroll', title: 'Payroll Run (Payslips)', desc: 'Payslip-level breakdown for a specific paid period.', icon: <Wallet className="text-rose-500" />, visible: true },
  ];

  const renderExports = () => (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exportCards.filter((c) => c.visible).map((c) => (
          <div key={c.type} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl">{c.icon}</div>
            </div>
            <h4 className="text-lg font-black text-slate-800 mb-2">{c.title}</h4>
            <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">{c.desc}</p>

            {c.type === 'payroll' && (
              <div className="flex gap-3 mb-6">
                <select
                  value={exportMonth}
                  onChange={(e) => setExportMonth(Number(e.target.value))}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('en-US', { month: 'long' })}</option>
                  ))}
                </select>
                <select
                  value={exportYear}
                  onChange={(e) => setExportYear(Number(e.target.value))}
                  className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                >
                  {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => runExport(c.type)}
              disabled={exportBusy === c.type}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Download size={14} /> {exportBusy === c.type ? 'Generating…' : 'Download CSV'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center">
        <div>
          <div className="flex items-center gap-4 mb-1">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Reports & Analytics</h1>
          </div>
          <p className="text-slate-500 font-medium">Live, data-driven insights across your organization.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-3 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
            disabled={isFetching}
            title="Refresh"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <div className="flex bg-white p-2 rounded-3xl border border-slate-200 shadow-sm w-full lg:w-auto overflow-x-auto scrollbar-hide">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                  }`}
              >
                {tab.icon} {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'workforce' && renderWorkforce()}
          {activeTab === 'recruitment' && renderRecruitment()}
          {activeTab === 'payroll' && renderPayroll()}
          {activeTab === 'exports' && renderExports()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Reports;
