import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Play,
  Square,
  MapPin,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Plus,
  Filter,
  Download,
  Search,
  Sun,
  Moon,
  Coffee,
  Zap,
  User,
  ArrowRight,
  ChevronLeft,
  LayoutGrid,
  Table as TableIcon,
  Activity,
  PieChart as PieIcon,
  History,
  Umbrella,
  Map as MapIcon,
  Timer,
  BadgeCheck,
  MoreHorizontal,
  X,
  FileText,
  Share2,
  CalendarDays,
  TrendingUp,
  Laptop,
  Utensils,
  Wifi,
  WifiOff,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from "recharts";
import {
  MOCK_LEAVE_BALANCES,
  MOCK_EMPLOYEES,
} from "../../data/mocks";
import { useMyAttendance, useClockIn, useClockOut, useOvertimeRequests, useSubmitOvertime } from "../../api/client";

const Attendance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "clock" | "calendar" | "overtime" | "reports"
  >("clock");
  const { data: attendanceData, isLoading } = useMyAttendance();
  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();

  const activeSession = attendanceData?.activeSession;
  const todaySessions = attendanceData?.todaySessions || [];
  const totalWorkHours = attendanceData?.totalWorkHours || 0;
  const isClockedIn = !!activeSession;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [timer, setTimer] = useState(0);
  const [showClockModal, setShowClockModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  // Overtime State & Hooks
  const { data: overtimeRequestsData } = useOvertimeRequests();
  const submitOvertimeMutation = useSubmitOvertime();
  const overtimeRequests = overtimeRequestsData || [];

  const [otDate, setOtDate] = useState("");
  const [otFrom, setOtFrom] = useState("");
  const [otTo, setOtTo] = useState("");
  const [otReason, setOtReason] = useState("");
  const [otDeliverable, setOtDeliverable] = useState("");

  const handleOvertimeSubmit = () => {
    if (!otDate || !otFrom || !otTo || !otReason) return;
    
    // Calculate simple difference in hours
    const start = new Date(`${otDate}T${otFrom}`);
    const end = new Date(`${otDate}T${otTo}`);
    let diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (diffHours < 0) diffHours += 24; // Handle overnight

    submitOvertimeMutation.mutate({
      date: otDate,
      startTime: otFrom,
      endTime: otTo,
      hours: Number(diffHours.toFixed(1)),
      reason: otReason,
      deliverable: otDeliverable
    }, {
      onSuccess: () => {
        setOtDate("");
        setOtFrom("");
        setOtTo("");
        setOtReason("");
        setOtDeliverable("");
      }
    });
  };

  const me = MOCK_EMPLOYEES[0];
  const noteRef = useRef<HTMLTextAreaElement>(null);

  // Stats calculation
  const history = attendanceData?.history || [];
  const statsMonth = new Date().getMonth();
  const statsYear = new Date().getFullYear();

  const monthlyHistory = history.filter((record: any) => {
    const d = new Date(record.date);
    return d.getMonth() === statsMonth && d.getFullYear() === statsYear;
  });

  const totalMonthlyHours = monthlyHistory.reduce((sum: number, r: any) => sum + (r.workHours || 0), 0);
  const totalMonthlyOvertime = monthlyHistory.reduce((sum: number, r: any) => sum + (r.overtime || 0), 0);

  let lateEntries = 0;
  let totalArrivalMinutes = 0;
  let arrivalCount = 0;

  monthlyHistory.forEach((r: any) => {
    if (r.clockIn) {
      const clockInTime = new Date(r.clockIn);
      const hours = clockInTime.getHours();
      const minutes = clockInTime.getMinutes();
      
      totalArrivalMinutes += (hours * 60 + minutes);
      arrivalCount++;

      // Consider late if clock in is after 09:15 AM
      if (hours > 9 || (hours === 9 && minutes > 15)) {
        lateEntries++;
      }
    }
  });

  const avgArrivalMinutes = arrivalCount > 0 ? Math.round(totalArrivalMinutes / arrivalCount) : 0;
  const avgArrivalHours = Math.floor(avgArrivalMinutes / 60);
  const avgArrivalMins = avgArrivalMinutes % 60;
  const avgArrivalAmPm = avgArrivalHours >= 12 ? 'PM' : 'AM';
  const displayAvgArrivalHours = avgArrivalHours > 12 ? avgArrivalHours - 12 : (avgArrivalHours === 0 ? 12 : avgArrivalHours);
  const formattedAvgArrival = arrivalCount > 0 ? `${displayAvgArrivalHours.toString().padStart(2, '0')}:${avgArrivalMins.toString().padStart(2, '0')} ${avgArrivalAmPm}` : 'N/A';

  useEffect(() => {
    const ticker = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(ticker);
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: any;
    const previousSeconds = Math.floor(totalWorkHours * 3600);

    if (isClockedIn && activeSession?.clockIn) {
      const startMs = new Date(activeSession.clockIn).getTime();
      interval = setInterval(() => {
        setTimer(previousSeconds + Math.floor((Date.now() - startMs) / 1000));
      }, 1000);
    } else {
      setTimer(previousSeconds);
    }
    return () => clearInterval(interval);
  }, [isClockedIn, activeSession, totalWorkHours]);

  // Network Status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (offlineQueue.length > 0) {
        // Mock sync
        console.log("Syncing offline data...", offlineQueue);
        setOfflineQueue([]);
        // Optional: show toast "Synced X records"
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [offlineQueue]);

  // Geolocation
  useEffect(() => {
    if (showClockModal && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
              headers: {
                'Accept-Language': 'en-US,en;q=0.9'
              }
            });
            const data = await response.json();
            setLocation({
              lat,
              lng,
              address: data.display_name || "Location verified",
            });
          } catch (e) {
            setLocation({
              lat,
              lng,
              address: "Location verified",
            });
          }
        },
        async (error) => {
          // If browser GPS fails, fallback to IP-based Geolocation to guarantee a location
          try {
            const ipResponse = await fetch('https://ipapi.co/json/');
            const ipData = await ipResponse.json();
            
            if (ipData && ipData.latitude && ipData.longitude) {
              setLocation({
                lat: ipData.latitude,
                lng: ipData.longitude,
                address: `${ipData.city}, ${ipData.region} (IP Approx)`,
              });
            } else {
              throw new Error("IP data invalid");
            }
          } catch (ipError) {
            setLocation({
              lat: 0,
              lng: 0,
              address: "Location Unknown (Check Network)",
            });
          }
        },
        { timeout: 15000, enableHighAccuracy: false, maximumAge: Infinity }
      );
    } else if (showClockModal) {
      setLocation({
        lat: 0,
        lng: 0,
        address: "Geolocation not supported by browser",
      });
    }
  }, [showClockModal]);

  const handleClockAction = (note: string) => {
    const actionData = {
      location: location?.address || "Unknown Location",
      latitude: location?.lat || null,
      longitude: location?.lng || null,
      notes: note
    };
    const action = isClockedIn ? "clock-out" : "clock-in";
    const timestamp = new Date().toISOString();
    if (!isClockedIn) {
      clockInMutation.mutate(actionData, {
        onSuccess: () => {
          setShowConfetti(true);
          if (window.navigator && window.navigator.vibrate) navigator.vibrate([200, 100, 200]);
          setTimeout(() => setShowConfetti(false), 3000);
          setShowClockModal(false);
        }
      });
    } else {
      clockOutMutation.mutate(actionData, {
        onSuccess: () => setShowClockModal(false)
      });
    }
  };

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m worked`;
  };

  const renderClock = () => (
    <div className="space-y-10 max-w-5xl mx-auto pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Main Clock Interface */}
        <section className="bg-white rounded-[4rem] border border-slate-200 shadow-sm p-12 flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock size={200} strokeWidth={1} />
          </div>

          <div className="absolute top-4 right-8">
            {isOnline ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full text-emerald-600 border border-emerald-100">
                <Wifi size={14} />{" "}
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Online
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-full text-rose-600 border border-rose-100">
                <WifiOff size={14} />{" "}
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Offline Mode
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 mb-10 mt-8">
            <div
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${
                isClockedIn
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${isClockedIn ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
              />
              {isClockedIn ? `Clocked In since 09:15 AM` : "Clocked Out"}
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <h2 className="text-7xl font-black text-slate-800 tracking-tighter mb-4 tabular-nums">
            {currentTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </h2>

          <div className="mb-12">
            <p className="text-xl font-bold text-indigo-600 font-mono tracking-tight">
              {isClockedIn ? formatTimer(timer) : "0h 0m today"}
            </p>
          </div>

          {/* Large Pulse Button */}
          <div className="relative mb-12">
            <AnimatePresence>
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`absolute inset-0 rounded-full blur-2xl ${isClockedIn ? "bg-rose-500" : "bg-emerald-500"}`}
              />
            </AnimatePresence>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowClockModal(true)}
              className={`relative w-48 h-48 rounded-full shadow-2xl flex flex-col items-center justify-center gap-3 transition-colors ${
                isClockedIn
                  ? "bg-rose-600 text-white shadow-rose-200"
                  : "bg-emerald-600 text-white shadow-emerald-200"
              }`}
            >
              {isClockedIn ? (
                <Square size={48} fill="white" />
              ) : (
                <Play size={48} fill="white" className="ml-2" />
              )}
              <span className="font-black text-xs uppercase tracking-[0.2em]">
                {isClockedIn ? "Clock Out" : "Clock In"}
              </span>
            </motion.button>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <MapPin size={12} className="text-emerald-500" />{" "}
            {location ? location.address : "Locating..."}
          </div>
        </section>

        {/* Schedule & Info Side */}
        <div className="space-y-8">
          {/* Today's Schedule Card */}
          <section className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <CalendarDays className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12" />
            <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-indigo-400">
              <CalendarIcon size={20} /> Today's Schedule
            </h3>
            <div className="space-y-6 mb-8">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-indigo-300" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    Your Shift
                  </p>
                  <p className="text-lg font-black tracking-tight">
                    09:00 AM - 05:00 PM
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                  <Utensils size={20} className="text-emerald-300" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    Lunch Break
                  </p>
                  <p className="text-lg font-black tracking-tight">
                    01:00 PM - 02:00 PM
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl flex items-center gap-4">
              <Zap className="text-amber-400" size={20} fill="currentColor" />
              <p className="text-xs font-bold text-indigo-100">
                Working overtime today? Remember to log your request below.
              </p>
            </div>
          </section>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Present This Month
              </p>
              <h4 className="text-2xl font-black text-slate-800 tracking-tight">
                20 / 22{" "}
                <span className="text-xs font-bold text-slate-400">Days</span>
              </h4>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                <Sun size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Avg Arrival
              </p>
              <h4 className="text-2xl font-black text-slate-800 tracking-tight">
                09:05 AM
              </h4>
            </div>
          </div>

          {/* Timeline/Activity Mini */}
          <section className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-8">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">
              Today's Timeline
            </h3>
            <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
              {todaySessions.length === 0 && (
                <p className="text-xs font-bold text-slate-400">No events yet today.</p>
              )}
              {todaySessions.map((session: any) => (
                <React.Fragment key={session.id}>
                  <div className="relative">
                    <div className="absolute -left-[1.9rem] top-1 w-3 h-3 rounded-full border-2 border-white ring-4 ring-slate-50 bg-emerald-500" />
                    <p className="text-xs font-black text-slate-800 leading-none">Clocked In</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                      {new Date(session.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {session.locationIn || 'Unknown'}
                    </p>
                  </div>
                  {session.clockOut && (
                    <div className="relative mt-6">
                      <div className="absolute -left-[1.9rem] top-1 w-3 h-3 rounded-full border-2 border-white ring-4 ring-slate-50 bg-rose-500" />
                      <p className="text-xs font-black text-slate-800 leading-none">Clocked Out</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                        {new Date(session.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {session.workHours}h logged
                      </p>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentMonthStr = currentMonth.toString().padStart(2, '0');
  const monthName = new Date().toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Helper to get status for a date
  const getDayData = (dateStr: string) => {
    return attendanceData?.history?.find((r: any) => r.date === dateStr) || null;
  };

  const getStatusForDate = (day: number) => {
    const dateStr = `${currentYear}-${currentMonthStr}-${day.toString().padStart(2, "0")}`;
    const entry = getDayData(dateStr);
    if (entry) return entry.status;

    // Fallback logic
    const dateObj = new Date(currentYear, currentMonth - 1, day);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return "weekend";
    return dateObj > new Date() ? "weekend" : "absent";
  };

  const selectedDayData = getDayData(selectedDate);

  const renderCalendar = () => (
    <div className="space-y-10 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Calendar Grid */}
        <section className="lg:col-span-2 bg-white rounded-[4rem] border border-slate-200 shadow-sm p-12">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter">
                Attendance Calendar
              </h2>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">
                {monthName} {currentYear}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100">
                <ChevronLeft size={20} />
              </button>
              <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-4 mb-8">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest"
              >
                {day}
              </div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${currentMonthStr}-${day.toString().padStart(2, "0")}`;
              const status = getStatusForDate(day);
              const isSelected = selectedDate === dateStr;

              const colors: any = {
                present: "bg-emerald-50 text-emerald-600 border-emerald-100",
                "present-half":
                  "bg-emerald-50 text-emerald-300 border-emerald-50",
                absent: "bg-rose-50 text-rose-500 border-rose-100",
                leave: "bg-indigo-50 text-indigo-600 border-indigo-100",
                late: "bg-amber-50 text-amber-600 border-amber-100",
                holiday: "bg-violet-50 text-violet-600 border-violet-100",
                weekend: "bg-slate-50 text-slate-300 border-slate-100",
              };

              return (
                <motion.button
                  key={day}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-16 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${colors[status]} ${isSelected ? "ring-4 ring-indigo-100 z-10 scale-110 shadow-lg" : ""}`}
                >
                  <span className="text-sm font-black">{day}</span>
                  <div
                    className={`w-1 h-1 rounded-full ${status === "absent" ? "bg-rose-500" : "bg-current opacity-30"}`}
                  />
                </motion.button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-6 pt-10 border-t border-slate-50">
            {[
              { label: "Present", color: "bg-emerald-500" },
              { label: "Late", color: "bg-amber-500" },
              { label: "Absent", color: "bg-rose-500" },
              { label: "Leave", color: "bg-indigo-500" },
              { label: "Holiday", color: "bg-violet-500" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${l.color}`} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {l.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Detail Panel */}
        <div className="space-y-8">
          <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden transition-all">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                Date Insight
              </h3>
              <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-lg uppercase tracking-widest">
                {selectedDate}
              </span>
            </div>

            {selectedDayData ? (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2">
                      Clock In
                    </p>
                    <p className="text-sm font-black text-slate-800">
                      {selectedDayData.clockIn
                        ? new Date(selectedDayData.clockIn).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" },
                          )
                        : "--:--"}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2">
                      Clock Out
                    </p>
                    <p className="text-sm font-black text-slate-800">
                      {selectedDayData.clockOut
                        ? new Date(selectedDayData.clockOut).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" },
                          )
                        : "Active"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-widest">
                      Status
                    </span>
                    <span className="text-slate-800 uppercase">
                      {selectedDayData.status || "Present"}
                    </span>
                  </div>
                  {/* Mocked data for demo if not in history */}
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-widest">
                      Total Work Hours
                    </span>
                    <span className="text-slate-800">8h 0m</span>
                  </div>
                </div>
                {selectedDayData.note && (
                  <div className="p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 flex items-start gap-4">
                    <FileText size={18} className="text-indigo-400 mt-1" />
                    <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                        Entry Notes
                      </p>
                      <p className="text-xs font-medium text-indigo-800 italic leading-relaxed">
                        "{selectedDayData.note}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <CalendarIcon size={24} />
                </div>
                <p className="text-slate-400 text-xs font-bold">
                  No attendance record found for this date.
                </p>
              </div>
            )}
          </section>

          <section className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <TrendingUp className="absolute -bottom-6 -right-6 w-32 h-32 text-indigo-500/10 rotate-12" />
            <h4 className="text-xl font-black mb-8 text-indigo-400">
              Monthly Stats
            </h4>
            <div className="space-y-6">
              {[
                {
                  label: "Avg Arrival",
                  val: formattedAvgArrival,
                  color: "text-amber-400",
                },
                {
                  label: "Total Hours",
                  val: `${totalMonthlyHours.toFixed(1)}h`,
                  color: "text-emerald-400",
                },
                { label: "Overtime", val: `${totalMonthlyOvertime.toFixed(1)}h`, color: "text-indigo-400" },
                {
                  label: "Late Entries",
                  val: `${lateEntries} Times`,
                  color: "text-rose-400",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex justify-between items-center border-b border-white/5 pb-4 last:border-0"
                >
                  <span className="text-xs font-black uppercase text-slate-400 tracking-widest">
                    {s.label}
                  </span>
                  <span className={`text-lg font-black ${s.color}`}>
                    {s.val}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  const renderOvertime = () => (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">
            Overtime & Extensions
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Log additional work hours for approval and compensation.
          </p>
        </div>
        <button className="px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-indigo-100">
          <Plus size={20} strokeWidth={3} /> Log New Request
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Overtime Form */}
        <section className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-8">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
            Request Overtime
          </h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Date
              </label>
              <input
                type="date"
                value={otDate}
                onChange={(e) => setOtDate(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  From
                </label>
                <input
                  type="time"
                  value={otFrom}
                  onChange={(e) => setOtFrom(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  To
                </label>
                <input
                  type="time"
                  value={otTo}
                  onChange={(e) => setOtTo(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Reason / Project
              </label>
              <textarea
                rows={3}
                value={otReason}
                onChange={(e) => setOtReason(e.target.value)}
                placeholder="e.g. Critical bug fix for V2 release..."
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Expected Deliverable
              </label>
              <input
                type="text"
                value={otDeliverable}
                onChange={(e) => setOtDeliverable(e.target.value)}
                placeholder="e.g. Merged PR #829"
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700"
              />
            </div>
            <button 
              onClick={handleOvertimeSubmit}
              disabled={submitOvertimeMutation.isPending}
              className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 disabled:opacity-50">
              {submitOvertimeMutation.isPending ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
        </section>

        {/* History / Status */}
        <section className="space-y-6">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
            My Requests
          </h3>
          <div className="space-y-4">
            {overtimeRequests.map((ot) => (
              <div
                key={ot.id}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {ot.date}
                    </p>
                    <h4 className="text-lg font-black text-slate-800">
                      {ot.hours} Hours Logged
                    </h4>
                  </div>
                  <span
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      ot.status === "approved"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {ot.status}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-500 leading-relaxed italic mb-8">
                  "{ot.reason}"
                </p>
                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://i.pravatar.cc/150?u=marcus"
                      className="w-8 h-8 rounded-xl object-cover"
                    />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Approved by Marcus R.
                    </p>
                  </div>
                  <button className="p-2 text-slate-300 hover:text-indigo-600">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Module Navigation */}
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img
              src={me.avatar}
              className="w-16 h-16 rounded-[1.5rem] object-cover border-4 border-white shadow-xl ring-1 ring-slate-100"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-xl shadow-md" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
              Professional Presence
            </h1>
            <p className="text-slate-500 font-medium">
              {me.name} • {me.role}
            </p>
          </div>
        </div>

        <div className="flex bg-white p-2 rounded-3xl border border-slate-200 shadow-sm w-full lg:w-auto overflow-x-auto scrollbar-hide">
          {[
            { id: "clock", name: "Dashboard", icon: <Clock size={18} /> },
            {
              id: "calendar",
              name: "My Attendance",
              icon: <CalendarDays size={18} />,
            },
            {
              id: "overtime",
              name: "Overtime",
              icon: <TrendingUp size={18} />,
            },
            { id: "reports", name: "Reports", icon: <FileText size={18} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.4 }}
        >
          {activeTab === "clock" && renderClock()}
          {activeTab === "calendar" && renderCalendar()}
          {activeTab === "overtime" && renderOvertime()}
          {activeTab === "reports" && (
            <div className="bg-white p-24 rounded-[4rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-32 h-32 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-300 mb-10 shadow-inner">
                <FileText size={64} strokeWidth={1.5} />
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter">
                Attendance Analytics
              </h3>
              <p className="text-slate-500 max-w-sm font-medium text-lg leading-relaxed">
                Generate your monthly attendance report for reimbursement or
                audit purposes.
              </p>
              <div className="flex gap-4 mt-12">
                <button className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl flex items-center gap-3">
                  <Download size={20} /> Export Monthly PDF
                </button>
                <button className="px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center gap-3">
                  <Share2 size={20} /> Share via Email
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Action Modal */}
      <AnimatePresence>
        {showClockModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClockModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden text-center"
            >
              <div
                className={`p-10 text-white ${isClockedIn ? "bg-rose-600" : "bg-emerald-600"}`}
              >
                <div className="w-20 h-20 bg-white/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                  <BadgeCheck size={40} className="text-white" />
                </div>
                <h2 className="text-2xl font-black mb-1 tracking-tight">
                  Confirm {isClockedIn ? "Clock Out" : "Clock In"}
                </h2>
                <p className="text-white/70 text-sm font-medium italic">
                  {currentTime.toLocaleTimeString()} at ZenHR HQ
                </p>
              </div>
              <div className="p-10 space-y-6">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4">
                  <MapPin className="text-indigo-600" />
                  <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Detected Location
                    </p>
                    <p className="text-xs font-bold text-slate-700">
                      {location
                        ? `${location.lat.toFixed(4)}° N, ${location.lng.toFixed(4)}° E`
                        : "Acquiring location..."}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-bold">
                      {location?.address}
                    </p>
                  </div>
                </div>
                <textarea
                  rows={3}
                  id="clock-note"
                  placeholder="Add a note (e.g. Working from client site...)"
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium resize-none"
                  ref={noteRef}
                />
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      handleClockAction(
                        noteRef.current?.value || "Regular entry",
                      );
                    }}
                    className={`flex-1 py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl transition-all ${
                      isClockedIn
                        ? "bg-rose-600 text-white shadow-rose-200"
                        : "bg-emerald-600 text-white shadow-emerald-200"
                    }`}
                  >
                    Confirm Action
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white/90 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border border-white/50 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10" />
              <motion.div
                className="mb-6 relative z-10"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-lg text-white">
                  <PartyPopper size={48} strokeWidth={1.5} />
                </div>
              </motion.div>
              <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight relative z-10">
                Awesome Work!
              </h2>
              <p className="text-slate-500 font-bold relative z-10">
                You're all set for today.
              </p>
              <div className="absolute inset-0 z-0">
                {/* Simple CSS particle simulation could go here, or just rely on the modal vibe */}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Attendance;
