import React, { useState } from "react";
import { X, Upload, CheckCircle2, Loader2 } from "lucide-react";
import { JobRequisition } from "../../types/index";
import { useSubmitPublicApplication } from "../../api/client";

interface Props {
  companyIdentifier: string;
  position: JobRequisition;
  onClose: () => void;
}

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  location: "",
  currentTitle: "",
  currentEmployer: "",
  experienceYears: "",
  education: "",
  linkedinUrl: "",
  portfolioUrl: "",
  coverLetter: "",
};

const JobApplicationForm: React.FC<Props> = ({ companyIdentifier, position, onClose }) => {
  const [form, setForm] = useState(emptyForm);
  const [resume, setResume] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submit = useSubmitPublicApplication();

  const handleChange = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setError(null);

    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => v && formData.append(k, String(v)));
    if (resume) formData.append("resume", resume);

    submit.mutate(
      { companyIdentifier, requisitionId: position.id, formData },
      { onError: (err: any) => setError(err.message || "Failed to submit your application.") }
    );
  };

  if (submit.isSuccess) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-6">
        <div className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-2xl">
          <CheckCircle2 size={56} className="mx-auto text-emerald-500 mb-6" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">Application Received</h2>
          <p className="text-slate-500 font-medium mb-8">
            Thanks for applying to {position.title}. We'll be in touch if there's a match.
          </p>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-10 shadow-2xl">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-800">Apply for {position.title}</h2>
            <p className="text-sm text-slate-500 font-medium">{position.department} · {position.location}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && <p className="text-sm font-bold text-rose-500">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <input
              required
              placeholder="Full name *"
              value={form.name}
              onChange={handleChange("name")}
              className="px-4 py-3 bg-slate-50 rounded-xl outline-none font-medium text-sm border border-transparent focus:border-indigo-400"
            />
            <input
              required
              type="email"
              placeholder="Email *"
              value={form.email}
              onChange={handleChange("email")}
              className="px-4 py-3 bg-slate-50 rounded-xl outline-none font-medium text-sm border border-transparent focus:border-indigo-400"
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange("phone")}
              className="px-4 py-3 bg-slate-50 rounded-xl outline-none font-medium text-sm border border-transparent focus:border-indigo-400"
            />
            <input
              placeholder="Location"
              value={form.location}
              onChange={handleChange("location")}
              className="px-4 py-3 bg-slate-50 rounded-xl outline-none font-medium text-sm border border-transparent focus:border-indigo-400"
            />
            <input
              placeholder="Current title"
              value={form.currentTitle}
              onChange={handleChange("currentTitle")}
              className="px-4 py-3 bg-slate-50 rounded-xl outline-none font-medium text-sm border border-transparent focus:border-indigo-400"
            />
            <input
              placeholder="Current employer"
              value={form.currentEmployer}
              onChange={handleChange("currentEmployer")}
              className="px-4 py-3 bg-slate-50 rounded-xl outline-none font-medium text-sm border border-transparent focus:border-indigo-400"
            />
            <input
              type="number"
              min="0"
              placeholder="Years of experience"
              value={form.experienceYears}
              onChange={handleChange("experienceYears")}
              className="px-4 py-3 bg-slate-50 rounded-xl outline-none font-medium text-sm border border-transparent focus:border-indigo-400"
            />
            <input
              placeholder="Education"
              value={form.education}
              onChange={handleChange("education")}
              className="px-4 py-3 bg-slate-50 rounded-xl outline-none font-medium text-sm border border-transparent focus:border-indigo-400"
            />
            <input
              placeholder="LinkedIn URL"
              value={form.linkedinUrl}
              onChange={handleChange("linkedinUrl")}
              className="px-4 py-3 bg-slate-50 rounded-xl outline-none font-medium text-sm border border-transparent focus:border-indigo-400"
            />
            <input
              placeholder="Portfolio / GitHub URL"
              value={form.portfolioUrl}
              onChange={handleChange("portfolioUrl")}
              className="px-4 py-3 bg-slate-50 rounded-xl outline-none font-medium text-sm border border-transparent focus:border-indigo-400"
            />
          </div>

          <textarea
            placeholder="Cover letter (optional)"
            value={form.coverLetter}
            onChange={handleChange("coverLetter")}
            rows={4}
            className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none font-medium text-sm border border-transparent focus:border-indigo-400 resize-none"
          />

          <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 cursor-pointer hover:border-indigo-300">
            <Upload size={18} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-600">
              {resume ? resume.name : "Attach resume (PDF, optional)"}
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => setResume(e.target.files?.[0] || null)}
            />
          </label>

          <button
            type="submit"
            disabled={submit.isPending}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submit.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
            {submit.isPending ? "Submitting…" : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JobApplicationForm;
