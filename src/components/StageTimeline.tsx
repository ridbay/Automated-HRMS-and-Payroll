import React from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export interface CycleStage {
  id: string;
  key: string;
  name: string;
  order: number;
  startDate?: string | null;
  dueDate?: string | null;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

type StageStatus = "done" | "current" | "upcoming" | "unscheduled";

const statusOf = (stage: CycleStage): StageStatus => {
  if (!stage.startDate && !stage.dueDate) return "unscheduled";
  const today = todayStr();
  if (stage.dueDate && today > stage.dueDate) return "done";
  if ((!stage.startDate || today >= stage.startDate) && (!stage.dueDate || today <= stage.dueDate)) return "current";
  return "upcoming";
};

const daysBetween = (a: string, b: string) => {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
};

// A short, plain-language "what's happening / what's next" line computed
// entirely client-side from the cycle's stage dates — no email or push
// notifications are sent; this is the in-app equivalent.
export const getDeadlineMessage = (stages: CycleStage[]): string | null => {
  const sorted = [...stages].sort((a, b) => a.order - b.order);
  const today = todayStr();

  const current = sorted.find((s) => statusOf(s) === "current" && s.dueDate);
  if (current) {
    const days = daysBetween(today, current.dueDate!);
    if (days === 0) return `${current.name} closes today.`;
    if (days > 0) return `${current.name} closes in ${days} day${days === 1 ? "" : "s"} (${current.dueDate}).`;
  }

  const next = sorted.find((s) => s.startDate && s.startDate > today);
  if (next) {
    const days = daysBetween(today, next.startDate!);
    return `${next.name} opens in ${days} day${days === 1 ? "" : "s"} (${next.startDate}).`;
  }

  return null;
};

export const DeadlineBanner: React.FC<{ stages?: CycleStage[]; cycleName?: string }> = ({ stages, cycleName }) => {
  if (!stages || stages.length === 0) return null;
  const message = getDeadlineMessage(stages);
  if (!message) return null;

  return (
    <div className="flex items-center gap-3 px-6 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700">
      <Clock size={18} className="shrink-0" />
      <p className="text-xs font-bold">
        {cycleName && <span className="text-indigo-500 uppercase tracking-widest mr-2">{cycleName}</span>}
        {message}
      </p>
    </div>
  );
};

export const StageTimeline: React.FC<{ stages?: CycleStage[] }> = ({ stages }) => {
  if (!stages || stages.length === 0) return null;
  const sorted = [...stages].sort((a, b) => a.order - b.order);

  return (
    <div className="flex items-start gap-1 overflow-x-auto scrollbar-hide pb-2">
      {sorted.map((stage, idx) => {
        const status = statusOf(stage);
        return (
          <div key={stage.id} className={`flex items-center ${idx < sorted.length - 1 ? "flex-1 min-w-[120px]" : ""}`}>
            <div className="flex flex-col items-center text-center w-[110px] shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${status === "done"
                  ? "bg-emerald-500 text-white"
                  : status === "current"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : status === "upcoming"
                      ? "bg-slate-100 text-slate-400"
                      : "bg-slate-50 text-slate-300"
                  }`}
              >
                {status === "done" ? <CheckCircle2 size={16} /> : <Circle size={14} fill="currentColor" />}
              </div>
              <p className={`text-[9px] font-black uppercase tracking-widest leading-tight ${status === "current" ? "text-indigo-600" : "text-slate-500"}`}>
                {stage.name}
              </p>
              <p className="text-[9px] text-slate-400 font-bold mt-1">
                {stage.startDate || stage.dueDate ? `${stage.startDate || "—"} → ${stage.dueDate || "—"}` : "Not scheduled"}
              </p>
            </div>
            {idx < sorted.length - 1 && (
              <div className={`flex-1 h-0.5 mt-4 ${status === "done" ? "bg-emerald-300" : "bg-slate-100"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StageTimeline;
