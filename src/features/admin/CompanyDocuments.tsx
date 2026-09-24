import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  FileText,
  Paperclip,
  RefreshCw,
  X,
  Sparkles,
} from "lucide-react";
import { useCompanyDocuments, useCreateCompanyDocument, useDeleteCompanyDocument } from "../../api/companyDocument.client";
import { usePopup } from "../../components/PopupProvider";

const CompanyDocuments: React.FC = () => {
  const { data: documents = [], isLoading } = useCompanyDocuments();
  const createDocument = useCreateCompanyDocument();
  const deleteDocument = useDeleteCompanyDocument();
  const { confirm, alert: popupAlert } = usePopup();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setFile(null);
    setFormError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!content.trim() && !file) {
      setFormError("Add content or attach a file for the AI assistant to read.");
      return;
    }
    setFormError(null);
    createDocument.mutate(
      { title: title.trim(), content: content.trim(), file },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          resetForm();
        },
        onError: (err: any) => setFormError(err.message || "Failed to upload document."),
      }
    );
  };

  const handleDelete = async (id: string, docTitle: string) => {
    if (!(await confirm(`Delete "${docTitle}"? The AI assistant will no longer be able to answer from it.`, "Delete Document"))) return;
    deleteDocument.mutate(id, {
      onError: (err: any) => popupAlert(err.message || "Failed to delete document.", "Error"),
    });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen size={20} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Knowledge Base</h1>
          </div>
          <p className="text-slate-500 font-medium">
            Documents here are searchable by the AI Assistant — employees can ask about company policy and get answers sourced from what you upload.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> New Document
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-indigo-600" />
          <h2 className="text-lg font-black text-slate-800">Documents the AI Assistant Can Read</h2>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center text-indigo-400">
            <RefreshCw className="animate-spin" size={32} />
          </div>
        ) : documents.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <FileText size={48} className="mx-auto mb-4 opacity-40" />
            <p className="text-sm font-bold">No documents uploaded yet.</p>
            <p className="text-xs mt-1">Add your employee handbook, policies, or FAQs so the AI assistant can answer questions about them.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc: any) => (
              <div key={doc.id} className="py-5 flex items-start justify-between gap-4 group">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-800 truncate">{doc.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{doc.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>By {doc.uploadedByName || "Unknown"}</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      {doc.fileName && (
                        <span className="flex items-center gap-1">
                          <Paperclip size={10} /> {doc.fileName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id, doc.title)}
                  className="p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">New Document</h3>
              <button
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold">
                {formError}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Remote Work Policy"
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Attach document <span className="normal-case font-medium text-slate-400">— PDF, DOCX, TXT, etc.</span>
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full text-xs font-bold text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                />
                <p className="text-[10px] text-slate-400 font-medium mt-2">
                  The AI assistant automatically extracts and indexes the file's contents — no need to retype anything. New uploads can take a few minutes to become searchable.
                </p>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Content <span className="normal-case font-medium text-slate-400">— optional if you attached a file above</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  placeholder="Paste or type the policy text here, or skip this if you attached a file..."
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={createDocument.isPending}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Plus size={16} /> {createDocument.isPending ? "Uploading..." : "Add Document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDocuments;
