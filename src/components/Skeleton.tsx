
import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rect' }) => {
  const baseClass = "animate-pulse bg-slate-200/60";
  const variants = {
    rect: "rounded-[1.5rem]",
    circle: "rounded-full",
    text: "rounded-lg h-4"
  };

  return (
    <div className={`${baseClass} ${variants[variant]} ${className}`} />
  );
};

export const CardSkeleton: React.FC<{ height?: string, children?: React.ReactNode }> = ({ height = "h-48", children }) => (
  <div className={`bg-white border border-slate-200 shadow-sm p-8 rounded-[3rem] ${height} flex flex-col gap-4 overflow-hidden`}>
    {children || (
      <>
        <Skeleton className="w-1/3 h-6" />
        <Skeleton className="w-full h-full mt-4" />
      </>
    )}
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-8 border-b border-slate-50">
    <div className="flex items-center gap-4">
      <Skeleton className="w-12 h-12" variant="circle" />
      <div className="space-y-2">
        <Skeleton className="w-32 h-4" />
        <Skeleton className="w-24 h-3" />
      </div>
    </div>
    <div className="flex gap-8">
      <Skeleton className="w-20 h-8" />
      <Skeleton className="w-20 h-8" />
      <Skeleton className="w-10 h-10" />
    </div>
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl">
        <Skeleton className="w-10 h-10" variant="rect" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-1/3 h-4" />
          <Skeleton className="w-1/4 h-3" />
        </div>
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
    ))}
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="w-full h-48 flex items-end gap-3 px-4 py-6 bg-slate-50/50 rounded-2xl border border-slate-100">
    {[60, 40, 80, 50, 70, 90, 45].map((h, i) => (
      <div key={i} className="flex-1 bg-slate-200/60 rounded-t-lg animate-pulse" style={{ height: `${h}%` }} />
    ))}
  </div>
);
