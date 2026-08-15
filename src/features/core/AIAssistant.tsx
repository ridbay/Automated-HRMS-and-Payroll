import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader2, Bot, User as UserIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAskAI } from "../../api/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

// Global chat panel — the model's actual data access is role-scoped
// server-side (api/src/services/ai.service.ts), so what any given user can
// ask about narrows automatically; this component doesn't need to know the
// rules, just show whatever answer (or permission-denied explanation) comes back.
const AIAssistant: React.FC<Props> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const ask = useAskAI();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, ask.isPending]);

  const handleSend = () => {
    const question = input.trim();
    if (!question || ask.isPending) return;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    ask.mutate(question, {
      onSuccess: (result) => setMessages((m) => [...m, { role: "assistant", content: result.answer }]),
      onError: (err: any) => setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${err.message}` }]),
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[250] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 250 }}
            className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col"
          >
            <div className="p-6 bg-indigo-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm">ZenHR Assistant</h3>
                  <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest">
                    Scoped to your access as {user?.role?.replace("_", " ")}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-hide">
              {messages.length === 0 && (
                <div className="text-center text-slate-400 mt-12 space-y-2">
                  <Bot size={36} className="mx-auto text-slate-300" />
                  <p className="text-sm font-bold">Ask about your team, leave, payroll, or open roles.</p>
                  <p className="text-xs">
                    {user?.role === "SUPER_ADMIN" || user?.role === "HR_ADMIN"
                      ? "As " + user.role.replace("_", " ") + ", you can ask about anyone or company-wide data."
                      : user?.role === "MANAGER"
                        ? "As a manager, you can ask about your own team."
                        : "You can ask about your own profile, leave, and open roles."}
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      m.role === "user" ? "bg-slate-800 text-white" : "bg-indigo-50 text-indigo-600"
                    }`}
                  >
                    {m.role === "user" ? <UserIcon size={14} /> : <Bot size={14} />}
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm font-medium max-w-[80%] whitespace-pre-wrap ${
                      m.role === "user" ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {ask.isPending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Bot size={14} />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-slate-50 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-indigo-600" />
                    <span className="text-xs font-bold text-slate-400">Thinking…</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 shrink-0">
              <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask a question…"
                  className="flex-1 bg-transparent px-3 py-2 outline-none text-sm font-medium"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || ask.isPending}
                  className="p-3 bg-indigo-600 text-white rounded-xl disabled:opacity-40 hover:bg-indigo-700 transition-all"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AIAssistant;
