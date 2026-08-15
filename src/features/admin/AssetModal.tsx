import React, { useState } from 'react';
import { useCreateAsset } from '../../api/asset.client';
import { X } from 'lucide-react';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: any[];
}

export const AssetModal: React.FC<AssetModalProps> = ({ isOpen, onClose, employees }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Laptop');
  const [status, setStatus] = useState('Available');
  const [condition, setCondition] = useState('New');
  const [employeeId, setEmployeeId] = useState('');
  const [value, setValue] = useState('');

  const createAsset = useCreateAsset();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAsset.mutate(
      {
        name,
        category,
        status,
        condition,
        employeeId: employeeId || undefined,
        value: value ? parseInt(value) : 0,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-600"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Add New Asset</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Asset Name</label>
            <input
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. MacBook Pro M3"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Laptop">Laptop</option>
                <option value="Monitor">Monitor</option>
                <option value="Phone">Phone</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Assign to Employee (Optional)</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">-- Unassigned --</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} {emp.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Value (₦)</label>
            <input
              type="number"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. 1500000"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            disabled={createAsset.isPending}
            className="w-full mt-4 bg-indigo-600 text-white rounded-xl py-3 font-bold hover:bg-indigo-700 transition-colors"
          >
            {createAsset.isPending ? 'Saving...' : 'Save Asset'}
          </button>
        </form>
      </div>
    </div>
  );
};
