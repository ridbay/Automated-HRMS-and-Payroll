import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt,
  Landmark,
  FileText,
  Users2,
  CheckCircle2,
  Upload,
  Paperclip,
  Plus,
  Trash2,
  Check,
  ArrowRight,
  CreditCard,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useUpdateAdminEmployee } from "../../api/client";
import { usePopup } from "../../components/PopupProvider";
import Celebration from "../../components/Celebration";

const EmployeeOnboarding: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const updateMutation = useUpdateAdminEmployee();
  const { alert: popupAlert } = usePopup();

  const [step, setStep] = useState(1);
  const [celebrating, setCelebrating] = useState(false);
  const [formData, setFormData] = useState<any>({
    tin: user?.tin || "",
    pfa: user?.pfa || "",
    pensionId: user?.pensionId || "",
    bankName: user?.bankName || "",
    accountNumber: user?.accountNumber || "",
    accountName: user?.accountName || "",
    payoutMethod: "Bank Transfer (Standard)",
    emergencyContacts: user?.emergencyContacts || [{ name: "", relationship: "Spouse", phone: "", email: "", isPrimary: true }],
  });

  const handleSave = () => {
    if (!formData.bankName || !formData.accountNumber) {
      popupAlert("Please provide your Bank Name and Account Number to proceed.");
      return;
    }

    const payload = {
      ...formData,
      status: "active", 
    };

    updateMutation.mutate(
      { id: user!.id, data: payload },
      {
        onSuccess: (updatedUser) => {
          setCelebrating(true);
          popupAlert("Welcome aboard! Your profile is complete.");
          setTimeout(() => {
            // This is a profile update on the existing session, not a new login —
            // there's no fresh token to swap in. Patch the current user in place
            // (status: 'active' is what flips App.tsx out of the onboarding view).
            updateUser({ ...updatedUser, status: "active" });
          }, 3000);
        },
        onError: (err: any) => {
          popupAlert(err.message || "Failed to update profile.");
        },
      }
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Receipt size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-800">1. Tax & Statutory</h3>
            </div>
            <p className="text-slate-500 font-medium">Please provide your statutory details for payroll processing.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax ID Number (TIN)</label>
                <input
                  type="text"
                  value={formData.tin}
                  onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                  placeholder="TIN-XXXXXX"
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pension Fund Admin (PFA)</label>
                <select
                  value={formData.pfa || "Select PFA..."}
                  onChange={(e) => setFormData({ ...formData, pfa: e.target.value })}
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                >
                  <option>Select PFA...</option>
                  <option>Stanbic IBTC Pension</option>
                  <option>ARM Pension</option>
                  <option>Leadway Pensure</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pension ID (RSA PIN)</label>
                <input
                  type="text"
                  value={formData.pensionId}
                  onChange={(e) => setFormData({ ...formData, pensionId: e.target.value })}
                  placeholder="PEN-XXXXXX"
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold tracking-[0.2em]"
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Landmark size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-800">2. Bank Details</h3>
            </div>
            <p className="text-slate-500 font-medium">Where should we send your salary?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Name <span className="text-rose-500">*</span></label>
                  <select
                    value={formData.bankName || "Select Bank..."}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                  >
                    <option>Select Bank...</option>
                    <option>Standard Chartered</option>
                    <option>Chase Bank</option>
                    <option>Zenith Bank</option>
                    <option>HSBC</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Number <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="10 digits"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold tracking-[0.2em]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Name</label>
                  <input
                    type="text"
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    placeholder="Full name on account"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                  />
                </div>
              </div>
              <div className="p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                  <CreditCard size={150} />
                </div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-8">Payout Method Selection</p>
                <div className="space-y-4">
                  {["Bank Transfer (Standard)", "Automated Wallet (Instant)", "Cash / Cheque"].map((method, i) => (
                    <button
                      key={i}
                      onClick={() => setFormData({ ...formData, payoutMethod: method })}
                      className={`w-full p-6 rounded-2xl border-2 flex items-center justify-between transition-all ${formData.payoutMethod === method ? "border-indigo-500 bg-indigo-500/10" : "border-white/5 bg-white/5 hover:border-white/20"}`}
                    >
                      <span className="text-sm font-bold">{method}</span>
                      {formData.payoutMethod === method && <CheckCircle2 size={20} className="text-indigo-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <FileText size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-800">3. Document Upload</h3>
            </div>
            <p className="text-slate-500 font-medium">Upload your supporting documents.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { l: "Resume / CV", req: true },
                { l: "National ID / Passport", req: true },
              ].map((doc, i) => (
                <div key={i} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:border-indigo-400 transition-all flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-colors shadow-sm">
                      <Paperclip size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{doc.l}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{doc.req ? "Required" : "Optional"}</p>
                    </div>
                  </div>
                  <button className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <Upload size={16} className="text-slate-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Users2 size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-800">4. Emergency Contacts</h3>
              </div>
            </div>
            <p className="text-slate-500 font-medium">Who should we contact in an emergency?</p>
            <div className="space-y-6">
              <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                    <input
                      type="text"
                      value={formData.emergencyContacts[0]?.name || ""}
                      onChange={(e) => {
                        const ec = [...formData.emergencyContacts];
                        ec[0] = { ...ec[0], name: e.target.value };
                        setFormData({ ...formData, emergencyContacts: ec });
                      }}
                      className="w-full px-5 py-3 bg-white border border-slate-100 rounded-xl outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Relationship</label>
                    <select
                      value={formData.emergencyContacts[0]?.relationship || "Spouse"}
                      onChange={(e) => {
                        const ec = [...formData.emergencyContacts];
                        ec[0] = { ...ec[0], relationship: e.target.value };
                        setFormData({ ...formData, emergencyContacts: ec });
                      }}
                      className="w-full px-5 py-3 bg-white border border-slate-100 rounded-xl outline-none font-bold"
                    >
                      <option>Spouse</option>
                      <option>Parent</option>
                      <option>Sibling</option>
                      <option>Friend</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.emergencyContacts[0]?.phone || ""}
                      onChange={(e) => {
                        const ec = [...formData.emergencyContacts];
                        ec[0] = { ...ec[0], phone: e.target.value };
                        setFormData({ ...formData, emergencyContacts: ec });
                      }}
                      className="w-full px-5 py-3 bg-white border border-slate-100 rounded-xl outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                    <input
                      type="email"
                      value={formData.emergencyContacts[0]?.email || ""}
                      onChange={(e) => {
                        const ec = [...formData.emergencyContacts];
                        ec[0] = { ...ec[0], email: e.target.value };
                        setFormData({ ...formData, emergencyContacts: ec });
                      }}
                      className="w-full px-5 py-3 bg-white border border-slate-100 rounded-xl outline-none font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 relative">
      <Celebration active={celebrating} />
      
      {/* Absolute Header */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
           <div className="w-6 h-6 border-4 border-white rounded-full border-t-transparent animate-spin" />
        </div>
        <button 
          onClick={logout}
          className="px-6 py-3 bg-white rounded-xl shadow-sm text-slate-500 font-bold text-sm hover:text-rose-600 transition-colors flex items-center gap-2"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="bg-slate-900 p-12 text-white shrink-0">
          <h1 className="text-4xl font-black tracking-tighter mb-2">Welcome to ZenHR, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-slate-400 font-medium text-lg">Let's get your profile set up so you can access your portal.</p>
          
          <div className="mt-8 flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-1.5 transition-all duration-500 rounded-full ${step >= s ? "w-10 bg-indigo-500" : "w-2 bg-slate-700"}`} />
            ))}
          </div>
        </div>

        <div className="flex-1 p-12 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            className={`px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${step === 1 ? "opacity-30 pointer-events-none" : "hover:bg-slate-100"}`}
          >
            Go Back
          </button>
          
          <button
            onClick={() => {
              if (step < 4) setStep(step + 1);
              else handleSave();
            }}
            className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
          >
            {step === 4 ? "Complete Profile" : "Continue"} <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EmployeeOnboarding;
