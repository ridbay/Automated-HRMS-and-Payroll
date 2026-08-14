import React, { createContext, useContext, useState, ReactNode } from "react";
import { AlertCircle, HelpCircle, Info, X } from "lucide-react";

type PopupType = "alert" | "confirm" | "prompt";

interface PopupOptions {
  message: string;
  title?: string;
  defaultValue?: string;
  type: PopupType;
  resolve: (value: any) => void;
}

interface PopupContextType {
  alert: (message: string, title?: string) => Promise<void>;
  confirm: (message: string, title?: string) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string, title?: string) => Promise<string | null>;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("usePopup must be used within a PopupProvider");
  }
  return context;
};

export const PopupProvider = ({ children }: { children: ReactNode }) => {
  const [popup, setPopup] = useState<PopupOptions | null>(null);
  const [inputValue, setInputValue] = useState("");

  const alert = (message: string, title: string = "Alert"): Promise<void> => {
    return new Promise((resolve) => {
      setPopup({ type: "alert", message, title, resolve });
    });
  };

  const confirm = (message: string, title: string = "Confirm"): Promise<boolean> => {
    return new Promise((resolve) => {
      setPopup({ type: "confirm", message, title, resolve });
    });
  };

  const prompt = (message: string, defaultValue: string = "", title: string = "Input Required"): Promise<string | null> => {
    return new Promise((resolve) => {
      setInputValue(defaultValue);
      setPopup({ type: "prompt", message, title, defaultValue, resolve });
    });
  };

  const close = (value: any = null) => {
    if (popup) {
      popup.resolve(value);
      setPopup(null);
    }
  };

  const handleConfirm = () => {
    if (popup?.type === "prompt") close(inputValue);
    else if (popup?.type === "confirm") close(true);
    else close();
  };

  const handleCancel = () => {
    if (popup?.type === "prompt") close(null);
    else if (popup?.type === "confirm") close(false);
    else close();
  };

  return (
    <PopupContext.Provider value={{ alert, confirm, prompt }}>
      {children}
      {popup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity"
            onClick={handleCancel}
          />
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden border border-slate-100 transform transition-all scale-100">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${popup.type === 'alert' ? 'bg-amber-50 text-amber-500' : popup.type === 'confirm' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
                  {popup.type === 'alert' ? <AlertCircle size={24} /> : popup.type === 'confirm' ? <HelpCircle size={24} /> : <Info size={24} />}
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                  {popup.title}
                </h3>
              </div>
              <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
                {popup.message}
              </p>
              
              {popup.type === "prompt" && (
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all mb-2"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirm();
                    if (e.key === 'Escape') handleCancel();
                  }}
                />
              )}
            </div>

            <div className="px-8 py-5 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              {popup.type !== "alert" && (
                <button
                  onClick={handleCancel}
                  className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${popup.type === 'alert' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : popup.type === 'confirm' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'}`}
              >
                {popup.type === "alert" ? "OK" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PopupContext.Provider>
  );
};
