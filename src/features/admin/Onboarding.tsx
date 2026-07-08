import React, { useState, useMemo } from "react";
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
import { MOCK_WORKFLOWS, Workflow } from "../../data/mocks";
import { useNavigation } from "../../context/NavigationContext";
import { useEmployees } from "../../api/client";
import { Loader2 } from "lucide-react";

const Onboarding: React.FC = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"Onboarding" | "Offboarding">(
    "Onboarding",
  );
  
  const { setActiveTab: setMainTab } = useNavigation();
  const { data: employees, isLoading: isEmployeesLoading } = useEmployees();
  const [isOffboardingWizardOpen, setIsOffboardingWizardOpen] = useState(false);
  const [offboardingStep, setOffboardingStep] = useState(1);
  const [offboardingData, setOffboardingData] = useState<any>({});

  const handleStartNew = () => {
    if (activeTab === "Onboarding") {
      sessionStorage.setItem("triggerOnboardingWizard", "true");
      setMainTab("workforce");
    } else {
      setIsOffboardingWizardOpen(true);
      setOffboardingStep(1);
    }
  };

  const workflows: Workflow[] = useMemo(() => {
    if (!employees) return [];
    
    return employees
      .filter((emp) => 
        (activeTab === "Onboarding" && (emp.status === "onboarding" || emp.status === "active")) ||
        (activeTab === "Offboarding" && (emp.status === "terminated" || emp.status === "notice"))
      )
      .map((emp) => ({
        id: `wf-${emp.id}`,
        type: activeTab,
        employeeId: emp.id,
        employeeName: `${emp.name} ${emp.lastName}`,
        stage: activeTab === "Onboarding" ? "Orientation" : "Exit Interview",
        startDate: emp.dob || new Date().toISOString(),
        progress: activeTab === "Onboarding" ? 25 : 50,
        status: "Active",
        tasks: [
          {
            id: `task-1-${emp.id}`,
            title: activeTab === "Onboarding" ? "Sign Offer Letter" : "Exit Interview",
            status: "completed",
            category: "HR",
            assignedTo: emp.name,
            dueDate: new Date().toISOString(),
          },
          {
            id: `task-2-${emp.id}`,
            title: activeTab === "Onboarding" ? "IT Setup" : "Revoke IT Access",
            status: "pending",
            category: "IT",
            assignedTo: "IT Dept",
            dueDate: new Date(Date.now() + 86400000).toISOString(),
          }
        ]
      }));
  }, [employees, activeTab]);

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
        <button 
          onClick={handleStartNew}
          className="bg-indigo-600 p-6 rounded-[2.5rem] shadow-xl shadow-indigo-200 flex flex-col justify-center items-center text-white hover:scale-[1.02] transition-transform group"
        >
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
          const employee = employees?.find(
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

      {/* Offboarding Wizard Modal */}
      <AnimatePresence>
        {isOffboardingWizardOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsOffboardingWizardOpen(false);
                setOffboardingStep(1);
              }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="bg-slate-900 p-10 text-white flex justify-between items-start shrink-0">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <UserMinus size={28} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter">
                      Initiate Offboarding
                    </h2>
                    <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">
                      Step {offboardingStep} of 4 • Employee Departure
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className={`h-1.5 transition-all duration-500 rounded-full ${offboardingStep >= s ? "w-10 bg-rose-500" : "w-2 bg-slate-700"}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={offboardingStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    {offboardingStep === 1 && (
                      <div className="space-y-8 max-w-2xl mx-auto">
                        <h3 className="text-2xl font-black text-slate-800">Select Employee</h3>
                        <p className="text-slate-500 font-medium">Choose an active employee to initiate the offboarding journey.</p>
                        <div className="space-y-4">
                          {isEmployeesLoading ? (
                            <div className="flex items-center justify-center py-10">
                              <Loader2 className="animate-spin text-rose-500" size={32} />
                            </div>
                          ) : (
                            employees?.filter((e) => e.status === "active").map((emp) => (
                              <div key={emp.id} 
                                onClick={() => setOffboardingData({ ...offboardingData, employeeId: emp.id })}
                                className={`p-6 rounded-2xl border-2 flex items-center gap-6 cursor-pointer transition-all ${offboardingData.employeeId === emp.id ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                <img src={emp.avatar || `https://ui-avatars.com/api/?name=${emp.name}`} className="w-12 h-12 rounded-full" />
                                <div>
                                  <h4 className="font-bold text-slate-800">{emp.name} {emp.lastName}</h4>
                                  <p className="text-xs font-medium text-slate-500">{emp.role || 'Employee'}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                    {offboardingStep === 2 && (
                      <div className="space-y-8 max-w-2xl mx-auto">
                        <h3 className="text-2xl font-black text-slate-800">Exit Details</h3>
                        <div className="space-y-6">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Reason for Leaving</label>
                            <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-rose-500">
                              <option>Resignation</option>
                              <option>Termination</option>
                              <option>Contract Ended</option>
                              <option>Retirement</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Last Working Day</label>
                            <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-rose-500" />
                          </div>
                          <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl bg-white cursor-pointer hover:bg-slate-50">
                            <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500" />
                            <span className="font-bold text-sm text-slate-700">Schedule Exit Interview</span>
                          </label>
                        </div>
                      </div>
                    )}
                    {offboardingStep === 3 && (
                      <div className="space-y-8 max-w-2xl mx-auto">
                        <h3 className="text-2xl font-black text-slate-800">Handover & Assets</h3>
                        <div className="space-y-6">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Handover Responsibilities To</label>
                            <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-rose-500">
                              <option value="">Select Employee...</option>
                              {employees?.map((e) => <option key={e.id}>{e.name} {e.lastName}</option>)}
                            </select>
                          </div>
                          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                            <h4 className="text-sm font-black text-slate-800">Device Return Checklist</h4>
                            {['MacBook Pro', 'Office Keys', 'ID Card', 'Corporate Credit Card'].map((item) => (
                              <label key={item} className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500" />
                                <span className="font-medium text-slate-700 text-sm">{item}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {offboardingStep === 4 && (
                      <div className="space-y-8 max-w-2xl mx-auto text-center">
                        <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-100">
                          <UserMinus size={48} />
                        </div>
                        <h3 className="text-3xl font-black text-slate-800">Confirm Offboarding</h3>
                        <p className="text-slate-500 font-medium leading-relaxed">You are about to initiate the offboarding process. This will generate the necessary tasks and notify relevant departments.</p>
                        <div className="bg-slate-50 p-8 rounded-3xl text-left border border-slate-200 mt-8">
                          <p className="text-sm font-black text-slate-800 mb-4 uppercase tracking-widest">Next Steps Automated:</p>
                          <ul className="text-sm text-slate-600 space-y-4">
                            <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-500"/> Revoke IT access on Last Working Day</li>
                            <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-500"/> Notify payroll for final settlement calculation</li>
                            <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-500"/> Schedule exit interview</li>
                            <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-500"/> Send asset recovery instructions</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
                <button
                  onClick={() => setOffboardingStep((prev) => Math.max(1, prev - 1))}
                  className={`px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${offboardingStep === 1 ? "opacity-30 pointer-events-none" : "hover:bg-slate-50"}`}
                >
                  Go Back
                </button>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      if (offboardingStep < 4) setOffboardingStep((prev) => prev + 1);
                      else {
                        setIsOffboardingWizardOpen(false);
                        setOffboardingStep(1);
                      }
                    }}
                    className={`px-10 py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 ${!offboardingData.employeeId && offboardingStep === 1 ? 'bg-slate-300 pointer-events-none' : 'bg-rose-600 shadow-rose-200 hover:scale-105'}`}
                  >
                    {offboardingStep === 4 ? "Confirm Offboarding" : "Continue"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;
