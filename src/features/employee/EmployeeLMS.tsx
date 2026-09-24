import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  PlayCircle,
  CheckCircle2,
  BookOpen,
  Loader2,
  Clock,
  BarChart2,
  Award,
  Search,
  Users,
  ShieldCheck,
  Sparkles,
  Send,
  Eye,
} from "lucide-react";
import { useMyCourses } from "../../api/learning.client";
import { TakeCourseModal } from "./TakeCourseModal";
import { CertificateModal } from "../lms/CertificateModal";

const progressColor = (pct: number) => {
  if (pct >= 100) return "bg-emerald-500";
  if (pct >= 50) return "bg-indigo-500";
  return "bg-amber-400";
};

const EmployeeLMS: React.FC = () => {
  const user =
    typeof window !== "undefined" && localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : null;
  const popupAlert = (msg: string) => window.alert(msg);

  const isManager = user?.role === "MANAGER";
  const [managerViewTab, setManagerViewTab] = useState<"my" | "team">("my");

  const { data: enrollments = [], isLoading } = useMyCourses();
  const teamEnrollments: any[] = [];
  const isTeamLoading = false;

  const [activeEnrollment, setActiveEnrollment] = useState<any | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<any | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [teamSearch, setTeamSearch] = useState("");

  const completed = enrollments.filter(
    (e: any) => (e.enrollment?.progress ?? e.progress ?? 0) >= 100,
  );
  const inProgress = enrollments.filter((e: any) => {
    const p = e.enrollment?.progress ?? e.progress ?? 0;
    return p > 0 && p < 100;
  });
  const notStarted = enrollments.filter(
    (e: any) => (e.enrollment?.progress ?? e.progress ?? 0) === 0,
  );

  const filteredInProgress = inProgress.filter((e: any) => {
    const title = (e.course?.title || e.title || "").toLowerCase();
    return !searchQuery || title.includes(searchQuery.toLowerCase());
  });
  const filteredNotStarted = notStarted.filter((e: any) => {
    const title = (e.course?.title || e.title || "").toLowerCase();
    return !searchQuery || title.includes(searchQuery.toLowerCase());
  });
  const filteredCompleted = completed.filter((e: any) => {
    const title = (e.course?.title || e.title || "").toLowerCase();
    return !searchQuery || title.includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-indigo-500" size={36} />
      </div>
    );
  }

  const CourseCard = ({ enrollment, i }: { enrollment: any; i: number }) => {
    const course = enrollment.course ?? enrollment;
    const progress =
      enrollment.enrollment?.progress ?? enrollment.progress ?? 0;
    const isDone = progress >= 100;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        className={`bg-white rounded-[2rem] border shadow-sm hover:shadow-lg transition-all overflow-hidden group ${
          isDone
            ? "border-slate-100 opacity-80"
            : "border-slate-200 hover:border-indigo-200"
        }`}
      >
        <div className="p-8 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${
                isDone
                  ? "bg-emerald-50 text-emerald-500"
                  : "bg-indigo-50 text-indigo-600"
              }`}
            >
              {isDone ? <CheckCircle2 size={22} /> : <BookOpen size={22} />}
            </div>
            <span
              className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg shrink-0 ${
                isDone
                  ? "bg-emerald-50 text-emerald-600"
                  : progress > 0
                    ? "bg-indigo-50 text-indigo-600"
                    : "bg-slate-50 text-slate-500"
              }`}
            >
              {isDone
                ? "Completed"
                : progress > 0
                  ? "In Progress"
                  : "Not Started"}
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
              <span className="text-[10px] font-black text-slate-600">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${progressColor(progress)}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
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
            {!isDone ? (
              <button
                onClick={() => setActiveEnrollment(enrollment)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
              >
                <PlayCircle size={13} />
                {progress > 0 ? "Continue" : "Start"}
              </button>
            ) : (
              <button
                onClick={() =>
                  setSelectedCertificate({
                    recipientName: `${user?.name || "Employee"}`,
                    courseTitle: course.title ?? course.name,
                    completedAt: enrollment.enrollment?.completedAt,
                    duration: course.duration,
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                <Award size={13} className="text-emerald-600" /> Certificate
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap size={14} /> ZenHR Academy
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            My Learning
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Courses assigned to you by your HR team.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

      {/* Manager Tab Toggle */}
      {isManager && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setManagerViewTab("my")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              managerViewTab === "my"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <BookOpen size={15} /> My Learning ({enrollments.length})
          </button>
          <button
            onClick={() => setManagerViewTab("team")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              managerViewTab === "team"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <Users size={15} /> Team Learning Progress ({teamEnrollments.length}
            )
          </button>
        </div>
      )}

      {/* Manager Team Learning View */}
      {isManager && managerViewTab === "team" ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-800">
                Team Learning & Compliance
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Monitor training progress and completions for your direct
                reports.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search direct reports..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {isTeamLoading ? (
            <div className="py-12 flex justify-center text-indigo-500">
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : teamEnrollments.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">
                No direct reports currently enrolled in courses.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Course</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Progress</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamEnrollments
                    .filter((item: any) => {
                      const name =
                        `${item.employee?.name || ""} ${item.employee?.lastName || ""}`.toLowerCase();
                      const courseTitle = (
                        item.course?.title || ""
                      ).toLowerCase();
                      const q = teamSearch.trim().toLowerCase();
                      return !q || name.includes(q) || courseTitle.includes(q);
                    })
                    .map((item: any) => {
                      const emp = item.employee;
                      const course = item.course;
                      const enr = item.enrollment;
                      const progress = enr?.progress ?? 0;
                      const isDone = progress >= 100;

                      return (
                        <tr
                          key={enr.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {emp?.name} {emp?.lastName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium">
                            {course?.title}
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
                              {isDone
                                ? "Completed"
                                : progress > 0
                                  ? "In Progress"
                                  : "Not Started"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="w-28">
                              <span className="text-[10px] font-bold text-slate-600 block mb-1">
                                {progress}%
                              </span>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isDone
                                      ? "bg-emerald-500"
                                      : progress > 0
                                        ? "bg-indigo-500"
                                        : "bg-slate-300"
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {!isDone && (
                              <button
                                onClick={() =>
                                  popupAlert(
                                    `Encouragement sent to ${emp?.name}.`,
                                  )
                                }
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors inline-flex items-center gap-1"
                              >
                                <Send size={11} /> Nudge
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Regular Employee Courses View */
        <>
          {enrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <GraduationCap size={40} className="text-indigo-300" />
              </div>
              <h2 className="text-xl font-black text-slate-700 mb-2">
                No courses assigned
              </h2>
              <p className="text-sm text-slate-400 font-medium max-w-xs">
                Your HR team hasn't enrolled you in any courses yet. Check back
                soon.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {inProgress.length > 0 && (
                <div>
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">
                    In Progress
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredInProgress.map((e: any, i: number) => (
                      <React.Fragment key={e.id}>
                        <CourseCard enrollment={e} i={i} />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {notStarted.length > 0 && (
                <div>
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">
                    Not Started
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredNotStarted.map((e: any, i: number) => (
                      <React.Fragment key={e.id}>
                        <CourseCard enrollment={e} i={i} />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {completed.length > 0 && (
                <div>
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">
                    Completed
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCompleted.map((e: any, i: number) => (
                      <React.Fragment key={e.id}>
                        <CourseCard enrollment={e} i={i} />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <TakeCourseModal
        isOpen={!!activeEnrollment}
        onClose={() => setActiveEnrollment(null)}
        enrollment={activeEnrollment}
      />

      <CertificateModal
        isOpen={!!selectedCertificate}
        onClose={() => setSelectedCertificate(null)}
        certificate={selectedCertificate}
      />
    </div>
  );
};

export default EmployeeLMS;
