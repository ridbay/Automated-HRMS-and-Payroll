
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Users, ShieldCheck, Zap, Globe, 
  Mail, Bell, Lock, Database, History, 
  Plus, Search, ChevronRight, Save, Trash2, 
  Upload, CheckCircle2, AlertCircle, ExternalLink,
  Eye, EyeOff, Key, Monitor, FileText, 
  Calendar, MapPin, Sliders, Smartphone,
  Info, ArrowRight, UserPlus, MoreHorizontal,
  LayoutGrid, Share2, Terminal, Code,
  Copy, KeyRound, Loader2, PlaySquare, Workflow
} from 'lucide-react';
import { useSettings, useUpdateSettings, useApiKeys, useCreateApiKey, useDeleteApiKey } from '../../api/client';

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  const { data: settings, isLoading: isSettingsLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();
  const { data: apiKeys, isLoading: isKeysLoading } = useApiKeys();
  const createApiKeyMutation = useCreateApiKey();
  const deleteApiKeyMutation = useDeleteApiKey();

  const sections = [
    { id: 'profile', name: 'Company Profile', icon: <Building2 size={18} />, group: 'General' },
    { id: 'org', name: 'Departments & Locations', icon: <Globe size={18} />, group: 'General' },
    { id: 'roles', name: 'Roles & Permissions', icon: <ShieldCheck size={18} />, group: 'General' },
    { id: 'workflows', name: 'Workflows', icon: <Zap size={18} />, group: 'Automation' },
    { id: 'integrations', name: 'Integrations', icon: <LayoutGrid size={18} />, group: 'Automation' },
    { id: 'email', name: 'Email Templates', icon: <Mail size={18} />, group: 'Communications' },
    { id: 'notifications', name: 'Notifications', icon: <Bell size={18} />, group: 'Communications' },
    { id: 'security', name: 'Security & Privacy', icon: <Lock size={18} />, group: 'Compliance' },
    { id: 'data', name: 'Data & Backup', icon: <Database size={18} />, group: 'Compliance' },
    { id: 'audit', name: 'Audit Logs', icon: <History size={18} />, group: 'Compliance' },
    { id: 'api', name: 'API Access', icon: <Code size={18} />, group: 'Advanced' },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  const renderProfile = () => (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-2xl font-black text-slate-800">Company Identity</h2>
           <p className="text-sm text-slate-500 font-medium">Manage your organization's core details and branding.</p>
        </div>
        <button 
          onClick={handleSave}
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2"
        >
          {isSaving ? <span className="flex items-center gap-2 animate-pulse"><Zap size={16} /> Saving...</span> : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col items-center text-center">
              <div className="relative group cursor-pointer mb-6">
                 <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-200 group-hover:border-indigo-400 transition-all overflow-hidden">
                    <Building2 size={48} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                 </div>
                 <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-all rounded-[2.5rem] flex items-center justify-center">
                    <Upload size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
              </div>
              <h3 className="font-black text-slate-800">Company Logo</h3>
              <p className="text-[10px] text-slate-400 uppercase font-black mt-1 tracking-widest">SVG, PNG, JPG (Max 2MB)</p>
           </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registered Name</label>
                    <input type="text" defaultValue="ZenHR Global Inc." className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration Number</label>
                    <input type="text" defaultValue="RC-129384820" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold" />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Industry</label>
                    <select className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold">
                       <option>Fintech / Financial Services</option>
                       <option>Technology & SaaS</option>
                       <option>Manufacturing</option>
                       <option>Retail</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiscal Year Start</label>
                    <select className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold">
                       <option>January</option>
                       <option>April</option>
                       <option>June</option>
                    </select>
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Headquarters Address</label>
                 <textarea rows={3} defaultValue="123 Innovation Drive, Tech City, Lagos, Nigeria" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold resize-none" />
              </div>
           </div>

           <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Operational Calendar</h3>
              <div className="space-y-6">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                       <Calendar size={18} className="text-indigo-600" />
                       <span className="text-xs font-bold text-slate-700 uppercase">Working Days</span>
                    </div>
                    <div className="flex gap-2">
                       {['M','T','W','T','F','S','S'].map((day, i) => (
                         <button key={i} className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${i < 5 ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}>
                           {day}
                         </button>
                       ))}
                    </div>
                 </div>
                 <button className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                    <Plus size={16} /> Manage Public Holidays
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderRoles = () => (
    <div className="space-y-10">
       <div className="flex justify-between items-center">
          <div>
             <h2 className="text-2xl font-black text-slate-800">RBAC Controls</h2>
             <p className="text-sm text-slate-500 font-medium">Define access layers and administrative permissions.</p>
          </div>
          <button className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2">
             <Plus size={18} /> Create Custom Role
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: 'Administrator', users: 3, desc: 'Full system access including wallet & payroll.', color: 'rose' },
            { name: 'HR Manager', users: 8, desc: 'Workforce, recruitment, and performance management.', color: 'indigo' },
            { name: 'Finance Officer', users: 4, desc: 'Maker/Checker access to payroll batches.', color: 'emerald' },
            { name: 'Employee', users: 128, desc: 'Standard portal self-service access.', color: 'slate' },
          ].map((role, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group"
            >
               <div className={`absolute top-0 right-0 w-16 h-16 bg-${role.color}-50 rounded-full -mr-8 -mt-8`} />
               <h3 className="text-lg font-black text-slate-800 mb-2">{role.name}</h3>
               <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">{role.desc}</p>
               <div className="flex items-center justify-between mt-auto">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{role.users} Users</span>
                  <button className="p-2 text-slate-300 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100">
                     <ChevronRight size={20} />
                  </button>
               </div>
            </motion.div>
          ))}
       </div>

       <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
             <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">Permission Matrix (HR Manager)</h3>
             <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Restore Defaults</button>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                   <tr>
                      <th className="px-10 py-5">Module</th>
                      <th className="px-8 py-5 text-center">View</th>
                      <th className="px-8 py-5 text-center">Create</th>
                      <th className="px-8 py-5 text-center">Edit</th>
                      <th className="px-8 py-5 text-center">Delete</th>
                      <th className="px-8 py-5 text-center">Approve</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {['Workforce', 'Payroll', 'Wallet', 'Recruitment', 'Performance', 'Settings'].map((mod, i) => (
                     <tr key={i} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-10 py-5">
                           <span className="text-xs font-black text-slate-700 uppercase">{mod}</span>
                        </td>
                        {[1, 2, 3, 4, 5].map((cell) => (
                          <td key={cell} className="px-8 py-5 text-center">
                             <div className="flex justify-center">
                                <input 
                                  type="checkbox" 
                                  defaultChecked={cell < 4 || (mod === 'Workforce' && cell === 5)} 
                                  disabled={mod === 'Settings' && cell > 1}
                                  className="w-5 h-5 rounded-lg border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500/20 transition-all cursor-pointer accent-indigo-600" 
                                />
                             </div>
                          </td>
                        ))}
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );

  const renderIntegrations = () => (
    <div className="space-y-10">
       <div>
          <h2 className="text-2xl font-black text-slate-800">App Ecosystem</h2>
          <p className="text-sm text-slate-500 font-medium">Connect ZenHR with your existing productivity and finance stack.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: 'Google Calendar', icon: <Calendar />, category: 'Scheduling', status: 'Connected' },
            { name: 'Slack Notifications', icon: <Smartphone />, category: 'Communication', status: 'Connected' },
            { name: 'Paystack Bank', icon: <Globe />, category: 'Fintech', status: 'Connected' },
            { name: 'Microsoft Outlook', icon: <Mail />, category: 'Communications', status: 'Available' },
            { name: 'Zoom Conferencing', icon: <Monitor />, category: 'Video', status: 'Available' },
            { name: 'QuickBooks Accounting', icon: <Database />, category: 'Finance', status: 'Available' },
          ].map((app, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group"
            >
               <div className="flex justify-between items-start mb-8">
                  <div className="w-14 h-14 bg-slate-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                     {app.icon}
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    app.status === 'Connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {app.status}
                  </span>
               </div>
               <h3 className="text-lg font-black text-slate-800 mb-1">{app.name}</h3>
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6">{app.category}</p>
               <button className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                 app.status === 'Connected' ? 'bg-slate-50 text-slate-600 hover:bg-slate-100' : 'bg-indigo-600 text-white shadow-lg'
               }`}>
                 {app.status === 'Connected' ? 'Configure' : 'Connect Account'}
               </button>
            </motion.div>
          ))}
       </div>
    </div>
  );

  const renderAudit = () => (
    <div className="space-y-10">
       <div className="flex justify-between items-center">
          <div>
             <h2 className="text-2xl font-black text-slate-800">Security Audit Logs</h2>
             <p className="text-sm text-slate-500 font-medium">Immutable record of all administrative actions and system events.</p>
          </div>
          <div className="flex gap-3">
             <button className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                <Search size={18} /> Search
             </button>
             <button className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all">
                Export Log (CSV)
             </button>
          </div>
       </div>

       <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                   <tr>
                      <th className="px-10 py-5">Timestamp</th>
                      <th className="px-8 py-5">User</th>
                      <th className="px-8 py-5">Action</th>
                      <th className="px-8 py-5">Module</th>
                      <th className="px-8 py-5">IP Address</th>
                      <th className="px-10 py-5 text-right">Details</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {[
                     { time: '2024-05-24 14:22:10', user: 'James HR', action: 'Approved Payroll Batch', mod: 'Payroll', ip: '192.168.1.1', sev: 'info' },
                     { time: '2024-05-24 12:05:45', user: 'Emma D.', action: 'Modified Permissions', mod: 'Settings', ip: '192.168.1.4', sev: 'warning' },
                     { time: '2024-05-23 09:15:22', user: 'System', action: 'Automated Wallet Top-up', mod: 'Wallet', ip: 'Cloud-Internal', sev: 'info' },
                     { time: '2024-05-22 16:40:12', user: 'James HR', action: 'Deleted Candidate Record', mod: 'Recruitment', ip: '192.168.1.1', sev: 'warning' },
                     { time: '2024-05-22 10:20:05', user: 'Sarah J.', action: 'User Login', mod: 'Auth', ip: '10.0.0.85', sev: 'info' },
                   ].map((log, i) => (
                     <tr key={i} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-10 py-5">
                           <span className="text-xs font-bold text-slate-500 font-mono">{log.time}</span>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-md flex items-center justify-center text-[10px] font-black">
                                 {log.user[0]}
                              </div>
                              <span className="text-xs font-black text-slate-700">{log.user}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <span className={`text-xs font-bold ${log.sev === 'warning' ? 'text-amber-600' : 'text-slate-600'}`}>{log.action}</span>
                        </td>
                        <td className="px-8 py-5">
                           <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[9px] font-black uppercase">{log.mod}</span>
                        </td>
                        <td className="px-8 py-5">
                           <span className="text-xs font-medium text-slate-400 font-mono">{log.ip}</span>
                        </td>
                        <td className="px-10 py-5 text-right">
                           <button className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><Info size={18} /></button>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );

  const renderSecurity = () => {
    if (isSettingsLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
    return (
      <div className="space-y-10">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Security & Privacy</h2>
            <p className="text-sm text-slate-500 font-medium">Configure access controls, MFA requirements, and password policies.</p>
          </div>
          <button 
            onClick={() => updateSettingsMutation.mutate({ 
              require2fa: !settings?.require2fa,
              passwordMinLength: settings?.passwordMinLength || 12,
              sessionTimeoutMins: settings?.sessionTimeoutMins || 60
            })}
            disabled={updateSettingsMutation.isPending}
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2"
          >
            {updateSettingsMutation.isPending ? <span className="flex items-center gap-2 animate-pulse"><Loader2 className="animate-spin" size={16} /> Saving...</span> : 'Save Changes'}
          </button>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-10 space-y-8">
          <div className="flex items-center justify-between p-6 border-2 border-slate-100 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Require Two-Factor Authentication (2FA)</h4>
                <p className="text-xs font-medium text-slate-500">Enforce MFA for all admin and employee accounts.</p>
              </div>
            </div>
            <button 
              onClick={() => updateSettingsMutation.mutate({ require2fa: !settings?.require2fa })}
              className={`w-14 h-8 rounded-full transition-colors relative ${settings?.require2fa ? 'bg-indigo-500' : 'bg-slate-200'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${settings?.require2fa ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password Minimum Length</label>
              <input 
                type="number" 
                value={settings?.passwordMinLength || 12} 
                onChange={(e) => updateSettingsMutation.mutate({ passwordMinLength: parseInt(e.target.value) })}
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Session Timeout (Minutes)</label>
              <input 
                type="number" 
                value={settings?.sessionTimeoutMins || 60} 
                onChange={(e) => updateSettingsMutation.mutate({ sessionTimeoutMins: parseInt(e.target.value) })}
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold" 
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWorkflows = () => (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800">HR Workflows & Automations</h2>
          <p className="text-sm text-slate-500 font-medium">Configure automated task pipelines for onboarding and offboarding.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {['Onboarding Pipeline', 'Offboarding Pipeline', 'Leave Approvals', 'Payroll Locking'].map((flow) => (
          <div key={flow} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
            <Workflow className="text-indigo-500 mb-6" size={32} />
            <h3 className="text-xl font-black text-slate-800 mb-2">{flow}</h3>
            <p className="text-xs font-medium text-slate-500 mb-6">Manage automated steps, triggers, and assignees.</p>
            <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
              Edit Pipeline <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderApi = () => (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800">API Access & Webhooks</h2>
          <p className="text-sm text-slate-500 font-medium">Manage developer API keys and real-time event webhooks.</p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-10 space-y-8">
        <h3 className="font-black text-slate-800 text-lg">Generate New Key</h3>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Key Description (e.g., Zapier Integration)" 
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-1 px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold" 
          />
          <button 
            onClick={() => {
              if (newKeyName) {
                createApiKeyMutation.mutate({ name: newKeyName });
                setNewKeyName('');
              }
            }}
            disabled={createApiKeyMutation.isPending || !newKeyName}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors"
          >
            {createApiKeyMutation.isPending ? 'Generating...' : 'Create Key'}
          </button>
        </div>

        <div className="mt-8">
          <h3 className="font-black text-slate-800 text-lg mb-6">Active API Keys</h3>
          {isKeysLoading ? (
            <Loader2 className="animate-spin text-indigo-500" />
          ) : (
            <div className="space-y-4">
              {apiKeys?.length === 0 && <p className="text-sm font-medium text-slate-500">No active API keys found.</p>}
              {apiKeys?.map((key: any) => (
                <div key={key.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-4">
                    <KeyRound className="text-indigo-500" size={24} />
                    <div>
                      <h4 className="font-bold text-slate-800">{key.name}</h4>
                      <p className="text-xs font-mono font-medium text-slate-500 mt-1">
                        {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="p-3 bg-white text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm transition-colors border border-slate-200">
                      <Copy size={16} />
                    </button>
                    <button 
                      onClick={() => deleteApiKeyMutation.mutate(key.id)}
                      className="p-3 bg-white text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl shadow-sm transition-colors border border-slate-200"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPlaceholder = (title: string, desc: string) => (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4">
      <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center mb-8 border-4 border-white shadow-xl shadow-indigo-100/50">
        <PlaySquare size={48} className="text-indigo-300" />
      </div>
      <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">{title}</h2>
      <p className="text-slate-500 font-medium max-w-md">{desc}</p>
      <button className="mt-8 px-8 py-3 bg-white text-indigo-600 border-2 border-indigo-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-indigo-500 transition-colors">
        Notify Me When Live
      </button>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-10 min-h-[calc(100vh-160px)] pb-20">
       {/* Settings Sidebar */}
       <aside className="lg:w-80 shrink-0">
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden sticky top-8">
             <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-4 mb-1">
                   <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                      <Sliders size={20} />
                   </div>
                   <h1 className="text-xl font-black text-slate-800 tracking-tighter">Control Center</h1>
                </div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Configuration Suite</p>
             </div>
             
             <nav className="p-4 space-y-8 py-8">
                {['General', 'Automation', 'Communications', 'Compliance', 'Advanced'].map(group => (
                  <div key={group}>
                     <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{group}</h4>
                     <div className="space-y-1">
                        {sections.filter(s => s.group === group).map(section => (
                          <button 
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                              activeSection === section.id 
                                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                            }`}
                          >
                             {section.icon}
                             <span className="flex-1 text-left">{section.name}</span>
                          </button>
                        ))}
                     </div>
                  </div>
                ))}
             </nav>
          </div>
       </aside>

       {/* Settings Content Area */}
       <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
             <motion.div
               key={activeSection}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.3 }}
             >
                {activeSection === 'profile' && renderProfile()}
                {activeSection === 'roles' && renderRoles()}
                {activeSection === 'integrations' && renderIntegrations()}
                {activeSection === 'audit' && renderAudit()}
                {activeSection === 'security' && renderSecurity()}
                {activeSection === 'workflows' && renderWorkflows()}
                {activeSection === 'api' && renderApi()}
                {['org', 'email', 'notifications', 'data'].includes(activeSection) && renderPlaceholder(
                  sections.find(s => s.id === activeSection)?.name || 'In Development',
                  "We're crafting an extraordinary experience for this module. It will be available in an upcoming release."
                )}
             </motion.div>
          </AnimatePresence>
       </main>
    </div>
  );
};

export default Settings;
