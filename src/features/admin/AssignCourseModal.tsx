import React, { useMemo, useState } from 'react';
import { X, Search, CheckCircle2 } from 'lucide-react';
import { useAssignCourse, useCourseEnrollments } from '../../api/learning.client';
import { useDirectory } from '../../api/client';
import { usePopup } from '../../components/PopupProvider';

interface AssignCourseModalProps {
  course: { id: string; title: string } | null;
  onClose: () => void;
}

export const AssignCourseModal: React.FC<AssignCourseModalProps> = ({ course, onClose }) => {
  const { alert: popupAlert } = usePopup();
  const { data: employees = [], isLoading: isDirectoryLoading } = useDirectory();
  const { data: enrollments = [], isLoading: isEnrollmentsLoading } = useCourseEnrollments(course?.id ?? null);
  const assignCourse = useAssignCourse();

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
      return `${emp.name} ${emp.lastName}`.toLowerCase().includes(q) || emp.email?.toLowerCase().includes(q);
    });
  }, [employees, enrolledIds, search]);

  if (!course) return null;

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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
            <div className="flex flex-wrap gap-2">
              {enrollments.map((e: any) => (
                <span key={e.enrollment.id} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} /> {e.employee?.name} {e.employee?.lastName}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="relative mb-3">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500"
            placeholder="Search employees to assign..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 border border-slate-100 rounded-2xl p-2">
          {isDirectoryLoading || isEnrollmentsLoading ? (
            <p className="text-center text-slate-400 text-sm py-8">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">No employees to assign.</p>
          ) : (
            filtered.map((emp: any) => (
              <label
                key={emp.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(emp.id)}
                  onChange={() => toggle(emp.id)}
                  className="w-4 h-4 accent-indigo-600"
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
          className="w-full bg-indigo-600 text-white rounded-xl py-4 font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-4"
        >
          {assignCourse.isPending ? 'Assigning...' : `Assign to ${selected.length || ''} Employee${selected.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  );
};
