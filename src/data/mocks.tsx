
import React from 'react';
import { 
  LayoutDashboard, Users, Wallet, Briefcase, Trophy, 
  Clock, Settings, UserCircle, Heart, BarChart3 
} from 'lucide-react';
import { Employee, Badge, PayrollEntry, WalletTransaction, JobCandidate, AttendanceRecord, LeaveBalance, PerformanceGoal, Feedback, LeaveRequest, Benefit, LoanRecord, ComplianceTask, TaxBracket, JobRequisition, Candidate, Interview } from '../types/index';

export const NAV_ITEMS = [
  { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: 'dashboard' },
  { name: 'Workforce', icon: <Users size={20} />, path: 'workforce' },
  { name: 'Attendance', icon: <Clock size={20} />, path: 'attendance' },
  { name: 'Payroll & Wallet', icon: <Wallet size={20} />, path: 'payroll' },
  { name: 'Benefits', icon: <Heart size={20} />, path: 'benefits' },
  { name: 'Performance', icon: <Trophy size={20} />, path: 'performance' },
  { name: 'Recruitment', icon: <Briefcase size={20} />, path: 'recruitment' },
  { name: 'Reports', icon: <BarChart3 size={20} />, path: 'reports' },
  { name: 'My Portal', icon: <UserCircle size={20} />, path: 'portal' },
  { name: 'Settings', icon: <Settings size={20} />, path: 'settings' },
];

export const MOCK_REQUISITIONS: JobRequisition[] = [
  {
    id: 'REQ-001',
    title: 'Senior React Developer',
    department: 'Engineering',
    location: 'Remote',
    hiringManager: 'Diana Prince',
    managerAvatar: 'https://i.pravatar.cc/150?u=diana',
    priority: 'High',
    status: 'Open',
    dateOpened: '2024-05-10',
    targetHireDate: '2024-06-30',
    daysOpen: 14,
    applicantsByStage: { applied: 45, screening: 12, interview: 5, offer: 2, hired: 0 }
  },
  {
    id: 'REQ-002',
    title: 'Product Designer',
    department: 'Design',
    location: 'New York Office',
    hiringManager: 'Marcus Head',
    priority: 'Medium',
    status: 'Open',
    dateOpened: '2024-05-15',
    targetHireDate: '2024-07-15',
    daysOpen: 9,
    applicantsByStage: { applied: 28, screening: 8, interview: 3, offer: 0, hired: 0 }
  }
];

export const MOCK_CANDIDATES_DETAILED: Candidate[] = [
  {
    id: 'C-001',
    name: 'Alex Rivera',
    currentTitle: 'Senior Frontend Dev',
    currentEmployer: 'TechFlow',
    email: 'arivera@example.com',
    phone: '+1 234 567 890',
    location: 'Austin, TX',
    experience: 7,
    education: 'M.S. Computer Science',
    source: 'LinkedIn',
    rating: 4.8,
    skills: ['React', 'TypeScript', 'Redux', 'System Design'],
    salaryExpectation: '₦14.0M - ₦16.0M',
    status: 'interview',
    appliedDate: '2024-05-20',
    timeline: [
      { event: 'Application Submitted', date: '2024-05-20' },
      { event: 'Screening Passed', date: '2024-05-22', note: 'Strong technical background.' }
    ]
  },
  {
    id: 'C-002',
    name: 'Jordan Smith',
    currentTitle: 'React Engineer',
    currentEmployer: 'CodeCraft',
    email: 'jsmith@example.com',
    phone: '+1 987 654 321',
    location: 'Remote',
    experience: 4,
    education: 'B.S. Software Engineering',
    source: 'Referral',
    rating: 4.2,
    skills: ['React', 'Next.js', 'Tailwind', 'Node.js'],
    status: 'screening',
    appliedDate: '2024-05-21',
    timeline: [
      { event: 'Application Submitted', date: '2024-05-21' }
    ]
  }
];

export const MOCK_INTERVIEWS: Interview[] = [
  {
    id: 'INT-001',
    candidateId: 'C-001',
    candidateName: 'Alex Rivera',
    type: 'Video',
    stage: 'Technical',
    dateTime: '2024-05-25T14:00:00Z',
    duration: 60,
    interviewers: ['Diana Prince', 'Michael Chen'],
    link: 'https://zoom.us/j/8293048',
    status: 'Scheduled'
  }
];

// ... rest of previous constants
export const MOCK_BADGES: Badge[] = [
  { id: 'b1', name: 'Sprint Master', icon: 'Zap', color: 'indigo', rarity: 'rare', description: 'Completed all sprint goals for 4 consecutive weeks.', unlockedAt: '2024-03-12' },
  { id: 'b2', name: 'Culture Champion', icon: 'Heart', color: 'rose', rarity: 'legendary', description: 'Received 50+ unique peer shoutouts.', unlockedAt: '2024-05-01' },
  { id: 'b3', name: 'Early Bird', icon: 'Sun', color: 'amber', rarity: 'common', description: 'Clocked in before 8:30 AM for 10 days.', unlockedAt: '2024-01-20' },
  { id: 'b4', name: 'Security Sentinel', icon: 'Shield', color: 'emerald', rarity: 'rare', description: 'Zero policy violations in 12 months.', unlockedAt: '2023-11-15' },
];

