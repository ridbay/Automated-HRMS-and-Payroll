import React, { useState, useEffect } from "react";
import {
  Bell,
  Search,
  User,
  LogOut,
  ChevronDown,
  Settings,
  Sparkles,
  Menu,
  ArrowRight,
} from "lucide-react";
import { useNavigation } from "../context/NavigationContext";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import AIAssistant from "../features/core/AIAssistant";
import CommandPalette from "../components/CommandPalette";
import NotificationDropdown from "../components/NotificationDropdown";

const AI_PROMPT_SUGGESTIONS = [
  "Ask ZenHR AI anything… (e.g. leave, payroll, team)",
  "Ask AI: 'How many leave days do I have left?'",
  "Ask AI: 'Who is on my department team?'",
  "Ask AI: 'When is the next payroll date?'",
  "Ask AI: 'What open positions do we have?'",
];

const Header: React.FC = () => {
  const { activeTab, setActiveTab, toggleMobileSidebar } = useNavigation();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantInitialQuery, setAssistantInitialQuery] = useState<string | undefined>(undefined);
  const [topbarAiInput, setTopbarAiInput] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Rotate friendly placeholder suggestions when user hasn't typed anything
  useEffect(() => {
    if (topbarAiInput) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % AI_PROMPT_SUGGESTIONS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [topbarAiInput]);

  const handleAiSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = topbarAiInput.trim();
    if (query) {
      setAssistantInitialQuery(query);
      setTopbarAiInput("");
    }
    setShowAssistant(true);
  };

  const formattedTitle = activeTab
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Global ⌘+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!user) return null;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 z-40 relative">
      <div className="flex items-center gap-3">
        {/* Mobile drawer toggle */}
        <button
          onClick={toggleMobileSidebar}
          title="Toggle navigation"
          className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl md:hidden transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="bg-slate-50 px-3 sm:px-4 py-1.5 rounded-xl border border-slate-100">
          <h1 className="text-xs font-black text-slate-400 uppercase tracking-widest truncate max-w-[120px] sm:max-w-none">
            {formattedTitle}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setShowCommandPalette(true)}
          className="hidden md:flex items-center relative ml-6 px-4 py-2 bg-slate-50 hover:bg-slate-100/80 rounded-2xl text-slate-400 text-sm w-48 lg:w-60 xl:w-72 transition-all cursor-pointer group text-left border border-transparent hover:border-slate-200"
        >
          <Search className="text-slate-400 group-hover:text-indigo-600 transition-colors mr-3" size={16} />
          <span className="font-medium text-slate-400 group-hover:text-slate-600 flex-1 truncate">
            Global search...
          </span>
          <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-400 text-[10px] font-bold rounded-lg shadow-sm">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile search button */}
        <button
          onClick={() => setShowCommandPalette(true)}
          title="Search"
          className="p-2 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 rounded-2xl md:hidden transition-all"
        >
          <Search size={20} />
        </button>

        {/* Mobile AI button */}
        <button
          type="button"
          onClick={() => setShowAssistant(true)}
          title="Ask ZenHR AI Assistant"
          className="sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 border border-indigo-200/60 rounded-xl font-bold text-xs shadow-2xs transition-all"
        >
          <Sparkles size={14} className="text-indigo-600" />
          <span>Ask AI</span>
        </button>

        {/* Desktop/Tablet AI Input Space */}
        <form
          onSubmit={handleAiSubmit}
          className="hidden sm:flex items-center relative bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-slate-50 hover:bg-slate-50/90 focus-within:bg-white border border-indigo-100/90 hover:border-indigo-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/15 rounded-2xl transition-all shadow-2xs h-10 px-2.5 w-60 md:w-72 lg:w-84 xl:w-96 group"
        >
          <button
            type="button"
            onClick={() => setShowAssistant(true)}
            title="ZenHR AI Assistant"
            className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles size={14} className="animate-pulse" />
          </button>

          <input
            type="text"
            value={topbarAiInput}
            onChange={(e) => setTopbarAiInput(e.target.value)}
            placeholder={AI_PROMPT_SUGGESTIONS[placeholderIndex]}
            aria-label="Ask ZenHR AI anything"
            className="flex-1 bg-transparent px-2.5 py-1 text-xs sm:text-sm font-medium text-slate-700 placeholder:text-slate-400 placeholder:font-normal focus:outline-none min-w-0"
          />

          {topbarAiInput.trim() ? (
            <button
              type="submit"
              title="Ask AI (Enter)"
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl transition-all shrink-0 shadow-xs"
            >
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowAssistant(true)}
              title="Open Assistant chat"
              className="hidden lg:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700 bg-white/80 hover:bg-white border border-indigo-100/80 px-2 py-0.5 rounded-lg shadow-2xs transition-colors shrink-0"
            >
              <span>Ask AI</span>
            </button>
          )}
        </form>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
            className={`p-2.5 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 rounded-2xl relative transition-all ${
              showNotifications ? "bg-slate-50 text-indigo-600" : ""
            }`}
          >
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>

          <NotificationDropdown
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>

        <div className="h-8 w-[1px] bg-slate-100 mx-1 sm:mx-2"></div>

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
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="avatar"
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-indigo-100 transition-all"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm ring-2 ring-transparent group-hover:ring-indigo-100 transition-all">
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
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
                  <button 
                    onClick={() => { setActiveTab("profile"); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                  >
                    <User size={16} /> My Account
                  </button>
                  <button 
                    onClick={() => { setActiveTab("settings"); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                  >
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

      <AIAssistant
        open={showAssistant}
        onClose={() => setShowAssistant(false)}
        initialQuestion={assistantInitialQuery}
        onClearInitialQuestion={() => setAssistantInitialQuery(undefined)}
      />
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onOpenAssistant={() => {
          setShowCommandPalette(false);
          setShowAssistant(true);
        }}
      />
    </header>
  );
};

export default Header;
