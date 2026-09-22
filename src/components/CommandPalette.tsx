import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Home,
  Users,
  Wallet,
  Clock,
  Calendar,
  Heart,
  Trophy,
  Briefcase,
  Settings,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  Building2,
  Box,
  BarChart3,
  LogOut,
} from "lucide-react";
import { useNavigation } from "../context/NavigationContext";
import { useAuth } from "../context/AuthContext";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAssistant?: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Quick Actions";
  icon: React.ReactNode;
  keywords: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenAssistant,
}) => {
  const { setActiveTab } = useNavigation();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items: CommandItem[] = useMemo(() => {
    const role = user?.role || "EMPLOYEE";
    const list: CommandItem[] = [];

    // General navigation
    if (role === "SUPER_ADMIN" || role === "HR_ADMIN") {
      list.push(
        {
          id: "nav-dash",
          title: "HR Dashboard",
          category: "Navigation",
          icon: <Home size={18} className="text-indigo-500" />,
          keywords: "dashboard home overview metrics",
          action: () => setActiveTab("dashboard"),
        },
        {
          id: "nav-workforce",
          title: "Workforce & Employees",
          category: "Navigation",
          icon: <Users size={18} className="text-blue-500" />,
          keywords: "employees staff directory workforce workers",
          action: () => setActiveTab("workforce"),
        },
        {
          id: "nav-payroll",
          title: "Payroll Management",
          category: "Navigation",
          icon: <Wallet size={18} className="text-emerald-500" />,
          keywords: "payroll salary compensation payslips payments",
          action: () => setActiveTab("payroll"),
        },
        {
          id: "nav-recruitment",
          title: "Recruitment & ATS",
          category: "Navigation",
          icon: <Briefcase size={18} className="text-purple-500" />,
          keywords: "recruitment jobs hiring candidates pipeline",
          action: () => setActiveTab("recruitment"),
        },
        {
          id: "nav-attendance",
          title: "Time & Attendance",
          category: "Navigation",
          icon: <Clock size={18} className="text-amber-500" />,
          keywords: "attendance clock timesheets time tracking hours",
          action: () => setActiveTab("attendance"),
        },
        {
          id: "nav-leave",
          title: "Leave Approvals",
          category: "Navigation",
          icon: <Calendar size={18} className="text-rose-500" />,
          keywords: "leave requests vacation pto timeoff approvals",
          action: () => setActiveTab("leave-approvals"),
        },
        {
          id: "nav-compliance",
          title: "Compliance & Statutory",
          category: "Navigation",
          icon: <ShieldCheck size={18} className="text-teal-500" />,
          keywords: "compliance pension tax payee nhf statutory",
          action: () => setActiveTab("compliance"),
        },
        {
          id: "nav-reports",
          title: "Reports & Analytics",
          category: "Navigation",
          icon: <BarChart3 size={18} className="text-cyan-500" />,
          keywords: "reports analytics metrics exports finance",
          action: () => setActiveTab("reports"),
        },
      );
    } else if (role === "MANAGER") {
      list.push(
        {
          id: "nav-manager-dash",
          title: "Manager Dashboard",
          category: "Navigation",
          icon: <Home size={18} className="text-indigo-500" />,
          keywords: "manager dashboard team overview",
          action: () => setActiveTab("manager-dashboard"),
        },
        {
          id: "nav-approvals",
          title: "Team Approvals",
          category: "Navigation",
          icon: <Calendar size={18} className="text-rose-500" />,
          keywords: "approvals leave overtime requests review",
          action: () => setActiveTab("approvals"),
        },
        {
          id: "nav-team-dir",
          title: "Team Directory",
          category: "Navigation",
          icon: <Users size={18} className="text-blue-500" />,
          keywords: "team direct reports members directory",
          action: () => setActiveTab("directory"),
        },
        {
          id: "nav-team-perf",
          title: "Team Performance & OKRs",
          category: "Navigation",
          icon: <Trophy size={18} className="text-amber-500" />,
          keywords: "performance reviews goals okrs appraisal",
          action: () => setActiveTab("performance"),
        },
      );
    } else {
      // Employee portal
      list.push(
        {
          id: "nav-portal",
          title: "My Portal",
          category: "Navigation",
          icon: <Home size={18} className="text-indigo-500" />,
          keywords: "portal home employee personal",
          action: () => setActiveTab("portal"),
        },
        {
          id: "nav-my-payroll",
          title: "My Payslips & Payroll",
          category: "Navigation",
          icon: <Wallet size={18} className="text-emerald-500" />,
          keywords: "payroll payslips salary earnings tax",
          action: () => setActiveTab("my-payroll"),
        },
        {
          id: "nav-my-leave",
          title: "My Leave Requests",
          category: "Navigation",
          icon: <Calendar size={18} className="text-rose-500" />,
          keywords: "leave pto timeoff vacation holiday request",
          action: () => setActiveTab("leave"),
        },
        {
          id: "nav-my-attendance",
          title: "Clock In & Attendance",
          category: "Navigation",
          icon: <Clock size={18} className="text-amber-500" />,
          keywords: "attendance clock in clock out timesheet",
          action: () => setActiveTab("attendance"),
        },
        {
          id: "nav-benefits",
          title: "My Benefits & Health Insurance",
          category: "Navigation",
          icon: <Heart size={18} className="text-pink-500" />,
          keywords: "benefits hmo pension insurance health",
          action: () => setActiveTab("benefits"),
        },
      );
    }

    // Common navigation
    list.push(
      {
        id: "nav-profile",
        title: "My Account Profile",
        category: "Navigation",
        icon: <Users size={18} className="text-slate-500" />,
        keywords: "profile account user personal info emergency contacts",
        action: () => setActiveTab("profile"),
      },
      {
        id: "nav-settings",
        title: "System & Organization Settings",
        category: "Navigation",
        icon: <Settings size={18} className="text-slate-500" />,
        keywords: "settings configuration preferences security 2fa",
        action: () => setActiveTab("settings"),
      },
      {
        id: "nav-help",
        title: "Help & Support Tickets",
        category: "Navigation",
        icon: <HelpCircle size={18} className="text-slate-500" />,
        keywords: "help support ticket faq assistance issue",
        action: () => setActiveTab("help"),
      },
    );

    // Quick Actions
    list.push(
      {
        id: "action-ai",
        title: "Ask ZenHR AI Assistant",
        category: "Quick Actions",
        icon: <Sparkles size={18} className="text-indigo-600" />,
        keywords: "ai assistant chatbot prompt query help ask",
        action: () => onOpenAssistant?.(),
      },
      {
        id: "action-clock",
        title: "Quick Clock In / Clock Out",
        category: "Quick Actions",
        icon: <Clock size={18} className="text-amber-600" />,
        keywords: "clock in clock out time track",
        action: () => setActiveTab("attendance"),
      },
      {
        id: "action-leave",
        title: "Apply for Leave / Time Off",
        category: "Quick Actions",
        icon: <Calendar size={18} className="text-rose-600" />,
        keywords: "apply leave request vacation sick time off",
        action: () => setActiveTab(role === "EMPLOYEE" ? "leave" : "leave-approvals"),
      },
      {
        id: "action-logout",
        title: "Log Out of ZenHR",
        category: "Quick Actions",
        icon: <LogOut size={18} className="text-rose-500" />,
        keywords: "logout sign out exit quit",
        action: () => logout(),
      },
    );

    return list;
  }, [user, setActiveTab, onOpenAssistant, logout]);

  // Filter items based on search input
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const query = search.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.keywords.toLowerCase().includes(query),
    );
  }, [items, search]);

  // Keyboard navigation within the palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < filtered.length ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
      />
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Search header */}
        <div className="flex items-center px-6 py-4 border-b border-slate-100 gap-3">
          <Search size={20} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search (e.g. 'payroll', 'clock', 'leave')..."
            className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 font-medium text-sm"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg uppercase">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm font-medium">
              No matching commands or pages found.
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all text-left ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-900"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isSelected ? "bg-white shadow-sm" : "bg-slate-50"
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {item.category}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className={`transition-transform ${
                      isSelected
                        ? "text-indigo-600 translate-x-0 opacity-100"
                        : "opacity-0 -translate-x-2"
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600">↑↓</kbd> to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600">↵</kbd> to select
            </span>
          </div>
          <span>ZenHR Quick Command</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