export const MOCK_EMPLOYEES: Employee[] = [
  { 
    id: '001', 
    name: 'Sarah Johnson', 
    lastName: 'Johnson',
    email: 'sarah@zenhr.com', 
    phone: '+1 (555) 123-4567',
    role: 'Product Designer', 
    department: 'Engineering', 
    location: 'New York HQ',
    employmentType: 'Full-time',
    status: 'active', 
    salary: 450000, 
    baseSalary: 380000, 
    hireDate: '2022-01-12',
    managerName: 'Diana Prince',
    performanceRating: 4.8,
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    badges: [MOCK_BADGES[0], MOCK_BADGES[1], MOCK_BADGES[3]],
    emergencyContacts: [{ name: 'Mark Johnson', relationship: 'Spouse', phone: '+1 555 999 888', isPrimary: true }],
    salaryHistory: [{ date: '2023-01-01', amount: 420000, reason: 'Annual Appraisal' }],
    bankDetails: {
      bankName: 'Standard Chartered',
      accountNumber: '0123456789',
      accountName: 'Sarah Johnson',
      method: 'Bank transfer'
    }
  },
  { 
    id: '002', 
    name: 'Michael Chen', 
    lastName: 'Chen',
    email: 'mchen@zenhr.com', 
    role: 'Fullstack Dev', 
    department: 'Engineering', 
    location: 'Remote',
    employmentType: 'Full-time',
    status: 'active', 
    salary: 520000, 
    hireDate: '2021-06-15',
    managerName: 'Diana Prince',
    performanceRating: 4.5,
    avatar: 'https://i.pravatar.cc/150?u=michael',
    bankDetails: {
      bankName: 'HSBC',
      accountNumber: '9876543210',
      accountName: 'Michael Chen',
      method: 'Automated Wallet'
    }
  },
  { 
    id: '003', 
    name: 'Emma Davis', 
    lastName: 'Davis',
    email: 'emma@zenhr.com', 
    role: 'HR Specialist', 
    department: 'People', 
    location: 'Lagos Hub',
    employmentType: 'Full-time',
    status: 'on_leave', 
    salary: 380000, 
    hireDate: '2023-03-01',
    managerName: 'James HR',
    performanceRating: 4.2,
    avatar: 'https://i.pravatar.cc/150?u=emma' 
  },
  { 
    id: '004', 
    name: 'James Wilson', 
    lastName: 'Wilson',
    email: 'jwilson@zenhr.com', 
    role: 'Sales Lead', 
    department: 'Sales', 
    location: 'London Office',
    employmentType: 'Full-time',
    status: 'active', 
    salary: 600000, 
    hireDate: '2020-11-20',
    managerName: 'Sarah Boss',
    performanceRating: 4.9,
    avatar: 'https://i.pravatar.cc/150?u=james' 
  },
];

export const MOCK_PAYROLL_ENTRIES: PayrollEntry[] = [
  {
    employeeId: '001',
    employeeName: 'Sarah Johnson',
    department: 'Engineering',
    grossPay: 450000,
    earnings: { basic: 380000, housing: 40000, transport: 20000, overtime: 10000, bonus: 0 },
    deductions: { tax: 45000, pension: 30000, insurance: 8000, loans: 0 },
    netPay: 367000,
    status: 'processed',
    attendance: { present: 22, absent: 0, late: 1, overtimeHours: 12.5 }
  },
  {
    employeeId: '002',
    employeeName: 'Michael Chen',
    department: 'Engineering',
    grossPay: 520000,
    earnings: { basic: 450000, housing: 40000, transport: 20000, overtime: 10000, bonus: 0 },
    deductions: { tax: 55000, pension: 35000, insurance: 8000, loans: 0 },
    netPay: 422000,
    status: 'processed',
    attendance: { present: 21, absent: 1, late: 0, overtimeHours: 8 }
  }
];

export const MOCK_TRANSACTIONS: WalletTransaction[] = [
  { id: 'tx1', type: 'credit', amount: 50000000, description: 'Bank Transfer Top-up', timestamp: '2024-05-20T10:00:00Z', status: 'completed' },
  { id: 'tx2', type: 'debit', amount: 26200000, description: 'May 2024 Payroll Disbursement', timestamp: '2024-05-25T09:00:00Z', status: 'completed' },
];

