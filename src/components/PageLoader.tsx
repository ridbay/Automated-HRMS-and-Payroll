import React from "react";
import { Loader2 } from "lucide-react";

export const PageLoader: React.FC = () => (
  <div className="flex-1 min-h-[50vh] flex flex-col items-center justify-center gap-3 animate-fade-in">
    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
      <Loader2 className="animate-spin" size={24} />
    </div>
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
      Loading...
    </span>
  </div>
);

export default PageLoader;
