import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  ChevronRight,
  Calendar,
  Filter,
  Search,
  Plus,
  ArrowRight,
  UserPlus,
  UserMinus,
  Plane,
  FileText,
  Shield,
  Briefcase,
  X,
} from "lucide-react";
import { MOCK_WORKFLOWS, MOCK_EMPLOYEES, Workflow } from "../../data/mocks";

const Onboarding: React.FC = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"Onboarding" | "Offboarding">(
    "Onboarding",
  );

  const workflows = MOCK_WORKFLOWS.filter((w) => w.type === activeTab);

  const stats = [
    {
      label: "Active Workflows",
      value: workflows.filter((w) => w.status === "Active").length,
      icon: <Clock size={20} className="text-indigo-600" />,
      bg: "bg-indigo-50",
    },
    {
      label: "Tasks Pending",
      value: workflows.reduce(
        (acc, w) => acc + w.tasks.filter((t) => t.status === "pending").length,
        0,
      ),
      icon: <CheckCircle2 size={20} className="text-amber-600" />,
      bg: "bg-amber-50",
    },
    {
      label: "Completed",
      value: workflows.filter((w) => w.status === "Completed").length,
      icon: <Users size={20} className="text-emerald-600" />,
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
            Transitions
          </h1>
          <p className="text-slate-500 font-medium">
            Manage employee onboarding and offboarding journeys.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("Onboarding")}
            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${
              activeTab === "Onboarding"
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
            }`}
          >
            Onboarding
          </button>
          <button
            onClick={() => setActiveTab("Offboarding")}
            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${
              activeTab === "Offboarding"
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
            }`}
          >
            Offboarding
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6"
          >
            <div
              className={`w-14 h-14 ${s.bg} rounded-2xl flex items-center justify-center shrink-0`}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {s.label}
              </p>
              <h4 className="text-3xl font-black text-slate-800 tracking-tighter tabular-nums">
                {s.value}
              </h4>
            </div>
          </div>
        ))}
        <button className="bg-indigo-600 p-6 rounded-[2.5rem] shadow-xl shadow-indigo-200 flex flex-col justify-center items-center text-white hover:scale-[1.02] transition-transform group">
          <Plus
            size={32}
            className="mb-2 group-hover:rotate-90 transition-transform"
          />
          <span className="text-xs font-black uppercase tracking-widest">
            Start New {activeTab}
          </span>
        </button>
      </div>

      {/* Workflow List */}
      <div className="space-y-4">
        {workflows.map((workflow) => {
          const employee = MOCK_EMPLOYEES.find(
            (e) => e.id === workflow.employeeId,
          ) || { avatar: "", role: "Unknown", department: "Unknown" };

          return (
            <motion.div
              key={workflow.id}
              layoutId={workflow.id}
              onClick={() => setSelectedWorkflow(workflow)}
              className="group bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-slate-100 group-hover:bg-indigo-500 transition-colors" />
              <div className="flex flex-col md:flex-row items-center gap-8 pl-4">
                {/* Profile */}
                <div className="flex items-center gap-4 w-full md:w-1/4">
                  <img
                    src={
                      employee.avatar ||
                      `https://ui-avatars.com/api/?name=${workflow.employeeName}`
                    }
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm"
                  />
                  <div>
                    <h3 className="text-lg font-black text-slate-800 truncate">
                      {workflow.employeeName}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {employee.role}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="flex-1 w-full space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                    <span>
                      Stage:{" "}
                      <span className="text-indigo-600">{workflow.stage}</span>
                    </span>
                    <span>{workflow.progress}% Complete</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000"
                      style={{ width: `${workflow.progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-8 w-full md:w-auto">
                  <div className="text-center">
                    <p className="text-xl font-black text-slate-800">
                      {
                        workflow.tasks.filter((t) => t.status === "completed")
                          .length
                      }
                      <span className="text-slate-300 text-sm">
                        / {workflow.tasks.length}
                      </span>
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Tasks
                    </p>
                  </div>
                  <div className="text-center hidden md:block">
                    <p className="text-lg font-bold text-slate-800">
                      {new Date(workflow.startDate).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric" },
                      )}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Start Date
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Details Slide-over */}
      <AnimatePresence>
        {selectedWorkflow && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWorkflow(null)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
            />
            <motion.div
              layoutId={selectedWorkflow.id}
              className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-10 space-y-8">
                <button
                  onClick={() => setSelectedWorkflow(null)}
                  className="absolute top-8 right-8 p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  <X size={20} />
                </button>

                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">
                    {selectedWorkflow.type} Journey
                  </div>
                  <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">
                    {selectedWorkflow.employeeName}
                  </h2>
                  <p className="text-slate-500 font-medium">
                    Current Stage: {selectedWorkflow.stage}
                  </p>
                </div>

                {/* Progress Card */}
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Users size={120} />
                  </div>
                  <h3 className="text-3xl font-black mb-1">
                    {selectedWorkflow.progress}%
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">
                    Workflow Completion
                  </p>
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${selectedWorkflow.progress}%` }}
                    />
                  </div>
                </div>

                {/* Tasks */}
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-indigo-600" />{" "}
                    Action Items
                  </h3>
                  <div className="space-y-3">
                    {selectedWorkflow.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="group p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4 hover:border-indigo-200 transition-colors cursor-pointer"
                      >
                        <button
                          className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.status === "completed" ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white group-hover:border-indigo-400"}`}
                        >
                          {task.status === "completed" && (
                            <CheckCircle2 size={14} />
                          )}
                        </button>
                        <div className="flex-1">
                          <h4
                            className={`text-sm font-bold ${task.status === "completed" ? "text-slate-400 line-through" : "text-slate-800"}`}
                          >
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase bg-white px-2 py-1 rounded border border-slate-200">
                              {task.category}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                              <Calendar size={10} /> Due{" "}
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                              <Users size={10} /> {task.assignedTo}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;
