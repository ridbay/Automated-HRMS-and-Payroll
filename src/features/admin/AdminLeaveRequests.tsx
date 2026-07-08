import React, { useState } from 'react';
import { useAdminLeaveRequests, useUpdateLeaveRequest } from '../../api/client';
import { Calendar, CheckCircle, XCircle, Search, Clock, FileText } from 'lucide-react';

const AdminLeaveRequests = () => {
  const { data: requests = [], isLoading } = useAdminLeaveRequests();
  const updateLeaveMutation = useUpdateLeaveRequest();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  
  const [approvedDays, setApprovedDays] = useState<number>(0);
  const [managerComment, setManagerComment] = useState('');

  const filteredRequests = requests.filter((req: any) => 
    req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReview = (req: any) => {
    setSelectedRequest(req);
    setApprovedDays(req.days);
    setManagerComment(req.managerComment || '');
  };

  const handleAction = (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    updateLeaveMutation.mutate({
      id: selectedRequest.id,
      status,
      days: approvedDays,
      managerComment,
    }, {
      onSuccess: () => {
        setSelectedRequest(null);
      }
    });
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-800">Leave Approvals</h1>
          <p className="text-slate-500 mt-2">Manage employee leave requests and adjust approved durations.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="relative w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search requests..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-slate-200">Request ID</th>
                <th className="p-4 font-bold border-b border-slate-200">Employee ID</th>
                <th className="p-4 font-bold border-b border-slate-200">Type & Dates</th>
                <th className="p-4 font-bold border-b border-slate-200">Requested Days</th>
                <th className="p-4 font-bold border-b border-slate-200">Status</th>
                <th className="p-4 font-bold border-b border-slate-200 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.map((req: any) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{req.id}</td>
                  <td className="p-4 text-slate-600">{req.employeeId}</td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{req.type}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Calendar size={12} /> {req.startDate} to {req.endDate}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-slate-800">{req.days} Days</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max ${
                      req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      req.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {req.status === 'approved' && <CheckCircle size={12} />}
                      {req.status === 'rejected' && <XCircle size={12} />}
                      {req.status === 'pending' && <Clock size={12} />}
                      {req.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleReview(req)}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-bold rounded-xl hover:bg-indigo-100 transition-colors"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRequests.length === 0 && (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center">
              <FileText size={32} className="mb-2 text-slate-300" />
              <p>No leave requests found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-black text-slate-800">Review Request {selectedRequest.id}</h2>
              <p className="text-sm text-slate-500 mt-1">Employee: {selectedRequest.employeeId}</p>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <div className="text-xs text-slate-500 font-bold mb-1">LEAVE TYPE</div>
                  <div className="font-medium text-slate-800">{selectedRequest.type}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <div className="text-xs text-slate-500 font-bold mb-1">DATES</div>
                  <div className="font-medium text-slate-800 text-sm">{selectedRequest.startDate} - {selectedRequest.endDate}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 font-bold mb-2">REASON PROVIDED</div>
                <div className="p-4 bg-slate-50 rounded-2xl text-slate-700 text-sm leading-relaxed">
                  {selectedRequest.reason || 'No reason provided.'}
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <label className="text-xs text-slate-500 font-bold mb-2 block">APPROVED DURATION (DAYS)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={approvedDays}
                    onChange={(e) => setApprovedDays(Number(e.target.value))}
                    className="w-24 px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-sm text-slate-500">Originally requested: {selectedRequest.days} days</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-bold mb-2 block">MANAGER COMMENT (OPTIONAL)</label>
                <textarea
                  rows={3}
                  value={managerComment}
                  onChange={(e) => setManagerComment(e.target.value)}
                  placeholder="Add a note about this decision..."
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors"
                disabled={updateLeaveMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('rejected')}
                className="px-6 py-2.5 bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-2"
                disabled={updateLeaveMutation.isPending}
              >
                <XCircle size={18} /> Decline
              </button>
              <button
                onClick={() => handleAction('approved')}
                className="px-6 py-2.5 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                disabled={updateLeaveMutation.isPending}
              >
                <CheckCircle size={18} /> Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeaveRequests;
