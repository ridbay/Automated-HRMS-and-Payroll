import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Briefcase, Layers, AlertCircle, RefreshCw, TrendingUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { useRecruitmentReport } from '../../api/client';

const tooltipStyle = { borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 700 };
const axisTick = { fontSize: 10, fontWeight: 800, fill: '#94a3b8' };

const Kpi: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <motion.div whileHover={{ y: -4 }} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
    <h3 className="text-2xl font-black text-indigo-600 tracking-tighter">{value}</h3>
  </motion.div>
);

const Card: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
    <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2">{icon}{title}</h3>
    {children}
  </section>
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

// Real, DB-backed recruitment analytics — every number comes from the
// job_requisitions table. There's no candidate/interview/offer tracking table
// yet, so metrics like cost-per-hire, offer acceptance or source
// effectiveness aren't shown here rather than being invented.
//
// `RecruitmentAnalyticsBody` renders just the KPIs/charts so it can be
// embedded inside Recruitment.tsx's own "Analytics" tab (which already has a
// page header); `RecruitmentAnalytics` wraps it with a header for the
// standalone sidebar route recruiters land on directly.
export const RecruitmentAnalyticsBody: React.FC = () => {
  const { data, isLoading, isError, refetch } = useRecruitmentReport();

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
        <p className="text-slate-500 font-bold">Couldn't load recruitment analytics right now.</p>
        <button onClick={() => refetch()} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Kpi label="Total Requisitions" value={data.summary.totalRequisitions} />
        <Kpi label="Open Positions" value={data.summary.openPositions} />
        <Kpi label="Filled This Month" value={data.summary.filledThisMonth} />
        <Kpi label="Avg. Days Open" value={data.summary.avgDaysOpen} />
        <Kpi label="Avg. Time to Fill" value={data.summary.avgTimeToFill !== null ? `${data.summary.avgTimeToFill}d` : '—'} />
      </div>

      <Card title="Requisitions Opened vs. Filled" icon={<TrendingUp size={24} className="text-indigo-600" />}>
        {data.monthlyTrend.every((m: any) => m.opened === 0 && m.filled === 0) ? <Empty /> : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyTrend}>
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
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card title="By Status" icon={<Briefcase size={22} className="text-indigo-600" />}>
          <DistributionBar data={data.statusBreakdown} height={220} />
        </Card>
        <Card title="By Department" icon={<Layers size={22} className="text-indigo-600" />}>
          <DistributionBar data={data.byDepartment} height={220} />
        </Card>
        <Card title="By Priority" icon={<AlertCircle size={22} className="text-amber-500" />}>
          <DistributionPie data={data.byPriority} height={220} />
        </Card>
      </div>
    </div>
  );
};

const RecruitmentAnalytics: React.FC = () => {
  const { isFetching, refetch } = useRecruitmentReport();

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        <div>
          <div className="flex items-center gap-4 mb-1">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Recruitment Analytics</h1>
          </div>
          <p className="text-slate-500 font-medium">Live hiring pipeline insights across every requisition.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-3 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
          disabled={isFetching}
          title="Refresh"
        >
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      <RecruitmentAnalyticsBody />
    </div>
  );
};

export default RecruitmentAnalytics;
