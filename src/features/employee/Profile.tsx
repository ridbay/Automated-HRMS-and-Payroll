import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Briefcase,
  FileText,
  Landmark,
  Shield,
  Users,
  Camera,
  Edit2,
  Lock,
  AlertCircle,
  Upload,
  CheckCircle2,
  X,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Globe,
  CreditCard,
  FileCheck,
  Download,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Heart,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { 
  useMyProfile, 
  useUpdateMyProfile, 
  useAddEmergencyContact, 
  useDeleteEmergencyContact,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
  getDocumentDownloadUrl
} from "../../api/client";

const ProfileField = ({
  label,
  value,
  editable = false,
  restricted = false,
  onEdit,
  fullWidth = false,
}: any) => (
  <div
    className={`p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group ${fullWidth ? "col-span-2" : ""}`}
  >
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
      {label}
    </p>
    <p className="text-sm font-bold text-slate-800 break-words">
      {value || "Not set"}
    </p>

    {editable && (
      <button
        onClick={onEdit}
        className="absolute top-4 right-4 p-2 bg-white rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:text-indigo-600"
      >
        <Edit2 size={14} />
      </button>
    )}

    {restricted && (
      <div className="absolute top-4 right-4 text-slate-300">
        <Lock size={14} />
      </div>
    )}
  </div>
);

