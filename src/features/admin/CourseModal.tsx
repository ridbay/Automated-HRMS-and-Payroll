import React, { useEffect, useState } from 'react';
import { useCreateCourse, useUpdateCourse } from '../../api/learning.client';
import { X } from 'lucide-react';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course?: { id: string; title: string; description?: string; url?: string; duration: number; status: string } | null;
}

export const CourseModal: React.FC<CourseModalProps> = ({ isOpen, onClose, course = null }) => {
  const isEditing = !!course;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [status, setStatus] = useState('active');

  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const saveCourse = isEditing ? updateCourse : createCourse;

  useEffect(() => {
    if (!isOpen) return;
    setTitle(course?.title || '');
    setDescription(course?.description || '');
    setUrl(course?.url || '');
    setDuration(course ? String(course.duration) : '');
    setStatus(course?.status || 'active');
  }, [isOpen, course]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      description,
      url,
      duration: parseInt(duration, 10),
      status,
    };
    const onSuccess = () => {
      onClose();
      setTitle('');
      setDescription('');
      setUrl('');
      setDuration('');
      setStatus('active');
    };
    if (isEditing) {
      updateCourse.mutate({ id: course!.id, data: payload }, { onSuccess });
    } else {
      createCourse.mutate(payload, { onSuccess });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-600"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">{isEditing ? 'Edit Course' : 'Add New Course'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Course Title</label>
            <input
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Information Security 101"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500"
              placeholder="Course overview..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Video / SCORM URL</label>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Duration (mins)</label>
              <input
                required
                type="number"
                min="1"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500"
                placeholder="45"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={saveCourse.isPending}
            className="w-full bg-indigo-600 text-white rounded-xl py-4 font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-4"
          >
            {saveCourse.isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Course'}
          </button>
        </form>
      </div>
    </div>
  );
};
