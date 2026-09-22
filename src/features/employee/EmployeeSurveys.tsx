import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  ChevronRight,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { useActiveSurveys } from '../../api/survey.client';
import { TakeSurveyModal } from './TakeSurveyModal';

const EmployeeSurveys: React.FC = () => {
  const { data: surveys = [], isLoading } = useActiveSurveys();
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null);

  const pending = surveys.filter((s: any) => !s.hasResponded);
  const completed = surveys.filter((s: any) => s.hasResponded);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-indigo-500" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Surveys</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Share your feedback and help improve the workplace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold">
            <Clock size={15} />
            <span>{pending.length} pending</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold">
            <CheckCircle2 size={15} />
            <span>{completed.length} completed</span>
          </div>
        </div>
      </div>

      {surveys.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
            <ClipboardList size={40} className="text-indigo-300" />
          </div>
          <h2 className="text-xl font-black text-slate-700 mb-2">No active surveys</h2>
          <p className="text-sm text-slate-400 font-medium max-w-xs">
            Your HR team hasn't published any surveys yet. Check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {pending.length > 0 && (
            <div>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">
                Awaiting Your Response
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {pending.map((survey: any, i: number) => (
                  <motion.div
                    key={survey.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all overflow-hidden group"
                  >
                    <div className="p-8 space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <MessageSquare size={22} />
                        </div>
                        <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-lg shrink-0">
                          Pending
                        </span>
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 text-lg leading-snug">{survey.title}</h3>
                        {survey.description && (
                          <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed line-clamp-2">
                            {survey.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {survey.questionCount ?? survey.questions?.length ?? '—'} questions
                        </span>
                        <button
                          onClick={() => setActiveSurveyId(survey.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                        >
                          Take Survey <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">Completed</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {completed.map((survey: any, i: number) => (
                  <motion.div
                    key={survey.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-[2rem] border border-slate-100 shadow-sm opacity-75 overflow-hidden"
                  >
                    <div className="p-8 space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                          <CheckCircle2 size={22} />
                        </div>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-lg shrink-0">
                          Submitted
                        </span>
                      </div>
                      <div>
                        <h3 className="font-black text-slate-700 text-lg leading-snug">{survey.title}</h3>
                        {survey.description && (
                          <p className="text-xs text-slate-400 font-medium mt-2 leading-relaxed line-clamp-2">
                            {survey.description}
                          </p>
                        )}
                      </div>
                      <div className="pt-2 border-t border-slate-50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Thank you for your feedback
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <TakeSurveyModal
        isOpen={!!activeSurveyId}
        onClose={() => setActiveSurveyId(null)}
        surveyId={activeSurveyId}
      />
    </div>
  );
};

export default EmployeeSurveys;
