import React, { useState, useEffect } from 'react';
import { useSurveyDetails, useSubmitSurvey } from '../../api/survey.client';
import { X, Loader2 } from 'lucide-react';
import Celebration from '../../components/Celebration';

interface TakeSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyId: string | null;
}

export const TakeSurveyModal: React.FC<TakeSurveyModalProps> = ({ isOpen, onClose, surveyId }) => {
  const { data: survey, isLoading } = useSurveyDetails(surveyId || '');
  const submitSurvey = useSubmitSurvey();
  
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAnswers({});
      setShowCelebration(false);
    }
  }, [isOpen, surveyId]);

  if (!isOpen || !surveyId) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Format answers
    const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer
    }));

    submitSurvey.mutate(
      { surveyId, answers: formattedAnswers },
      {
        onSuccess: () => {
          setShowCelebration(true);
          setTimeout(() => {
            onClose();
          }, 2500);
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {showCelebration && <Celebration active={true} />}
      
      <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-600"
        >
          <X size={24} />
        </button>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
          </div>
        ) : survey ? (
          <>
            <div className="mb-8 pr-12">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-lg mb-4 inline-block">
                {survey.type === 'eNPS' ? 'eNPS Survey' : 'Pulse Check'}
              </span>
              <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">{survey.title}</h2>
              {survey.description && (
                <p className="text-slate-500 font-medium">{survey.description}</p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {survey.questions?.map((q: any, idx: number) => (
                <div key={q.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">
                    <span className="text-indigo-500 mr-2">{idx + 1}.</span> 
                    {q.question}
                  </h3>

                  {q.type === 'rating' ? (
                    <div className="flex justify-between items-center max-w-md mx-auto mt-6">
                      <span className="text-xs font-bold text-slate-400 uppercase">Strongly Disagree</span>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            type="button"
                            key={val}
                            onClick={() => setAnswers({ ...answers, [q.id]: val.toString() })}
                            className={`w-12 h-12 rounded-full font-black text-lg transition-all ${
                              answers[q.id] === val.toString()
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110'
                                : 'bg-white border-2 border-slate-200 text-slate-400 hover:border-indigo-400 hover:text-indigo-500'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase">Strongly Agree</span>
                    </div>
                  ) : (
                    <textarea
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      rows={3}
                      placeholder="Type your answer here..."
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    />
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={submitSurvey.isPending || Object.keys(answers).length !== (survey.questions?.length || 0)}
                className="w-full bg-indigo-600 text-white rounded-xl py-4 font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {submitSurvey.isPending ? 'Submitting...' : 'Submit Answers Anonymously'}
              </button>
            </form>
          </>
        ) : (
          <div className="py-20 text-center text-slate-500 font-bold">
            Survey not found.
          </div>
        )}
      </div>
    </div>
  );
};