const SectionTitle = ({ icon: Icon, title, subtitle }: any) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
      <Icon size={20} />
    </div>
    <div>
      <h3 className="text-lg font-black text-slate-800">{title}</h3>
      {subtitle && (
        <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
      )}
    </div>
  </div>
);

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState("personal");
  const [editMode, setEditMode] = useState(false);
  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false);
  const [changeRequestField, setChangeRequestField] = useState("");
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', relationship: '', phone: '' });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadDocMutation = useUploadDocumentMutation();
  const deleteDocMutation = useDeleteDocumentMutation();

  const handleDocumentSubmit = () => {
    if (uploadFile && uploadName) {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("name", uploadName);
      formData.append("type", uploadFile.type.includes("pdf") ? "PDF" : "Image");
      
      uploadDocMutation.mutate(formData, {
        onSuccess: () => {
          setShowUploadModal(false);
          setUploadName("");
          setUploadFile(null);
        }
      });
    }
  };

  const { data: me, isLoading } = useMyProfile();
  const updateProfileMutation = useUpdateMyProfile();
  const addEmergencyContact = useAddEmergencyContact();
  const deleteEmergencyContact = useDeleteEmergencyContact();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500 font-bold">Profile not found.</p>
      </div>
    );
  }

  const tabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "employment", label: "Employment", icon: Briefcase },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "bank", label: "Bank Details", icon: Landmark },
    { id: "tax", label: "Tax & Statutory", icon: Shield },
    { id: "dependents", label: "Dependents", icon: Users },
  ];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfileMutation.mutate({ avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Profile Header */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-16 -mt-16" />
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative group">
            <img
              src={me.avatar || 'https://via.placeholder.com/150'}
              className="w-32 h-32 rounded-[2.5rem] object-cover ring-4 ring-white shadow-2xl"
              alt="Profile"
            />
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarChange} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-3 bg-indigo-600 text-white rounded-2xl shadow-lg opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
            >
              <Camera size={18} />
            </button>
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">
                  {me.name}
                </h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    ID: {me.id}
                  </span>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {me.role} • {me.department}
                  </span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    Employed Since {me.hireDate}
                  </span>
                </div>
              </div>
              <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">
                Review Public Profile
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 w-full max-w-2xl">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="p-2 bg-white rounded-lg text-slate-400">
                  <Mail size={16} />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    Work Email
                  </p>
                  <p className="text-xs font-bold text-slate-700">{me.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="p-2 bg-white rounded-lg text-slate-400">
                  <Phone size={16} />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    Work Phone
                  </p>
                  <p className="text-xs font-bold text-slate-700">
                    +1 (555) 012-3456
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="flex bg-white p-2 rounded-[2rem] border border-slate-200 shadow-sm overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === "personal" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Basic Info */}
                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:border-indigo-200 transition-colors">
                  <div className="flex justify-between items-center mb-6">
                    <SectionTitle
                      icon={User}
                      title="Basic Information"
                      subtitle="Official identification details"
                    />
                    <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 flex items-center gap-2 text-[10px] font-black uppercase">
                      <AlertCircle size={14} /> Changes Require Approval
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ProfileField
                      label="Full Name"
                      value={me.name}
                      restricted
                      onEdit={() => {
                        setChangeRequestField("Full Name");
                        setShowChangeRequestModal(true);
                      }}
                      editable
                    />
                    <ProfileField
                      label="Date of Birth"
                      value={me.dob}
                      restricted
                    />
                    <ProfileField label="Gender" value={me.gender} restricted />
                    <ProfileField
                      label="Nationality"
                      value={me.nationality}
                      restricted
                    />
                    <ProfileField
                      label="Marital Status"
                      value="Married"
                      editable
                    />
                    <ProfileField
                      label="National ID (SSN)"
                      value="***-**-9812"
                      restricted
                    />
                  </div>
                </section>

                {/* Contact Info */}
                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <SectionTitle
                      icon={Phone}
                      title="Contact Details"
                      subtitle="Private contact information"
                    />
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    >
                      {editMode ? <X size={18} /> : <Edit2 size={18} />}
                    </button>
                  </div>
                  {editMode ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        updateProfileMutation.mutate({
                          email: fd.get("email") as string,
                          phone: fd.get("phone") as string,
                          location: fd.get("location") as string,
                        });
                        setEditMode(false);
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase">
                            Personal Email
                          </label>
                          <input
                            name="email"
                            defaultValue={me.email || ""}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase">
                            Personal Phone
                          </label>
                          <input
                            name="phone"
                            defaultValue={me.phone || ""}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">
                          Home Address
                        </label>
                        <input
                          name="location"
                          defaultValue={me.location || ""}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none"
                        />
                      </div>
                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ProfileField label="Personal Email" value={me.email} />
                      <ProfileField label="Personal Phone" value={me.phone} />
                      <ProfileField
                        label="Home Address"
                        value={me.location}
                        fullWidth
                      />
                    </div>
                  )}
                </section>

                {/* Emergency Contacts */}
                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <SectionTitle
                      icon={AlertCircle}
                      title="Emergency Contacts"
                      subtitle="Who to call in case of emergency"
                    />
                    <button 
                      onClick={() => setShowEmergencyModal(true)}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-100 transition-colors flex items-center gap-2"
                    >
                      <Plus size={14} /> Add Contact
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(!me.emergencyContacts || me.emergencyContacts.length === 0) && (
                      <p className="text-xs text-slate-400 font-bold p-4 bg-slate-50 rounded-2xl text-center">No emergency contacts set.</p>
                    )}
                    {me.emergencyContacts?.map((contact: any) => (
                      <div key={contact.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center">
                            <Heart size={20} fill="currentColor" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">
                              {contact.name}
                            </p>
                            <p className="text-xs font-bold text-slate-400 uppercase">
                              {contact.relationship} • {contact.phone}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteEmergencyContact.mutate(contact.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === "employment" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <SectionTitle
                    icon={Briefcase}
                    title="Job Details"
                    subtitle="Current role and placement"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ProfileField
                      label="Employee ID"
                      value={me.id}
                      restricted
                    />
                    <ProfileField
                      label="Date of Hire"
                      value={me.hireDate}
                      restricted
                    />
                    <ProfileField
                      label="Employment Type"
                      value="Full-Time Permanent"
                      restricted
                    />
                    <ProfileField
                      label="Probation Status"
                      value="Completed"
                      restricted
                    />
                    <ProfileField
                      label="Department"
                      value={me.department}
                      restricted
                    />
                    <ProfileField
                      label="Designation"
                      value={me.role}
                      restricted
                    />
                    <ProfileField
                      label="Work Location"
                      value={me.location}
                      restricted
                    />
                    <ProfileField
                      label="Work Schedule"
                      value="Mon-Fri, 9:00 AM - 5:00 PM"
                      restricted
                    />
                  </div>
                </section>

                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <SectionTitle
                    icon={Users}
                    title="Reporting Manager"
                    subtitle="Direct functional report"
                  />
                  <div className="flex items-center gap-6 p-6 bg-indigo-50/50 border border-indigo-100 rounded-3xl">
                    <img
                      src="https://i.pravatar.cc/150?u=manager_lead"
                      className="w-16 h-16 rounded-2xl object-cover"
                    />
                    <div>
                      <p className="text-lg font-black text-slate-800">
                        Marcus Head
                      </p>
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                        VP of Engineering
                      </p>
                      <div className="flex gap-4 mt-2 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1">
                          <Mail size={12} /> marcus.h@zenhr.com
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> New York HQ
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === "documents" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <SectionTitle
                      icon={FileText}
                      title="My Documents"
                      subtitle="Digital filing cabinet"
                    />
                    <button 
                      onClick={() => setShowUploadModal(true)}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                    >
                      <Upload size={16} /> Upload New
                    </button>
                  </div>
                  
                  {me?.employeeDocuments?.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-100">
                      <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                      <p className="text-slate-500 font-medium">No documents uploaded yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {me?.employeeDocuments?.map((doc: any) => (
                        <div
                          key={doc.id}
                          className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all group relative overflow-hidden"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                              <FileText size={24} />
                            </div>
                            <span
                              className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-slate-200 text-slate-500`}
                            >
                              {doc.status}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-800 mb-1">
                            {doc.name}
                          </h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            {doc.type} • {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                          <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => {
                                if(confirm('Are you sure you want to delete this document?')) {
                                  deleteDocMutation.mutate(doc.id);
                                }
                              }}
                              className="p-2 bg-red-100 text-red-600 rounded-xl shadow-lg hover:bg-red-600 hover:text-white transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                            <a 
                              href={getDocumentDownloadUrl(doc.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-slate-900 text-white rounded-xl shadow-lg hover:scale-110 transition-all inline-block"
                            >
                              <Download size={16} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </motion.div>
            )}

            {activeTab === "bank" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <SectionTitle
                    icon={Landmark}
                    title="Bank Accounts"
                    subtitle="Payroll destinations"
                  />
                  <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden mb-8">
                    <div className="absolute top-0 right-0 p-8 text-white/5">
                      <Landmark size={120} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-8">
                        <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest">
                          Primary Salary Account
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Bank Name
                          </p>
                          <p className="text-lg font-black tracking-tight">
                            {me.bankName || "Not configured"}
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                        Account Number
                      </p>
                      <div className="flex items-center gap-4 text-3xl font-mono tracking-widest mb-8">
                        <span>
                          {me.accountNumber
                            ? me.accountNumber.substring(0, 4)
                            : "****"}
                        </span>
                        <span>****</span>
                        <span>
                          {me.accountNumber
                            ? me.accountNumber.slice(-4)
                            : "****"}
                        </span>
                        <button className="ml-2 p-2 text-slate-500 hover:text-white transition-colors">
                          <EyeOff size={18} />
                        </button>
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            setChangeRequestField("Bank Details");
                            setShowChangeRequestModal(true);
                          }}
                          className="px-6 py-3 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-colors"
                        >
                          Request Change
                        </button>
                      </div>
                    </div>
                  </div>
                  <button className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-black uppercase text-xs tracking-widest hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                    <Plus size={18} /> Add Secondary Account
                  </button>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-8">
          {/* Security Card */}
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
            <ShieldCheck className="absolute -bottom-6 -right-6 text-white/5 w-48 h-48" />
            <div className="relative z-10">
              <h3 className="text-lg font-black mb-6">Security Center</h3>
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                      <CheckCircle2 size={16} />
                    </div>
                    <span className="text-xs font-bold">Two-Factor Auth</span>
                  </div>
                  <div className="w-8 h-4 bg-emerald-500 rounded-full flex items-center px-1 justify-end">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                      <AlertCircle size={16} />
                    </div>
                    <span className="text-xs font-bold">Password Age</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    Changed 3mo ago
                  </span>
                </div>
              </div>
              <button className="w-full py-4 bg-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-500 transition-colors">
                Change Password
              </button>
            </div>
          </div>

          {/* Profile Completion */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">
              Profile Completion
            </h3>
            <div className="relative pt-2 mb-4">
              <div className="flex items-center justify-between mb-2 text-xs font-bold">
                <span className="text-indigo-600">85% Complete</span>
                <span className="text-slate-400">Excellent</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full w-[85%] bg-indigo-600 rounded-full" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100 cursor-pointer hover:bg-rose-100 transition-colors">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-xs font-bold text-rose-700">
                  Add Emergency Contact
                </span>
                <ChevronRight size={14} className="ml-auto text-rose-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Change Modal */}
      <AnimatePresence>
        {showChangeRequestModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChangeRequestModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
                <h3 className="text-xl font-black">Request Change</h3>
                <button
                  onClick={() => setShowChangeRequestModal(false)}
                  className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Field
                  </label>
                  <input
                    type="text"
                    value={changeRequestField}
                    disabled
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold text-slate-500 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    New Value
                  </label>
                  <input
                    type="text"
                    placeholder="Enter new value..."
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-800 border-none outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Reason for Change
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Why is this change necessary?"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-medium text-slate-600 border-none outline-none focus:ring-4 focus:ring-indigo-100 resize-none"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowChangeRequestModal(false)}
                    className="flex-1 py-4 bg-slate-50 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowChangeRequestModal(false)}
                    className="flex-1 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-indigo-700"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Emergency Contact Modal */}
      <AnimatePresence>
        {showEmergencyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEmergencyModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-rose-500 text-white flex justify-between items-center">
                <h3 className="text-xl font-black flex items-center gap-2"><Heart size={20} fill="currentColor" /> Add Contact</h3>
                <button
                  onClick={() => setShowEmergencyModal(false)}
                  className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                    placeholder="E.g. Jane Doe"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-800 border-none outline-none focus:ring-4 focus:ring-rose-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={newContact.relationship}
                    onChange={(e) => setNewContact({...newContact, relationship: e.target.value})}
                    placeholder="E.g. Spouse, Parent"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-800 border-none outline-none focus:ring-4 focus:ring-rose-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                    placeholder="E.g. +1 (555) 000-0000"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-800 border-none outline-none focus:ring-4 focus:ring-rose-100"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowEmergencyModal(false)}
                    className="flex-1 py-4 bg-slate-50 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      addEmergencyContact.mutate(newContact, {
                        onSuccess: () => {
                          setShowEmergencyModal(false);
                          setNewContact({ name: '', relationship: '', phone: '' });
                        }
                      });
                    }}
                    className="flex-1 py-4 bg-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-rose-600"
                  >
                    Save Contact
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Upload className="text-indigo-600" /> Upload Document
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Document Type / Name
                  </label>
                  <select
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                  >
                    <option value="" disabled>Select Document Type</option>
                    <option value="Passport Copy">Passport Copy</option>
                    <option value="National ID">National ID</option>
                    <option value="Employment Contract">Employment Contract</option>
                    <option value="NDA Agreement">NDA Agreement</option>
                    <option value="University Degree">University Degree</option>
                    <option value="Certifications">Certifications</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    File Attachment
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 transition-all"
                  />
                </div>
                <button
                  onClick={handleDocumentSubmit}
                  disabled={!uploadName || !uploadFile || uploadDocMutation.isPending}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadDocMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {uploadDocMutation.isPending ? "Uploading..." : "Submit Document"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