export const MOCK_CANDIDATES: JobCandidate[] = [
  { id: 'c1', name: 'Alex Rivera', role: 'Senior React Dev', status: 'interview', rating: 4.8 },
  { id: 'c2', name: 'Jordan Smith', role: 'Backend Lead', status: 'screening', rating: 4.2 },
  { id: 'c3', name: 'Taylor Swift', role: 'HR Manager', status: 'applied', rating: 3.9 },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'a1', employeeId: '001', date: '2024-05-24', clockIn: '08:55 AM', clockOut: '06:05 PM', status: 'present', workHours: 9, overtime: 1 },
];

export const MOCK_LEAVE_BALANCES: LeaveBalance[] = [
  { type: 'Annual Leave', used: 8, total: 20, color: 'indigo' },
  { type: 'Sick Leave', used: 2, total: 10, color: 'rose' },
  { type: 'Personal Leave', used: 1, total: 5, color: 'amber' },
  { type: 'Maternity Leave', used: 0, total: 90, color: 'violet' },
];

export const MOCK_GOALS: PerformanceGoal[] = [
  { id: 'g1', title: 'Master Wallet Architecture', description: 'Deep dive into the micro-disbursement engine.', progress: 75, status: 'on_track', priority: 'high', dueDate: '2024-06-30', category: 'individual', keyResults: [{ text: 'Code review completion', completed: true }, { text: 'Unit test coverage > 90%', completed: false }] },
  { id: 'g2', title: 'UI Redesign V3', description: 'Lead the mobile-first redesign initiative.', progress: 100, status: 'completed', priority: 'medium', dueDate: '2024-05-15', category: 'team' },
];

export const MOCK_FEEDBACK: Feedback[] = [
  { id: 'f1', fromId: '002', toId: '001', message: 'Incredible work on the new dashboard components!', type: 'praise', timestamp: '2024-05-24T14:30:00Z', tags: ['innovation', 'design'], reactions: 5 },
];

export const MOCK_DEPENDENTS = [
  { id: 'd1', name: 'Mark Johnson', relationship: 'Spouse', dob: '1992-08-15' },
  { id: 'd2', name: 'Lily Johnson', relationship: 'Child', dob: '2018-03-22' },
];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: 'lr1', employeeId: '001', type: 'annual', startDate: '2024-06-12', endDate: '2024-06-15', days: 4, reason: 'Family vacation', status: 'pending', appliedOn: '2024-05-22' },
];

export const MOCK_BENEFITS: Benefit[] = [
  { id: 'b1', type: 'health', title: 'Premium Health Cover', provider: 'Aetna', value: '₦5,000,000 Limit', status: 'active', icon: 'Shield', color: 'emerald' },
  { id: 'b2', type: 'retirement', title: 'Pension Matching', provider: 'ZenHR Finance', value: '8% Matching', status: 'active', icon: 'PieChart', color: 'indigo' },
  { id: 'b3', type: 'wellness', title: 'Gym Membership', provider: 'ZenFit', value: 'Global Access', status: 'active', icon: 'Activity', color: 'rose' },
];

export const MOCK_CLAIMS = [
  { id: 'cl1', date: '2024-05-10', type: 'Pharmacy', hospital: 'City Care', amount: 45000, status: 'paid' },
  { id: 'cl2', date: '2024-05-15', type: 'General', hospital: 'St. Jude', amount: 120000, status: 'review' },
];

export const MOCK_EQUITY = [
  { id: 'eq1', title: 'ZenHR Stock Options', units: 1500, vested: 500, value: '₦12,500,000' },
];

export const MOCK_CHALLENGES = [
  { id: 'ch1', title: '10k Steps Daily', goal: 10000, progress: 8500, participants: 42, joined: true },
  { id: 'ch2', title: 'Water Intake', goal: 3000, progress: 1200, participants: 18, joined: false },
];

export const MOCK_LOANS: LoanRecord[] = [
  { id: 'l1', employeeId: '001', employeeName: 'Sarah Johnson', amount: 5000000, interest: 2, duration: 12, monthlyInstallment: 425000, remainingBalance: 3400000, status: 'active', startDate: '2024-01-01' },
];

export const MOCK_COMPLIANCE: ComplianceTask[] = [
  { id: 'c1', title: 'January PAYE Filing', dueDate: '2026-02-10', status: 'completed', type: 'tax' },
  { id: 'c2', title: 'Pension Remittance', dueDate: '2026-02-07', status: 'pending', type: 'pension' },
  { id: 'c3', title: 'Annual Tax Returns', dueDate: '2026-03-31', status: 'pending', type: 'tax' },
];

export const MOCK_TAX_BRACKETS: TaxBracket[] = [
  { range: '₦0 - ₦300,000', rate: 7 },
  { range: '₦300,001 - ₦600,000', rate: 11 },
  { range: '₦600,001 - ₦1,100,000', rate: 15 },
  { range: '₦1,100,001 - ₦1,600,000', rate: 19 },
  { range: '₦1,600,001 - ₦3,200,000', rate: 21 },
  { range: 'Over ₦3,200,000', rate: 24 },
];
