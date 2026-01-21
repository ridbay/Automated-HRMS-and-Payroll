import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize,
  Move,
  ChevronDown,
  ChevronUp,
  MapPin,
  Mail,
  User,
  Phone,
  Briefcase,
} from "lucide-react";
import { MOCK_EMPLOYEES } from "../../data/mocks";
import { Employee } from "../../types/index";

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
        : !e.managerId || e.managerName === "CEO",
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
        <img
          src={node.avatar}
          className="w-16 h-16 rounded-2xl border-4 border-white shadow-md -mt-10 mb-3 object-cover bg-slate-100"
          alt={node.name}
        />
        <h3 className="font-black text-slate-800 text-sm leading-tight">
          {node.name} {node.lastName}
        </h3>
        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1 mb-2">
          {node.role}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
          <MapPin size={10} /> {(node.location || "").split(",")[0]}
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
const OrgChart: React.FC = () => {
  const [scale, setScale] = useState(1);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const orgData = buildTree(MOCK_EMPLOYEES);

  return (
    <div className="h-[calc(100vh-120px)] relative overflow-hidden bg-slate-50/50 rounded-[3rem] border border-slate-200">
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

      <div className="absolute top-6 right-6 z-30 bg-white px-6 py-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-black uppercase tracking-widest text-slate-500">
          {MOCK_EMPLOYEES.length} Employees
        </span>
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

      {/* Employee Detail Slide-over */}
      <AnimatePresence>
        {selectedNode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNode(null)}
              className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] z-40"
            />
            <motion.div
              layoutId={selectedNode.id}
              className="absolute top-4 right-4 bottom-4 w-96 bg-white rounded-[2.5rem] shadow-2xl z-50 p-8 overflow-y-auto border border-slate-100"
            >
              <div className="flex flex-col items-center text-center mt-6">
                <img
                  src={selectedNode.avatar}
                  className="w-32 h-32 rounded-[2.5rem] object-cover shadow-xl border-4 border-white mb-6"
                />
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

export default OrgChart;
