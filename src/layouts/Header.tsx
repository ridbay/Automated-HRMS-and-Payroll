import React, { useState } from "react";
import {
  Bell,
  Search,
  User,
  LogOut,
  ChevronDown,
  Settings,
} from "lucide-react";
import { useNavigation } from "../context/NavigationContext";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const Header: React.FC = () => {
  const { activeTab } = useNavigation();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const formattedTitle = activeTab
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  if (!user) return null;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-40">
      <div className="flex items-center gap-4">
        <div className="bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100">
          <h1 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            {formattedTitle}
          </h1>
        </div>
        <div className="hidden md:flex items-center relative ml-8">
          <Search className="absolute left-4 text-slate-300" size={16} />
          <input
            type="text"
            placeholder="Global search (⌘+K)"
            className="pl-11 pr-4 py-2 bg-slate-50 border-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-2xl text-sm w-72 transition-all outline-none font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 rounded-2xl relative transition-all">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-8 w-[1px] bg-slate-100 mx-2"></div>

        <div className="relative">
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-2xl transition-all group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-slate-800 leading-none">
                {user.name}
              </p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span
                  className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                    user.role === "SUPER_ADMIN"
                      ? "bg-rose-50 text-rose-500"
                      : user.role === "MANAGER"
                        ? "bg-amber-50 text-amber-500"
                        : user.role === "EMPLOYEE"
                          ? "bg-slate-100 text-slate-500"
                          : "bg-indigo-50 text-indigo-600"
                  }`}
                >
                  {user.role.replace("_", " ")}
                </span>
              </div>
            </div>
            <div className="relative">
              <img
                src={user.avatar}
                alt="avatar"
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-indigo-100 transition-all"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform ${showProfileMenu ? "rotate-180" : ""}`}
            />
          </div>

          <AnimatePresence>
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-[60]"
                  onClick={() => setShowProfileMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 py-3 z-[70] overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-50 mb-2">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold truncate">
                      {user.email}
                    </p>
                  </div>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                    <User size={16} /> My Account
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                    <Settings size={16} /> Preferences
                  </button>
                  <div className="h-[1px] bg-slate-50 my-2"></div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 transition-colors"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
