import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
// Added Check icon to the imports from lucide-react to fix errors on lines 406, 478, and 485
// Added FileCheck icon to the imports to fix error on line 833
import {
  Search,
  Filter,
  UserPlus,
  Mail,
  MoreVertical,
  ShieldCheck,
  Clock,
  Download,
  Trash2,
  CheckSquare,
  Square,
  ChevronRight,
  Plus,
  FileJson,
  FileSpreadsheet,
  X,
  LayoutGrid,
  List,
  Network,
  MapPin,
  Briefcase,
  Calendar,
  User,
  DollarSign,
  ArrowRight,
  ChevronLeft,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Building2,
  UserCheck,
  Settings2,
  Users,
  Eye,
  FilterX,
  Send,
  FileText,
  Landmark,
  ShieldAlert,
  Sparkles,
  Phone,
  Globe,
  Trash,
  Paperclip,
  Users2,
  CreditCard,
  Receipt,
  Fingerprint,
  Check,
  FileCheck,
} from "lucide-react";
import { MOCK_EMPLOYEES } from "../../data/mocks";
import { Employee } from "../../types/index";
import Celebration from "../../components/Celebration";
import EmployeeDetail from "./EmployeeDetail";

const Workforce: React.FC = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "org">("grid");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  );
  const [celebrating, setCelebrating] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    dept: [] as string[],
    location: [] as string[],
    type: [] as string[],
    status: [] as string[],
  });

  const triggerCelebration = () => {
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 3000);
  };

  const filteredEmployees = useMemo(() => {
    return MOCK_EMPLOYEES.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept =
        filters.dept.length === 0 || filters.dept.includes(emp.department);
      const matchesStatus =
        filters.status.length === 0 || filters.status.includes(emp.status);
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [searchTerm, filters]);

  const toggleSelect = (id: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const renderWizardStep = () => {
    switch (wizardStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <User size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-800">
                1. Basic Information
              </h3>
            </div>
            <div className="flex flex-col md:flex-row gap-10">
              <div className="w-40 h-40 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 group hover:border-indigo-400 transition-all cursor-pointer shrink-0">
                <Camera size={32} />
                <span className="text-[10px] font-black uppercase mt-2">
                  Upload Photo
                </span>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="John"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    placeholder="Quincy"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Doe"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold italic text-indigo-600"
                  />
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Personal Email
                  </label>
                  <input
                    type="email"
                    placeholder="john.doe@gmail.com"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+234 (803) 000-0000"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Gender
                  </label>
                  <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold appearance-none">
                    <option>Select...</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Non-binary</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Marital Status
                  </label>
                  <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold appearance-none">
                    <option>Select...</option>
                    <option>Single</option>
                    <option>Married</option>
                    <option>Divorced</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Nationality
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nigerian"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Briefcase size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-800">
                2. Employment Details
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Employment Type
                </label>
                <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold appearance-none">
                  <option>Full-time</option>
                  <option>Contract</option>
                  <option>Intern</option>
                  <option>Consultant</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Department
                </label>
                <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold appearance-none">
                  <option>Engineering</option>
                  <option>Design</option>
                  <option>People</option>
                  <option>Sales</option>
                  <option>Marketing</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Job Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Backend Dev"
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Work Location
                </label>
                <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold appearance-none">
                  <option>HQ - New York</option>
                  <option>Lagos Hub</option>
                  <option>London Office</option>
                  <option>Remote</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Date of Hire
                </label>
                <input
                  type="date"
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Probation Period (Months)
                </label>
                <input
                  type="number"
                  defaultValue={3}
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Employment Status
                </label>
                <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold appearance-none">
                  <option>Active</option>
                  <option>Probation</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Reporting Manager
                </label>
                <input
                  type="text"
                  placeholder="Search manager..."
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Work Email
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated"
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold italic text-indigo-600"
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <DollarSign size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-800">
                3. Compensation
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Salary Structure Template
                  </label>
                  <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold appearance-none">
                    <option>Standard Corporate</option>
                    <option>Consultant Retainer</option>
                    <option>Executive Package</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Basic Salary
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-black text-indigo-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Currency
                    </label>
                    <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold">
                      <option>NGN (₦)</option>
                      <option>USD ($)</option>
                      <option>GBP (£)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
                  Standard Allowances
                </h4>
                <div className="space-y-4">
                  {[
                    { l: "Housing Allowance", v: "20%" },
                    { l: "Transport Allowance", v: "10%" },
                    { l: "Utility Stipend", v: "Fixed ₦80,000" },
                  ].map((a, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="font-bold text-slate-500">{a.l}</span>
                      <span className="font-black text-slate-800">{a.v}</span>
                    </div>
                  ))}
                  <button className="w-full mt-6 py-3 border-2 border-dashed border-slate-200 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                    <Plus size={14} /> Add Custom Allowance
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Receipt size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-800">
                4. Tax & Statutory
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Tax ID Number (TIN)
                </label>
                <input
                  type="text"
                  placeholder="TIN-XXXXXX"
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Pension Fund Admin (PFA)
                </label>
                <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold">
                  <option>Select PFA...</option>
                  <option>Stanbic IBTC Pension</option>
                  <option>ARM Pension</option>
                  <option>Leadway Pensure</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Pension ID (RSA PIN)
                </label>
                <input
                  type="text"
                  placeholder="PEN-XXXXXXXX"
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Health Insurance Plan
                </label>
                <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold">
                  <option>Premium Plus (Standard)</option>
                  <option>Executive Gold</option>
                  <option>Basic Essential</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  National Insurance No.
                </label>
                <input
                  type="text"
                  placeholder="NI-XXXXXXXX"
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Tax Exemptions / Reliefs
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dependent Relief"
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Landmark size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-800">
                5. Bank Details
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Bank Name
                  </label>
                  <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold">
                    <option>Select Bank...</option>
                    <option>Standard Chartered</option>
                    <option>Chase Bank</option>
                    <option>Zenith Bank</option>
                    <option>HSBC</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Account Number
                  </label>
                  <input
                    type="text"
                    placeholder="10 digits"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold tracking-[0.2em]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Account Name
                  </label>
                  <input
                    type="text"
                    placeholder="Full name on account"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                  />
                </div>
              </div>
              <div className="p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                  <CreditCard size={150} />
                </div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-8">
                  Payout Method Selection
                </p>
                <div className="space-y-4">
                  {[
                    "Bank Transfer (Standard)",
                    "Automated Wallet (Instant)",
                    "Cash / Cheque",
                  ].map((method, i) => (
                    /* Fixed unintentional comparison of index i to string on line 327 */
                    <button
                      key={i}
                      className={`w-full p-6 rounded-2xl border-2 flex items-center justify-between transition-all ${method === "Automated Wallet (Instant)" ? "border-indigo-500 bg-indigo-500/10" : "border-white/5 bg-white/5 hover:border-white/20"}`}
                    >
                      <span className="text-sm font-bold">{method}</span>
                      {method === "Automated Wallet (Instant)" && (
                        <CheckCircle2 size={20} className="text-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <FileText size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-800">
                6. Document Upload
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { l: "Resume / CV", req: true },
                { l: "National ID / Passport", req: true },
                { l: "Educational Certificates", req: false },
                { l: "Offer Letter", req: false },
              ].map((doc, i) => (
                <div
                  key={i}
                  className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:border-indigo-400 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-colors shadow-sm">
                      <Paperclip size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">
                        {doc.l}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">
                        {doc.req ? "Required • Missing" : "Optional"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">
                        Set Expiry
                      </p>
                      <input
                        type="date"
                        className="bg-transparent text-[10px] font-bold text-slate-500 outline-none"
                      />
                    </div>
                    <button className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <Upload size={16} className="text-slate-400" />
                    </button>
                  </div>
                </div>
              ))}
              <button className="col-span-1 md:col-span-2 py-8 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:border-indigo-200 hover:text-indigo-400 transition-all">
                <Plus size={24} /> Add More Supporting Documents
              </button>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Users2 size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-800">
                  7. Emergency Contacts
                </h3>
              </div>
              <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg">
                + Add Contact
              </button>
            </div>
            <div className="space-y-6">
              {[1].map((n) => (
                <div
                  key={n}
                  className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Contact Name"
                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl outline-none font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Relationship
                      </label>
                      <select className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl outline-none font-bold">
                        <option>Spouse</option>
                        <option>Parent</option>
                        <option>Sibling</option>
                        <option>Friend</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl outline-none font-bold"
                      />
                    </div>
                    <div className="flex items-end gap-3 pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                          <Check size={14} strokeWidth={4} />
                        </div>
                        <span className="text-[10px] font-black uppercase text-indigo-600">
                          Primary Contact
                        </span>
                      </label>
                      <button className="p-3 text-slate-300 hover:text-rose-500 ml-auto transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="space-y-2 col-span-1 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl outline-none font-bold"
                      />
                    </div>
                    <div className="space-y-2 col-span-1 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Residential Address
                      </label>
                      <input
                        type="text"
                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl outline-none font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-10">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-10">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[1.8rem] flex items-center justify-center shadow-inner">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">
                  Final Review & Sign-off
                </h2>
                <p className="text-slate-500 font-medium">
                  Verify all lifecycle configurations before formal commitment.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <section className="space-y-6">
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-8 relative overflow-hidden">
                  <User className="absolute -top-6 -right-6 w-32 h-32 text-indigo-100/50" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] relative z-10">
                    Employee Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-6 relative z-10">
                    {[
                      { l: "Full Name", v: "John Quincy Doe" },
                      { l: "Role & Dept", v: "Product Lead • Engineering" },
                      { l: "Start Date", v: "June 1, 2024" },
                      { l: "Hiring Manager", v: "Sarah Boss" },
                    ].map((item, i) => (
                      <div key={i}>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                          {item.l}
                        </p>
                        <p className="text-sm font-bold text-slate-800">
                          {item.v}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Financial Setup
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-500 uppercase tracking-tight text-xs">
                        Annual Gross Pay
                      </span>
                      <span className="font-black text-indigo-600 font-mono text-lg">
                        ₦18,500,000.00
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-4">
                      <span className="font-bold text-slate-500 uppercase tracking-tight text-xs">
                        Payout Frequency
                      </span>
                      <span className="font-black text-slate-800">Monthly</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="p-8 bg-indigo-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                  <Sparkles className="absolute -bottom-10 -right-10 w-48 h-48 text-indigo-500/10" />
                  <h4 className="text-xl font-black mb-6">
                    Onboarding Automation
                  </h4>
                  <div className="space-y-6 mb-10">
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center mt-0.5">
                        <Check size={14} strokeWidth={4} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">
                          Auto-generate Employment Contract
                        </p>
                        <p className="text-[10px] text-indigo-300 uppercase">
                          Based on Corporate Template V4
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center mt-0.5">
                        <Check size={14} strokeWidth={4} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">
                          Initiate Welcome Drip Sequence
                        </p>
                        <p className="text-[10px] text-indigo-300 uppercase">
                          7-day culture immersion emails
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white/10 p-6 rounded-2xl border border-white/10">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-10 h-6 bg-emerald-500 rounded-full relative flex items-center px-1 transition-colors">
                        <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm" />
                      </div>
                      <span className="text-xs font-black uppercase">
                        Send Welcome Package Instantly
                      </span>
                    </label>
                  </div>
                </div>
                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-start gap-4">
                  <ShieldAlert className="text-amber-500 shrink-0" size={24} />
                  <p className="text-xs font-medium text-amber-800 leading-relaxed italic">
                    "Contract signing will be routed via ZenSign integration.
                    Background check will commence upon creation."
                  </p>
                </div>
              </section>
            </div>
          </div>
        );
      default:
        return (
          <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest">
            Module under configuration...
          </div>
        );
    }
  };

  if (selectedEmployeeId) {
    const emp = MOCK_EMPLOYEES.find((e) => e.id === selectedEmployeeId);
    return (
      <EmployeeDetail
        employee={emp!}
        onBack={() => setSelectedEmployeeId(null)}
      />
    );
  }

  return (
    <div className="space-y-10 pb-24 relative">
      <Celebration active={celebrating} />

      {/* Dynamic Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
              <Users size={20} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
              Workforce Intelligence
            </h1>
          </div>
          <p className="text-slate-500 font-medium italic">
            Strategic management of {MOCK_EMPLOYEES.length} active personnel
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            {[
              { id: "grid", icon: <LayoutGrid size={18} />, label: "Gallery" },
              { id: "list", icon: <List size={18} />, label: "Roster" },
              { id: "org", icon: <Network size={18} />, label: "Org Map" },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${viewMode === mode.id ? "bg-indigo-600 text-white shadow-xl" : "text-slate-400 hover:bg-slate-50"}`}
              >
                {mode.icon}{" "}
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {mode.label}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setIsWizardOpen(true);
              setWizardStep(1);
            }}
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2 hover:scale-105 transition-all"
          >
            <UserPlus size={18} /> Add Employee
          </button>
        </div>
      </section>

      {/* Unified Search & Bulk Bar */}
      <section className="bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search
            className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by name, ID (ZEN-XXX), or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 py-5 bg-slate-50 border-none rounded-[1.8rem] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium outline-none"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsFilterSidebarOpen(true)}
            className="px-6 py-5 bg-white border border-slate-200 text-slate-600 rounded-[1.8rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 transition-all"
          >
            <Filter size={18} /> Filters
          </button>
          <div className="h-14 w-[1px] bg-slate-100 mx-2" />
          <button className="p-5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-[1.8rem] transition-all shadow-inner">
            <Download size={20} />
          </button>
        </div>
      </section>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {viewMode === "grid" && (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {filteredEmployees.map((emp) => (
              <motion.div
                key={emp.id}
                layout
                whileHover={{ y: -8 }}
                className={`bg-white p-8 rounded-[3.5rem] border-2 transition-all relative group overflow-hidden cursor-pointer ${selectedEmployees.includes(emp.id) ? "border-indigo-600 ring-8 ring-indigo-500/5 shadow-2xl" : "border-slate-100 shadow-sm"}`}
                onClick={() => toggleSelect(emp.id)}
              >
                <div
                  className={`absolute top-0 left-0 w-full h-24 ${emp.status === "active" ? "bg-emerald-50" : "bg-amber-50"} transition-transform group-hover:scale-x-110`}
                />
                <div className="relative mb-6 pt-4">
                  <div className="relative mx-auto w-32 h-32">
                    <img
                      src={emp.avatar}
                      className="w-full h-full rounded-[2.5rem] object-cover border-8 border-white shadow-2xl"
                    />
                    <div
                      className={`absolute -bottom-2 -right-2 w-10 h-10 border-4 border-white rounded-2xl flex items-center justify-center shadow-lg ${emp.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`}
                    >
                      <ShieldCheck size={18} className="text-white" />
                    </div>
                  </div>
                </div>
                <div className="text-center mb-8">
                  <h3 className="text-xl font-black text-slate-800 tracking-tighter leading-tight mb-1">
                    {emp.name}
                  </h3>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">
                    {emp.role}
                  </p>
                  <div className="flex justify-center gap-1.5">
                    <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-slate-100">
                      ID: {emp.id}
                    </span>
                    <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-slate-100">
                      {emp.department}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50">
                  <button className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-100 flex items-center justify-center gap-2">
                    <Settings2 size={12} /> Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEmployeeId(emp.id);
                    }}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-700 shadow-lg flex items-center justify-center gap-2"
                  >
                    <Eye size={12} /> Profile
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {viewMode === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden"
          >
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-8 py-6 w-12">
                    <button
                      onClick={() =>
                        setSelectedEmployees(filteredEmployees.map((e) => e.id))
                      }
                      className="p-1"
                    >
                      <Square size={18} />
                    </button>
                  </th>
                  <th className="px-6 py-6">Employee Info</th>
                  <th className="px-6 py-6">Dept & Location</th>
                  <th className="px-6 py-6">Status</th>
                  <th className="px-6 py-6">Join Date</th>
                  <th className="px-6 py-6">Manager</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <button
                        onClick={() => toggleSelect(emp.id)}
                        className={`p-1 ${selectedEmployees.includes(emp.id) ? "text-indigo-600" : "text-slate-300"}`}
                      >
                        {selectedEmployees.includes(emp.id) ? (
                          <CheckSquare size={18} />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <img
                          src={emp.avatar}
                          className="w-10 h-10 rounded-xl object-cover shadow-md"
                        />
                        <div>
                          <p className="text-sm font-black text-slate-800 leading-none mb-1">
                            {emp.name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            ID: {emp.id} • {emp.role}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-700 uppercase">
                          {emp.department}
                        </p>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                          <MapPin size={10} /> {emp.location || "HQ"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          emp.status === "active"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-mono text-xs font-bold text-slate-500">
                      {emp.hireDate}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-[10px]">
                          DP
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                          {emp.managerName || "None"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => setSelectedEmployeeId(emp.id)}
                          className="p-3 bg-white border rounded-xl text-slate-400 hover:text-indigo-600 shadow-sm"
                        >
                          <Eye size={16} />
                        </button>
                        <button className="p-3 bg-white border rounded-xl text-slate-400 hover:text-rose-600 shadow-sm">
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {viewMode === "org" && (
          <div className="bg-slate-50 p-20 rounded-[4rem] border border-slate-200 min-h-[600px] overflow-auto flex justify-center">
            <div className="flex flex-col items-center">
              {/* CEO Node */}
              <div className="relative mb-12 flex flex-col items-center group cursor-pointer">
                <div className="w-20 h-20 rounded-[2rem] bg-white border-4 border-slate-200 shadow-xl overflow-hidden mb-3 relative z-10 group-hover:border-indigo-600 transition-colors">
                  <img
                    src="https://i.pravatar.cc/150?u=ceo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center relative z-10 bg-slate-50 px-2">
                  <h4 className="text-sm font-black text-slate-800">
                    Richard Hendricks
                  </h4>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                    Chief Executive Officer
                  </p>
                </div>
                {/* Connector */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 h-12 w-0.5 bg-slate-300 -z-0" />
              </div>

              {/* Level 2 Container */}
              <div className="flex gap-16 relative">
                {/* Horizontal Bar */}
                <div className="absolute -top-12 left-10 right-10 h-0.5 bg-slate-300" />

                {[
                  {
                    name: "Jared Dunn",
                    role: "Head of Operations",
                    img: "https://i.pravatar.cc/150?u=jared",
                  },
                  {
                    name: "Monica Hall",
                    role: "Head of Product",
                    img: "https://i.pravatar.cc/150?u=monica",
                  },
                  {
                    name: "Bertram Gilfoyle",
                    role: "CTO",
                    img: "https://i.pravatar.cc/150?u=gilfoyle",
                  },
                ].map((exec, i) => (
                  <div key={i} className="flex flex-col items-center relative">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-12 w-0.5 bg-slate-300" />
                    <div className="w-16 h-16 rounded-2xl bg-white border-4 border-slate-200 shadow-lg overflow-hidden mb-2 hover:border-indigo-400 transition-colors">
                      <img
                        src={exec.img}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-center">
                      <h4 className="text-xs font-black text-slate-800">
                        {exec.name}
                      </h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                        {exec.role}
                      </p>
                    </div>
                    {exec.role === "CTO" && (
                      <div className="mt-8 flex flex-col items-center relative">
                        <div className="h-8 w-0.5 bg-slate-300" />
                        <div className="flex gap-8 relative pt-8">
                          <div className="absolute top-0 left-6 right-6 h-0.5 bg-slate-300" />
                          {filteredEmployees.slice(0, 3).map((emp, j) => (
                            <div
                              key={j}
                              className="flex flex-col items-center relative"
                            >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 h-8 w-0.5 bg-slate-300" />
                              <div className="w-12 h-12 rounded-xl bg-white border-2 border-slate-200 shadow-md overflow-hidden mb-1">
                                <img
                                  src={emp.avatar}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="text-[9px] font-black text-slate-700">
                                {emp.name.split(" ")[0]}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Bulk Actions Bar */}
      <AnimatePresence>
        {selectedEmployees.length > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-10 py-6 rounded-[3rem] shadow-2xl flex items-center gap-12 z-[150] border border-white/10"
          >
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-1">
                Batch Operations
              </p>
              <p className="text-xl font-black">
                {selectedEmployees.length} Members Selected
              </p>
            </div>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                <UserCheck size={16} /> Bulk Update
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                <Send size={16} /> Send Email
              </button>
              <button
                onClick={() => setSelectedEmployees([])}
                className="p-3 bg-rose-500/20 text-rose-500 rounded-2xl hover:bg-rose-500/30 transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Sidebar Overlay */}
      <AnimatePresence>
        {isFilterSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterSidebarOpen(false)}
              className="fixed inset-0 z-[180] bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[190] p-12 flex flex-col"
            >
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-2xl font-black text-slate-800">
                  Advanced Filters
                </h2>
                <button
                  onClick={() => setIsFilterSidebarOpen(false)}
                  className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-10 flex-1 overflow-y-auto scrollbar-hide">
                <section>
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
                    Departments
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "Engineering",
                      "Design",
                      "Marketing",
                      "Sales",
                      "Product",
                      "Legal",
                    ].map((d) => (
                      <button
                        key={d}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            dept: prev.dept.includes(d)
                              ? prev.dept.filter((i) => i !== d)
                              : [...prev.dept, d],
                          }))
                        }
                        className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${filters.dept.includes(d) ? "bg-indigo-50 border-indigo-600 text-indigo-600 shadow-lg" : "bg-slate-50 border-transparent text-slate-500"}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
                    Employment Status
                  </h4>
                  <div className="space-y-3">
                    {["Active", "Probation", "Notice Period", "Inactive"].map(
                      (s) => (
                        <button
                          key={s}
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              status: prev.status.includes(s.toLowerCase())
                                ? prev.status.filter(
                                    (i) => i !== s.toLowerCase(),
                                  )
                                : [...prev.status, s.toLowerCase()],
                            }))
                          }
                          className={`w-full px-6 py-4 flex justify-between items-center rounded-2xl border-2 transition-all ${filters.status.includes(s.toLowerCase()) ? "bg-indigo-50 border-indigo-600 text-indigo-600" : "bg-slate-50 border-transparent text-slate-400"}`}
                        >
                          <span className="text-[11px] font-black uppercase tracking-widest">
                            {s}
                          </span>
                          {filters.status.includes(s.toLowerCase()) && (
                            <CheckCircle2 size={18} />
                          )}
                        </button>
                      ),
                    )}
                  </div>
                </section>
              </div>

              <div className="pt-10 border-t border-slate-100 flex gap-4">
                <button
                  onClick={() =>
                    setFilters({ dept: [], location: [], type: [], status: [] })
                  }
                  className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setIsFilterSidebarOpen(false)}
                  className="flex-2 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hiring Wizard Modal */}
      <AnimatePresence>
        {isWizardOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsWizardOpen(false);
                setWizardStep(1);
              }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-6xl max-h-[90vh] rounded-[4rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="bg-slate-900 p-12 text-white flex justify-between items-start shrink-0">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-indigo-600 rounded-[1.8rem] flex items-center justify-center shadow-2xl">
                    <UserPlus size={32} />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black tracking-tighter">
                      Onboard New Talent
                    </h2>
                    <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">
                      Step {wizardStep} of 8 • Employee Lifecycle Configuration
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <div
                      key={s}
                      className={`h-1.5 transition-all duration-500 rounded-full ${wizardStep >= s ? "w-10 bg-indigo-500" : "w-2 bg-slate-700"}`}
                    />
                  ))}
                </div>
              </div>

              {/* Step Navigation Progress Bar */}
              <div className="bg-slate-50 border-b border-slate-100 flex overflow-x-auto scrollbar-hide shrink-0">
                {[
                  { id: 1, label: "Identity", icon: <User size={14} /> },
                  {
                    id: 2,
                    label: "Job Details",
                    icon: <Briefcase size={14} />,
                  },
                  {
                    id: 3,
                    label: "Compensation",
                    icon: <DollarSign size={14} />,
                  },
                  { id: 4, label: "Statutory", icon: <Receipt size={14} /> },
                  { id: 5, label: "Banking", icon: <Landmark size={14} /> },
                  { id: 6, label: "Documents", icon: <FileCheck size={14} /> },
                  { id: 7, label: "Emergency", icon: <Users2 size={14} /> },
                  {
                    id: 8,
                    label: "Finalize",
                    icon: <CheckCircle2 size={14} />,
                  },
                ].map((s) => (
                  <div
                    key={s.id}
                    className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${wizardStep === s.id ? "bg-white border-indigo-600 text-indigo-600" : "border-transparent text-slate-400"}`}
                  >
                    {s.icon} {s.label}
                  </div>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-16 scrollbar-hide">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={wizardStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    {renderWizardStep()}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="p-12 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
                <button
                  onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))}
                  className={`px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${wizardStep === 1 ? "opacity-30 pointer-events-none" : "hover:bg-slate-50"}`}
                >
                  Go Back
                </button>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setIsWizardOpen(false);
                      setWizardStep(1);
                    }}
                    className="px-8 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={() => {
                      if (wizardStep < 8) setWizardStep((prev) => prev + 1);
                      else {
                        setIsWizardOpen(false);
                        setWizardStep(1);
                        triggerCelebration();
                      }
                    }}
                    className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                  >
                    {wizardStep === 8
                      ? "Confirm & Create Employee"
                      : "Next: " +
                        (wizardStep === 7 ? "Finalize" : "Continue")}{" "}
                    <ArrowRight size={18} />
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

export default Workforce;
