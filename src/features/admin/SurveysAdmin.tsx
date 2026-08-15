import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Plus,
  Trash2,
  PieChart,
  Target,
  RefreshCw,
  Users
} from "lucide-react";
import { useAdminSurveys, useDeleteSurvey } from "../../api/survey.client";
import { SurveyModal } from "./SurveyModal";

const SurveysAdmin: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: surveys = [], isLoading } = useAdminSurveys();
  const deleteSurvey = useDeleteSurvey();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-700";
      case "closed":
        return "bg-slate-100 text-slate-500";
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
            Pulse Surveys
          </h1>
          <p className="text-slate-500 font-medium">
            Manage employee engagement surveys and eNPS campaigns.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> New Survey
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="text-indigo-600" />
          <h2 className="text-lg font-black text-slate-800">All Surveys</h2>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center text-indigo-400">
            <RefreshCw className="animate-spin" size={32} />
          </div>
        ) : surveys.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <PieChart size={48} className="mx-auto mb-4 opacity-40" />
            <p className="text-sm font-bold">No surveys created yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.map((survey: any) => (
              <motion.div
                whileHover={{ y: -4 }}
                key={survey.id}
                className="p-6 rounded-[2rem] border border-slate-200 bg-slate-50 group hover:shadow-lg transition-all relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${getStatusColor(survey.status)}`}>
                    {survey.status}
                  </div>
                  <button 
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this survey?")) {
                        deleteSurvey.mutate(survey.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <h3 className="text-xl font-black text-slate-800 mb-2">{survey.title}</h3>
                {survey.description && (
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{survey.description}</p>
                )}

                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                  <div className="flex items-center gap-1">
                    <Target size={14} />
                    {survey.type}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    {survey.targetAudience === 'all' ? 'Everyone' : 'Specific'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <SurveyModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default SurveysAdmin;
