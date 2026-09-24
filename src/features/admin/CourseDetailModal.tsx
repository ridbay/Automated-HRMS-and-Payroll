import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Clock,
  CheckCircle2,
  Users,
  PlayCircle,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Search,
  UserCheck,
  Award,
} from 'lucide-react';
import * as learningClient from '../../api/learning.client';

interface CourseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: any;
  onOpenAssign: (course: { id: string; title: string }) => void;
  onViewCertificate?: (cert: any) => void;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({
  isOpen,
  onClose,
  course,
  onOpenAssign,
  onViewCertificate,
}) => {
  const popupAlert = (msg: string) => window.alert(msg);
  const popupConfirm = (msg: string) => Promise.resolve(window.confirm(msg));
  const { data: enrollments = [], isLoading } = learningClient.useCourseEnrollments(course?.id ?? null);
  const unassign = learningClient.useUnassignCourse
    ? learningClient.useUnassignCourse()
    : { mutate: (_p: any, c?: any) => c?.onSuccess?.() };
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  if (!isOpen || !course) return null;

  const total = enrollments.length;
  const completed = enrollments.filter(
    (e: any) => (e.enrollment?.progress ?? 0) >= 100 || e.enrollment?.status === 'completed'
  );
  const inProgress = enrollments.filter((e: any) => {
    const p = e.enrollment?.progress ?? 0;
    return p > 0 && p < 100;
  });
  const notStarted = enrollments.filter((e: any) => (e.enrollment?.progress ?? 0) === 0);
  const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

  const filteredEnrollments = enrollments.filter((e: any) => {
    const name = `${e.employee?.name || ''} ${e.employee?.lastName || ''}`.toLowerCase();
    const email = (e.employee?.email || '').toLowerCase();
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || name.includes(q) || email.includes(q);

    const progress = e.enrollment?.progress ?? 0;
    const isDone = progress >= 100 || e.enrollment?.status === 'completed';
    const isOngoing = progress > 0 && progress < 100;

    if (statusFilter === 'completed') return matchesSearch && isDone;
    if (statusFilter === 'in_progress') return matchesSearch && isOngoing;
    if (statusFilter === 'not_started') return matchesSearch && progress === 0;
    return matchesSearch;
  });

  const handleUnassign = async (enrollmentId: string, employeeName: string) => {
    if (popupConfirm) {
      const ok = await popupConfirm(
        `Remove ${employeeName} from "${course.title}"? Their progress will be deleted.`,
        'Confirm Unassign'
      );
      if (!ok) return;
    }
    unassign.mutate(
      { courseId: course.id, enrollmentId },
      {
        onSuccess: () => popupAlert(`Removed ${employeeName} from the course roster.`, 'Unassigned'),
        onError: (err: any) => popupAlert(err.message || 'Failed to unassign.', 'Error'),
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute right-6 top-6 text-white/60 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={22} />
          </button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-200">
                  {course.status}
                </span>
                <span className="flex items-center gap-1 text-indigo-200 text-xs font-bold">
                  <Clock size={13} /> {course.duration} minutes
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">{course.title}</h2>
              {course.description && (
                <p className="text-sm text-indigo-100/80 max-w-2xl font-medium leading-relaxed">
                  {course.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {course.url && (
                <a
                  href={course.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <ExternalLink size={14} /> Open Material
                </a>
              )}
              <button
                onClick={() => {
                  onClose();
                  onOpenAssign({ id: course.id, title: course.title });
                }}
                className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-950/30 flex items-center gap-2"
              >
                <Users size={14} /> Assign Learners
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10 text-white">
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200">Total Enrolled</span>
              <p className="text-2xl font-black mt-0.5">{total}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Completed</span>
              <p className="text-2xl font-black mt-0.5">{completed.length}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">In Progress</span>
              <p className="text-2xl font-black mt-0.5">{inProgress.length}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200">Completion Rate</span>
              <p className="text-2xl font-black mt-0.5">{completionRate}%</p>
            </div>
          </div>
        </div>

        {/* Content Body / Roster */}
        <div className="p-6 md:p-8 flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h3 className="text-lg font-black text-slate-800">Learner Roster</h3>
              <p className="text-xs text-slate-400 font-medium">
                Track individual employee progress and completion status.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter roster..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="not_started">Not Started</option>
              </select>
            </div>
          </div>

          {/* Roster Table */}
          <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 text-sm font-medium">
                Loading roster...
              </div>
            ) : filteredEnrollments.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Users size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-bold">No learners found matching criteria.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] sticky top-0 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Learner</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Progress</th>
                    <th className="py-3 px-4">Enrolled On</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEnrollments.map((item: any) => {
                    const emp = item.employee;
                    const enr = item.enrollment;
                    const progress = enr?.progress ?? 0;
                    const isDone = progress >= 100 || enr?.status === 'completed';

                    return (
                      <tr key={enr.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">
                            {emp?.name} {emp?.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400">{emp?.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                              isDone
                                ? 'bg-emerald-50 text-emerald-600'
                                : progress > 0
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isDone ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="w-32">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                              <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isDone ? 'bg-emerald-500' : progress > 0 ? 'bg-indigo-500' : 'bg-slate-300'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isDone && onViewCertificate && (
                              <button
                                onClick={() =>
                                  onViewCertificate({
                                    recipientName: `${emp?.name} ${emp?.lastName}`,
                                    courseTitle: course.title,
                                    completedAt: enr.completedAt || enr.enrolledAt,
                                    duration: course.duration,
                                  })
                                }
                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                              >
                                <Award size={12} /> Certificate
                              </button>
                            )}
                            <button
                              onClick={() => handleUnassign(enr.id, `${emp?.name} ${emp?.lastName}`)}
                              className="px-2.5 py-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-[10px] font-bold"
                            >
                              Unassign
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
