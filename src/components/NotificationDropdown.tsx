import React, { useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Wallet,
  Check,
  X,
} from "lucide-react";
import { useNavigation } from "../context/NavigationContext";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "leave" | "payroll" | "attendance" | "compliance" | "system";
  targetTab?: string;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Payroll Batch Prepared",
    message: "September 2026 automated payroll run is pending HR/Finance approval.",
    time: "15m ago",
    read: false,
    type: "payroll",
    targetTab: "payroll",
  },
  {
    id: "notif-2",
    title: "Leave Request Submitted",
    message: "New Annual Leave application submitted awaiting review.",
    time: "1h ago",
    read: false,
    type: "leave",
    targetTab: "leave-approvals",
  },
  {
    id: "notif-3",
    title: "Statutory Filing Reminder",
    message: "Monthly PAYE and Pension remittance schedules generated.",
    time: "3h ago",
    read: false,
    type: "compliance",
    targetTab: "compliance",
  },
  {
    id: "notif-4",
    title: "Daily Attendance Sync",
    message: "Team clock-ins processed with Lagos WAT timezone validation.",
    time: "5h ago",
    read: true,
    type: "attendance",
    targetTab: "attendance",
  },
];

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
}) => {
  const { setActiveTab } = useNavigation();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleItemClick = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
    );
    if (item.targetTab) {
      setActiveTab(item.targetTab);
    }
    onClose();
  };

  const displayedNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "payroll":
        return <Wallet size={16} className="text-emerald-500" />;
      case "leave":
        return <Calendar size={16} className="text-rose-500" />;
      case "attendance":
        return <Clock size={16} className="text-amber-500" />;
      case "compliance":
        return <AlertCircle size={16} className="text-purple-500" />;
      default:
        return <Bell size={16} className="text-indigo-500" />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-8 top-16 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-sm text-slate-800 uppercase tracking-wider">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
            >
              <Check size={14} /> Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center border-b border-slate-100 px-6 bg-slate-50/50">
          <button
            onClick={() => setFilter("all")}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition-all ${
              filter === "all"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition-all ${
              filter === "unread"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notification list */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
          {displayedNotifications.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs font-medium">
              No {filter === "unread" ? "unread " : ""}notifications right now.
            </div>
          ) : (
            displayedNotifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                  !notif.read ? "bg-indigo-50/20" : ""
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className={`text-xs truncate ${notif.read ? "font-bold text-slate-700" : "font-black text-slate-900"}`}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      {notif.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                    {notif.message}
                  </p>
                </div>
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-2" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
            ZenHR Activity Stream
          </p>
        </div>
      </div>
    </>
  );
};

export default NotificationDropdown;
