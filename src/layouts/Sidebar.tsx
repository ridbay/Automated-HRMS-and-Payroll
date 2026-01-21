import React from "react";
import { NAV_ITEMS } from "../data/mocks";
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Home,
  User,
  Clock,
  Calendar,
  Wallet,
  Box,
  Trophy,
  FileText,
  Users,
  Settings,
  LifeBuoy,
  CheckSquare,
  BarChart3,
  Target,
  ShieldCheck,
  HelpCircle,
  Briefcase,
  Heart,
  Search,
  Users2,
  Rocket,
  Award,
  LayoutGrid,
  Plane,
  Network,
} from "lucide-react";
import { useNavigation } from "../context/NavigationContext";
import { useAuth } from "../context/AuthContext";

const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isSidebarOpen: isOpen,
    toggleSidebar: toggle,
  } = useNavigation();
  const { user } = useAuth();
  const userRole = user?.role || "EMPLOYEE"; // Fallback or handle null user appropriately

  // Navigation for Employees
  const employeeNav = [
    { name: "Dashboard", icon: <Home size={20} />, path: "portal" },
    { name: "My Profile", icon: <User size={20} />, path: "profile" },
    {
      name: "Time & Attendance",
      icon: <Clock size={20} />,
      path: "attendance",
    },
    { name: "My Leaves", icon: <Calendar size={20} />, path: "leaves" },
    {
      name: "Payroll & Benefits",
      icon: <Wallet size={20} />,
      path: "benefits",
    },
    { name: "My Performance", icon: <Trophy size={20} />, path: "performance" },
    { name: "My Documents", icon: <FileText size={20} />, path: "documents" },
    { name: "Team Directory", icon: <Users size={20} />, path: "workforce" },
    { name: "Settings", icon: <Settings size={20} />, path: "settings" },
    { name: "Help & Support", icon: <LifeBuoy size={20} />, path: "help" },
  ];

  // Navigation for Managers
  const managerNav = [
    { name: "Dashboard", icon: <Home size={20} />, path: "manager-dashboard" },
    { name: "My Team", icon: <Users size={20} />, path: "workforce" },
    { name: "Approvals", icon: <CheckSquare size={20} />, path: "approvals" },
    {
      name: "Team Performance",
      icon: <Trophy size={20} />,
      path: "performance",
    },
    { name: "Team Calendar", icon: <Calendar size={20} />, path: "attendance" },
    { name: "Budget & Payroll", icon: <Wallet size={20} />, path: "payroll" },
    { name: "Assets", icon: <Box size={20} />, path: "assets" }, // Added Assets menu item
    { name: "Reports", icon: <BarChart3 size={20} />, path: "reports" },
    { name: "Goals & OKRs", icon: <Target size={20} />, path: "goals" },
    { name: "Settings", icon: <Settings size={20} />, path: "settings" },
  ];

  // Navigation for Recruiters
  const recruiterNav = [
    {
      name: "Hiring Dashboard",
      icon: <LayoutGrid size={20} />,
      path: "recruitment",
    },
    {
      name: "Open Positions",
      icon: <Briefcase size={20} />,
      path: "requisitions",
    },
    { name: "Pipeline", icon: <Rocket size={20} />, path: "pipeline" },
    {
      name: "Candidate Search",
      icon: <Search size={20} />,
      path: "candidates",
    },
    { name: "Talent Pool", icon: <Users2 size={20} />, path: "pool" },
    {
      name: "Interview Calendar",
      icon: <Calendar size={20} />,
      path: "interviews",
    },
    { name: "Offer Manager", icon: <Award size={20} />, path: "offers" },
    { name: "Analytics", icon: <BarChart3 size={20} />, path: "analytics" },
    { name: "Help Center", icon: <HelpCircle size={20} />, path: "help" },
  ];

  // Navigation for HR Admins
  const hrAdminNav = [
    { name: "Dashboard", icon: <Home size={20} />, path: "dashboard" },
    { name: "Employee Mgmt", icon: <Users size={20} />, path: "workforce" },
    { name: "Recruitment", icon: <Briefcase size={20} />, path: "recruitment" },
    { name: "Payroll & Comp", icon: <Wallet size={20} />, path: "payroll" },
    {
      name: "Time & Attendance",
      icon: <Clock size={20} />,
      path: "attendance",
    },
    { name: "Onboarding", icon: <Plane size={20} />, path: "onboarding" },
    { name: "Org Chart", icon: <Network size={20} />, path: "org-chart" }, // Added
    { name: "Performance", icon: <Trophy size={20} />, path: "performance" },
    { name: "Benefits Admin", icon: <Heart size={20} />, path: "benefits" },
    {
      name: "Reports & Analytics",
      icon: <BarChart3 size={20} />,
      path: "reports",
    },
    { name: "Org Setup", icon: <Building2 size={20} />, path: "settings" },
    { name: "Compliance", icon: <ShieldCheck size={20} />, path: "compliance" },
    { name: "System Settings", icon: <Settings size={20} />, path: "settings" },
    { name: "Support", icon: <HelpCircle size={20} />, path: "help" },
  ];

  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "HR_ADMIN";
  const isManager = userRole === "MANAGER";
  const isRecruiter = userRole === "RECRUITER";

  let navToUse = NAV_ITEMS;
  if (userRole === "EMPLOYEE") {
    navToUse = employeeNav;
  } else if (isManager) {
    navToUse = managerNav;
  } else if (isRecruiter) {
    navToUse = recruiterNav;
  } else if (isAdmin) {
    navToUse = hrAdminNav;
  } else if (userRole === "PAYROLL_OFFICER") {
    navToUse = NAV_ITEMS.filter((i) =>
      ["dashboard", "payroll", "reports", "settings"].includes(i.path),
    );
  }

  return (
    <aside
      className={`${isOpen ? "w-64" : "w-20"} transition-all duration-300 bg-white border-r border-slate-200 flex flex-col z-50`}
    >
      <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-600/20">
            <Zap size={20} fill="currentColor" />
          </div>
          {isOpen && (
            <span className="font-black text-xl tracking-tighter text-slate-800 uppercase italic">
              ZenHR
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-hide">
        {navToUse.map((item) => (
          <button
            key={item.path}
            onClick={() => setActiveTab(item.path)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all relative group ${
              activeTab === item.path
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20"
                : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
            }`}
          >
            <div
              className={`shrink-0 ${activeTab === item.path ? "text-white" : "text-slate-400 group-hover:text-indigo-500"}`}
            >
              {item.icon}
            </div>
            {isOpen && (
              <span className="font-black text-[10px] uppercase tracking-widest text-left leading-tight">
                {item.name}
              </span>
            )}
            {!isOpen && (
              <div className="absolute left-full ml-2 px-3 py-1 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] shadow-xl">
                {item.name}
              </div>
            )}
            {item.name === "Approvals" && isManager && (
              <div
                className={`absolute ${isOpen ? "right-3" : "right-1 top-1"} px-1.5 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded-full`}
              >
                3
              </div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={toggle}
          className="w-full flex items-center justify-center p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </aside>
  );
};

const Building2 = ({ size }: { size: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </svg>
);

export default Sidebar;
