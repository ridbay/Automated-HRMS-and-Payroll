
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Users, ShieldCheck, Zap, Globe,
  Mail, Bell, Lock, Database, History,
  Plus, Search, ChevronRight, Save, Trash2,
  Upload, Monitor, FileText,
  Calendar, MapPin, Sliders, Smartphone,
  ArrowRight, UserPlus,
  LayoutGrid, Code,
  Copy, KeyRound, Loader2, Workflow,
  X, ChevronDown, Crown, Star,
  Link2, Unlink, HardDrive, ListChecks,
  Download, CalendarPlus, CheckCheck, Palette, Check
} from 'lucide-react';
import { usePopup } from '../../components/PopupProvider';
import {
  useSettings, useUpdateSettings, useApiKeys, useCreateApiKey, useDeleteApiKey,
  useCompany, useUpdateCompany, useUploadCompanyLogo, useDeleteCompanyLogo, resolveCompanyLogoUrl,
  useDepartments, useCreateDepartment, useDeleteDepartment, useUpdateDepartment,
  useDepartmentMembers, useAssignDepartmentMember, useRemoveDepartmentMember,
  useLocations, useCreateLocation, useDeleteLocation,
  useRoles, useCreateRole, useUpdateRole, useDeleteRole,
  useEmployees,
  useHolidays, useCreateHoliday, useDeleteHoliday,
  useEmailTemplates, useUpdateEmailTemplate,
  useIntegrations, useToggleIntegration,
  useConnectSlack, useDisconnectSlack, useTestSlack,
  useConnectMailgun, useDisconnectMailgun, useTestMailgun,
  useIntegrationEvents,
  useWorkflows, useUpdateWorkflow,
  useDataStats, exportCompanyData,
  useAuditLogs, exportAuditLogsCsv,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { CURATED_PRESETS, DEFAULT_PRIMARY_COLOR, isValidHexColor } from '../../utils/themeColors';

const WEEKDAYS = [
  { iso: 1, label: 'M' }, { iso: 2, label: 'T' }, { iso: 3, label: 'W' }, { iso: 4, label: 'T' },
  { iso: 5, label: 'F' }, { iso: 6, label: 'S' }, { iso: 7, label: 'S' },
];

const AUDIT_MODULES = [
  { key: 'company', label: 'Company' },
  { key: 'settings', label: 'Settings' },
  { key: 'roles', label: 'Roles' },
  { key: 'departments', label: 'Departments' },
  { key: 'locations', label: 'Locations' },
  { key: 'workforce', label: 'Workforce' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'workflows', label: 'Workflows' },
  { key: 'api', label: 'API' },
  { key: 'email', label: 'Email' },
];

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [newKeyName, setNewKeyName] = useState('');
  const { prompt, confirm, alert: popupAlert } = usePopup();

  // These sections (Company Profile, Departments & Locations, Roles & Permissions,
  // API Access) are backed by admin-only endpoints. Every role's nav links to this
  // same Settings page, so guard the underlying queries rather than let non-admins
  // hit a wall of 403s.
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const { data: settings, isLoading: isSettingsLoading } = useSettings(isAdmin);
  const updateSettingsMutation = useUpdateSettings();
  const { data: apiKeys, isLoading: isKeysLoading } = useApiKeys(isAdmin);
  const createApiKeyMutation = useCreateApiKey();
  const deleteApiKeyMutation = useDeleteApiKey();
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

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

  const { data: company, isLoading: isCompanyLoading } = useCompany(isAdmin);
  const updateCompanyMutation = useUpdateCompany();
  const uploadLogoMutation = useUploadCompanyLogo();
  const deleteLogoMutation = useDeleteCompanyLogo();
  const { setPrimaryColor: applyGlobalColor } = useBranding();

  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_PRIMARY_COLOR);
  const [customHexInput, setCustomHexInput] = useState<string>(DEFAULT_PRIMARY_COLOR);

  const { data: departments, isLoading: isDeptsLoading } = useDepartments(isAdmin);
  const { data: locations, isLoading: isLocsLoading } = useLocations(isAdmin);
  const { data: employees = [] } = useEmployees(isAdmin);
  const createDept = useCreateDepartment();
  const deleteDept = useDeleteDepartment();
  const updateDept = useUpdateDepartment();
  const assignDeptMember = useAssignDepartmentMember();
  const removeDeptMember = useRemoveDepartmentMember();
  const createLoc = useCreateLocation();
  const deleteLoc = useDeleteLocation();
  const { data: roles, isLoading: isRolesLoading } = useRoles(isAdmin);
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const [expandedDeptId, setExpandedDeptId] = useState<string | null>(null);
  const [newMemberByDept, setNewMemberByDept] = useState<Record<string, string>>({});
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [permissionsDraft, setPermissionsDraft] = useState<Record<string, Record<string, boolean>>>({});
  const { data: deptMembers, isLoading: isDeptMembersLoading } = useDepartmentMembers(expandedDeptId || undefined);

  // Company Profile extras: branding, working calendar, public holidays
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [workingDaysDraft, setWorkingDaysDraft] = useState<number[]>([1, 2, 3, 4, 5]);
  const [showHolidays, setShowHolidays] = useState(false);
  const { data: holidays, isLoading: isHolidaysLoading } = useHolidays(isAdmin && showHolidays);
  const createHoliday = useCreateHoliday();
  const deleteHoliday = useDeleteHoliday();

  useEffect(() => {
    if (settings?.workingDays) setWorkingDaysDraft(settings.workingDays);
  }, [settings?.workingDays]);

  useEffect(() => {
    if (company?.id && company?.logoUrl) {
      setLogoPreview(resolveCompanyLogoUrl(company.id, company.logoUrl));
    } else if (company && !company.logoUrl) {
      setLogoPreview(null);
    }
  }, [company?.id, company?.logoUrl]);

  useEffect(() => {
    if (company?.primaryColor && isValidHexColor(company.primaryColor)) {
      setSelectedColor(company.primaryColor);
      setCustomHexInput(company.primaryColor);
    }
  }, [company?.primaryColor]);

  // Email Templates
  const { data: emailTemplates, isLoading: isTemplatesLoading } = useEmailTemplates(isAdmin);
  const updateEmailTemplate = useUpdateEmailTemplate();
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
  // null = no unsaved edits yet; falls back to the selected template's saved
  // values. Using null (rather than empty strings) so the fields show the
  // template's real content before the user has typed anything.
  const [templateDraft, setTemplateDraft] = useState<{ subject: string; body: string } | null>(null);

  // Integrations
  const { data: integrations, isLoading: isIntegrationsLoading } = useIntegrations(isAdmin);
  const toggleIntegration = useToggleIntegration();
  const connectSlack = useConnectSlack();
  const disconnectSlack = useDisconnectSlack();
  const testSlack = useTestSlack();
  const [showSlackModal, setShowSlackModal] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [slackError, setSlackError] = useState<string | null>(null);
  const slackConnected = integrations?.find((i: any) => i.key === 'slack')?.status === 'connected';
  const { data: slackEvents } = useIntegrationEvents('slack', isAdmin && slackConnected);

  const connectMailgun = useConnectMailgun();
  const disconnectMailgun = useDisconnectMailgun();
  const testMailgun = useTestMailgun();
  const [showMailgunModal, setShowMailgunModal] = useState(false);
  const [mailgunApiKey, setMailgunApiKey] = useState('');
  const [mailgunDomain, setMailgunDomain] = useState('');
  const [mailgunFrom, setMailgunFrom] = useState('');
  const [mailgunError, setMailgunError] = useState<string | null>(null);
  const mailgunConnected = integrations?.find((i: any) => i.key === 'mailgun')?.status === 'connected';
  const { data: mailgunEvents } = useIntegrationEvents('mailgun', isAdmin && mailgunConnected);

  // Workflows
  const { data: workflows, isLoading: isWorkflowsLoading } = useWorkflows(isAdmin);
  const updateWorkflow = useUpdateWorkflow();
  const [expandedWorkflowKey, setExpandedWorkflowKey] = useState<string | null>(null);
  const [workflowStepsDraft, setWorkflowStepsDraft] = useState<{ id: string; name: string; assignee: string }[]>([]);
  const [newStepName, setNewStepName] = useState('');
  const [newStepAssignee, setNewStepAssignee] = useState('');

  // Data & Backup
  const { data: dataStats, isLoading: isDataStatsLoading } = useDataStats(isAdmin && activeSection === 'data');
  const [isExporting, setIsExporting] = useState(false);

  // Audit Logs
  const [auditSearch, setAuditSearch] = useState('');
  const [auditModule, setAuditModule] = useState('');
  const { data: auditLogs, isLoading: isAuditLoading } = useAuditLogs(
    { module: auditModule || undefined, search: auditSearch || undefined },
    isAdmin && activeSection === 'audit'
  );
  const [isExportingAudit, setIsExportingAudit] = useState(false);

  const handleSaveProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateCompanyMutation.mutate({
      name: formData.get('name') as string,
      registrationNumber: formData.get('registrationNumber') as string,
      industry: formData.get('industry') as string,
      fiscalYearStart: formData.get('fiscalYearStart') as string,
      address: formData.get('address') as string,
      primaryColor: selectedColor,
    }, {
      onSuccess: () => {
        popupAlert('Company identity and branding saved successfully!', 'Settings Saved');
      },
      onError: (err: any) => {
        popupAlert(err.message || 'Failed to update company settings', 'Error');
      }
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      popupAlert('Logo must be 5MB or smaller.', 'File Too Large');
      e.target.value = '';
      return;
    }
    // Show an instant local preview while the real R2 upload is in flight.
    const localPreview = URL.createObjectURL(file);
    setLogoPreview(localPreview);
    uploadLogoMutation.mutate(file, {
      onSuccess: (data: any) => {
        URL.revokeObjectURL(localPreview);
        if (company?.id) setLogoPreview(resolveCompanyLogoUrl(company.id, data.logoUrl));
      },
      onError: (err: any) => {
        URL.revokeObjectURL(localPreview);
        popupAlert(err.message || 'Failed to upload logo.', 'Error');
        setLogoPreview(company?.id ? resolveCompanyLogoUrl(company.id, company.logoUrl) : null);
      },
    });
    e.target.value = '';
  };

  const handleRemoveLogo = async () => {
    if (await confirm('Are you sure you want to remove the custom company logo? This will revert back to the default brand icon.', 'Remove Logo')) {
      deleteLogoMutation.mutate(undefined, {
        onSuccess: () => {
          setLogoPreview(null);
          popupAlert('Company logo removed successfully.', 'Logo Removed');
        },
        onError: (err: any) => {
          popupAlert(err.message || 'Failed to remove logo.', 'Error');
        }
      });
    }
  };

  const handleColorChange = (hex: string) => {
    setSelectedColor(hex);
    setCustomHexInput(hex);
    applyGlobalColor(hex);
  };

  const toggleWorkingDay = (iso: number) => {
    const next = workingDaysDraft.includes(iso)
      ? workingDaysDraft.filter((d) => d !== iso)
      : [...workingDaysDraft, iso].sort((a, b) => a - b);
    setWorkingDaysDraft(next);
    updateSettingsMutation.mutate({ workingDays: next });
  };

  const renderProfile = () => {
    if (isCompanyLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

    return (
      <form onSubmit={handleSaveProfile} className="space-y-10">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Company Identity</h2>
            <p className="text-sm text-slate-500 font-medium">Manage your organization's core details and branding.</p>
          </div>
          <button
            type="submit"
            disabled={updateCompanyMutation.isPending}
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2 disabled:opacity-50"
          >
            {updateCompanyMutation.isPending ? <span className="flex items-center gap-2 animate-pulse"><Zap size={16} /> Saving...</span> : 'Save Changes'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-6">
            {/* Company Logo Card */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                <label className="relative group cursor-pointer mb-4">
                  <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-200 group-hover:border-indigo-500 transition-all overflow-hidden p-2 shadow-inner">
                      {uploadLogoMutation.isPending || deleteLogoMutation.isPending ? (
                        <Loader2 className="animate-spin text-indigo-500" size={32} />
                      ) : logoPreview ? (
                        <img src={logoPreview} alt="Company logo" className="w-full h-full object-contain" />
                      ) : (
                        <Building2 size={48} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                      )}
                  </div>
                  <div className="absolute inset-0 bg-indigo-900/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                      <Upload size={22} className="mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        {logoPreview ? 'Change' : 'Upload'}
                      </span>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    disabled={uploadLogoMutation.isPending || deleteLogoMutation.isPending}
                    onChange={handleLogoChange}
                  />
                </label>
                <h3 className="font-black text-slate-800 text-sm">Company Logo</h3>
                <p className="text-[10px] text-slate-400 uppercase font-black mt-1 tracking-widest">SVG, PNG, JPG, WebP (Max 5MB)</p>

                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={deleteLogoMutation.isPending}
                    className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors border border-rose-100"
                  >
                    <Trash2 size={13} />
                    <span>Remove Logo</span>
                  </button>
                )}
            </div>

            {/* Sitewide Brand & Theme Color Card */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Palette size={16} />
                    </div>
                    <h3 className="font-black text-slate-800 text-sm">Brand Color</h3>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    Customizes buttons, navigation highlights, badges, and focus rings across ZenHR.
                  </p>
                </div>

                {/* Preset Palettes */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Curated Palettes
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CURATED_PRESETS.map((preset) => {
                      const isSelected = selectedColor.toLowerCase() === preset.hex.toLowerCase();
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleColorChange(preset.hex)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all group ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                              : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200'
                          }`}
                        >
                          <div
                            className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
                            style={{ backgroundColor: preset.hex }}
                          >
                            {isSelected && <Check size={13} strokeWidth={3} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black text-slate-800 truncate leading-none">
                              {preset.name}
                            </p>
                            <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                              {preset.hex}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Color Input */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Custom Hex Color
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <input
                        type="color"
                        value={isValidHexColor(selectedColor) ? selectedColor : DEFAULT_PRIMARY_COLOR}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border-2 border-slate-200 p-0.5 bg-white shadow-sm"
                        title="Pick custom color"
                      />
                    </div>
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-xs">
                        #
                      </span>
                      <input
                        type="text"
                        value={customHexInput.replace(/^#/, '')}
                        maxLength={6}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '');
                          setCustomHexInput(`#${val}`);
                          if (val.length === 6 || val.length === 3) {
                            handleColorChange(`#${val}`);
                          }
                        }}
                        placeholder="4F46E5"
                        className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Live UI Preview Card */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Live UI Preview
                    </span>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      Active
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md shadow-indigo-600/20 hover:opacity-95"
                      >
                        Primary Action
                      </button>
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase">
                        Verified
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-xl text-[11px] font-black shadow-sm">
                      <Zap size={14} fill="currentColor" />
                      <span>Sidebar Highlight</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 italic text-center">
                    Instant preview. Save Changes to apply company-wide.
                  </p>
                </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registered Name</label>
                      <input name="name" type="text" defaultValue={company?.name || ''} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold" />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration Number</label>
                      <input name="registrationNumber" type="text" defaultValue={company?.registrationNumber || ''} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Industry</label>
                      <select name="industry" defaultValue={company?.industry || 'Technology & SaaS'} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold">
                        <option value="Fintech / Financial Services">Fintech / Financial Services</option>
                        <option value="Technology & SaaS">Technology & SaaS</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Retail">Retail</option>
                      </select>
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiscal Year Start</label>
                      <select name="fiscalYearStart" defaultValue={company?.fiscalYearStart || 'January'} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold">
                        <option value="January">January</option>
                        <option value="April">April</option>
                        <option value="June">June</option>
                      </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Headquarters Address</label>
                  <textarea name="address" rows={3} defaultValue={company?.address || ''} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold resize-none" />
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
                        {WEEKDAYS.map(({ iso, label }) => (
                          <button
                            key={iso}
                            type="button"
                            onClick={() => toggleWorkingDay(iso)}
                            className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${workingDaysDraft.includes(iso) ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHolidays((v) => !v)}
                    className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                  >
                      <CalendarPlus size={16} /> {showHolidays ? 'Hide Public Holidays' : 'Manage Public Holidays'}
                      <ChevronDown size={14} className={`transition-transform ${showHolidays ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showHolidays && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const fd = new FormData(e.currentTarget);
                              const name = fd.get('name') as string;
                              const date = fd.get('date') as string;
                              if (name && date) createHoliday.mutate({ name, date });
                              e.currentTarget.reset();
                            }}
                            className="flex gap-3"
                          >
                            <input name="name" placeholder="Holiday name (e.g. New Year's Day)" className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none" required />
                            <input name="date" type="date" className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none" required />
                            <button type="submit" disabled={createHoliday.isPending} className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 shrink-0">
                              Add
                            </button>
                          </form>

                          <div className="space-y-2">
                            {isHolidaysLoading ? (
                              <Loader2 className="animate-spin text-indigo-500 mx-auto" size={18} />
                            ) : holidays?.length ? (
                              holidays.map((h: any) => (
                                <div key={h.id} className="flex justify-between items-center px-4 py-3 bg-white rounded-xl border border-slate-100">
                                  <div className="flex items-center gap-3">
                                    <Calendar size={14} className="text-indigo-400" />
                                    <span className="text-xs font-bold text-slate-700">{h.name}</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase">{h.date}</span>
                                  </div>
                                  <button
                                    onClick={async () => {
                                      if (await confirm(`Remove "${h.name}" from the holiday calendar?`, 'Remove Holiday')) {
                                        deleteHoliday.mutate(h.id);
                                      }
                                    }}
                                    className="text-slate-300 hover:text-rose-500"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <p className="text-[10px] text-slate-400 font-bold uppercase text-center py-3">No holidays added yet</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
            </div>
          </div>
        </div>
      </form>
    );
  };

  const renderOrg = () => {
    return (
      <div className="space-y-10">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Departments & Locations</h2>
            <p className="text-sm text-slate-500 font-medium">Manage your organizational structure and office locations.</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><Globe className="text-indigo-500" /> Departments</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              if (fd.get('name')) {
                createDept.mutate({
                  name: fd.get('name') as string,
                  description: fd.get('description') as string,
                  managerId: (fd.get('managerId') as string) || undefined,
                  teamLeadId: (fd.get('teamLeadId') as string) || undefined,
                });
              }
              e.currentTarget.reset();
            }}
            className="space-y-3 mb-6 p-6 bg-slate-50 rounded-2xl border border-slate-100"
          >
            <div className="flex gap-4">
              <input name="name" placeholder="Name (e.g. Engineering)" className="w-1/2 px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none" required />
              <input name="description" placeholder="Description" className="w-1/2 px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none" />
            </div>
            <div className="flex gap-4">
              <select name="managerId" defaultValue="" className="w-1/2 px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none">
                <option value="">Manager (optional)</option>
                {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name} {e.lastName}</option>)}
              </select>
              <select name="teamLeadId" defaultValue="" className="w-1/2 px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none">
                <option value="">Team Lead (optional)</option>
                {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name} {e.lastName}</option>)}
              </select>
            </div>
            <button type="submit" disabled={createDept.isPending} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700">+ Add Department</button>
          </form>

          <div className="space-y-3">
            {isDeptsLoading ? <Loader2 className="animate-spin text-indigo-500 mx-auto" /> : departments?.map((d: any) => {
              const isExpanded = expandedDeptId === d.id;
              return (
                <div key={d.id} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="flex justify-between items-start p-4 gap-4">
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 truncate">{d.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{d.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        {d.memberCount || 0} {d.memberCount === 1 ? 'member' : 'members'}
                      </span>
                      <button
                        onClick={async () => {
                          if (await confirm(`Delete "${d.name}"? Members will be unassigned, not deleted.`, 'Delete Department')) {
                            deleteDept.mutate(d.id);
                          }
                        }}
                        className="text-rose-400 hover:text-rose-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Crown size={10} /> Manager</label>
                      <select
                        value={d.managerId || ''}
                        onChange={(e) => updateDept.mutate({ id: d.id, data: { managerId: e.target.value || null } })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none"
                      >
                        <option value="">Unassigned</option>
                        {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name} {e.lastName}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Star size={10} /> Team Lead</label>
                      <select
                        value={d.teamLeadId || ''}
                        onChange={(e) => updateDept.mutate({ id: d.id, data: { teamLeadId: e.target.value || null } })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none"
                      >
                        <option value="">Unassigned</option>
                        {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name} {e.lastName}</option>)}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedDeptId(isExpanded ? null : d.id)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white border-t border-slate-200 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50/50 transition-colors"
                  >
                    {isExpanded ? 'Hide Members' : 'Manage Members'}
                    <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-200 bg-white"
                      >
                        <div className="p-4 space-y-3">
                          <div className="flex gap-2">
                            <select
                              value={newMemberByDept[d.id] || ''}
                              onChange={(e) => setNewMemberByDept((prev) => ({ ...prev, [d.id]: e.target.value }))}
                              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none"
                            >
                              <option value="">Add existing employee...</option>
                              {employees.filter((e: any) => e.departmentId !== d.id).map((e: any) => (
                                <option key={e.id} value={e.id}>{e.name} {e.lastName}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                const employeeId = newMemberByDept[d.id];
                                if (!employeeId) return;
                                assignDeptMember.mutate({ departmentId: d.id, employeeId });
                                setNewMemberByDept((prev) => ({ ...prev, [d.id]: '' }));
                              }}
                              disabled={!newMemberByDept[d.id] || assignDeptMember.isPending}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-40"
                            >
                              Add
                            </button>
                          </div>

                          <div className="space-y-2">
                            {isDeptMembersLoading ? (
                              <Loader2 className="animate-spin text-indigo-500 mx-auto" size={18} />
                            ) : deptMembers?.length ? (
                              deptMembers.map((m: any) => (
                                <div key={m.id} className="flex justify-between items-center px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs font-bold text-slate-700 truncate">{m.name} {m.lastName}</span>
                                    {m.id === d.managerId && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[8px] font-black uppercase">Manager</span>}
                                    {m.id === d.teamLeadId && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[8px] font-black uppercase">Lead</span>}
                                  </div>
                                  <button
                                    onClick={() => removeDeptMember.mutate({ departmentId: d.id, employeeId: m.id })}
                                    className="text-slate-300 hover:text-rose-500 shrink-0"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <p className="text-[10px] text-slate-400 font-bold uppercase text-center py-3">No members yet</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><MapPin className="text-indigo-500" /> Locations</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              if (fd.get('name')) createLoc.mutate({ name: fd.get('name') as string, address: fd.get('address') as string, city: fd.get('city') as string, country: fd.get('country') as string });
              e.currentTarget.reset();
            }}
            className="space-y-3 mb-6"
          >
            <div className="flex gap-4">
              <input name="name" placeholder="Name (e.g. HQ)" className="w-1/2 px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-xs outline-none" required />
              <input name="city" placeholder="City" className="w-1/2 px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-xs outline-none" />
            </div>
            <div className="flex gap-4">
              <input name="country" placeholder="Country" className="w-1/2 px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-xs outline-none" />
              <input name="address" placeholder="Full Address" className="w-1/2 px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-xs outline-none" required />
            </div>
            <button type="submit" disabled={createLoc.isPending} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700">Add Location</button>
          </form>
          <div className="space-y-3">
            {isLocsLoading ? <Loader2 className="animate-spin text-indigo-500 mx-auto" /> : locations?.map((l: any) => (
              <div key={l.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-800">{l.name}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{l.city}, {l.country}</p>
                </div>
                <button
                  onClick={async () => {
                    if (await confirm(`Remove location "${l.name}"?`, 'Remove Location')) {
                      deleteLoc.mutate(l.id);
                    }
                  }}
                  className="text-rose-400 hover:text-rose-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Mirrors the module/action shape enforced server-side (requirePermission in
  // api/src/middlewares/role.middleware.ts). A blank cell means that action
  // has no real route behind it for this module — kept off rather than faked.
  const PERMISSION_MODULES: { key: string; label: string; actions: string[] }[] = [
    { key: 'workforce', label: 'Workforce', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'payroll', label: 'Payroll', actions: ['view', 'approve'] },
    { key: 'performance', label: 'Performance', actions: ['view', 'create', 'edit'] },
    { key: 'leave', label: 'Leave & Time Off', actions: ['view', 'approve'] },
    { key: 'attendance', label: 'Time & Attendance', actions: ['view', 'edit', 'approve'] },
    { key: 'settings', label: 'Settings', actions: ['view', 'edit'] },
  ];
  const PERMISSION_COLUMNS: { key: string; label: string }[] = [
    { key: 'view', label: 'View' },
    { key: 'create', label: 'Create' },
    { key: 'edit', label: 'Edit' },
    { key: 'delete', label: 'Delete' },
    { key: 'approve', label: 'Approve' },
  ];

  const selectedRole = roles?.find((r: any) => r.id === selectedRoleId) || null;

  const selectRole = (role: any) => {
    setSelectedRoleId(role.id);
    setPermissionsDraft(role.permissions && typeof role.permissions === 'object' ? role.permissions : {});
  };

  const togglePermission = (moduleKey: string, action: string) => {
    setPermissionsDraft((prev) => ({
      ...prev,
      [moduleKey]: { ...(prev[moduleKey] || {}), [action]: !prev[moduleKey]?.[action] },
    }));
  };

  const handleDeleteRole = async (role: any) => {
    const usageWarning = role.usersCount > 0 ? ` ${role.usersCount} employee${role.usersCount === 1 ? '' : 's'} currently ${role.usersCount === 1 ? 'has' : 'have'} it assigned and will fall back to their base role.` : '';
    if (await confirm(`Delete the "${role.name}" role?${usageWarning}`, 'Delete Role')) {
      deleteRole.mutate(role.id);
      if (selectedRoleId === role.id) {
        setSelectedRoleId(null);
        setPermissionsDraft({});
      }
    }
  };

  const renderRoles = () => {
    return (
      <div className="space-y-10">
        <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-slate-800">RBAC Controls</h2>
              <p className="text-sm text-slate-500 font-medium">Define access layers and administrative permissions. Custom roles narrow what an employee's base role already allows — they can't grant more.</p>
            </div>
            <button
              onClick={async () => {
                const name = await prompt("Enter role name:");
                if (name) createRole.mutate({ name, permissions: {}, color: 'indigo', description: 'Custom role' });
              }}
              disabled={createRole.isPending}
              className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2"
            >
              <Plus size={18} /> {createRole.isPending ? 'Creating...' : 'Create Custom Role'}
            </button>
        </div>

        {isRolesLoading ? <Loader2 className="animate-spin text-indigo-500 mx-auto" /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles?.map((role: any) => (
              <motion.div
                key={role.id}
                whileHover={{ y: -5 }}
                onClick={() => selectRole(role)}
                className={`bg-white p-8 rounded-[2.5rem] border shadow-sm relative group cursor-pointer transition-all ${selectedRoleId === role.id ? 'border-indigo-600 ring-4 ring-indigo-500/10' : 'border-slate-200'}`}
              >
                  <div className={`absolute top-0 right-0 w-16 h-16 bg-${role.color || 'slate'}-50 rounded-full -mr-8 -mt-8`} />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteRole(role); }}
                    className="absolute top-6 right-6 text-slate-300 hover:text-rose-500 transition-colors z-10"
                    title="Delete role"
                  >
                    <Trash2 size={16} />
                  </button>
                  <h3 className="text-lg font-black text-slate-800 mb-2 pr-6">{role.name}</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">{role.description || 'No description'}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{role.usersCount || 0} Users</span>
                    <button className={`p-2 transition-all ${selectedRoleId === role.id ? 'text-indigo-600' : 'text-slate-300 group-hover:text-indigo-600'}`}>
                        <ChevronRight size={20} />
                    </button>
                  </div>
              </motion.div>
            ))}
            {roles && roles.length === 0 && (
              <p className="col-span-full text-center text-sm text-slate-400 font-medium py-10">No custom roles yet — every employee is governed by their base role only.</p>
            )}
          </div>
        )}

        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">
                Permission Matrix {selectedRole ? `(${selectedRole.name})` : ''}
              </h3>
              {selectedRole && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setPermissionsDraft(selectedRole.permissions || {})}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:underline"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={() => updateRole.mutate({ id: selectedRole.id, data: { permissions: permissionsDraft } })}
                    disabled={updateRole.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Save size={14} /> {updateRole.isPending ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              )}
            </div>

            {!selectedRole ? (
              <div className="p-16 text-center">
                <ShieldCheck className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-sm font-bold text-slate-400">Select a role above to view and edit its permissions.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr>
                          <th className="px-10 py-5">Module</th>
                          {PERMISSION_COLUMNS.map((col) => (
                            <th key={col.key} className="px-8 py-5 text-center">{col.label}</th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {PERMISSION_MODULES.map((mod) => (
                          <tr key={mod.key} className="hover:bg-slate-50/50 transition-all">
                            <td className="px-10 py-5">
                                <span className="text-xs font-black text-slate-700 uppercase">{mod.label}</span>
                            </td>
                            {PERMISSION_COLUMNS.map((col) => (
                              <td key={col.key} className="px-8 py-5 text-center">
                                  <div className="flex justify-center">
                                    {mod.actions.includes(col.key) ? (
                                      <input
                                        type="checkbox"
                                        checked={!!permissionsDraft[mod.key]?.[col.key]}
                                        onChange={() => togglePermission(mod.key, col.key)}
                                        className="w-5 h-5 rounded-lg border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500/20 transition-all cursor-pointer accent-indigo-600"
                                      />
                                    ) : (
                                      <span className="text-slate-200">—</span>
                                    )}
                                  </div>
                              </td>
                            ))}
                          </tr>
                      ))}
                    </tbody>
                </table>
              </div>
            )}
        </div>
      </div>
    );
  };

  const renderIntegrations = () => (
    <div className="space-y-10">
       <div>
          <h2 className="text-2xl font-black text-slate-800">App Ecosystem</h2>
          <p className="text-sm text-slate-500 font-medium">Connect ZenHR with your existing productivity and finance stack.</p>
       </div>

       {isIntegrationsLoading ? <Loader2 className="animate-spin text-indigo-500 mx-auto" /> : (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {integrations?.map((app: any) => {
              const isConnected = app.status === 'connected';
              const isSlack = app.key === 'slack';
              const isMailgun = app.key === 'mailgun';
              // Slack (an Incoming Webhook) and Mailgun (API key + domain) both
              // have a real connection behind them — everything else is still
              // just this on/off catalog state, so it's labeled honestly rather
              // than implying a live handshake that doesn't exist.
              const isReal = isSlack || isMailgun;
              const ICONS: Record<string, React.ReactNode> = {
                google_calendar: <Calendar />, slack: <Smartphone />, paystack: <Globe />,
                outlook: <Mail />, zoom: <Monitor />, quickbooks: <Database />, mailgun: <Mail />,
              };
              return (
                <motion.div
                  key={app.id}
                  whileHover={{ y: -5 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group"
                >
                   <div className="flex justify-between items-start mb-8">
                      <div className="w-14 h-14 bg-slate-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                         {ICONS[app.key] || <LayoutGrid />}
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {isConnected ? 'Connected' : 'Available'}
                      </span>
                   </div>
                   <h3 className="text-lg font-black text-slate-800 mb-1">{app.name}</h3>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">{app.category}</p>
                   {!isReal && (
                     <p className="text-[10px] text-amber-500 font-bold mb-4">Requires setup — not live yet</p>
                   )}
                   {isSlack && isConnected && app.lastError && (
                     <p className="text-[10px] text-rose-500 font-bold mb-4">Last delivery failed: {app.lastError}</p>
                   )}
                   {isMailgun && isConnected && app.lastError && (
                     <p className="text-[10px] text-rose-500 font-bold mb-4">Last delivery failed: {app.lastError}</p>
                   )}

                   {isSlack ? (
                     isConnected ? (
                       <div className="space-y-2">
                         <button
                           onClick={() => testSlack.mutate(undefined, { onError: (e: any) => popupAlert(e.message, 'Test Failed') })}
                           disabled={testSlack.isPending}
                           className="w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
                         >
                           {testSlack.isPending ? 'Sending…' : 'Send Test Message'}
                         </button>
                         <button
                           onClick={() => disconnectSlack.mutate()}
                           disabled={disconnectSlack.isPending}
                           className="w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center gap-2 disabled:opacity-50"
                         >
                           <Unlink size={13} /> Disconnect
                         </button>
                       </div>
                     ) : (
                       <button
                         onClick={() => { setSlackWebhookUrl(''); setSlackError(null); setShowSlackModal(true); }}
                         className="w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                       >
                         <Link2 size={13} /> Connect Slack
                       </button>
                     )
                   ) : isMailgun ? (
                     isConnected ? (
                       <div className="space-y-2">
                         <button
                           onClick={() => testMailgun.mutate(undefined, { onError: (e: any) => popupAlert(e.message, 'Test Failed') })}
                           disabled={testMailgun.isPending}
                           className="w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
                         >
                           {testMailgun.isPending ? 'Sending…' : 'Send Test Email'}
                         </button>
                         <button
                           onClick={() => disconnectMailgun.mutate()}
                           disabled={disconnectMailgun.isPending}
                           className="w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center gap-2 disabled:opacity-50"
                         >
                           <Unlink size={13} /> Disconnect
                         </button>
                       </div>
                     ) : (
                       <button
                         onClick={() => { setMailgunApiKey(''); setMailgunDomain(''); setMailgunFrom(''); setMailgunError(null); setShowMailgunModal(true); }}
                         className="w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                       >
                         <Link2 size={13} /> Connect Mailgun
                       </button>
                     )
                   ) : (
                     <button
                       onClick={() => toggleIntegration.mutate(app.key)}
                       disabled={toggleIntegration.isPending}
                       className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                         isConnected ? 'bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600' : 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700'
                       }`}
                     >
                       {isConnected ? <><Unlink size={13} /> Disconnect</> : <><Link2 size={13} /> Connect Account</>}
                     </button>
                   )}
                </motion.div>
              );
            })}
         </div>
       )}

       {slackConnected && slackEvents?.length > 0 && (
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
           <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Recent Slack Activity</h3>
           <div className="space-y-2">
             {slackEvents.slice(0, 8).map((e: any) => (
               <div key={e.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                 <span className="text-xs font-bold text-slate-600 truncate">{e.payloadSummary}</span>
                 <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg shrink-0 ml-3 ${
                   e.status === 'sent' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                 }`}>{e.status}</span>
               </div>
             ))}
           </div>
         </div>
       )}

       {mailgunConnected && mailgunEvents?.length > 0 && (
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
           <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Recent Mailgun Activity</h3>
           <div className="space-y-2">
             {mailgunEvents.slice(0, 8).map((e: any) => (
               <div key={e.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                 <span className="text-xs font-bold text-slate-600 truncate">{e.payloadSummary}</span>
                 <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg shrink-0 ml-3 ${
                   e.status === 'sent' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                 }`}>{e.status}</span>
               </div>
             ))}
           </div>
         </div>
       )}

       {showSlackModal && (
         <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-6">
           <div className="bg-white rounded-3xl p-10 max-w-lg w-full shadow-2xl">
             <h3 className="text-xl font-black text-slate-800 mb-2">Connect Slack</h3>
             <p className="text-sm text-slate-500 font-medium mb-6">
               In Slack, create an{' '}
               <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noreferrer" className="text-indigo-600 underline">
                 Incoming Webhook
               </a>{' '}
               for the channel you want notifications in, then paste the URL below.
             </p>
             {slackError && <p className="text-xs font-bold text-rose-500 mb-4">{slackError}</p>}
             <input
               value={slackWebhookUrl}
               onChange={(e) => setSlackWebhookUrl(e.target.value)}
               placeholder="https://hooks.slack.com/services/…"
               className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-medium text-sm border border-transparent focus:border-indigo-400 mb-6"
             />
             <div className="flex gap-3">
               <button
                 onClick={() => setShowSlackModal(false)}
                 className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest"
               >
                 Cancel
               </button>
               <button
                 disabled={connectSlack.isPending}
                 onClick={() =>
                   connectSlack.mutate(slackWebhookUrl, {
                     onSuccess: () => setShowSlackModal(false),
                     onError: (e: any) => setSlackError(e.message || 'Failed to connect Slack'),
                   })
                 }
                 className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50"
               >
                 {connectSlack.isPending ? 'Connecting…' : 'Connect'}
               </button>
             </div>
           </div>
         </div>
       )}

       {showMailgunModal && (
         <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-6">
           <div className="bg-white rounded-3xl p-10 max-w-lg w-full shadow-2xl">
             <h3 className="text-xl font-black text-slate-800 mb-2">Connect Mailgun</h3>
             <p className="text-sm text-slate-500 font-medium mb-6">
               Paste your{' '}
               <a href="https://app.mailgun.com/app/account/security/api_keys" target="_blank" rel="noreferrer" className="text-indigo-600 underline">
                 Mailgun API key
               </a>{' '}
               and sending domain to enable transactional email delivery (leave requests, payslips, etc.).
             </p>
             {mailgunError && <p className="text-xs font-bold text-rose-500 mb-4">{mailgunError}</p>}
             <div className="space-y-3 mb-6">
               <input
                 value={mailgunApiKey}
                 onChange={(e) => setMailgunApiKey(e.target.value)}
                 placeholder="Mailgun API Key"
                 type="password"
                 className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-medium text-sm border border-transparent focus:border-indigo-400"
               />
               <input
                 value={mailgunDomain}
                 onChange={(e) => setMailgunDomain(e.target.value)}
                 placeholder="mg.yourcompany.com"
                 className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-medium text-sm border border-transparent focus:border-indigo-400"
               />
               <input
                 value={mailgunFrom}
                 onChange={(e) => setMailgunFrom(e.target.value)}
                 placeholder="From address (optional) — hr@yourcompany.com"
                 className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-medium text-sm border border-transparent focus:border-indigo-400"
               />
             </div>
             <div className="flex gap-3">
               <button
                 onClick={() => setShowMailgunModal(false)}
                 className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest"
               >
                 Cancel
               </button>
               <button
                 disabled={connectMailgun.isPending}
                 onClick={() =>
                   connectMailgun.mutate(
                     { apiKey: mailgunApiKey, domain: mailgunDomain, from: mailgunFrom || undefined },
                     {
                       onSuccess: () => setShowMailgunModal(false),
                       onError: (e: any) => setMailgunError(e.message || 'Failed to connect Mailgun'),
                     }
                   )
                 }
                 className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50"
               >
                 {connectMailgun.isPending ? 'Connecting…' : 'Connect'}
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );

  const renderAudit = () => {
    const severityColor = (sev: string) => sev === 'warning' ? 'text-amber-600' : 'text-slate-600';
    return (
      <div className="space-y-10">
         <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div>
               <h2 className="text-2xl font-black text-slate-800">Security Audit Logs</h2>
               <p className="text-sm text-slate-500 font-medium">Immutable record of administrative actions across the org (latest 200).</p>
            </div>
            <div className="flex gap-3">
               <div className="relative">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Search actor, action, details..."
                    className="pl-10 pr-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs outline-none w-56"
                  />
               </div>
               <select
                 value={auditModule}
                 onChange={(e) => setAuditModule(e.target.value)}
                 className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest outline-none"
               >
                 <option value="">All Modules</option>
                 {AUDIT_MODULES.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
               </select>
               <button
                 onClick={async () => {
                   setIsExportingAudit(true);
                   try { await exportAuditLogsCsv(); } catch (e: any) { popupAlert(e.message, 'Export Failed'); }
                   setIsExportingAudit(false);
                 }}
                 disabled={isExportingAudit}
                 className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
               >
                  <Download size={16} /> {isExportingAudit ? 'Exporting...' : 'Export CSV'}
               </button>
            </div>
         </div>

         <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                     <tr>
                        <th className="px-10 py-5">Timestamp</th>
                        <th className="px-8 py-5">Actor</th>
                        <th className="px-8 py-5">Action</th>
                        <th className="px-8 py-5">Module</th>
                        <th className="px-8 py-5">IP Address</th>
                        <th className="px-10 py-5">Details</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {isAuditLoading ? (
                       <tr><td colSpan={6} className="py-16 text-center"><Loader2 className="animate-spin text-indigo-500 mx-auto" /></td></tr>
                     ) : auditLogs?.length ? auditLogs.map((log: any) => (
                       <tr key={log.id} className="hover:bg-slate-50/50 transition-all group">
                          <td className="px-10 py-5">
                             <span className="text-xs font-bold text-slate-500 font-mono whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</span>
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-md flex items-center justify-center text-[10px] font-black shrink-0">
                                   {log.actorName?.[0] || '?'}
                                </div>
                                <span className="text-xs font-black text-slate-700 whitespace-nowrap">{log.actorName}</span>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <span className={`text-xs font-bold ${severityColor(log.severity)}`}>{log.action}</span>
                          </td>
                          <td className="px-8 py-5">
                             <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[9px] font-black uppercase whitespace-nowrap">{log.module || '—'}</span>
                          </td>
                          <td className="px-8 py-5">
                             <span className="text-xs font-medium text-slate-400 font-mono">{log.ipAddress || '—'}</span>
                          </td>
                          <td className="px-10 py-5 max-w-xs">
                             <span className="text-xs font-medium text-slate-500 line-clamp-1" title={log.details}>{log.details || '—'}</span>
                          </td>
                       </tr>
                     )) : (
                       <tr><td colSpan={6} className="py-16 text-center text-sm font-bold text-slate-400">No audit activity matches these filters yet.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    );
  };

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

  const renderNotifications = () => {
    if (isSettingsLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

    const NOTIF_ROWS: { key: string; label: string; desc: string; icon: React.ReactNode }[] = [
      { key: 'notifyLeaveRequests', label: 'Leave Requests', desc: 'Alert HR/Managers when an employee submits or updates a leave request.', icon: <Calendar size={20} /> },
      { key: 'notifyPayrollRuns', label: 'Payroll Runs', desc: 'Notify admins when a payroll run is submitted, approved, or paid.', icon: <Zap size={20} /> },
      { key: 'notifyNewHires', label: 'New Hires', desc: 'Notify the team when a new employee is onboarded.', icon: <UserPlus size={20} /> },
      { key: 'notifyComplianceAlerts', label: 'Compliance Alerts', desc: 'Statutory remittance deadlines and compliance task reminders.', icon: <ShieldCheck size={20} /> },
      { key: 'notifyWeeklyDigest', label: 'Weekly Digest', desc: 'A weekly summary email of workforce, payroll, and recruitment activity.', icon: <Mail size={20} /> },
    ];

    return (
      <div className="space-y-10">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Notification Preferences</h2>
          <p className="text-sm text-slate-500 font-medium">Choose which events trigger notifications for your admin team.</p>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-10 space-y-6">
          {NOTIF_ROWS.map((row) => {
            const enabled = !!(settings as any)?.[row.key];
            return (
              <div key={row.key} className="flex items-center justify-between p-6 border-2 border-slate-100 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
                    {row.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{row.label}</h4>
                    <p className="text-xs font-medium text-slate-500">{row.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSettingsMutation.mutate({ [row.key]: !enabled })}
                  className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${enabled ? 'bg-indigo-500' : 'bg-slate-200'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderEmailTemplates = () => {
    const selected = emailTemplates?.find((t: any) => t.key === selectedTemplateKey) || emailTemplates?.[0] || null;
    const activeKey = selectedTemplateKey || selected?.key;
    const draft = templateDraft || { subject: selected?.subject || '', body: selected?.body || '' };

    return (
      <div className="space-y-10">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Email Templates</h2>
          <p className="text-sm text-slate-500 font-medium">Customize the transactional emails ZenHR sends on your behalf. Use <code className="px-1 bg-slate-100 rounded text-indigo-600">{'{{variables}}'}</code> to personalize.</p>
        </div>

        {isTemplatesLoading ? <Loader2 className="animate-spin text-indigo-500 mx-auto" /> : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-4 space-y-2 h-fit">
              {emailTemplates?.map((t: any) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setSelectedTemplateKey(t.key);
                    setTemplateDraft(null);
                  }}
                  className={`w-full text-left px-5 py-4 rounded-2xl transition-all ${activeKey === t.key ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="font-black text-sm block">{t.name}</span>
                  <span className={`text-[10px] uppercase font-black tracking-widest ${activeKey === t.key ? 'text-indigo-200' : 'text-slate-400'}`}>{t.key}</span>
                </button>
              ))}
            </div>

            <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-200 shadow-sm p-10 space-y-6">
              {!selected ? (
                <p className="text-sm font-bold text-slate-400 text-center py-16">Select a template to edit.</p>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-black text-slate-800">{selected.name}</h3>
                    <button
                      onClick={() => updateEmailTemplate.mutate({
                        key: selected.key,
                        data: { subject: draft.subject, body: draft.body },
                      })}
                      disabled={updateEmailTemplate.isPending}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Save size={14} /> {updateEmailTemplate.isPending ? 'Saving...' : 'Save Template'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</label>
                    <input
                      value={draft.subject}
                      onChange={(e) => setTemplateDraft({ ...draft, subject: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Body</label>
                    <textarea
                      rows={12}
                      value={draft.body}
                      onChange={(e) => setTemplateDraft({ ...draft, body: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm leading-relaxed resize-none"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const openWorkflow = (wf: any) => {
    const isOpen = expandedWorkflowKey === wf.key;
    setExpandedWorkflowKey(isOpen ? null : wf.key);
    if (!isOpen) setWorkflowStepsDraft(wf.steps || []);
  };

  const renderWorkflows = () => (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800">HR Workflows & Automations</h2>
          <p className="text-sm text-slate-500 font-medium">Configure automated task pipelines for onboarding and offboarding.</p>
        </div>
      </div>

      {isWorkflowsLoading ? <Loader2 className="animate-spin text-indigo-500 mx-auto" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workflows?.map((wf: any) => {
            const isExpanded = expandedWorkflowKey === wf.key;
            return (
              <div key={wf.key} className="bg-white rounded-[2.5rem] border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -z-10" />
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <Workflow className="text-indigo-500" size={32} />
                    <button
                      onClick={() => updateWorkflow.mutate({ key: wf.key, data: { enabled: !wf.enabled } })}
                      className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${wf.enabled ? 'bg-indigo-500' : 'bg-slate-200'}`}
                      title={wf.enabled ? 'Enabled' : 'Disabled'}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${wf.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-2">{wf.name}</h3>
                  <p className="text-xs font-medium text-slate-500 mb-6">{wf.description}</p>
                  <button onClick={() => openWorkflow(wf)} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                    {isExpanded ? 'Close Pipeline' : 'Edit Pipeline'}
                    {isExpanded ? <ChevronDown size={14} /> : <ArrowRight size={14} />}
                  </button>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-slate-100 bg-slate-50/50"
                    >
                      <div className="p-6 space-y-3">
                        {workflowStepsDraft.map((step, i) => (
                          <div key={step.id} className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-100">
                            <ListChecks size={14} className="text-indigo-400 shrink-0" />
                            <input
                              value={step.name}
                              onChange={(e) => setWorkflowStepsDraft((prev) => prev.map((s, idx) => idx === i ? { ...s, name: e.target.value } : s))}
                              className="flex-1 text-xs font-bold text-slate-700 outline-none min-w-0"
                            />
                            <input
                              value={step.assignee}
                              onChange={(e) => setWorkflowStepsDraft((prev) => prev.map((s, idx) => idx === i ? { ...s, assignee: e.target.value } : s))}
                              className="w-28 text-[10px] font-black text-indigo-500 uppercase text-right outline-none shrink-0"
                            />
                            <button onClick={() => setWorkflowStepsDraft((prev) => prev.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-rose-500 shrink-0">
                              <X size={14} />
                            </button>
                          </div>
                        ))}

                        <div className="flex gap-2">
                          <input
                            value={newStepName}
                            onChange={(e) => setNewStepName(e.target.value)}
                            placeholder="New step..."
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none min-w-0"
                          />
                          <input
                            value={newStepAssignee}
                            onChange={(e) => setNewStepAssignee(e.target.value)}
                            placeholder="Assignee"
                            className="w-28 px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none shrink-0"
                          />
                          <button
                            onClick={() => {
                              if (!newStepName.trim()) return;
                              setWorkflowStepsDraft((prev) => [...prev, { id: `s${Date.now()}`, name: newStepName.trim(), assignee: newStepAssignee.trim() || 'Unassigned' }]);
                              setNewStepName('');
                              setNewStepAssignee('');
                            }}
                            className="px-3 py-2 bg-slate-800 text-white rounded-xl shrink-0"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button
                          onClick={() => updateWorkflow.mutate({ key: wf.key, data: { steps: workflowStepsDraft } })}
                          disabled={updateWorkflow.isPending}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <Save size={14} /> {updateWorkflow.isPending ? 'Saving...' : 'Save Pipeline'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
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
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(key.key);
                        setCopiedKeyId(key.id);
                        setTimeout(() => setCopiedKeyId((c) => (c === key.id ? null : c)), 1500);
                      }}
                      className="p-3 bg-white text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm transition-colors border border-slate-200"
                      title="Copy key"
                    >
                      {copiedKeyId === key.id ? <CheckCheck size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                    <button
                      onClick={async () => {
                        if (await confirm(`Revoke API key "${key.name}"? Anything using it will stop working immediately.`, 'Revoke API Key')) {
                          deleteApiKeyMutation.mutate(key.id);
                        }
                      }}
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

  const renderData = () => (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Data & Backup</h2>
          <p className="text-sm text-slate-500 font-medium">A snapshot of what's stored, and an on-demand export of your company's records.</p>
        </div>
        <button
          onClick={async () => {
            setIsExporting(true);
            try { await exportCompanyData(); } catch (e: any) { popupAlert(e.message, 'Export Failed'); }
            setIsExporting(false);
          }}
          disabled={isExporting}
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2 disabled:opacity-50"
        >
          <Download size={16} /> {isExporting ? 'Preparing Export...' : 'Export Full Backup (JSON)'}
        </button>
      </div>

      {isDataStatsLoading ? <Loader2 className="animate-spin text-indigo-500 mx-auto" /> : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { label: 'Employees', value: dataStats?.employees ?? 0, sub: `${dataStats?.activeEmployees ?? 0} active`, icon: <Users size={22} /> },
            { label: 'Departments', value: dataStats?.departments ?? 0, icon: <Globe size={22} /> },
            { label: 'Locations', value: dataStats?.locations ?? 0, icon: <MapPin size={22} /> },
            { label: 'Documents', value: dataStats?.documents ?? 0, icon: <FileText size={22} /> },
            { label: 'Payroll Runs', value: dataStats?.payrollRuns ?? 0, icon: <Zap size={22} /> },
            { label: 'Job Requisitions', value: dataStats?.jobRequisitions ?? 0, icon: <LayoutGrid size={22} /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-6">
                {stat.icon}
              </div>
              <p className="text-3xl font-black text-slate-800">{stat.value.toLocaleString()}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
              {stat.sub && <p className="text-[10px] font-bold text-emerald-500 mt-1">{stat.sub}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-10 flex items-center gap-6">
        <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center shrink-0">
          <HardDrive size={26} />
        </div>
        <div>
          <h4 className="font-bold text-slate-800">About this export</h4>
          <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">
            Downloads a sanitized JSON snapshot of company profile, settings, employees, departments, locations, roles, and payroll runs.
            Password hashes and raw document files are never included. Every export is recorded in the Audit Logs.
          </p>
        </div>
      </div>
    </div>
  );

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 px-4 min-h-[60vh]">
        <div className="w-28 h-28 bg-indigo-50 rounded-full flex items-center justify-center mb-8 border-4 border-white shadow-xl shadow-indigo-100/50">
          <ShieldCheck size={44} className="text-indigo-300" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Org Setup is Admin-Only</h2>
        <p className="text-slate-500 font-medium max-w-md">
          Company profile, roles &amp; permissions, integrations, and other organization-wide settings are managed by your Super Admin or HR Admin. Reach out to them if something needs to change.
        </p>
      </div>
    );
  }

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
                {activeSection === 'org' && renderOrg()}
                {activeSection === 'notifications' && renderNotifications()}
                {activeSection === 'email' && renderEmailTemplates()}
                {activeSection === 'data' && renderData()}
             </motion.div>
          </AnimatePresence>
       </main>
    </div>
  );
};

export default Settings;
