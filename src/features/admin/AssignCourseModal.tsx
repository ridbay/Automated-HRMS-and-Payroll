import React, { useMemo, useState } from 'react';
import { X, Search, CheckCircle2, UserCheck, Trash2 } from 'lucide-react';
import { useAssignCourse, useCourseEnrollments, useUnassignCourse } from '../../api/learning.client';
import { useDirectory } from '../../api/client';
import { usePopup } from '../../components/PopupProvider';

interface AssignCourseModalProps {
  course: { id: string; title: string } | null;
  onClose: () => void;
}

export const AssignCourseModal: React.FC<AssignCourseModalProps> = ({ course, onClose }) => {
  const { alert: popupAlert, confirm: popupConfirm } = usePopup();
  const { data: employees = [], isLoading: isDirectoryLoading } = useDirectory();
  const { data: enrollments = [], isLoading: isEnrollmentsLoading } = useCourseEnrollments(course?.id ?? null);
  const assignCourse = useAssignCourse();
  const unassign = useUnassignCourse();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const enrolledIds = useMemo(
    () => new Set((enrollments || []).map((e: any) => e.employee?.id).filter(Boolean)),
    [enrollments]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (employees || []).filter((emp: any) => {
      if (enrolledIds.has(emp.id)) return false; // already assigned
      if (!q) return true;
      return `${emp.name} ${emp.lastName}`.toLowerCase().includes(q) || emp.email?.toLowerCase().includes(q) || emp.department?.toLowerCase().includes(q);
    });
  }, [employees, enrolledIds, search]);

  if (!course) return null;

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selected.length === filtered.length && filtered.length > 0) {
      setSelected([]);
    } else {
      setSelected(filtered.map((e: any) => e.id));
    }
  };

  const handleUnassign = async (enrollmentId: string, employeeName: string) => {
    if (popupConfirm) {
      const ok = await popupConfirm(`Remove ${employeeName} from this course?`, 'Unassign Course');
      if (!ok) return;
    }
    unassign.mutate(
      { courseId: course.id, enrollmentId },
      {
        onSuccess: () => popupAlert(`Removed ${employeeName} from ${course.title}.`, 'Unassigned'),
        onError: (err: any) => popupAlert(err.message || 'Failed to unassign.', 'Error'),
      }
    );
  };

  const handleAssign = () => {
    if (selected.length === 0) return;
    assignCourse.mutate(
      { courseId: course.id, employeeIds: selected },
      {
        onSuccess: () => {
          setSelected([]);
          popupAlert(`Assigned "${course.title}" to ${selected.length} employee(s).`, 'Assigned');
        },
        onError: (err: any) => popupAlert(err.message || 'Failed to assign course.', 'Error'),
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative max-h-[85vh] flex flex-col">
        <button onClick={onClose} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">Manage Assignments</h2>
        <p className="text-sm text-slate-500 font-medium mb-6">{course.title}</p>

        {enrollments && enrollments.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Already assigned ({enrollments.length})
            </p>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
              {enrollments.map((e: any) => (
                <span
                  key={e.enrollment.id}
                  className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1.5 group"
                >
                  <CheckCircle2 size={12} /> {e.employee?.name} {e.employee?.lastName}
                  {e.enrollment?.id && (
                    <button
                      type="button"
                      onClick={() => handleUnassign(e.enrollment.id, `${e.employee?.name} ${e.employee?.lastName}`)}
                      className="text-emerald-500 hover:text-red-500 ml-1 transition-colors"
                      title="Unassign"
                    >
                      <X size={11} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500"
              placeholder="Search employees to assign..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {filtered.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
            >
              {selected.length === filtered.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 border border-slate-100 rounded-2xl p-2 min-h-[140px]">
          {isDirectoryLoading || isEnrollmentsLoading ? (
            <p className="text-center text-slate-400 text-sm py-8">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">No employees to assign.</p>
          ) : (
            filtered.map((emp: any) => (
              <label
                key={emp.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(emp.id)}
                  onChange={() => toggle(emp.id)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{emp.name} {emp.lastName}</p>
                  <p className="text-xs text-slate-400 truncate">{emp.department || emp.email}</p>
                </div>
              </label>
            ))
          )}
        </div>

        <button
          onClick={handleAssign}
          disabled={selected.length === 0 || assignCourse.isPending}
          className="w-full bg-indigo-600 text-white rounded-xl py-4 font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-4 shadow-lg shadow-indigo-100"
        >
          {assignCourse.isPending ? 'Assigning...' : selected.length === 0 ? 'Assign to Employees' : `Assign to ${selected.length} Employee${selected.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  );
};
