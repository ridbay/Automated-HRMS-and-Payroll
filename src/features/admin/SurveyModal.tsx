import React, { useState } from 'react';
import { useCreateSurvey } from '../../api/survey.client';
import { X, Plus, Trash2 } from 'lucide-react';

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SurveyModal: React.FC<SurveyModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('pulse');
  const [status, setStatus] = useState('active');
  const [questions, setQuestions] = useState<any[]>([
    { question: '', type: 'rating', options: [] }
  ]);

  const createSurvey = useCreateSurvey();

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: '', type: 'rating', options: [] }]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQs = [...questions];
    newQs[index] = { ...newQs[index], [field]: value };
    setQuestions(newQs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSurvey.mutate(
      {
        title,
        description,
        type,
        status,
        questions,
      },
      {
        onSuccess: () => {
          onClose();
          // Reset
          setTitle('');
          setDescription('');
          setType('pulse');
          setQuestions([{ question: '', type: 'rating', options: [] }]);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-600"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Create Pulse Survey</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Survey Title</label>
              <input
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Q3 Employee Engagement"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Briefly describe the purpose of this survey..."
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Type</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="pulse">Pulse Check</option>
                <option value="eNPS">eNPS</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="active">Active (Publish Immediately)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-800">Questions</h3>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="text-indigo-600 text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:text-indigo-700"
              >
                <Plus size={14} /> Add Question
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mr-8">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Question {idx + 1}</label>
                      <input
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="What do you think about..."
                        value={q.question}
                        onChange={(e) => handleQuestionChange(idx, 'question', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                      <select
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                        value={q.type}
                        onChange={(e) => handleQuestionChange(idx, 'type', e.target.value)}
                      >
                        <option value="rating">1-5 Rating</option>
                        <option value="text">Text Response</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={createSurvey.isPending || questions.length === 0}
            className="w-full bg-indigo-600 text-white rounded-xl py-4 font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {createSurvey.isPending ? 'Publishing...' : 'Publish Survey'}
          </button>
        </form>
      </div>
    </div>
  );
};
