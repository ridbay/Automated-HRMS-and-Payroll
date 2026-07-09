import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Plus,
  X,
  Star,
  Target,
  Award,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Save,
  Send
} from 'lucide-react';

interface AssessmentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  cycleName: string;
  existingAssessment?: any;
  onSave: (data: any) => void;
  onSubmit: (id: string) => void;
}

const AssessmentWizard: React.FC<AssessmentWizardProps> = ({
  isOpen,
  onClose,
  cycleName,
  existingAssessment,
  onSave,
  onSubmit
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [assessmentData, setAssessmentData] = useState({
    achievements: existingAssessment?.achievements || [''],
    challenges: existingAssessment?.challenges || [''],
    goalsProgress: existingAssessment?.goalsProgress || [],
    skillRatings: existingAssessment?.skillRatings || [
      { skill: 'Technical Skills', rating: 4, comment: '' },
      { skill: 'Communication', rating: 4, comment: '' },
      { skill: 'Leadership', rating: 3, comment: '' },
      { skill: 'Problem Solving', rating: 4, comment: '' },
    ],
    selfRating: existingAssessment?.selfRating || '',
    selfComment: existingAssessment?.selfComment || '',
    developmentGoals: existingAssessment?.developmentGoals || [{ title: '', category: 'Technical', targetDate: '' }],
  });

  const steps = [
    { id: 'achievements', title: 'Achievements', icon: <Award size={20} /> },
    { id: 'challenges', title: 'Challenges', icon: <AlertCircle size={20} /> },
    { id: 'goals', title: 'Goals Progress', icon: <Target size={20} /> },
    { id: 'skills', title: 'Skill Ratings', icon: <Star size={20} /> },
    { id: 'self', title: 'Self Assessment', icon: <TrendingUp size={20} /> },
    { id: 'development', title: 'Development Goals', icon: <Sparkles size={20} /> },
  ];

  const addAchievement = () => setAssessmentData(prev => ({ ...prev, achievements: [...prev.achievements, ''] }));
  const updateAchievement = (index: number, value: string) => {
    const updated = [...assessmentData.achievements];
    updated[index] = value;
    setAssessmentData(prev => ({ ...prev, achievements: updated }));
  };
  const removeAchievement = (index: number) => {
    const updated = assessmentData.achievements.filter((_, i) => i !== index);
    setAssessmentData(prev => ({ ...prev, achievements: updated }));
  };

  const addChallenge = () => setAssessmentData(prev => ({ ...prev, challenges: [...prev.challenges, ''] }));
  const updateChallenge = (index: number, value: string) => {
    const updated = [...assessmentData.challenges];
    updated[index] = value;
    setAssessmentData(prev => ({ ...prev, challenges: updated }));
  };
  const removeChallenge = (index: number) => {
    const updated = assessmentData.challenges.filter((_, i) => i !== index);
    setAssessmentData(prev => ({ ...prev, challenges: updated }));
  };

  const updateSkillRating = (index: number, field: string, value: any) => {
    const updated = [...assessmentData.skillRatings];
    updated[index] = { ...updated[index], [field]: value };
    setAssessmentData(prev => ({ ...prev, skillRatings: updated }));
  };

  const addDevelopmentGoal = () => setAssessmentData(prev => ({
    ...prev,
    developmentGoals: [...prev.developmentGoals, { title: '', category: 'Technical', targetDate: '' }]
  }));
  const updateDevelopmentGoal = (index: number, field: string, value: string) => {
    const updated = [...assessmentData.developmentGoals];
    updated[index] = { ...updated[index], [field]: value };
    setAssessmentData(prev => ({ ...prev, developmentGoals: updated }));
  };
  const removeDevelopmentGoal = (index: number) => {
    const updated = assessmentData.developmentGoals.filter((_, i) => i !== index);
    setAssessmentData(prev => ({ ...prev, developmentGoals: updated }));
  };

  const handleSave = () => {
    onSave(assessmentData);
  };

  const handleSubmit = () => {
    if (existingAssessment?.id) {
      onSubmit(existingAssessment.id);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Key Achievements</h3>
              <p className="text-slate-500 text-sm">List your most significant accomplishments during this review period.</p>
            </div>
            <div className="space-y-4">
              {assessmentData.achievements.map((achievement, index) => (
                <div key={index} className="flex gap-3">
                  <textarea
                    value={achievement}
                    onChange={(e) => updateAchievement(index, e.target.value)}
                    placeholder="Describe your achievement..."
                    className="flex-1 px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-slate-700 resize-none h-24"
                  />
                  {assessmentData.achievements.length > 1 && (
                    <button
                      onClick={() => removeAchievement(index)}
                      className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addAchievement}
                className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:text-indigo-700 transition-colors"
              >
                <Plus size={18} /> Add Achievement
              </button>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Challenges Faced</h3>
              <p className="text-slate-500 text-sm">What obstacles did you encounter and how did you overcome them?</p>
            </div>
            <div className="space-y-4">
              {assessmentData.challenges.map((challenge, index) => (
                <div key={index} className="flex gap-3">
                  <textarea
                    value={challenge}
                    onChange={(e) => updateChallenge(index, e.target.value)}
                    placeholder="Describe a challenge..."
                    className="flex-1 px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-slate-700 resize-none h-24"
                  />
                  {assessmentData.challenges.length > 1 && (
                    <button
                      onClick={() => removeChallenge(index)}
                      className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addChallenge}
                className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:text-indigo-700 transition-colors"
              >
                <Plus size={18} /> Add Challenge
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Goals Progress</h3>
              <p className="text-slate-500 text-sm">Review your goals and document your progress.</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-sm text-amber-700 font-medium">
                This section will be populated with your active goals from the Objectives tab.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Skill Self-Ratings</h3>
              <p className="text-slate-500 text-sm">Rate your skills and provide comments.</p>
            </div>
            <div className="space-y-4">
              {assessmentData.skillRatings.map((skill, index) => (
                <div key={index} className="bg-slate-50 p-5 rounded-2xl">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-slate-800">{skill.skill}</h4>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => updateSkillRating(index, 'rating', rating)}
                          className={`transition-all ${rating <= skill.rating ? 'text-amber-400' : 'text-slate-200'}`}
                        >
                          <Star size={20} fill={rating <= skill.rating ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={skill.comment}
                    onChange={(e) => updateSkillRating(index, 'comment', e.target.value)}
                    placeholder="Add a comment about this skill..."
                    className="w-full px-4 py-3 bg-white border-none rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-slate-700 resize-none h-20 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Overall Self-Assessment</h3>
              <p className="text-slate-500 text-sm">Provide your overall rating and comments.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Overall Rating
                </label>
                <select
                  value={assessmentData.selfRating}
                  onChange={(e) => setAssessmentData(prev => ({ ...prev, selfRating: e.target.value }))}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700"
                >
                  <option value="">Select rating...</option>
                  <option value="exceptional">Exceptional</option>
                  <option value="exceeds_expectations">Exceeds Expectations</option>
                  <option value="meets_expectations">Meets Expectations</option>
                  <option value="needs_improvement">Needs Improvement</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Self-Comment
                </label>
                <textarea
                  value={assessmentData.selfComment}
                  onChange={(e) => setAssessmentData(prev => ({ ...prev, selfComment: e.target.value }))}
                  placeholder="Share your overall thoughts about your performance..."
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-slate-700 resize-none h-32"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Development Goals</h3>
              <p className="text-slate-500 text-sm">Set your goals for the next review period.</p>
            </div>
            <div className="space-y-4">
              {assessmentData.developmentGoals.map((goal, index) => (
                <div key={index} className="bg-slate-50 p-5 rounded-2xl space-y-3">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={goal.title}
                      onChange={(e) => updateDevelopmentGoal(index, 'title', e.target.value)}
                      placeholder="Goal title..."
                      className="flex-1 px-4 py-3 bg-white border-none rounded-xl outline-none font-bold text-slate-700"
                    />
                    {assessmentData.developmentGoals.length > 1 && (
                      <button
                        onClick={() => removeDevelopmentGoal(index)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={goal.category}
                      onChange={(e) => updateDevelopmentGoal(index, 'category', e.target.value)}
                      className="px-4 py-3 bg-white border-none rounded-xl outline-none font-bold text-slate-600 text-sm"
                    >
                      <option value="Technical">Technical</option>
                      <option value="Leadership">Leadership</option>
                      <option value="Soft Skills">Soft Skills</option>
                      <option value="Certification">Certification</option>
                    </select>
                    <input
                      type="date"
                      value={goal.targetDate}
                      onChange={(e) => updateDevelopmentGoal(index, 'targetDate', e.target.value)}
                      className="px-4 py-3 bg-white border-none rounded-xl outline-none font-bold text-slate-600 text-sm"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={addDevelopmentGoal}
                className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:text-indigo-700 transition-colors"
              >
                <Plus size={18} /> Add Development Goal
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="p-8 bg-indigo-600 text-white flex justify-between items-start shrink-0">
            <div>
              <h2 className="text-2xl font-black mb-1">
                Self-Assessment: {cycleName}
              </h2>
              <p className="text-indigo-100 text-sm font-medium">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-8 py-4 bg-slate-50 border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 ${index < steps.length - 1 ? 'flex-1' : ''}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      index <= currentStep
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {index < currentStep ? <CheckCircle2 size={18} /> : step.icon}
                  </div>
                  <span
                    className={`text-xs font-black uppercase tracking-widest ${
                      index <= currentStep ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        index < currentStep ? 'bg-indigo-600' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0 flex justify-between items-center">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 bg-white text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} /> Back
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                <Save size={18} /> Save Draft
              </button>
              {currentStep === steps.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                >
                  <Send size={18} /> Submit
                </button>
              ) : (
                <button
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                >
                  Next <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AssessmentWizard;
