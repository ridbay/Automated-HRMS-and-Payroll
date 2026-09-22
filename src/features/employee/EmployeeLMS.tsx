import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  PlayCircle,
  CheckCircle2,
  BookOpen,
  Loader2,
  Clock,
  BarChart2,
} from 'lucide-react';
import { useMyCourses } from '../../api/learning.client';
import { TakeCourseModal } from './TakeCourseModal';

const progressColor = (pct: number) => {
  if (pct >= 100) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-indigo-500';
  return 'bg-amber-400';
};

const EmployeeLMS: React.FC = () => {
  const { data: enrollments = [], isLoading } = useMyCourses();
  const [activeEnrollment, setActiveEnrollment] = useState<any | null>(null);

  const completed = enrollments.filter((e: any) => (e.enrollment?.progress ?? e.progress ?? 0) >= 100);
  const inProgress = enrollments.filter((e: any) => {
    const p = e.enrollment?.progress ?? e.progress ?? 0;
    return p > 0 && p < 100;
  });
  const notStarted = enrollments.filter((e: any) => (e.enrollment?.progress ?? e.progress ?? 0) === 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-indigo-500" size={36} />
      </div>
    );
  }

  const CourseCard = ({ enrollment, i }: { enrollment: any; i: number }) => {
    const course = enrollment.course ?? enrollment;
    const progress = enrollment.enrollment?.progress ?? enrollment.progress ?? 0;
    const isDone = progress >= 100;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        className={`bg-white rounded-[2rem] border shadow-sm hover:shadow-lg transition-all overflow-hidden group ${
          isDone ? 'border-slate-100 opacity-80' : 'border-slate-200 hover:border-indigo-200'
        }`}
      >
        <div className="p-8 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${
              isDone ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-600'
            }`}>
              {isDone ? <CheckCircle2 size={22} /> : <BookOpen size={22} />}
            </div>
            <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg shrink-0 ${
              isDone
                ? 'bg-emerald-50 text-emerald-600'
                : progress > 0
                ? 'bg-indigo-50 text-indigo-600'
                : 'bg-slate-50 text-slate-500'
            }`}>
              {isDone ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'}
            </span>
          </div>

          <div>
            <h3 className="font-black text-slate-800 text-lg leading-snug">
              {course.title ?? course.name}
            </h3>
            {course.description && (
              <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed line-clamp-2">
                {course.description}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <BarChart2 size={11} /> Progress
              </span>
              <span className="text-[10px] font-black text-slate-600">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${progressColor(progress)}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
            {course.duration ? (
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Clock size={11} /> {course.duration}
              </span>
            ) : (
              <span />
            )}
            {!isDone && (
              <button
                onClick={() => setActiveEnrollment(enrollment)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
              >
                <PlayCircle size={13} />
                {progress > 0 ? 'Continue' : 'Start'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Learning</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Courses assigned to you by your HR team.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold">
            <PlayCircle size={15} />
            <span>{inProgress.length} in progress</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold">
            <CheckCircle2 size={15} />
            <span>{completed.length} completed</span>
          </div>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
            <GraduationCap size={40} className="text-indigo-300" />
          </div>
          <h2 className="text-xl font-black text-slate-700 mb-2">No courses assigned</h2>
          <p className="text-sm text-slate-400 font-medium max-w-xs">
            Your HR team hasn't enrolled you in any courses yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {inProgress.length > 0 && (
            <div>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">In Progress</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {inProgress.map((e: any, i: number) => <React.Fragment key={e.id}><CourseCard enrollment={e} i={i} /></React.Fragment>)}
              </div>
            </div>
          )}
          {notStarted.length > 0 && (
            <div>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">Not Started</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {notStarted.map((e: any, i: number) => <React.Fragment key={e.id}><CourseCard enrollment={e} i={i} /></React.Fragment>)}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">Completed</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {completed.map((e: any, i: number) => <React.Fragment key={e.id}><CourseCard enrollment={e} i={i} /></React.Fragment>)}
              </div>
            </div>
          )}
        </div>
      )}

      <TakeCourseModal
        isOpen={!!activeEnrollment}
        onClose={() => setActiveEnrollment(null)}
        enrollment={activeEnrollment}
      />
    </div>
  );
};

export default EmployeeLMS;
