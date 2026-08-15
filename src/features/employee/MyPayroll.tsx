import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Calendar,
  TrendingUp,
  PieChart as PieChartIcon,
  Eye,
  EyeOff,
  FileText,
  CheckCircle2,
  Printer,
  History,
  Landmark,
  Wallet,
  ArrowLeft,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
} from "recharts";
import { useMyCompensation, useMyPayslips, useMyProfile } from "../../api/client";

const formatCurrency = (val: number | undefined | null) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(val || 0);

const periodLabel = (month: number, year: number) =>
  new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });

// Compact integer → English words converter, used for the payslip's amount-in-words line.
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function numberToWords(n: number): string {
  if (n === 0) return "Zero";
  const chunk = (num: number): string => {
    if (num === 0) return "";
    if (num < 20) return ONES[num];
    if (num < 100) return `${TENS[Math.floor(num / 10)]}${num % 10 ? "-" + ONES[num % 10] : ""}`;
    return `${ONES[Math.floor(num / 100)]} Hundred${num % 100 ? " " + chunk(num % 100) : ""}`;
  };
  const scales = [{ v: 1_000_000_000, l: "Billion" }, { v: 1_000_000, l: "Million" }, { v: 1_000, l: "Thousand" }];
  let remaining = Math.floor(n);
  const parts: string[] = [];
  for (const { v, l } of scales) {
    if (remaining >= v) {
      parts.push(`${chunk(Math.floor(remaining / v))} ${l}`);
      remaining %= v;
    }
  }
  if (remaining > 0) parts.push(chunk(remaining));
  return parts.join(" ").trim();
}
const amountInWords = (naira: number) => `${numberToWords(Math.floor(naira))} Naira Only`;

