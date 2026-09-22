import React from "react";
import {
  LayoutDashboard,
  Users,
  Clock,
  Wallet,
  Heart,
  Trophy,
  Briefcase,
  BarChart3,
  UserCircle,
  Settings,
} from "lucide-react";

export interface NavItem {
  name: string;
  icon: React.ReactNode;
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "dashboard" },
  { name: "Workforce", icon: <Users size={20} />, path: "workforce" },
  { name: "Attendance", icon: <Clock size={20} />, path: "attendance" },
  { name: "Payroll & Wallet", icon: <Wallet size={20} />, path: "payroll" },
  { name: "Benefits", icon: <Heart size={20} />, path: "benefits" },
  { name: "Performance", icon: <Trophy size={20} />, path: "performance" },
  { name: "Recruitment", icon: <Briefcase size={20} />, path: "recruitment" },
  { name: "Reports", icon: <BarChart3 size={20} />, path: "reports" },
  { name: "My Portal", icon: <UserCircle size={20} />, path: "portal" },
  { name: "Settings", icon: <Settings size={20} />, path: "settings" },
];
