import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, Clock, Target, CalendarDays, RefreshCw, AlertCircle, UserX,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { useTeamReport } from '../../api/client';

const tooltipStyle = { borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 700 };
const axisTick = { fontSize: 10, fontWeight: 800, fill: '#94a3b8' };

const Kpi: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <motion.div whileHover={{ y: -4 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
    <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{value}</h3>
  </motion.div>
);

const Card: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
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

const DistributionBar: React.FC<{ data: { name: string; value: number; fill?: string }[]; height?: number }> = ({ data, height = 240 }) => {
  if (!data || data.length === 0) return <Empty />;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={16}>
            {data.map((d, i) => <Cell key={i} fill={d.fill || '#6366f1'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const DistributionPie: React.FC<{ data: { name: string; value: number; fill?: string }[]; height?: number }> = ({ data, height = 240 }) => {
  if (!data || data.length === 0) return <Empty />;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} innerRadius={55} outerRadius={85} paddingAngle={6} dataKey="value">
            {data.map((d, i) => <Cell key={i} fill={d.fill || '#6366f1'} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const TeamReports: React.FC = () => {
  const { data, isLoading, isError, refetch, isFetching } = useTeamReport();

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
        <p className="text-slate-500 font-bold">Couldn't load your team's reports right now.</p>
        <button onClick={() => refetch()} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">Retry</button>
      </div>
    );
  }

  const { teamSize, team, workforce, leaveAttendance, performance } = data;

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        <div>
          <div className="flex items-center gap-4 mb-1">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Team Reports</h1>
          </div>
          <p className="text-slate-500 font-medium">Insights for your {teamSize} direct report{teamSize === 1 ? '' : 's'}.</p>
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

      {teamSize === 0 ? (
        <div className="bg-white p-16 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center text-center gap-4">
          <UserX className="text-slate-300" size={40} />
          <h3 className="text-xl font-black text-slate-800">No direct reports yet</h3>
          <p className="text-slate-400 font-medium max-w-sm">Once employees are assigned to you as their manager, their workforce, leave and performance insights will show up here.</p>
        </div>
      ) : (
        <div className="space-y-8 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kpi label="Team Size" value={teamSize} />
            <Kpi label="On Notice" value={workforce.summary.onNoticeCount} />
            <Kpi label="Avg. Tenure" value={`${workforce.summary.avgTenureYears}y`} />
            <Kpi label="Avg. Goal Progress" value={`${performance.avgGoalProgress}%`} />
          </div>

          <Card title="Team Roster" icon={<Users className="text-indigo-600" size={20} />}>
            <div className="flex flex-wrap gap-4">
              {team.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                  {m.avatar ? (
                    <img src={m.avatar} className="w-9 h-9 rounded-xl object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs">
                      {m.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-black text-slate-700">{m.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.department || m.role || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card title="Tenure" icon={<Clock className="text-indigo-600" size={20} />}>
              {workforce.tenureDistribution.every((d: any) => d.value === 0) ? <Empty /> : (
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workforce.tenureDistribution}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} />
                      <YAxis hide />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="value" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
            <Card title="Gender Mix" icon={<Users className="text-indigo-600" size={20} />}>
              <DistributionPie data={workforce.genderDistribution} />
            </Card>
            <Card title="Status" icon={<Users className="text-indigo-600" size={20} />}>
              <DistributionBar data={workforce.statusBreakdown} />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card title="Leave Utilization (YTD)" icon={<CalendarDays className="text-amber-500" size={20} />}>
              <DistributionBar data={leaveAttendance.leaveByType} />
            </Card>
            <Card title="Goals by Status" icon={<Target className="text-emerald-500" size={20} />}>
              {performance.totalGoals === 0 ? <Empty label="No goals logged yet" /> : <DistributionPie data={performance.goalsByStatus} />}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamReports;
