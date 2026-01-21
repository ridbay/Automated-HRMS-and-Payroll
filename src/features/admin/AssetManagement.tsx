import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Monitor,
  Laptop,
  Smartphone,
  Car,
  Search,
  Filter,
  Download,
  Plus,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react";
import { MOCK_ASSETS, MOCK_EMPLOYEES } from "../../data/mocks";

const AssetManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const assets = MOCK_ASSETS.filter((asset) => {
    const matchesSearch = asset.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "All" || asset.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = [
    {
      label: "Total Assets",
      value: MOCK_ASSETS.length,
      sub: "Active Inventory",
      icon: <Box className="text-indigo-600" />,
      bg: "bg-indigo-50",
    },
    {
      label: "Total Value",
      value: `₦${(MOCK_ASSETS.reduce((acc, curr) => acc + curr.value, 0) / 1000000).toFixed(1)}M`,
      sub: "Depreciating Value",
      icon: <Clock className="text-emerald-600" />,
      bg: "bg-emerald-50",
    },
    {
      label: "Assigned",
      value: `${Math.round((MOCK_ASSETS.filter((a) => a.status === "Assigned").length / MOCK_ASSETS.length) * 100)}%`,
      sub: "Utilization Rate",
      icon: <CheckCircle2 className="text-blue-600" />,
      bg: "bg-blue-50",
    },
    {
      label: "Maintenance",
      value: MOCK_ASSETS.filter((a) => a.status === "Maintenance").length,
      sub: "Needs Attention",
      icon: <AlertTriangle className="text-amber-600" />,
      bg: "bg-amber-50",
    },
  ];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Laptop":
        return <Laptop size={18} />;
      case "Monitor":
        return <Monitor size={18} />;
      case "Phone":
        return <Smartphone size={18} />;
      case "Vehicle":
        return <Car size={18} />;
      default:
        return <Box size={18} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-emerald-100 text-emerald-700";
      case "Assigned":
        return "bg-indigo-100 text-indigo-700";
      case "Maintenance":
        return "bg-amber-100 text-amber-700";
      case "Retired":
        return "bg-slate-100 text-slate-500";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
            Asset Inventory
          </h1>
          <p className="text-slate-500 font-medium">
            Manage company hardware, licenses, and vehicles.
          </p>
        </div>
        <button className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all flex items-center gap-2">
          <Plus size={18} /> Add New Asset
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group"
          >
            <div
              className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
            >
              {s.icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {s.label}
            </p>
            <h4 className="text-3xl font-black text-slate-800 tracking-tighter tabular-nums">
              {s.value}
            </h4>
            <p className="text-[10px] font-bold text-slate-400 mt-2">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            {["All", "Laptop", "Monitor", "Phone", "Vehicle"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  filterCategory === cat
                    ? "bg-slate-800 text-white shadow-lg"
                    : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                placeholder="Search serial, name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
              />
              <Search
                className="absolute left-3 top-3 text-slate-400"
                size={16}
              />
            </div>
            <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
              <Filter size={18} />
            </button>
            <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Assets List */}
        <div className="divide-y divide-slate-50">
          {assets.map((asset) => {
            const assignee = MOCK_EMPLOYEES.find(
              (e) => e.id === asset.assignedTo,
            );

            return (
              <div
                key={asset.id}
                className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row items-center gap-6 group"
              >
                {/* Asset Image/Icon */}
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden relative">
                  {asset.image ? (
                    <img
                      src={asset.image}
                      className="w-full h-full object-cover"
                      alt={asset.name}
                    />
                  ) : (
                    <div className="text-slate-400">
                      {getCategoryIcon(asset.category)}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <h3 className="text-sm font-black text-slate-800 truncate">
                      {asset.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${getStatusColor(
                        asset.status,
                      )}`}
                    >
                      {asset.status}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    SN: {asset.serialNumber} • Purchased:{" "}
                    {new Date(asset.purchaseDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Assignee */}
                <div className="flex flex-col items-center md:items-end w-40">
                  {assignee ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={assignee.avatar}
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      />
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-700 leading-tight">
                          {assignee.name}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">
                          {assignee.department}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      Unassigned
                    </span>
                  )}
                </div>

                {/* Value */}
                <div className="text-right w-24 hidden md:block">
                  <p className="text-xs font-black text-slate-800 tabular-nums">
                    ₦{asset.value.toLocaleString()}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    Value
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                    <RefreshCw size={16} />
                  </button>
                  <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssetManagement;
