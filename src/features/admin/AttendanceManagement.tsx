import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  useAdminAttendance,
  useAdminAttendanceSummary,
  useMyTeamAttendanceToday,
  useTeamPendingOvertime,
  useUpdateTeamOvertimeStatus,
  useAdminOvertimeRequests,
  useUpdateAdminOvertimeStatus,
  useCreateAttendanceRecord,
  useUpdateAttendanceRecord,
  useDeleteAttendanceRecord,
  useAttendancePolicy,
  useUpdateAttendancePolicy,
} from '../../api/client';
import {
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Search,
  Plus,
  Pencil,
  Trash2,
  Settings2,
  TrendingUp,
  MapPin,
  X,
  Umbrella,
  LogIn,
  LogOut,
  Timer,
  FileText,
} from 'lucide-react';

const todayStr = () => new Date().toISOString().split('T')[0];
const daysAgoStr = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};
const fmtTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

const STATUS_STYLES: Record<string, string> = {
  present: 'bg-emerald-50 text-emerald-600',
  late: 'bg-amber-50 text-amber-600',
  'clocked-out': 'bg-slate-100 text-slate-500',
  absent: 'bg-rose-50 text-rose-500',
};

const emptyRecordForm = { employeeId: '', date: todayStr(), clockIn: '', clockOut: '', status: 'present', notes: '' };

const AttendanceManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const [activeTab, setActiveTab] = useState<'today' | 'records' | 'overtime' | 'policy'>('today');

  // ---------------------------------------------------------------------
  // Today
  // ---------------------------------------------------------------------
  const { data: summary } = useAdminAttendanceSummary(todayStr());
  const { data: todayRecords = [], isLoading: loadingToday } = useAdminAttendance({ date: todayStr() });

  // Manager-only fallback list (covers direct reports who haven't clocked in
  // at all today, which the records feed above can't show since it has no row).
  const { data: teamToday } = useMyTeamAttendanceToday();
  const notClockedIn = useMemo(() => {
    if (isAdmin || !teamToday) return [];
    return teamToday.filter((t: any) => t.status === 'absent');
  }, [isAdmin, teamToday]);

  // ---------------------------------------------------------------------
  // Records
  // ---------------------------------------------------------------------
  const [fromDate, setFromDate] = useState(daysAgoStr(30));
  const [toDate, setToDate] = useState(todayStr());
  const [searchTerm, setSearchTerm] = useState('');
  const { data: records = [], isLoading: loadingRecords } = useAdminAttendance({ from: fromDate, to: toDate });

  const filteredRecords = records.filter((r: any) => {
    const term = searchTerm.toLowerCase();
    return !term || `${r.name} ${r.lastName} ${r.employeeId}`.toLowerCase().includes(term);
  });

  const createRecord = useCreateAttendanceRecord();
  const updateRecord = useUpdateAttendanceRecord();
  const deleteRecord = useDeleteAttendanceRecord();

  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recordForm, setRecordForm] = useState(emptyRecordForm);

  const openCreate = () => {
    setEditingId(null);
    setRecordForm(emptyRecordForm);
    setShowRecordModal(true);
  };
  const openEdit = (r: any) => {
    setEditingId(r.id);
    setRecordForm({
      employeeId: r.employeeId,
      date: r.date,
      clockIn: r.clockIn ? r.clockIn.slice(0, 16) : '',
      clockOut: r.clockOut ? r.clockOut.slice(0, 16) : '',
      status: r.status,
      notes: r.notes || '',
    });
    setShowRecordModal(true);
  };

  const saveRecord = () => {
    const payload: any = {
      date: recordForm.date,
      status: recordForm.status,
      notes: recordForm.notes,
      clockIn: recordForm.clockIn ? new Date(recordForm.clockIn).toISOString() : undefined,
      clockOut: recordForm.clockOut ? new Date(recordForm.clockOut).toISOString() : null,
    };
    if (editingId) {
      updateRecord.mutate({ id: editingId, ...payload }, { onSuccess: () => setShowRecordModal(false) });
    } else {
      createRecord.mutate({ ...payload, employeeId: recordForm.employeeId }, { onSuccess: () => setShowRecordModal(false) });
    }
  };

  // ---------------------------------------------------------------------
  // Overtime
  // ---------------------------------------------------------------------
  const [otStatusFilter, setOtStatusFilter] = useState<string>('pending');
  const { data: adminOvertime = [] } = useAdminOvertimeRequests(isAdmin ? otStatusFilter : undefined);
  const { data: teamOvertime = [] } = useTeamPendingOvertime();
  const overtimeList = isAdmin ? adminOvertime : teamOvertime;

  const updateAdminOt = useUpdateAdminOvertimeStatus();
  const updateTeamOt = useUpdateTeamOvertimeStatus();

  const [reviewingOt, setReviewingOt] = useState<any>(null);
  const [otComment, setOtComment] = useState('');
  const [otHours, setOtHours] = useState<number>(0);

  const openReview = (req: any) => {
    setReviewingOt(req);
    setOtComment(req.managerComment || '');
    setOtHours(req.hours);
  };

  const decideOvertime = (status: 'approved' | 'rejected') => {
    if (!reviewingOt) return;
    const payload = { id: reviewingOt.id, status, managerComment: otComment, hours: otHours };
    const mutation = isAdmin ? updateAdminOt : updateTeamOt;
    mutation.mutate(payload, { onSuccess: () => setReviewingOt(null) });
  };

  // ---------------------------------------------------------------------
  // Policy (admin only)
  // ---------------------------------------------------------------------
  const { data: policy } = useAttendancePolicy();
  const updatePolicy = useUpdateAttendancePolicy();
  const [policyForm, setPolicyForm] = useState({ attendanceStartTime: '09:00', attendanceEndTime: '17:00', attendanceGraceMinutes: 15 });
  const [policyHydrated, setPolicyHydrated] = useState(false);
  if (policy && !policyHydrated) {
    setPolicyForm({
      attendanceStartTime: policy.attendanceStartTime,
      attendanceEndTime: policy.attendanceEndTime,
      attendanceGraceMinutes: policy.attendanceGraceMinutes,
    });
    setPolicyHydrated(true);
  }

  const tabs = [
    { id: 'today', label: 'Today', icon: <Clock size={16} /> },
    { id: 'records', label: 'Records', icon: <Calendar size={16} /> },
    { id: 'overtime', label: 'Overtime', icon: <Timer size={16} /> },
    ...(isAdmin ? [{ id: 'policy', label: 'Policy', icon: <Settings2 size={16} /> }] : []),
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-800">Time & Attendance</h1>
          <p className="text-slate-500 mt-1">
            {isAdmin ? 'Company-wide attendance oversight, corrections & overtime approvals.' : "Your team's presence and overtime approvals."}
          </p>
        </div>
      </div>

      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit overflow-x-auto scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === t.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'today' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Team', val: summary?.totalEmployees ?? '—', icon: <Users size={18} />, bg: 'bg-slate-100', fg: 'text-slate-600' },
              { label: 'Present', val: summary?.present ?? '—', icon: <CheckCircle2 size={18} />, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
              { label: 'Late', val: summary?.late ?? '—', icon: <AlertCircle size={18} />, bg: 'bg-amber-50', fg: 'text-amber-600' },
              { label: 'Absent', val: summary?.absent ?? '—', icon: <XCircle size={18} />, bg: 'bg-rose-50', fg: 'text-rose-500' },
              { label: 'On Leave', val: summary?.onLeave ?? '—', icon: <Umbrella size={18} />, bg: 'bg-indigo-50', fg: 'text-indigo-600' },
              { label: 'Avg Hours', val: summary ? `${summary.avgWorkHours}h` : '—', icon: <TrendingUp size={18} />, bg: 'bg-violet-50', fg: 'text-violet-600' },
            ].map((s) => (
              <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className={`w-9 h-9 ${s.bg} ${s.fg} rounded-lg flex items-center justify-center mb-3`}>{s.icon}</div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                <h4 className="text-xl font-black text-slate-800">{s.val}</h4>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-800">Today's Activity</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold border-b border-slate-200">Employee</th>
                    <th className="p-4 font-bold border-b border-slate-200">Clock In</th>
                    <th className="p-4 font-bold border-b border-slate-200">Clock Out</th>
                    <th className="p-4 font-bold border-b border-slate-200">Status</th>
                    <th className="p-4 font-bold border-b border-slate-200">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {todayRecords.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={r.avatar || `https://i.pravatar.cc/150?u=${r.employeeId}`} className="w-8 h-8 rounded-lg object-cover" />
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{r.name} {r.lastName}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">{r.department || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-700 text-sm font-medium"><LogIn size={12} className="inline mr-1.5 text-emerald-500" />{fmtTime(r.clockIn)}</td>
                      <td className="p-4 text-slate-700 text-sm font-medium"><LogOut size={12} className="inline mr-1.5 text-rose-400" />{fmtTime(r.clockOut)}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_STYLES[r.status] || 'bg-slate-100 text-slate-500'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-500 font-medium">
                        <MapPin size={12} className="inline mr-1 text-slate-300" />{r.locationIn || '—'}
                      </td>
                    </tr>
                  ))}
                  {!isAdmin && notClockedIn.map((t: any) => (
                    <tr key={t.employeeId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={t.avatar || `https://i.pravatar.cc/150?u=${t.employeeId}`} className="w-8 h-8 rounded-lg object-cover opacity-60" />
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{t.name} {t.lastName}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">{t.department || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400 text-sm">--:--</td>
                      <td className="p-4 text-slate-400 text-sm">--:--</td>
                      <td className="p-4"><span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-500">Absent</span></td>
                      <td className="p-4 text-xs text-slate-300">—</td>
                    </tr>
                  ))}
                  {!loadingToday && todayRecords.length === 0 && notClockedIn.length === 0 && (
                    <tr><td colSpan={5} className="p-10 text-center text-slate-400"><Clock size={28} className="mx-auto mb-2 text-slate-300" />No activity logged yet today.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-56">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employee..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
              <span className="text-slate-400 text-xs font-bold">to</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
            </div>
            {isAdmin && (
              <button onClick={openCreate} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-100">
                <Plus size={16} /> Manual Entry
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold border-b border-slate-200">Employee</th>
                  <th className="p-4 font-bold border-b border-slate-200">Date</th>
                  <th className="p-4 font-bold border-b border-slate-200">Clock In</th>
                  <th className="p-4 font-bold border-b border-slate-200">Clock Out</th>
                  <th className="p-4 font-bold border-b border-slate-200">Hours</th>
                  <th className="p-4 font-bold border-b border-slate-200">Overtime</th>
                  <th className="p-4 font-bold border-b border-slate-200">Status</th>
                  {isAdmin && <th className="p-4 font-bold border-b border-slate-200 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800 text-sm">{r.name} {r.lastName}</td>
                    <td className="p-4 text-slate-600 text-sm">{r.date}</td>
                    <td className="p-4 text-slate-600 text-sm">{fmtTime(r.clockIn)}</td>
                    <td className="p-4 text-slate-600 text-sm">{fmtTime(r.clockOut)}</td>
                    <td className="p-4 text-slate-800 text-sm font-bold">{r.workHours}h</td>
                    <td className="p-4 text-sm font-bold">{r.overtime > 0 ? <span className="text-indigo-600">{r.overtime}h</span> : <span className="text-slate-300">—</span>}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_STYLES[r.status] || 'bg-slate-100 text-slate-500'}`}>
                        {r.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(r)} className="p-2 bg-slate-50 text-slate-500 hover:text-indigo-600 rounded-lg"><Pencil size={14} /></button>
                          <button onClick={() => { if (confirm('Delete this attendance record?')) deleteRecord.mutate(r.id); }} className="p-2 bg-slate-50 text-slate-500 hover:text-rose-600 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {!loadingRecords && filteredRecords.length === 0 && (
                  <tr><td colSpan={isAdmin ? 8 : 7} className="p-10 text-center text-slate-400"><FileText size={28} className="mx-auto mb-2 text-slate-300" />No attendance records in this range.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'overtime' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-black text-slate-800">{isAdmin ? 'Overtime Requests' : "Your Team's Pending Overtime"}</h3>
            {isAdmin && (
              <div className="flex gap-1">
                {['pending', 'approved', 'rejected'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setOtStatusFilter(s)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${otStatusFilter === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold border-b border-slate-200">Employee</th>
                  <th className="p-4 font-bold border-b border-slate-200">Date & Time</th>
                  <th className="p-4 font-bold border-b border-slate-200">Hours</th>
                  <th className="p-4 font-bold border-b border-slate-200">Reason</th>
                  <th className="p-4 font-bold border-b border-slate-200">Status</th>
                  <th className="p-4 font-bold border-b border-slate-200 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overtimeList.map((req: any) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800 text-sm">{req.name} {req.lastName}</td>
                    <td className="p-4 text-xs text-slate-500">{req.date} • {req.startTime}–{req.endTime}</td>
                    <td className="p-4 font-bold text-slate-800 text-sm">{req.hours}h</td>
                    <td className="p-4 text-xs text-slate-500 max-w-xs truncate">{req.reason}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : req.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => openReview(req)} className="px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-bold rounded-xl hover:bg-indigo-100 transition-colors">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
                {overtimeList.length === 0 && (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-400"><Timer size={28} className="mx-auto mb-2 text-slate-300" />No overtime requests here.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'policy' && isAdmin && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-xl space-y-6">
          <div>
            <h3 className="font-black text-slate-800">Attendance Policy</h3>
            <p className="text-sm text-slate-500 mt-1">Drives the on-time/late tag at clock-in and the overtime calculated at clock-out.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Shift Start</label>
              <input
                type="time"
                value={policyForm.attendanceStartTime}
                onChange={(e) => setPolicyForm({ ...policyForm, attendanceStartTime: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Shift End</label>
              <input
                type="time"
                value={policyForm.attendanceEndTime}
                onChange={(e) => setPolicyForm({ ...policyForm, attendanceEndTime: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Grace Period (minutes)</label>
            <input
              type="number"
              min={0}
              value={policyForm.attendanceGraceMinutes}
              onChange={(e) => setPolicyForm({ ...policyForm, attendanceGraceMinutes: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
            />
            <p className="text-xs text-slate-400 mt-2">Clock-ins after start time + grace period are tagged "late". Hours worked beyond the shift length are logged as overtime.</p>
          </div>
          <button
            onClick={() => updatePolicy.mutate(policyForm)}
            disabled={updatePolicy.isPending}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            {updatePolicy.isPending ? 'Saving...' : 'Save Policy'}
          </button>
        </div>
      )}

      {/* Manual Record Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800">{editingId ? 'Edit Attendance Record' : 'New Manual Entry'}</h2>
              <button onClick={() => setShowRecordModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              {!editingId && (
                <div>
                  <label className="text-xs text-slate-500 font-bold mb-2 block">EMPLOYEE ID</label>
                  <input
                    type="text"
                    value={recordForm.employeeId}
                    onChange={(e) => setRecordForm({ ...recordForm, employeeId: e.target.value })}
                    placeholder="e.g. EMP-1234"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-slate-500 font-bold mb-2 block">DATE</label>
                <input
                  type="date"
                  value={recordForm.date}
                  onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 font-bold mb-2 block">CLOCK IN</label>
                  <input
                    type="datetime-local"
                    value={recordForm.clockIn}
                    onChange={(e) => setRecordForm({ ...recordForm, clockIn: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold mb-2 block">CLOCK OUT</label>
                  <input
                    type="datetime-local"
                    value={recordForm.clockOut}
                    onChange={(e) => setRecordForm({ ...recordForm, clockOut: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-bold mb-2 block">STATUS</label>
                <select
                  value={recordForm.status}
                  onChange={(e) => setRecordForm({ ...recordForm, status: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Leave</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-bold mb-2 block">NOTES</label>
                <textarea
                  rows={3}
                  value={recordForm.notes}
                  onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                  placeholder="Reason for the manual correction..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button onClick={() => setShowRecordModal(false)} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button
                onClick={saveRecord}
                disabled={createRecord.isPending || updateRecord.isPending || (!editingId && !recordForm.employeeId)}
                className="px-6 py-2.5 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overtime Review Modal */}
      {reviewingOt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-black text-slate-800">Review Overtime Request</h2>
              <p className="text-sm text-slate-500 mt-1">{reviewingOt.name} {reviewingOt.lastName} • {reviewingOt.date}</p>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <div className="text-xs text-slate-500 font-bold mb-1">WINDOW</div>
                  <div className="font-medium text-slate-800 text-sm">{reviewingOt.startTime} – {reviewingOt.endTime}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <div className="text-xs text-slate-500 font-bold mb-1">DELIVERABLE</div>
                  <div className="font-medium text-slate-800 text-sm">{reviewingOt.deliverable || '—'}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-bold mb-2">REASON PROVIDED</div>
                <div className="p-4 bg-slate-50 rounded-2xl text-slate-700 text-sm leading-relaxed">{reviewingOt.reason || 'No reason provided.'}</div>
              </div>
              <hr className="border-slate-100" />
              <div>
                <label className="text-xs text-slate-500 font-bold mb-2 block">APPROVED HOURS</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={otHours}
                  onChange={(e) => setOtHours(Number(e.target.value))}
                  className="w-32 px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-bold mb-2 block">COMMENT (OPTIONAL)</label>
                <textarea
                  rows={3}
                  value={otComment}
                  onChange={(e) => setOtComment(e.target.value)}
                  placeholder="Add a note about this decision..."
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button onClick={() => setReviewingOt(null)} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={() => decideOvertime('rejected')} className="px-6 py-2.5 bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-2">
                <XCircle size={18} /> Decline
              </button>
              <button onClick={() => decideOvertime('approved')} className="px-6 py-2.5 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2">
                <CheckCircle2 size={18} /> Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;