const MyPayroll: React.FC = () => {
  const { data: profile, isLoading: isProfileLoading } = useMyProfile();
  const { data: compData, isLoading: isCompLoading } = useMyCompensation();
  const { data: payslips, isLoading: isPayslipsLoading } = useMyPayslips();

  const [activeView, setActiveView] = useState<"dashboard" | "payslip" | "history" | "compensation">("dashboard");
  const [showValues, setShowValues] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  const latestPayslip = payslips?.[0];
  const displayedPayslip = selectedPayslip || latestPayslip;

  const ytdGross = useMemo(() => {
    if (!payslips || !latestPayslip) return 0;
    return payslips.filter((p: any) => p.periodYear === latestPayslip.periodYear).reduce((sum: number, p: any) => sum + p.grossPay, 0);
  }, [payslips, latestPayslip]);

  const salaryDistribution = displayedPayslip
    ? [
        { name: "Basic Salary", value: displayedPayslip.basicSalary, color: "#4f46e5" },
        { name: "Allowances", value: displayedPayslip.allowances, color: "#10b981" },
        { name: "Bonuses", value: displayedPayslip.bonuses || 0, color: "#f59e0b" },
      ].filter((d) => d.value > 0)
    : [];

  const salaryHistory = useMemo(
    () =>
      (payslips || [])
        .slice(0, 6)
        .reverse()
        .map((p: any) => ({ month: new Date(p.periodYear, p.periodMonth - 1, 1).toLocaleString("en-US", { month: "short" }), amount: p.netPay })),
    [payslips]
  );

  const isLoading = isProfileLoading || isCompLoading || isPayslipsLoading;

  const renderDashboard = () => (
    <div className="space-y-8 pb-20">
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full -mr-20 -mt-20 blur-3xl opacity-30" />
        {!latestPayslip ? (
          <div className="relative z-10 text-center py-10">
            <FileText className="mx-auto text-indigo-300 mb-4" size={40} />
            <h2 className="text-2xl font-black mb-2">No payslips yet</h2>
            <p className="text-slate-400 text-sm font-medium max-w-md mx-auto">Your payslip will appear here once your first payroll run has been processed and paid.</p>
          </div>
        ) : (
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 size={12} /> Processed
                </span>
                {latestPayslip.paidAt && <span className="text-xs font-bold text-slate-400">Credited on {new Date(latestPayslip.paidAt).toLocaleDateString()}</span>}
              </div>
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <p className="text-sm font-black text-indigo-300 uppercase tracking-widest">Net Pay ({periodLabel(latestPayslip.periodMonth, latestPayslip.periodYear)})</p>
                  <button onClick={() => setShowValues(!showValues)} className="text-slate-500 hover:text-white transition-colors">
                    {showValues ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter tabular-nums">{showValues ? formatCurrency(latestPayslip.netPay) : "₦ ••••••••"}</h2>
              </div>
              <div className="flex flex-wrap gap-4 pt-4">
                <button onClick={() => { setSelectedPayslip(latestPayslip); setActiveView("payslip"); }} className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
                  <FileText size={16} /> View Payslip
                </button>
              </div>
            </div>
            <div className="hidden lg:block relative h-full min-h-[200px]">
              <div className="bg-slate-800/50 rounded-3xl p-6 backdrop-blur-sm border border-slate-700/50 absolute right-0 top-1/2 -translate-y-1/2 w-80">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-slate-400">Payroll Breakdown</span>
                  <PieChartIcon size={16} className="text-indigo-400" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-300">Earnings</span>
                    <span className="font-black text-emerald-400">{formatCurrency(latestPayslip.grossPay)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-300">Deductions</span>
                    <span className="font-black text-rose-400">
                      -{formatCurrency(latestPayslip.taxDeductions + latestPayslip.pensionDeductions + (latestPayslip.loanDeductions || 0) + (latestPayslip.otherDeductions || 0))}
                    </span>
                  </div>
                  <div className="h-px bg-slate-700 my-2" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-300">Net Pay</span>
                    <span className="font-black text-white">{formatCurrency(latestPayslip.netPay)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {latestPayslip && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Gross Pay", val: latestPayslip.grossPay, sub: "This Month", icon: TrendingUp, color: "emerald" },
              { label: "Total Deductions", val: latestPayslip.taxDeductions + latestPayslip.pensionDeductions + (latestPayslip.loanDeductions || 0) + (latestPayslip.otherDeductions || 0), sub: "Tax, Pension & Loans", icon: Wallet, color: "rose" },
              { label: "YTD Earnings", val: ytdGross, sub: `Year to Date · ${latestPayslip.periodYear}`, icon: Calendar, color: "indigo" },
            ].map((stat, i) => (
              <motion.div key={i} whileHover={{ y: -5 }} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative group">
                <div className={`absolute top-0 right-0 p-6 opacity-5 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                  <stat.icon size={64} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{stat.label}</p>
                <p className="text-2xl font-black text-slate-800 tabular-nums mb-1">{showValues ? formatCurrency(stat.val) : "••••"}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <History size={18} className="text-indigo-600" /> Recent Payslips
                  </h3>
                  <button onClick={() => setActiveView("history")} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600">
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {payslips.slice(0, 3).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm font-bold text-[10px] uppercase">
                          {periodLabel(p.periodMonth, p.periodYear).split(" ")[0].slice(0, 3)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{periodLabel(p.periodMonth, p.periodYear)}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Paid • {formatCurrency(p.netPay)}</p>
                        </div>
                      </div>
                      <button onClick={() => { setSelectedPayslip(p); setActiveView("payslip"); }} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                        <FileText size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <button onClick={() => setActiveView("compensation")} className="w-full py-4 bg-white border border-slate-200 rounded-[2rem] font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                <PieChartIcon size={16} /> View Total Compensation
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderPayslip = () => {
    if (!displayedPayslip) return null;
    const totalDeductions = displayedPayslip.taxDeductions + displayedPayslip.pensionDeductions + (displayedPayslip.loanDeductions || 0) + (displayedPayslip.otherDeductions || 0);
    return (
      <div className="max-w-4xl mx-auto pb-20">
        <button onClick={() => setActiveView("dashboard")} className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 mb-8 transition-colors print:hidden">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none">
          <div className="bg-slate-900 p-10 text-white flex justify-between items-start print:bg-white print:text-black">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center print:border print:border-black">
                <span className="font-black text-xl">Z</span>
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">ZenHR Systems</h2>
                <p className="text-slate-400 text-xs font-medium print:text-slate-600">Payroll Department</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payslip For</p>
              <h3 className="text-xl font-black">{periodLabel(displayedPayslip.periodMonth, displayedPayslip.periodYear)}</h3>
              {displayedPayslip.paidAt && <p className="text-xs text-emerald-400 font-bold uppercase mt-1 print:text-black">Paid on {new Date(displayedPayslip.paidAt).toLocaleDateString()}</p>}
            </div>
          </div>

          <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-y-6 justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employee</p>
              <p className="text-sm font-black text-slate-800">{profile?.name} {profile?.lastName}</p>
              <p className="text-xs text-slate-500 font-medium">ID: {profile?.id}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Role</p>
              <p className="text-sm font-bold text-slate-800">{profile?.role}</p>
              <p className="text-xs text-slate-500 font-medium">{profile?.department}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bank Details</p>
              <p className="text-sm font-bold text-slate-800">{profile?.bankName || "Not on file"}</p>
              {profile?.accountNumber && <p className="text-xs text-slate-500 font-medium">****{String(profile.accountNumber).slice(-4)}</p>}
            </div>
          </div>

          <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Earnings</h4>
              <div className="space-y-4">
                {[
                  { l: "Basic Salary", v: displayedPayslip.basicSalary },
                  { l: "Allowances", v: displayedPayslip.allowances },
                  { l: "Bonuses", v: displayedPayslip.bonuses || 0 },
                ].map((m, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-600">{m.l}</span>
                    <span className="font-black text-slate-800 tabular-nums">{formatCurrency(m.v)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-black text-slate-800 uppercase">Total Gross</span>
                <span className="text-lg font-black text-emerald-600">{formatCurrency(displayedPayslip.grossPay)}</span>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Deductions</h4>
              <div className="space-y-4">
                {[
                  { l: "Income Tax (PAYE)", v: displayedPayslip.taxDeductions },
                  { l: "Pension Contribution", v: displayedPayslip.pensionDeductions },
                  ...(displayedPayslip.loanDeductions ? [{ l: "Loan Repayment", v: displayedPayslip.loanDeductions }] : []),
                  ...(displayedPayslip.otherDeductions ? [{ l: "Other Deductions", v: displayedPayslip.otherDeductions }] : []),
                ].map((m, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-600">{m.l}</span>
                    <span className="font-black text-rose-500 tabular-nums">-{formatCurrency(m.v)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-black text-slate-800 uppercase">Total Deductions</span>
                <span className="text-lg font-black text-rose-600">-{formatCurrency(totalDeductions)}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-10 flex flex-col items-center justify-center border-t border-slate-200">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Net Pay (Take Home)</p>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">{formatCurrency(displayedPayslip.netPay)}</h2>
            <div className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
              {amountInWords(displayedPayslip.netPay)}
            </div>
          </div>

          <div className="p-8 border-t border-slate-200 flex justify-end gap-4 print:hidden">
            <button onClick={() => window.print()} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center gap-2">
              <Printer size={16} /> Print
            </button>
            <button onClick={() => window.print()} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2">
              <Download size={16} /> Save as PDF
            </button>
          </div>
        </div>
        <p className="text-center mt-6 text-xs text-slate-400 font-medium print:hidden">
          Confidential Document • Generated by ZenHR System • {new Date().toLocaleDateString()}
        </p>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="space-y-8 pb-20">
      <button onClick={() => setActiveView("dashboard")} className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
        <ArrowLeft size={16} /> Back to Dashboard
      </button>
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        {(!payslips || payslips.length === 0) ? (
          <div className="text-center py-20">
            <History className="mx-auto text-slate-200 mb-4" size={40} />
            <h2 className="text-lg font-black text-slate-300">No payslip history yet</h2>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-5">Period</th>
                <th className="px-8 py-5">Gross</th>
                <th className="px-8 py-5">Deductions</th>
                <th className="px-8 py-5">Net Pay</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payslips.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-8 py-5 text-sm font-black text-slate-800">{periodLabel(p.periodMonth, p.periodYear)}</td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-600">{formatCurrency(p.grossPay)}</td>
                  <td className="px-8 py-5 text-sm font-bold text-rose-500">-{formatCurrency(p.taxDeductions + p.pensionDeductions + (p.loanDeductions || 0) + (p.otherDeductions || 0))}</td>
                  <td className="px-8 py-5 text-sm font-black text-emerald-600">{formatCurrency(p.netPay)}</td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => { setSelectedPayslip(p); setActiveView("payslip"); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-500 rounded-lg text-[10px] font-black uppercase hover:border-indigo-600 hover:text-indigo-600">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderCompensation = () => (
    <div className="space-y-8 pb-20">
      <button onClick={() => setActiveView("dashboard")} className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-8">Latest Payslip Structure</h3>
          {salaryDistribution.length === 0 ? (
            <p className="text-sm text-slate-400 font-bold text-center py-16">No payslip data available yet.</p>
          ) : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={salaryDistribution} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
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
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <div>
                      <p className="text-sm font-bold text-slate-600">{d.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{((d.value / displayedPayslip.grossPay) * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-8">Net Pay Progression</h3>
          {salaryHistory.length === 0 ? (
            <p className="text-sm text-slate-400 font-bold text-center py-16">Not enough history yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salaryHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "bold", fill: "#94a3b8" }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="amount" stroke="#4f46e5" fill="#e0e7ff" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <section className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <Landmark className="absolute -bottom-10 -right-10 w-64 h-64 text-indigo-500/10 rotate-12" />
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-2xl font-black mb-6">Total Rewards Statement</h3>
          <p className="text-slate-400 font-medium mb-10 text-lg leading-relaxed">Your compensation goes beyond your monthly salary. ZenHR invests in your future and well-being.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { l: "Annual Salary", v: compData ? compData.baseSalary * 12 : 0 },
              { l: "Health Benefits (Annual)", v: compData?.benefits?.healthPremium ? compData.benefits.healthPremium * 12 : 0 },
              { l: "Pension Match (Annual)", v: compData?.benefits?.employerMatchRate ? compData.baseSalary * (compData.benefits.employerMatchRate / 100) * 12 : 0 },
            ].map((item, i) => (
              <div key={i}>
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">{item.l}</p>
                <p className="text-2xl font-black">{formatCurrency(item.v)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-20 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {activeView === "dashboard" && (
        <div className="flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">My Payroll</h1>
            <p className="text-slate-500 font-medium">Access your payslips and compensation details.</p>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={activeView} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
          {activeView === "dashboard" && renderDashboard()}
          {activeView === "payslip" && renderPayslip()}
          {activeView === "history" && renderHistory()}
          {activeView === "compensation" && renderCompensation()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MyPayroll;
