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
  
  const [showSecondaryBankModal, setShowSecondaryBankModal] = useState(false);
  const [secondaryBankDetails, setSecondaryBankDetails] = useState({
    secondaryBankName: "",
    secondaryAccountName: "",
    secondaryAccountNumber: "",
  });

  const [showStatutoryModal, setShowStatutoryModal] = useState(false);
  const [statutoryDetails, setStatutoryDetails] = useState({
    tin: "",
    pfa: "",
    pensionId: "",
    nin: "",
    nhf: "",
    taxState: "",
  });
  
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

  const handleOpenSecondaryBank = () => {
    setSecondaryBankDetails({
      secondaryBankName: me?.secondaryBankName || "",
      secondaryAccountName: me?.secondaryAccountName || "",
      secondaryAccountNumber: me?.secondaryAccountNumber || "",
    });
    setShowSecondaryBankModal(true);
  };

  const handleSaveSecondaryBank = () => {
    updateProfileMutation.mutate(secondaryBankDetails, {
      onSuccess: () => setShowSecondaryBankModal(false)
    });
  };

  const handleOpenStatutory = () => {
    setStatutoryDetails({
      tin: me?.tin || "",
      pfa: me?.pfa || "",
      pensionId: me?.pensionId || "",
      nin: me?.nin || "",
      nhf: me?.nhf || "",
      taxState: me?.taxState || "",
    });
    setShowStatutoryModal(true);
  };

  const handleSaveStatutory = () => {
    updateProfileMutation.mutate(statutoryDetails, {
      onSuccess: () => setShowStatutoryModal(false)
    });
  };

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

  // Calculate Profile Completion
  const completionItems = [
    { key: "avatar", label: "Upload Profile Picture", isComplete: !!me?.avatar, action: () => fileInputRef.current?.click() },
    { key: "phone", label: "Add Personal Phone", isComplete: !!me?.phone, action: () => setActiveTab("personal") },
    { key: "location", label: "Add Home Address", isComplete: !!me?.location, action: () => setActiveTab("personal") },
    { key: "emergency", label: "Add Emergency Contact", isComplete: me?.emergencyContacts?.length > 0, action: () => { setActiveTab("dependents"); setShowEmergencyModal(true); } },
    { key: "bank", label: "Add Primary Bank", isComplete: !!me?.accountNumber, action: () => setActiveTab("bank") },
    { key: "statutory", label: "Complete Statutory Info", isComplete: !!(me?.nin && me?.tin && me?.pensionId), action: () => { setActiveTab("tax"); setShowStatutoryModal(true); } },
  ];

  const completedCount = completionItems.filter(item => item.isComplete).length;
  const completionPercentage = Math.round((completedCount / completionItems.length) * 100);
  const missingItems = completionItems.filter(item => !item.isComplete).slice(0, 3);

  const tabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "employment", label: "Employment", icon: Briefcase },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "bank", label: "Bank Details", icon: Landmark },
    { id: "tax", label: "Tax & Statutory", icon: Shield },
    { id: "dependents", label: "Family & Contacts", icon: Users },
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Primary Account */}
                    <div className="relative group perspective">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                      <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden h-full transform transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
                        {/* Glass Overlay */}
                        <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl" />
                        
                        {/* Decorative Circles */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl" />
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />

                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-auto">
                            <div className="flex flex-col gap-2">
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest backdrop-blur-md">
                                <CheckCircle2 size={12} /> Primary Salary
                              </div>
                              <div className="w-12 h-8 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-md opacity-80 mt-2" />
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Bank Name
                              </p>
                              <p className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                                {me.bankName || "Not configured"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-12 mb-8">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                              Account Number
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 md:gap-6 text-2xl md:text-3xl font-mono tracking-[0.2em] text-slate-100">
                                <span>{me.accountNumber ? me.accountNumber.substring(0, 4) : "****"}</span>
                                <span className="text-slate-500">****</span>
                                <span>{me.accountNumber ? me.accountNumber.slice(-4) : "****"}</span>
                              </div>
                              <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all backdrop-blur-md border border-white/5">
                                <EyeOff size={18} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/10">
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Holder</p>
                              <p className="text-sm font-bold tracking-wide">{me.accountName || me.name}</p>
                            </div>
                            <button
                              onClick={() => {
                                setChangeRequestField("Primary Bank Details");
                                setShowChangeRequestModal(true);
                              }}
                              className="px-5 py-2.5 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10 flex items-center gap-2"
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Account */}
                    <div className="relative group perspective">
                      {me.secondaryAccountNumber && (
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                      )}
                      
                      <div className={`h-full p-8 rounded-[2.5rem] relative overflow-hidden transition-all duration-500 ${me.secondaryAccountNumber ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white shadow-2xl hover:scale-[1.02] hover:-translate-y-1' : 'bg-slate-50 border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 flex flex-col items-center justify-center text-center group-hover:scale-[1.02]'}`}>
                        {me.secondaryAccountNumber ? (
                          <>
                            <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl" />
                            <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl" />
                            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/30 rounded-full blur-3xl" />

                            <div className="relative z-10 flex flex-col h-full">
                              <div className="flex justify-between items-start mb-auto">
                                <div className="flex flex-col gap-2">
                                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 text-indigo-50 border border-white/30 rounded-xl text-[9px] font-black uppercase tracking-widest backdrop-blur-md">
                                    <ShieldCheck size={12} /> Secondary Account
                                  </div>
                                  <div className="w-12 h-8 bg-gradient-to-br from-slate-200 to-slate-400 rounded-md opacity-80 mt-2" />
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">
                                    Bank Name
                                  </p>
                                  <p className="text-xl font-black tracking-tight text-white">
                                    {me.secondaryBankName}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="mt-12 mb-8">
                                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-2">
                                  Account Number
                                </p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 md:gap-6 text-2xl md:text-3xl font-mono tracking-[0.2em] text-white">
                                    <span>{me.secondaryAccountNumber.substring(0, 4)}</span>
                                    <span className="text-indigo-300">****</span>
                                    <span>{me.secondaryAccountNumber.slice(-4)}</span>
                                  </div>
                                  <button className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-indigo-200 hover:text-white transition-all backdrop-blur-md border border-white/10">
                                    <EyeOff size={18} />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/10">
                                <div>
                                  <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Account Holder</p>
                                  <p className="text-sm font-bold tracking-wide">{me.secondaryAccountName || me.name}</p>
                                </div>
                                <button
                                  onClick={handleOpenSecondaryBank}
                                  className="px-5 py-2.5 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10 flex items-center gap-2"
                                >
                                  <Edit2 size={12} /> Edit
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="relative z-10 flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-xl shadow-indigo-100">
                              <Plus size={32} className="transition-transform duration-500 group-hover:rotate-90" />
                            </div>
                            <h4 className="text-lg font-black text-slate-800 mb-2">Secondary Account</h4>
                            <p className="text-xs font-bold text-slate-500 mb-8 max-w-[220px] leading-relaxed">
                              Add a secondary bank account to split your payroll seamlessly.
                            </p>
                            <button
                              onClick={handleOpenSecondaryBank}
                              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all transform hover:-translate-y-1"
                            >
                              Add Bank Account
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {!me.secondaryAccountNumber && (
                    <button 
                      onClick={handleOpenSecondaryBank}
                      className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-black uppercase text-xs tracking-widest hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> Add Secondary Account
                    </button>
                  )}
                </section>
              </motion.div>
            )}
            
            {activeTab === "tax" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Tax & Statutory */}
                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:border-indigo-200 transition-colors">
                  <div className="flex justify-between items-center mb-6">
                    <SectionTitle
                      icon={ShieldCheck}
                      title="Tax & Statutory"
                      subtitle="Government compliance and IDs"
                    />
                    <button
                      onClick={handleOpenStatutory}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ProfileField label="NIN (National ID)" value={me.nin} restricted />
                    <ProfileField label="Tax ID (TIN)" value={me.tin} restricted />
                    <ProfileField label="State of Residence" value={me.taxState} restricted />
                    <ProfileField label="Pension Administrator" value={me.pfa} restricted />
                    <ProfileField label="Pension RSA PIN" value={me.pensionId} restricted />
                    <ProfileField label="NHF Number" value={me.nhf} restricted />
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === "dependents" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Emergency Contacts & Dependents */}
                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <SectionTitle
                      icon={AlertCircle}
                      title="Family & Emergency Contacts"
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
                      <p className="text-xs text-slate-400 font-bold p-4 bg-slate-50 rounded-2xl text-center">No contacts set.</p>
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
                <span className={completionPercentage === 100 ? "text-emerald-600" : "text-indigo-600"}>{completionPercentage}% Complete</span>
                <span className="text-slate-400">{completionPercentage === 100 ? "Perfect!" : completionPercentage > 70 ? "Excellent" : completionPercentage > 40 ? "Good" : "Needs Work"}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${completionPercentage === 100 ? "bg-emerald-500" : "bg-indigo-600"}`} 
                />
              </div>
            </div>
            
            {completionPercentage === 100 ? (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <CheckCircle2 size={20} className="text-emerald-500" />
                <span className="text-xs font-bold text-emerald-700">Your profile is 100% complete!</span>
              </div>
            ) : (
              <div className="space-y-3 mt-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tasks to complete</p>
                {missingItems.map(item => (
                  <div 
                    key={item.key}
                    onClick={item.action}
                    className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100 cursor-pointer hover:bg-rose-100 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-xs font-bold text-rose-700">
                      {item.label}
                    </span>
                    <ChevronRight size={14} className="ml-auto text-rose-400" />
                  </div>
                ))}
              </div>
            )}
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
      {/* Secondary Bank Modal */}
      <AnimatePresence>
        {showSecondaryBankModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Landmark className="text-indigo-600" /> Secondary Bank Details
                </h3>
                <button
                  onClick={() => setShowSecondaryBankModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Guaranty Trust Bank"
                    value={secondaryBankDetails.secondaryBankName}
                    onChange={(e) => setSecondaryBankDetails({ ...secondaryBankDetails, secondaryBankName: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-800 border-none outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Account Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={secondaryBankDetails.secondaryAccountName}
                    onChange={(e) => setSecondaryBankDetails({ ...secondaryBankDetails, secondaryAccountName: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-800 border-none outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    placeholder="10-digit account number"
                    maxLength={10}
                    value={secondaryBankDetails.secondaryAccountNumber}
                    onChange={(e) => setSecondaryBankDetails({ ...secondaryBankDetails, secondaryAccountNumber: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-800 border-none outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <button
                  onClick={handleSaveSecondaryBank}
                  disabled={updateProfileMutation.isPending || !secondaryBankDetails.secondaryBankName || !secondaryBankDetails.secondaryAccountNumber}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updateProfileMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {updateProfileMutation.isPending ? "Saving..." : "Save Details"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Statutory Modal */}
      <AnimatePresence>
        {showStatutoryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="text-indigo-600" /> Tax & Statutory
                </h3>
                <button
                  onClick={() => setShowStatutoryModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      NIN
                    </label>
                    <input
                      type="text"
                      value={statutoryDetails.nin}
                      onChange={(e) => setStatutoryDetails({ ...statutoryDetails, nin: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold text-slate-800 border-none outline-none focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      State of Residence
                    </label>
                    <input
                      type="text"
                      value={statutoryDetails.taxState}
                      onChange={(e) => setStatutoryDetails({ ...statutoryDetails, taxState: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold text-slate-800 border-none outline-none focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Tax Identification Number (TIN)
                  </label>
                  <input
                    type="text"
                    value={statutoryDetails.tin}
                    onChange={(e) => setStatutoryDetails({ ...statutoryDetails, tin: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-800 border-none outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Pension Fund Administrator (PFA)
                  </label>
                  <input
                    type="text"
                    value={statutoryDetails.pfa}
                    onChange={(e) => setStatutoryDetails({ ...statutoryDetails, pfa: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-800 border-none outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Pension RSA PIN
                  </label>
                  <input
                    type="text"
                    value={statutoryDetails.pensionId}
                    onChange={(e) => setStatutoryDetails({ ...statutoryDetails, pensionId: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-800 border-none outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    National Housing Fund (NHF) No.
                  </label>
                  <input
                    type="text"
                    value={statutoryDetails.nhf}
                    onChange={(e) => setStatutoryDetails({ ...statutoryDetails, nhf: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-800 border-none outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <button
                  onClick={handleSaveStatutory}
                  disabled={updateProfileMutation.isPending}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  {updateProfileMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {updateProfileMutation.isPending ? "Saving..." : "Save Statutory Details"}
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
