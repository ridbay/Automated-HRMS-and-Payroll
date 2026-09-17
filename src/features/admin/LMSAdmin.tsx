import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Plus,
  Trash2,
  Pencil,
  BookOpen,
  Clock,
  PlayCircle,
  RefreshCw,
  MoreVertical
} from "lucide-react";
import { useAdminCourses, useDeleteCourse } from "../../api/learning.client";
import { CourseModal } from "./CourseModal";
import { AssignCourseModal } from "./AssignCourseModal";

const LMSAdmin: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [assigningCourse, setAssigningCourse] = useState<{ id: string; title: string } | null>(null);
  const { data: courses = [], isLoading } = useAdminCourses();
  const deleteCourse = useDeleteCourse();

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
            Learning Management
          </h1>
          <p className="text-slate-500 font-medium">
            Manage employee training, courses, and compliance modules.
          </p>
        </div>
        <button
          onClick={() => { setEditingCourse(null); setIsModalOpen(true); }}
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Add Course
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <GraduationCap className="text-indigo-600" />
          <h2 className="text-lg font-black text-slate-800">Course Library</h2>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center text-indigo-400">
            <RefreshCw className="animate-spin" size={32} />
          </div>
        ) : courses.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <BookOpen size={48} className="mx-auto mb-4 opacity-40" />
            <p className="text-sm font-bold">No courses available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => (
              <motion.div
                whileHover={{ y: -4 }}
                key={course.id}
                className="rounded-[2rem] border border-slate-200 bg-white group hover:shadow-xl hover:shadow-indigo-50/50 transition-all relative overflow-hidden flex flex-col"
              >
                <div className="h-32 bg-indigo-50 flex items-center justify-center border-b border-indigo-100 relative">
                  <PlayCircle size={40} className="text-indigo-300 group-hover:text-indigo-500 transition-colors" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => { setEditingCourse(course); setIsModalOpen(true); }}
                      className="p-2 bg-white/50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors backdrop-blur-sm"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this course?")) {
                          deleteCourse.mutate(course.id);
                        }
                      }}
                      className="p-2 bg-white/50 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors backdrop-blur-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      {course.status}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase">
                      <Clock size={12} />
                      {course.duration} mins
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-800 mb-2">{course.title}</h3>
                  {course.description && (
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">{course.description}</p>
                  )}

                  <div className="pt-4 mt-auto border-t border-slate-100">
                    <button
                      onClick={() => setAssigningCourse({ id: course.id, title: course.title })}
                      className="w-full py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase hover:bg-slate-100 transition-colors"
                    >
                      Manage Assignments
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <CourseModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCourse(null); }}
        course={editingCourse}
      />

      <AssignCourseModal
        course={assigningCourse}
        onClose={() => setAssigningCourse(null)}
      />
    </div>
  );
};

export default LMSAdmin;
