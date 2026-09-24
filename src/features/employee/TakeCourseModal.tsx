import React, { useState } from 'react';
import { useUpdateCourseProgress } from '../../api/learning.client';
import {
  X,
  PlayCircle,
  CheckCircle2,
  BookOpen,
  Award,
  HelpCircle,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import Celebration from '../../components/Celebration';
import { CertificateModal } from '../lms/CertificateModal';

interface TakeCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrollment: any; // Contains { enrollment: {...}, course: {...} }
}

export const TakeCourseModal: React.FC<TakeCourseModalProps> = ({ isOpen, onClose, enrollment }) => {
  const user = typeof window !== 'undefined' && localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  const [showCelebration, setShowCelebration] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'modules' | 'quiz'>('content');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const updateProgress = useUpdateCourseProgress();

  if (!isOpen || !enrollment) return null;

  const course = enrollment.course;
  const currentProgress = enrollment.enrollment.progress;
  const isCompleted = currentProgress >= 100 || enrollment.enrollment.status === 'completed';

  const defaultModules = [
    { id: 1, title: 'Module 1: Executive Overview & Objectives', duration: '10 mins', threshold: 25 },
    { id: 2, title: 'Module 2: Core Protocols, Standards & Compliance', duration: '15 mins', threshold: 50 },
    { id: 3, title: 'Module 3: Practical Scenarios & Incident Playbooks', duration: '15 mins', threshold: 75 },
    { id: 4, title: 'Module 4: Evaluation, Sign-Off & Verification', duration: '5 mins', threshold: 100 },
  ];

  const quizQuestions = [
    {
      question: 'What is the primary objective of this corporate training standard?',
      options: [
        'To ensure full organizational compliance and operational excellence',
        'To fulfill an optional suggestion',
        'To complete arbitrary administrative tasks',
      ],
      correct: 0,
    },
    {
      question: 'How frequently should team members review and refresh these guidelines?',
      options: [
        'Once every decade',
        'Annually and whenever critical updates are published',
        'Never after initial onboarding',
      ],
      correct: 1,
    },
  ];

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

  const handleModuleClick = (threshold: number) => {
    if (threshold > currentProgress) {
      updateProgress.mutate({
        enrollmentId: enrollment.enrollment.id,
        progress: threshold,
      });
      if (threshold === 100) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2500);
      }
    }
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    const score = quizQuestions.reduce((acc, q, idx) => (quizAnswers[idx] === q.correct ? acc + 1 : acc), 0);
    if (score === quizQuestions.length) {
      handleComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      {showCelebration && <Celebration active={true} />}
      
      <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
        
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 z-10 p-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
              <PlayCircle size={30} />
            </div>
            <div className="flex-1 min-w-0 pr-10">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight truncate">{course.title}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs font-bold text-slate-400 uppercase">{course.duration} minutes</p>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-bold text-indigo-600 uppercase">Accredited Module</span>
              </div>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-100 mb-4 pb-2">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === 'content'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <BookOpen size={13} /> Overview
            </button>
            <button
              onClick={() => setActiveTab('modules')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === 'modules'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <FileText size={13} /> Lessons ({defaultModules.length})
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === 'quiz'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <HelpCircle size={13} /> Knowledge Check
            </button>
            {isCompleted && (
              <button
                onClick={() => setShowCertificate(true)}
                className="ml-auto px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                <Award size={14} className="text-amber-600" /> View Certificate
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {activeTab === 'content' && (
              <>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-2">Course Description</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {course.description || "No description provided."}
                  </p>
                </div>

                {course.url && (
                  <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-600 text-white rounded-xl">
                        <ExternalLink size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-indigo-950">External Interactive Content</h4>
                        <p className="text-xs text-indigo-700 font-medium">Launch accredited video or SCORM course player in browser</p>
                      </div>
                    </div>
                    <button
                      onClick={handleStart}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 transition-colors"
                    >
                      Open Link
                    </button>
                  </div>
                )}
              </>
            )}

            {activeTab === 'modules' && (
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Curriculum Modules — Click to advance progress
                </p>
                {defaultModules.map((m) => {
                  const done = currentProgress >= m.threshold;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleModuleClick(m.threshold)}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        done
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                          : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {done ? <CheckCircle2 size={16} /> : <PlayCircle size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{m.title}</p>
                          <span className="text-xs text-slate-400 font-medium">{m.duration}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                        done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {done ? 'Completed' : `${m.threshold}% Milestone`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'quiz' && (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs text-indigo-900 font-medium leading-relaxed">
                  Answer the verification questions below to demonstrate comprehension and earn your official completion badge.
                </div>

                {quizQuestions.map((q, idx) => (
                  <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                    <p className="text-sm font-bold text-slate-800">
                      {idx + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => (
                        <label
                          key={optIdx}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                            quizAnswers[idx] === optIdx
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
                              : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`quiz-${idx}`}
                            checked={quizAnswers[idx] === optIdx}
                            onChange={() => setQuizAnswers({ ...quizAnswers, [idx]: optIdx })}
                            className="accent-indigo-600"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleQuizSubmit}
                  disabled={Object.keys(quizAnswers).length < quizQuestions.length || isCompleted}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isCompleted ? 'Quiz Completed & Verified' : 'Submit Answers & Verify Course'}
                </button>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-6 mb-4 pt-4 border-t border-slate-100">
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

          {/* Bottom Actions */}
          <div className="flex gap-4 justify-end pt-2">
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

      <CertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        certificate={{
          recipientName: `${user?.name || 'Employee'}`,
          courseTitle: course.title,
          completedAt: enrollment.enrollment?.completedAt || new Date().toISOString(),
          duration: course.duration,
        }}
      />
    </div>
  );
};
