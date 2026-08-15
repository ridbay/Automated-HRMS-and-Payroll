import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  LifeBuoy,
  Plus,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  Send,
  Loader2
} from 'lucide-react';
import {
  useSupportTickets,
  useCreateSupportTicket,
  useUpdateSupportTicket,
  useTicketMessages,
  useAddTicketMessage
} from '../../api/client';
import { usePopup } from '../../components/PopupProvider';

const Support: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const { data: tickets, isLoading } = useSupportTickets();
  const createTicketMutation = useCreateSupportTicket();
  const updateTicketMutation = useUpdateSupportTicket();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredTickets = tickets?.filter((t: any) =>
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open': return <AlertCircle size={16} className="text-amber-500" />;
      case 'In Progress': return <Clock size={16} className="text-indigo-500" />;
      case 'Resolved': return <CheckCircle2 size={16} className="text-emerald-500" />;
      default: return <LifeBuoy size={16} className="text-slate-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
            Help & Support
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {isAdmin ? "Manage employee support tickets and inquiries." : "Submit requests and track your support tickets."}
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={16} /> New Ticket
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        </div>
      ) : filteredTickets?.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
            <LifeBuoy size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">No tickets found</h3>
          <p className="text-slate-500 font-medium">You don't have any support tickets at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className={`${selectedTicket ? 'hidden lg:block' : ''} lg:col-span-1 space-y-4`}>
            {filteredTickets?.map((ticket: any) => (
              <motion.div
                key={ticket.id}
                layoutId={`ticket-${ticket.id}`}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-6 rounded-3xl border cursor-pointer transition-all ${
                  selectedTicket?.id === ticket.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-200'
                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-lg hover:-translate-y-1'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                    selectedTicket?.id === ticket.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {getStatusIcon(ticket.status)} {ticket.status}
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                    selectedTicket?.id === ticket.id ? 'bg-white/20 text-white border-white/20' : getPriorityColor(ticket.priority)
                  }`}>
                    {ticket.priority}
                  </span>
                </div>
                <h3 className={`text-sm font-bold mb-1 line-clamp-1 ${selectedTicket?.id === ticket.id ? 'text-white' : 'text-slate-800'}`}>
                  {ticket.subject}
                </h3>
                <p className={`text-xs mb-4 line-clamp-2 ${selectedTicket?.id === ticket.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                  {ticket.description}
                </p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-dashed border-slate-200/50">
                  <div className="flex items-center gap-2">
                    <img 
                      src={ticket.employeeAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.employeeName || 'U')}&background=random`} 
                      alt="" 
                      className="w-6 h-6 rounded-full"
                    />
                    <span className={`text-[10px] font-bold ${selectedTicket?.id === ticket.id ? 'text-indigo-100' : 'text-slate-600'}`}>
                      {ticket.employeeName}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold ${selectedTicket?.id === ticket.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className={`${!selectedTicket ? 'hidden lg:block' : ''} lg:col-span-2 h-[800px]`}>
            {selectedTicket ? (
              <TicketDetail 
                ticket={selectedTicket} 
                onClose={() => setSelectedTicket(null)} 
                isAdmin={isAdmin}
                onUpdateStatus={(status) => {
                  updateTicketMutation.mutate({ id: selectedTicket.id, status });
                  setSelectedTicket({ ...selectedTicket, status });
                }}
              />
            ) : (
              <div className="h-full bg-white rounded-[2.5rem] border border-slate-200 flex flex-col items-center justify-center text-center p-12">
                <MessageCircle size={48} className="text-slate-200 mb-6" />
                <h3 className="text-xl font-black text-slate-800 mb-2">Select a Ticket</h3>
                <p className="text-slate-500 font-medium">Choose a ticket from the list to view details and replies.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateTicketModal 
            onClose={() => setShowCreateModal(false)}
            onSubmit={(data) => {
              createTicketMutation.mutate(data, {
                onSuccess: () => setShowCreateModal(false)
              });
            }}
            isPending={createTicketMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const TicketDetail = ({ ticket, onClose, isAdmin, onUpdateStatus }: any) => {
  const { user } = useAuth();
  const { data: messages } = useTicketMessages(ticket.id);
  const addMessageMutation = useAddTicketMessage();
  const [replyText, setReplyText] = useState('');

  const handleSend = () => {
    if (!replyText.trim()) return;
    addMessageMutation.mutate({ ticketId: ticket.id, message: replyText }, {
      onSuccess: () => setReplyText('')
    });
  };

  return (
    <div className="h-full bg-white rounded-[2.5rem] border border-slate-200 flex flex-col overflow-hidden shadow-sm">
      <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
        <div className="flex-1">
          <button onClick={onClose} className="lg:hidden mb-4 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
            <X size={14} /> Close
          </button>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
              {ticket.category}
            </span>
            {isAdmin && (
              <select 
                value={ticket.status}
                onChange={(e) => onUpdateStatus(e.target.value)}
                className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer hover:border-indigo-200"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            )}
            {!isAdmin && (
               <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
               {ticket.status}
             </span>
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">{ticket.subject}</h2>
          <p className="text-sm text-slate-600 bg-white p-4 rounded-2xl border border-slate-100">{ticket.description}</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50/30">
        {messages?.map((msg: any) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
              <img 
                src={msg.senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName || 'U')}&background=random`} 
                alt="" 
                className="w-10 h-10 rounded-2xl"
              />
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className={`p-4 rounded-2xl text-sm ${
                  isMe 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                }`}>
                  {msg.message}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {ticket.status !== 'Resolved' ? (
        <div className="p-6 md:p-8 bg-white border-t border-slate-100">
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-[2rem] border border-slate-200 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-300 transition-all">
            <input 
              type="text" 
              placeholder="Type your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-transparent border-none outline-none px-4 font-bold text-sm text-slate-700"
            />
            <button 
              onClick={handleSend}
              disabled={!replyText.trim() || addMessageMutation.isPending}
              className="w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-[1.5rem] hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50"
            >
              {addMessageMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="-ml-1" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-sm font-bold text-slate-500">This ticket has been marked as resolved and is now closed.</p>
        </div>
      )}
    </div>
  );
};

const CreateTicketModal = ({ onClose, onSubmit, isPending }: any) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <LifeBuoy size={20} className="text-indigo-600" /> New Support Ticket
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            onSubmit({
              subject: fd.get('subject'),
              description: fd.get('description'),
              category: fd.get('category'),
              priority: fd.get('priority')
            });
          }}
          className="p-8 space-y-6 overflow-y-auto flex-1"
        >
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</label>
            <input name="subject" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-100" placeholder="Briefly describe the issue" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
            <textarea name="description" required rows={4} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-100 resize-none" placeholder="Provide more details..."></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
              <select name="category" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-100 cursor-pointer">
                <option value="IT">IT Support</option>
                <option value="HR">HR Request</option>
                <option value="Payroll">Payroll Issue</option>
                <option value="General">General Inquiry</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</label>
              <select name="priority" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-100 cursor-pointer">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2 transition-all"
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Support;
