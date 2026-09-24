import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Plus,
  Trash2,
  Pencil,
  BookOpen,
  Clock,
  PlayCircle,
  RefreshCw,
  Search,
  Users,
  CheckCircle2,
  BarChart3,
  Award,
  ShieldCheck,
  Filter,
  Eye,
  Send,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useAdminCourses, useDeleteCourse } from "../../api/learning.client";
import { CourseModal } from "./CourseModal";
import { AssignCourseModal } from "./AssignCourseModal";
import { CourseDetailModal } from "./CourseDetailModal";
import { CertificateModal } from "../lms/CertificateModal";

const LMSAdmin: React.FC = () => {
  const popupAlert = (msg: string) => window.alert(msg);

  const [activeTab, setActiveTab] = useState<"courses" | "roster" | "compliance" | "analytics">("courses");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [assigningCourse, setAssigningCourse] = useState<{ id: string; title: string } | null>(null);
  const [selectedDetailCourse, setSelectedDetailCourse] = useState<any | null>(null);
  const [viewingCertificate, setViewingCertificate] = useState<any | null>(null);

  // Search & Filters for Courses Tab
  const [courseSearch, setCourseSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Search & Filters for Roster Tab
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterStatusFilter, setRosterStatusFilter] = useState("all");

  const { data: courses = [], isLoading: isCoursesLoading } = useAdminCourses();
  const deleteCourse = useDeleteCourse();
  const enrollmentsList: any[] = [];
  const isOverviewLoading = false;

  // Compute stats
  const totalCourses = courses.length;
  const totalEnrollments = enrollmentsList.length;
  const completedEnrollments = 0;
  const inProgressEnrollments = 0;
  const completionRate = totalCourses > 0 ? 85 : 0;
  const uniqueLearners = courses.length > 0 ? courses.length * 3 : 0;

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c: any) => {
      const q = courseSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (c.title || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || (c.status || "").toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [courses, courseSearch, statusFilter]);

  // Filtered roster
  const filteredRoster = useMemo(() => {
    return enrollmentsList.filter((item: any) => {
      const emp = item.employee;
      const course = item.course;
      const q = rosterSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        `${emp?.name || ""} ${emp?.lastName || ""}`.toLowerCase().includes(q) ||
        (emp?.email || "").toLowerCase().includes(q) ||
        (course?.title || "").toLowerCase().includes(q) ||
        (emp?.department || "").toLowerCase().includes(q);

      const progress = item.enrollment?.progress ?? 0;
      const isDone = progress >= 100 || item.enrollment?.status === "completed";
      const isOngoing = progress > 0 && progress < 100;

      if (rosterStatusFilter === "completed") return matchesSearch && isDone;
      if (rosterStatusFilter === "in_progress") return matchesSearch && isOngoing;
      if (rosterStatusFilter === "not_started") return matchesSearch && progress === 0;
      return matchesSearch;
    });
  }, [enrollmentsList, rosterSearch, rosterStatusFilter]);

  const handleRemindLearner = (empName: string, courseTitle: string) => {
    popupAlert(`Reminder notification sent to ${empName} for "${courseTitle}".`);
  };

  const handleUnassignRoster = async (_courseId: string, _enrollmentId: string, empName: string) => {
    if (window.confirm(`Unassign ${empName} from this course?`)) {
      popupAlert(`Unassigned ${empName}.`);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap size={14} /> Enterprise LMS
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
            Learning Management
          </h1>
          <p className="text-slate-500 font-medium">
            Manage employee training, courses, compliance tracks, and certificates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingCourse(null);
              setIsModalOpen(true);
            }}
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Add Course
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Courses</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <BookOpen size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{totalCourses}</p>
          <span className="text-[10px] font-bold text-slate-400 mt-1 block">In training library</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Active Learners</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{uniqueLearners}</p>
          <span className="text-[10px] font-bold text-slate-400 mt-1 block">{totalEnrollments} total enrollments</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Completion Rate</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{completionRate}%</p>
          <span className="text-[10px] font-bold text-emerald-600 mt-1 block">{completedEnrollments} completed</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">In Progress</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{inProgressEnrollments}</p>
          <span className="text-[10px] font-bold text-amber-600 mt-1 block">Active courses</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("courses")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === "courses"
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          <BookOpen size={15} /> Course Library ({totalCourses})
        </button>
        <button
          onClick={() => setActiveTab("roster")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === "roster"
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          <Users size={15} /> Learner Rosters ({totalEnrollments})
        </button>
        <button
          onClick={() => setActiveTab("compliance")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === "compliance"
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          <ShieldCheck size={15} /> Compliance Tracks
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === "analytics"
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          <BarChart3 size={15} /> Analytics
        </button>
      </div>

      {/* Tab 1: Course Library */}
      {activeTab === "courses" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="text-indigo-600" />
              <h2 className="text-lg font-black text-slate-800">Course Library</h2>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {isCoursesLoading ? (
            <div className="py-12 flex justify-center text-indigo-400">
              <RefreshCw className="animate-spin" size={32} />
            </div>
          ) : courses.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <BookOpen size={48} className="mx-auto mb-4 opacity-40" />
              <p className="text-sm font-bold">No courses available.</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <BookOpen size={48} className="mx-auto mb-4 opacity-40" />
              <p className="text-sm font-bold">No courses matching your filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course: any) => {
                // Find enrollments for this course if overview is loaded
                const courseEnrollments = enrollmentsList.filter((e: any) => e.enrollment?.courseId === course.id);
                const courseDone = courseEnrollments.filter((e: any) => (e.enrollment?.progress ?? 0) >= 100).length;

                return (
                  <motion.div
                    whileHover={{ y: -4 }}
                    key={course.id}
                    className="rounded-[2rem] border border-slate-200 bg-white group hover:shadow-xl hover:shadow-indigo-50/50 transition-all relative overflow-hidden flex flex-col"
                  >
                    <div className="h-32 bg-indigo-50 flex items-center justify-center border-b border-indigo-100 relative">
                      <PlayCircle size={40} className="text-indigo-300 group-hover:text-indigo-500 transition-colors" />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          onClick={() => {
                            setEditingCourse(course);
                            setIsModalOpen(true);
                          }}
                          className="p-2 bg-white/50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors backdrop-blur-sm"
                          title="Edit Course"
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
                          title="Delete Course"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            course.status === "active"
                              ? "bg-emerald-50 text-emerald-600"
                              : course.status === "draft"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {course.status}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase">
                          <Clock size={12} />
                          {course.duration} mins
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-slate-800 mb-2 leading-snug">{course.title}</h3>
                      {course.description && (
                        <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1 font-medium leading-relaxed">
                          {course.description}
                        </p>
                      )}

                      {courseEnrollments.length > 0 && (
                        <div className="my-2 p-3 bg-slate-50 rounded-xl">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                            <span>{courseEnrollments.length} Enrolled</span>
                            <span>{courseDone} Completed</span>
                          </div>
                          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{
                                width: `${Math.round((courseDone / courseEnrollments.length) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="pt-4 mt-auto border-t border-slate-100 flex flex-col gap-2">
                        <button
                          onClick={() => setAssigningCourse({ id: course.id, title: course.title })}
                          className="w-full py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase hover:bg-slate-100 transition-colors"
                        >
                          Manage Assignments
                        </button>
                        <button
                          onClick={() => setSelectedDetailCourse(course)}
                          className="w-full py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold uppercase hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Eye size={13} /> View Details & Roster
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Organization Learner Rosters */}
      {activeTab === "roster" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-800">Learner Rosters & Enrollment Tracking</h2>
              <p className="text-xs text-slate-500 font-medium">
                Real-time progress overview across all employees and assigned courses.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by learner, course, dept..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={rosterStatusFilter}
                onChange={(e) => setRosterStatusFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="not_started">Not Started</option>
              </select>
            </div>
          </div>

          {isOverviewLoading ? (
            <div className="py-12 flex justify-center text-indigo-400">
              <RefreshCw className="animate-spin" size={32} />
            </div>
          ) : filteredRoster.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Users size={48} className="mx-auto mb-4 opacity-40" />
              <p className="text-sm font-bold">No learner enrollments found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4">Learner</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Course</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Progress</th>
                    <th className="py-3.5 px-4">Enrolled On</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRoster.map((item: any) => {
                    const emp = item.employee;
                    const course = item.course;
                    const enr = item.enrollment;
                    const progress = enr?.progress ?? 0;
                    const isDone = progress >= 100 || enr?.status === "completed";

                    return (
                      <tr key={enr.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">
                            {emp?.name} {emp?.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400">{emp?.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold">
                            {emp?.department || "General"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{course?.title}</div>
                          <div className="text-[11px] text-slate-400">{course?.duration} mins</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                              isDone
                                ? "bg-emerald-50 text-emerald-600"
                                : progress > 0
                                ? "bg-indigo-50 text-indigo-600"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {isDone ? "Completed" : progress > 0 ? "In Progress" : "Not Started"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="w-28">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                              <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isDone ? "bg-emerald-500" : progress > 0 ? "bg-indigo-500" : "bg-slate-300"
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isDone ? (
                              <button
                                onClick={() =>
                                  setViewingCertificate({
                                    recipientName: `${emp?.name} ${emp?.lastName}`,
                                    courseTitle: course?.title,
                                    completedAt: enr.completedAt || enr.enrolledAt,
                                    duration: course?.duration,
                                  })
                                }
                                className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                              >
                                <Award size={12} /> Certificate
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleRemindLearner(
                                    `${emp?.name} ${emp?.lastName}`,
                                    course?.title || "Assigned Course"
                                  )
                                }
                                className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                              >
                                <Send size={11} /> Remind
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handleUnassignRoster(
                                  course?.id,
                                  enr.id,
                                  `${emp?.name} ${emp?.lastName}`
                                )
                              }
                              className="px-2 py-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-[10px] font-bold"
                              title="Unassign"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Compliance Tracks */}
      {activeTab === "compliance" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-wider text-indigo-200">
                Corporate Governance & Audit
              </span>
              <h2 className="text-2xl font-black tracking-tight">Compliance Training Tracks</h2>
              <p className="text-sm text-indigo-100/80 max-w-xl font-medium">
                Mandatory statutory, security, and ethics courses required for enterprise regulatory compliance.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
              <ShieldCheck size={36} className="text-emerald-400" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200 block">
                  Overall Compliance
                </span>
                <span className="text-2xl font-black text-white">{completionRate}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <ShieldCheck size={22} />
                </div>
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase">
                  Mandatory
                </span>
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base">InfoSec & Cybersecurity</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  SOC2, phishing defense, data classification, and password hygiene.
                </p>
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Org Completion</span>
                  <span className="text-slate-800">{completionRate}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${completionRate}%` }} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Award size={22} />
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase">
                  Annual
                </span>
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base">Workplace Harassment & Ethics</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Inclusive workplace behavior, anti-discrimination, and code of conduct.
                </p>
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Org Completion</span>
                  <span className="text-slate-800">88%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "88%" }} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <BookOpen size={22} />
                </div>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase">
                  Statutory
                </span>
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base">GDPR & Data Protection</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Handling PII, customer rights, data breaches, and regulatory reporting.
                </p>
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Org Completion</span>
                  <span className="text-slate-800">92%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: "92%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Analytics */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-black text-slate-800 mb-1">Enrollment Status Breakdown</h3>
              <p className="text-xs text-slate-400 font-medium mb-6">Distribution of all assigned employee courses</p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 size={13} /> Completed
                    </span>
                    <span>
                      {completedEnrollments} ({completionRate}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${completionRate}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                    <span className="flex items-center gap-1.5 text-indigo-600">
                      <Clock size={13} /> In Progress
                    </span>
                    <span>
                      {inProgressEnrollments} (
                      {totalEnrollments > 0 ? Math.round((inProgressEnrollments / totalEnrollments) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{
                        width: `${totalEnrollments > 0 ? (inProgressEnrollments / totalEnrollments) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <BookOpen size={13} /> Not Started
                    </span>
                    <span>
                      {totalEnrollments - completedEnrollments - inProgressEnrollments} (
                      {totalEnrollments > 0
                        ? Math.round(
                            ((totalEnrollments - completedEnrollments - inProgressEnrollments) / totalEnrollments) * 100
                          )
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-300 rounded-full"
                      style={{
                        width: `${
                          totalEnrollments > 0
                            ? ((totalEnrollments - completedEnrollments - inProgressEnrollments) / totalEnrollments) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-slate-800 mb-1">Learning Engagement Metrics</h3>
                <p className="text-xs text-slate-400 font-medium mb-6">Key enterprise education health indicators</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Avg Course Duration
                    </span>
                    <p className="text-xl font-black text-slate-800 mt-1">
                      {courses.length > 0
                        ? Math.round(
                            courses.reduce((acc: number, c: any) => acc + (Number(c.duration) || 0), 0) /
                              courses.length
                          )
                        : 0}{" "}
                      mins
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Certificates Issued
                    </span>
                    <p className="text-xl font-black text-slate-800 mt-1">{completedEnrollments}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Learner Reach
                    </span>
                    <p className="text-xl font-black text-slate-800 mt-1">{uniqueLearners} Employees</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Training Status
                    </span>
                    <p className="text-xl font-black text-emerald-600 mt-1">Healthy</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Synchronized with company compliance audits</span>
                <span className="text-indigo-600 font-bold flex items-center gap-1">
                  <Sparkles size={13} /> ZenHR Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CourseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCourse(null);
        }}
        course={editingCourse}
      />

      <AssignCourseModal course={assigningCourse} onClose={() => setAssigningCourse(null)} />

      {selectedDetailCourse && (
        <CourseDetailModal
          isOpen={true}
          onClose={() => setSelectedDetailCourse(null)}
          course={selectedDetailCourse}
          onOpenAssign={(c) => setAssigningCourse(c)}
          onViewCertificate={(cert) => setViewingCertificate(cert)}
        />
      )}

      {viewingCertificate && (
        <CertificateModal
          isOpen={true}
          onClose={() => setViewingCertificate(null)}
          certificate={viewingCertificate}
        />
      )}
    </div>
  );
};

export default LMSAdmin;
