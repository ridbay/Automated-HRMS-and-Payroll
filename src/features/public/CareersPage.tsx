import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { usePublicCareers, usePublicPosition, resolveCompanyLogoUrl } from "../../api/client";
import { applyThemeColor, DEFAULT_PRIMARY_COLOR } from "../../utils/themeColors";
import JobApplicationForm from "./JobApplicationForm";

interface Props {
  companyIdentifier: string;
  initialRequisitionId?: string | null;
}

// Standalone, unauthenticated page — no Sidebar/Header chrome, reachable at
// /careers/:companyIdentifier[/:requisitionId] via the minimal pre-auth path
// check in App.tsx. Navigation between the list and a single posting is
// handled with local state rather than further URL changes, since the app
// has no client-side router elsewhere to hook into.
const CareersPage: React.FC<Props> = ({ companyIdentifier, initialRequisitionId }) => {
  const [selectedId, setSelectedId] = useState<string | null>(initialRequisitionId || null);
  const [showApply, setShowApply] = useState(false);

  const { data: listData, isLoading: listLoading, error: listError } = usePublicCareers(companyIdentifier);
  const { data: detailData, isLoading: detailLoading } = usePublicPosition(companyIdentifier, selectedId);

  // Unauthenticated visitors never go through BrandingContext, so this page
  // applies the company's brand color itself. All bg-indigo-600/text-indigo-600
  // classes below already resolve to the CSS vars this sets (tailwind.config.js).
  useEffect(() => {
    applyThemeColor(listData?.company.primaryColor || DEFAULT_PRIMARY_COLOR, false);
    return () => {
      applyThemeColor(DEFAULT_PRIMARY_COLOR, false);
    };
  }, [listData?.company.primaryColor]);

  if (listLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (listError || !listData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-center p-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Careers page not found</h1>
          <p className="text-slate-500 font-medium">This company doesn't have a public careers page, or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  const { company, positions } = listData;
  const logoUrl = resolveCompanyLogoUrl(company.id, company.logoUrl);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-10 flex items-center gap-5">
          {logoUrl ? (
            <img src={logoUrl} alt={company.name} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Briefcase size={24} />
            </div>
          )}
          <div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Careers at</p>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">{company.name}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {selectedId && detailData ? (
          <div>
            <button
              onClick={() => setSelectedId(null)}
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 mb-8"
            >
              <ArrowLeft size={16} /> Back to all roles
            </button>

            {detailLoading ? (
              <Loader2 className="animate-spin text-indigo-600" size={32} />
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10">
                <h2 className="text-3xl font-black text-slate-800 mb-3">{detailData.position.title}</h2>
                <div className="flex flex-wrap gap-3 mb-8">
                  <span className="px-4 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1">
                    <Briefcase size={12} /> {detailData.position.department}
                  </span>
                  <span className="px-4 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1">
                    <MapPin size={12} /> {detailData.position.location}
                  </span>
                  {detailData.position.employmentType && (
                    <span className="px-4 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-black uppercase tracking-widest">
                      {detailData.position.employmentType}
                    </span>
                  )}
                </div>

                {detailData.position.description ? (
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line mb-8">{detailData.position.description}</p>
                ) : (
                  <p className="text-slate-400 italic mb-8">No description provided for this role yet.</p>
                )}

                {detailData.position.requirements && (
                  <>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Requirements</h3>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line mb-10">{detailData.position.requirements}</p>
                  </>
                )}

                <button
                  onClick={() => setShowApply(true)}
                  className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2"
                >
                  Apply for this role <ArrowRight size={16} />
                </button>
              </div>
            )}

            {showApply && detailData && (
              <JobApplicationForm
                companyIdentifier={companyIdentifier}
                position={detailData.position}
                onClose={() => setShowApply(false)}
              />
            )}
          </div>
        ) : (
          <>
            <h2 className="text-xl font-black text-slate-800 mb-8">
              {positions.length} Open Position{positions.length === 1 ? "" : "s"}
            </h2>
            {positions.length === 0 ? (
              <p className="text-slate-400 font-medium">No open positions right now — check back soon.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {positions.map((p) => (
                  <motion.button
                    key={p.id}
                    whileHover={{ y: -3 }}
                    onClick={() => setSelectedId(p.id)}
                    className="text-left bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-300 transition-all"
                  >
                    <h3 className="text-lg font-black text-slate-800 mb-2">{p.title}</h3>
                    <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                      <span className="flex items-center gap-1"><Briefcase size={12} /> {p.department}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} /> {p.location}</span>
                    </div>
                    <span className="text-indigo-600 text-xs font-black uppercase tracking-widest flex items-center gap-1">
                      View role <ArrowRight size={14} />
                    </span>
                  </motion.button>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default CareersPage;
