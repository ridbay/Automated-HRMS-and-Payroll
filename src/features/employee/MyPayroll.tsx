import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  Download,
  Calendar,
  TrendingUp,
  PieChart as PieChartIcon,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  CheckCircle2,
  ArrowRight,
  Printer,
  Mail,
  AlertCircle,
  History,
  ChevronRight,
  ShieldCheck,
  Landmark,
  Wallet,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { MOCK_PAYROLL_ENTRIES, MOCK_EMPLOYEES } from "../../data/mocks";
import { useNavigation } from "../../context/NavigationContext";

const MyPayroll: React.FC = () => {
  const { setActiveTab } = useNavigation();
  const [activeView, setActiveView] = useState<
    "dashboard" | "payslip" | "history" | "compensation"
  >("dashboard");
  const [showValues, setShowValues] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("Jan 2026");

  // Mock Data & Helpers
  const currentPay = MOCK_PAYROLL_ENTRIES[0];
  const employee = MOCK_EMPLOYEES[0];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(val);

  const salaryDistribution = [
    {
      name: "Basic Salary",
      value: currentPay.earnings.basic,
      color: "#4f46e5",
    },
    { name: "Housing", value: currentPay.earnings.housing, color: "#10b981" },
    {
      name: "Transport",
      value: currentPay.earnings.transport,
      color: "#f59e0b",
    },
    {
      name: "Allowances",
      value: currentPay.earnings.overtime + currentPay.earnings.bonus,
      color: "#ec4899",
    },
  ];

  const salaryHistory = [
    { month: "Aug", amount: 350000 },
    { month: "Sep", amount: 350000 },
    { month: "Oct", amount: 350000 },
    { month: "Nov", amount: 350000 },
    { month: "Dec", amount: 367000 }, // Increment
    { month: "Jan", amount: 367000 },
  ];

  const renderDashboard = () => (
    <div className="space-y-8 pb-20">
      {/* Hero Card */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full -mr-20 -mt-20 blur-3xl opacity-30" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={12} /> Processed
              </span>
              <span className="text-xs font-bold text-slate-400">
                Credited on Jan 25, 2026
              </span>
            </div>
            <div>
              <div className="flex items-center gap-4 mb-2">
                <p className="text-sm font-black text-indigo-300 uppercase tracking-widest">
                  Net Pay (Jan 2026)
                </p>
                <button
                  onClick={() => setShowValues(!showValues)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  {showValues ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              <h2 className="text-5xl md:text-6xl font-black tracking-tighter tabular-nums">
                {showValues ? formatCurrency(currentPay.netPay) : "₦ ••••••••"}
              </h2>
            </div>
            <div className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={() => setActiveView("payslip")}
                className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
              >
                <FileText size={16} /> View Payslip
              </button>
              <button className="px-8 py-4 bg-slate-800 text-white border border-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-colors flex items-center gap-2">
                <Download size={16} /> PDF
              </button>
            </div>
          </div>

          {/* Visual - Abstract representation or small chart */}
          <div className="hidden lg:block relative h-full min-h-[200px]">
            <div className="bg-slate-800/50 rounded-3xl p-6 backdrop-blur-sm border border-slate-700/50 absolute right-0 top-1/2 -translate-y-1/2 w-80">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-slate-400">
                  Payroll Breakdown
                </span>
                <PieChartIcon size={16} className="text-indigo-400" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-300">Earnings</span>
                  <span className="font-black text-emerald-400">
                    {formatCurrency(currentPay.grossPay)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-300">Deductions</span>
                  <span className="font-black text-rose-400">
                    -
                    {formatCurrency(
                      currentPay.deductions.tax + currentPay.deductions.pension,
                    )}
                  </span>
                </div>
                <div className="h-px bg-slate-700 my-2" />
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-300">Net Pay</span>
                  <span className="font-black text-white">
                    {formatCurrency(currentPay.netPay)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Gross Pay",
            val: currentPay.grossPay,
            sub: "This Month",
            icon: TrendingUp,
            color: "emerald",
          },
          {
            label: "Total Deductions",
            val: currentPay.deductions.tax + currentPay.deductions.pension,
            sub: "Tax & Pension",
            icon: Wallet,
            color: "rose",
          },
          {
            label: "YTD Earnings",
            val: currentPay.grossPay * 1,
            sub: "Year to Date",
            icon: Calendar,
            color: "indigo",
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative group"
          >
            <div
              className={`absolute top-0 right-0 p-6 opacity-5 text-${stat.color}-600 group-hover:scale-110 transition-transform`}
            >
              <stat.icon size={64} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              {stat.label}
            </p>
            <p className="text-2xl font-black text-slate-800 tabular-nums mb-1">
              {showValues ? formatCurrency(stat.val) : "••••"}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">
              {stat.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Recent & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <History size={18} className="text-indigo-600" /> Recent
                Payslips
              </h3>
              <button
                onClick={() => setActiveView("history")}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {["Jan 2026", "Dec 2025", "Nov 2025"].map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm font-bold text-[10px] uppercase">
                      {m.split(" ")[0]}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{m}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Paid • {formatCurrency(currentPay.netPay)}
                      </p>
                    </div>
                  </div>
                  <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                    <Download size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
            <div className="relative z-10 text-center">
              <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2">
                Next Payday
              </p>
              <h3 className="text-3xl font-black mb-1">Feb 25</h3>
              <p className="text-xs text-indigo-100 font-medium mb-6">
                Approx. 34 days remaining
              </p>
              <div className="w-full bg-indigo-900/30 h-1.5 rounded-full overflow-hidden">
                <div className="w-1/4 h-full bg-white rounded-full" />
              </div>
            </div>
          </section>

          <button
            onClick={() => setActiveView("compensation")}
            className="w-full py-4 bg-white border border-slate-200 rounded-[2rem] font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <PieChartIcon size={16} /> View Total Compensation
          </button>
        </div>
      </div>
    </div>
  );

  const renderPayslip = () => (
    <div className="max-w-4xl mx-auto pb-20">
      <button
        onClick={() => setActiveView("dashboard")}
        className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 mb-8 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none">
        {/* Header */}
        <div className="bg-slate-900 p-10 text-white flex justify-between items-start print:bg-white print:text-black">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center print:border print:border-black">
              <span className="font-black text-xl">Z</span>
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">
                ZenHR Systems
              </h2>
              <p className="text-slate-400 text-xs font-medium print:text-slate-600">
                Lagos HQ • 12 Marina Road
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Payslip For
            </p>
            <h3 className="text-xl font-black">{selectedMonth}</h3>
            <p className="text-xs text-emerald-400 font-bold uppercase mt-1 print:text-black">
              Paid on Jan 25
            </p>
          </div>
        </div>

        {/* Employee Info */}
        <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-y-6 justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Employee
            </p>
            <p className="text-sm font-black text-slate-800">
              {employee.name} {employee.lastName}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              ID: {employee.id}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Role
            </p>
            <p className="text-sm font-bold text-slate-800">{employee.role}</p>
            <p className="text-xs text-slate-500 font-medium">
              {employee.department}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Bank Details
            </p>
            <p className="text-sm font-bold text-slate-800">
              {employee.bankDetails?.bankName}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              ****{employee.bankDetails?.accountNumber.slice(-4)}
            </p>
          </div>
        </div>

        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Earnings */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              Earnings
            </h4>
            <div className="space-y-4">
              {[
                { l: "Basic Salary", v: currentPay.earnings.basic },
                { l: "Housing Allowance", v: currentPay.earnings.housing },
                { l: "Transport Allowance", v: currentPay.earnings.transport },
                { l: "Overtime", v: currentPay.earnings.overtime },
              ].map((m, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="font-bold text-slate-600">{m.l}</span>
                  <span className="font-black text-slate-800 tabular-nums">
                    {formatCurrency(m.v)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-sm font-black text-slate-800 uppercase">
                Total Gross
              </span>
              <span className="text-lg font-black text-emerald-600">
                {formatCurrency(currentPay.grossPay)}
              </span>
            </div>
          </div>

          {/* Deductions */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              Deductions
            </h4>
            <div className="space-y-4">
              {[
                { l: "Income Tax (PAYE)", v: currentPay.deductions.tax },
                { l: "Pension Contribution", v: currentPay.deductions.pension },
                { l: "Health Insurance", v: currentPay.deductions.insurance },
              ].map((m, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="font-bold text-slate-600">{m.l}</span>
                  <span className="font-black text-rose-500 tabular-nums">
                    -{formatCurrency(m.v)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-sm font-black text-slate-800 uppercase">
                Total Deductions
              </span>
              <span className="text-lg font-black text-rose-600">
                -
                {formatCurrency(
                  currentPay.deductions.tax +
                    currentPay.deductions.pension +
                    currentPay.deductions.insurance,
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Net Pay Net */}
        <div className="bg-slate-50 p-10 flex flex-col items-center justify-center border-t border-slate-200">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
            Net Pay (Take Home)
          </p>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">
            {formatCurrency(currentPay.netPay)}
          </h2>
          <div className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
            Seventy-Two Thousand Three Hundred Naira Only
          </div>
        </div>

        {/* Actions */}
        <div className="p-8 border-t border-slate-200 flex justify-end gap-4 print:hidden">
          <button className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Printer size={16} /> Print
          </button>
          <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2">
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>
      <p className="text-center mt-6 text-xs text-slate-400 font-medium">
        Confidential Document • Generated by ZenHR System •{" "}
        {new Date().toLocaleDateString()}
      </p>
    </div>
  );

  const renderCompensation = () => (
    <div className="space-y-8 pb-20">
      <button
        onClick={() => setActiveView("dashboard")}
        className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-8">
            Salary Structure
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salaryDistribution}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {salaryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            {salaryDistribution.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <div>
                  <p className="text-sm font-bold text-slate-600">{d.name}</p>
                  <p className="text-xs text-slate-400 font-medium">
                    {((d.value / currentPay.grossPay) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-8">
            Salary Progression
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salaryHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: "bold", fill: "#94a3b8" }}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#4f46e5"
                  fill="#e0e7ff"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-4">
            <TrendingUp className="text-indigo-600 mt-1" size={20} />
            <div>
              <p className="text-sm font-black text-slate-800">
                Congrats on your growth!
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Your salary increased by 5% in December due to the annual
                performance review.
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <Landmark className="absolute -bottom-10 -right-10 w-64 h-64 text-indigo-500/10 rotate-12" />
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-2xl font-black mb-6">Total Rewards Statement</h3>
          <p className="text-slate-400 font-medium mb-10 text-lg leading-relaxed">
            Your compensation goes beyond your monthly salary. ZenHR invests in
            your future and well-being.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { l: "Annual Salary", v: 450000 * 12 },
              { l: "Health Benefits", v: 5000000 },
              { l: "Pension Match", v: 360000 },
            ].map((item, i) => (
              <div key={i}>
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">
                  {item.l}
                </p>
                <p className="text-2xl font-black">{formatCurrency(item.v)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="container mx-auto">
      {/* Header (Hidden in payslip view for clear nav) */}
      {activeView === "dashboard" && (
        <div className="flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">
              My Payroll
            </h1>
            <p className="text-slate-500 font-medium">
              Access your payslips and compensation details.
            </p>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
        >
          {activeView === "dashboard" && renderDashboard()}
          {activeView === "payslip" && renderPayslip()}
          {activeView === "history" && (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100">
              <h2 className="text-2xl font-black text-slate-300 mb-4">
                Payslip History Archive
              </h2>
              <button
                onClick={() => setActiveView("dashboard")}
                className="text-indigo-600 font-black uppercase tracking-widest text-xs"
              >
                Back to Dashboard
              </button>
            </div>
          )}
          {activeView === "compensation" && renderCompensation()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MyPayroll;
