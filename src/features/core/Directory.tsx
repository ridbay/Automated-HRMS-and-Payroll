import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronDown,
  ChevronUp,
  MapPin,
  Mail,
  User,
  Phone,
  List,
  Network
} from "lucide-react";
import { Employee } from "../../types/index";
import { useDirectory } from "../../api/client";

// --- Types ---
interface TreeNode extends Employee {
  children?: TreeNode[];
}

// --- Helper Functions ---
const buildTree = (
  employees: Employee[],
  managerId: string | null = null,
): TreeNode[] => {
  return employees
    .filter((e) =>
      managerId
        ? e.managerId === managerId
        : !e.managerId || e.managerName === "CEO" || !e.managerName,
    )
    .map((e) => ({
      ...e,
      children: buildTree(employees, e.id),
    }));
};

// --- Recursive Node Component ---
const OrgNode: React.FC<{
  node: TreeNode;
  depth: number;
  onSelect: (node: TreeNode) => void;
}> = ({ node, depth, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
        className={`
          relative w-64 bg-white rounded-[1.5rem] border border-slate-200 shadow-sm p-4 cursor-pointer
          flex flex-col items-center text-center z-10 hover:border-indigo-300 transition-colors
          ${depth === 0 ? "border-indigo-500 shadow-indigo-100 ring-4 ring-indigo-50" : ""}
        `}
      >
        {node.avatar ? (
          <img
            src={node.avatar}
            className="w-16 h-16 rounded-2xl border-4 border-white shadow-md -mt-10 mb-3 object-cover bg-slate-100"
            alt={node.name}
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-md -mt-10 mb-3 flex items-center justify-center bg-indigo-100 text-indigo-600 font-black text-xl">
            {node.name?.[0]}
          </div>
        )}
        <h3 className="font-black text-slate-800 text-sm leading-tight">
          {node.name} {node.lastName}
        </h3>
        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1 mb-2">
          {node.role}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
          <MapPin size={10} /> {(node.location || "Location").split(",")[0]}
        </div>

        {/* Expand/Collapse Toggle */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="absolute -bottom-3 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 shadow-sm z-20"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </motion.div>

      {/* Connection Line */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col items-center w-full">
          <div className="w-px h-8 bg-slate-300"></div>
          <div className="relative flex justify-center gap-8 pt-4 border-t border-slate-300 w-full px-4">
            {node.children?.map((child) => (
              <div
                key={child.id}
                className="flex flex-col items-center relative"
              >
                {/* Vertical line connecting to the horizontal parent line */}
                <div className="absolute -top-4 w-px h-4 bg-slate-300"></div>
                <OrgNode node={child} depth={depth + 1} onSelect={onSelect} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Component ---
const Directory: React.FC = () => {
  const [scale, setScale] = useState(1);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");
  const [searchQuery, setSearchQuery] = useState("");
  
  const constraintsRef = useRef<HTMLDivElement>(null);

  const { data: employees = [], isLoading } = useDirectory();

  const filteredEmployees = employees.filter((emp: any) => 
    `${emp.name} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const orgData = buildTree(filteredEmployees);

  return (
    <div className="space-y-6 pb-20">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users size={24} className="text-indigo-600" />
            Company Directory
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Browse {employees.length} team members
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode("tree")}
              className={`p-2 rounded-xl transition-all ${
                viewMode === "tree" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Network size={20} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-xl transition-all ${
                viewMode === "list" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : viewMode === "tree" ? (
        <div className="h-[calc(100vh-250px)] relative overflow-hidden bg-slate-50/50 rounded-[3rem] border border-slate-200">
          {/* Controls */}
          <div className="absolute top-6 left-6 z-30 flex flex-col gap-2">
            <div className="bg-white p-2 rounded-2xl shadow-xl flex flex-col gap-2">
              <button
                onClick={() => setScale((s) => Math.min(s + 0.1, 2))}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-600"
              >
                <ZoomIn size={20} />
              </button>
              <button
                onClick={() => setScale((s) => Math.max(s - 0.1, 0.5))}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-600"
              >
                <ZoomOut size={20} />
              </button>
              <button
                onClick={() => setScale(1)}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-600"
              >
                <Maximize size={20} />
              </button>
            </div>
          </div>

          {/* Draggable Canvas */}
          <motion.div
            ref={constraintsRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          >
            <motion.div
              drag
              dragConstraints={constraintsRef}
              className="w-full min-h-full flex justify-center pt-20 pb-20"
              style={{ scale }}
            >
              <div className="flex gap-20">
                {orgData.map((node) => (
                  <OrgNode
                    key={node.id}
                    node={node}
                    depth={0}
                    onSelect={setSelectedNode}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Employee</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Role & Dept</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Contact</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Manager</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer" onClick={() => setSelectedNode(emp)}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        {emp.avatar ? (
                          <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-sm">
                            {emp.name?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{emp.name} {emp.lastName}</p>
                          <p className="text-xs text-slate-500 font-medium">{emp.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-700 text-sm">{emp.role}</p>
                      <p className="text-xs text-slate-500 font-medium">{emp.department}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                        <span className="flex items-center gap-2"><Mail size={12} className="text-slate-400"/> {emp.email}</span>
                        {emp.phone && <span className="flex items-center gap-2"><Phone size={12} className="text-slate-400"/> {emp.phone}</span>}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {emp.managerName ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                          <User size={14} className="text-slate-400"/> {emp.managerName}
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 uppercase">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Detail Slide-over */}
      <AnimatePresence>
        {selectedNode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNode(null)}
              className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-40"
            />
            <motion.div
              layoutId={selectedNode.id}
              className="fixed top-4 right-4 bottom-4 w-96 bg-white rounded-[2.5rem] shadow-2xl z-50 p-8 overflow-y-auto border border-slate-100"
            >
              <div className="flex flex-col items-center text-center mt-6">
                {selectedNode.avatar ? (
                  <img
                    src={selectedNode.avatar}
                    className="w-32 h-32 rounded-[2.5rem] object-cover shadow-xl border-4 border-white mb-6"
                    alt={selectedNode.name}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-100 text-indigo-600 shadow-xl border-4 border-white mb-6 flex items-center justify-center font-black text-5xl">
                    {selectedNode.name?.[0]}
                  </div>
                )}
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  {selectedNode.name} {selectedNode.lastName}
                </h2>
                <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mt-2">
                  {selectedNode.role}
                </p>
                <p className="text-xs font-medium text-slate-400 mt-1">
                  {selectedNode.department}
                </p>
              </div>

              <div className="mt-10 space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">
                      Email
                    </p>
                    <p className="text-xs font-bold text-slate-700">
                      {selectedNode.email}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">
                      Phone
                    </p>
                    <p className="text-xs font-bold text-slate-700">
                      {selectedNode.phone || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">
                      Manager
                    </p>
                    <p className="text-xs font-bold text-slate-700">
                      {selectedNode.managerName || "None"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors"
              >
                Close Details
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Directory;
