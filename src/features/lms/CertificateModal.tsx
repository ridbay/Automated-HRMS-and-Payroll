import React from 'react';
import { X, Award, CheckCircle2, Printer, Download, ShieldCheck, Sparkles } from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: {
    recipientName: string;
    courseTitle: string;
    completedAt?: string | null;
    duration?: number | string;
    certificateId?: string;
    issuerName?: string;
  } | null;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ isOpen, onClose, certificate }) => {
  if (!isOpen || !certificate) return null;

  const dateFormatted = certificate.completedAt
    ? new Date(certificate.completedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const certId =
    certificate.certificateId ||
    `ZHR-${(certificate.courseTitle || 'CRS').substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8">
        {/* Floating Action Controls */}
        <div className="flex justify-between items-center mb-4 px-2 print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Sparkles size={13} /> Official ZenHR Credential
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white text-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-all shadow-md flex items-center gap-2"
            >
              <Printer size={15} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Certificate Paper */}
        <div
          id="zenhr-certificate"
          className="bg-white rounded-[2rem] p-10 md:p-14 shadow-2xl border-8 border-indigo-900/10 relative overflow-hidden text-center"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(248, 250, 252, 0.9) 0%, rgba(255, 255, 255, 1) 100%)',
          }}
        >
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-3 left-3 w-12 h-12 border-t-2 border-l-2 border-amber-500 rounded-tl-xl pointer-events-none" />
          <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-amber-500 rounded-tr-xl pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 border-amber-500 rounded-bl-xl pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-12 h-12 border-b-2 border-r-2 border-amber-500 rounded-br-xl pointer-events-none" />

          {/* Watermark Crest */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
            <Award size={480} />
          </div>

          {/* Header */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-700 to-indigo-900 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3 border border-indigo-400/30">
              <Award size={32} className="text-amber-300" />
            </div>
            <div className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-900 mb-1">
              ZenHR Learning & Talent Development
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 tracking-tight">
              Certificate of Completion
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mt-3" />
          </div>

          {/* Body */}
          <div className="space-y-4 my-8 relative z-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              This is proudly presented to
            </p>
            <div className="py-2">
              <span className="text-2xl md:text-3xl font-black text-indigo-950 border-b-2 border-slate-200 pb-1 px-8 inline-block">
                {certificate.recipientName}
              </span>
            </div>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              for successfully completing all curriculum requirements, knowledge checkpoints, and compliance standards for:
            </p>
            <div className="py-3 px-6 bg-indigo-50/70 border border-indigo-100/80 rounded-2xl max-w-xl mx-auto inline-block">
              <h2 className="text-lg md:text-xl font-black text-indigo-900">
                {certificate.courseTitle}
              </h2>
              {certificate.duration && (
                <p className="text-xs font-bold text-indigo-600 mt-0.5">
                  {certificate.duration} Minutes of Accredited Professional Training
                </p>
              )}
            </div>
          </div>

          {/* Footer & Signatures */}
          <div className="grid grid-cols-3 items-end pt-8 border-t border-slate-200 mt-8 relative z-10 text-left">
            <div>
              <div className="font-serif italic text-sm text-slate-800 pb-1 border-b border-slate-300">
                {certificate.issuerName || 'Sarah Jenkins, VP of People'}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                Authorized HR Executive
              </p>
            </div>

            {/* Seal */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-500 bg-amber-50/50 flex items-center justify-center p-1 text-amber-700">
                <div className="w-full h-full rounded-full border border-amber-400 flex flex-col items-center justify-center text-[8px] font-black uppercase text-center leading-tight">
                  <ShieldCheck size={16} className="text-amber-600 mb-0.5" />
                  VERIFIED
                </div>
              </div>
              <span className="text-[9px] font-mono text-slate-400 mt-1">{certId}</span>
            </div>

            <div className="text-right">
              <div className="font-bold text-sm text-slate-800 pb-1 border-b border-slate-300">
                {dateFormatted}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                Date of Issue
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
