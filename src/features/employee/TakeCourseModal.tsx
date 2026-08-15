import React, { useState } from 'react';
import { useUpdateCourseProgress } from '../../api/learning.client';
import { X, PlayCircle, CheckCircle2 } from 'lucide-react';
import Celebration from '../../components/Celebration';

interface TakeCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrollment: any; // Contains { enrollment: {...}, course: {...} }
}

export const TakeCourseModal: React.FC<TakeCourseModalProps> = ({ isOpen, onClose, enrollment }) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const updateProgress = useUpdateCourseProgress();

  if (!isOpen || !enrollment) return null;

  const course = enrollment.course;
  const currentProgress = enrollment.enrollment.progress;

  const handleComplete = () => {
    updateProgress.mutate(
      { enrollmentId: enrollment.enrollment.id, progress: 100 },
      {
        onSuccess: () => {
          setShowCelebration(true);
          setTimeout(() => {
            onClose();
            setShowCelebration(false);
          }, 2500);
        }
      }
    );
  };

  const handleStart = () => {
    if (currentProgress === 0) {
      updateProgress.mutate({ enrollmentId: enrollment.enrollment.id, progress: 10 });
    }
    if (course.url) {
      window.open(course.url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {showCelebration && <Celebration active={true} />}
      
      <div className="bg-white rounded-3xl p-8 w-full max-w-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-2xl" />
        
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 z-10"
        >
          <X size={24} />
        </button>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
              <PlayCircle size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{course.title}</h2>
              <p className="text-sm font-bold text-slate-400 uppercase">{course.duration} minutes</p>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
            <h3 className="text-sm font-bold text-slate-800 mb-2">Course Description</h3>
            <p className="text-slate-600 leading-relaxed">
              {course.description || "No description provided."}
            </p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between text-xs font-bold uppercase text-slate-400 mb-2">
              <span>Progress</span>
              <span>{currentProgress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${currentProgress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'} transition-all duration-500`} 
                style={{ width: `${currentProgress}%` }}
              />
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            {currentProgress < 100 ? (
              <>
                <button
                  onClick={handleStart}
                  className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-100 transition-colors"
                >
                  {course.url ? 'Open Course Link' : 'Start Module'}
                </button>
                <button
                  onClick={handleComplete}
                  disabled={updateProgress.isPending}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> Mark as Completed
                </button>
              </>
            ) : (
              <button
                disabled
                className="px-6 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2"
              >
                <CheckCircle2 size={16} /> Completed
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
