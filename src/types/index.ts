
export type UserRole = 'SUPER_ADMIN' | 'HR_ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'PAYROLL_OFFICER' | 'RECRUITER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface JobRequisition {
  id: string;
  title: string;
  department: string;
  location: string;
  hiringManager: string;
  managerAvatar?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'On Hold' | 'Filled' | 'Cancelled';
  dateOpened: string;
  targetHireDate: string;
  daysOpen: number;
  applicantsByStage: {
    applied: number;
    screening: number;
    interview: number;
    offer: number;
    hired: number;
  };
}

export interface Candidate {
  id: string;
  name: string;
  currentTitle: string;
  currentEmployer?: string;
  email: string;
  phone: string;
  location: string;
  experience: number;
  education: string;
  avatar?: string;
  source: 'LinkedIn' | 'Referral' | 'Job Board' | 'Career Page';
  rating: number; // 1-5
  skills: string[];
  salaryExpectation?: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  appliedDate: string;
  socials?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  timeline: {
    event: string;
    date: string;
    note?: string;
  }[];
}

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  type: 'Phone' | 'Video' | 'In-person' | 'Panel';
  stage: 'Screening' | 'Technical' | 'Cultural' | 'Final';
  dateTime: string;
  duration: number; // minutes
  interviewers: string[];
  link?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  scorecard?: {
    technical: number;
    communication: number;
    cultural: number;
    notes: string;
    recommendation: 'Hire' | 'Maybe' | 'No Hire';
  };
}

// ... existing types below
export interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'legendary';
  description: string;
  unlockedAt?: string;
}

export interface Employee {
  id: string;
  name: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: string;
  nationality?: string;
  maritalStatus?: string;
  role: string;
  department: string;
  location?: string;
  employmentType: 'Full-time' | 'Contract' | 'Intern' | 'Consultant';
  status: 'active' | 'onboarding' | 'on_leave' | 'terminated' | 'probation' | 'notice';
  salary: number;
  avatar?: string;
  baseSalary?: number;
  hireDate: string;
  probationEnd?: string;
  managerId?: string;
  managerName?: string;
  workEmail?: string;
  badges?: Badge[];
  emergencyContacts?: EmergencyContact[];
  education?: EducationRecord[];
  experience?: ExperienceRecord[];
  salaryHistory?: SalaryHistoryRecord[];
  performanceRating?: number;
  bankDetails?: BankDetails;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  method: 'Bank transfer' | 'Cash' | 'Cheque' | 'Automated Wallet';
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
}

export interface EducationRecord {
  institution: string;
  degree: string;
  field: string;
  year: string;
}

export interface ExperienceRecord {
  company: string;
  role: string;
  duration: string;
  description?: string;
}

export interface SalaryHistoryRecord {
  date: string;
  amount: number;
  reason: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  status: 'present' | 'late' | 'absent' | 'on_leave' | 'half_day';
  locationIn?: string;
  locationOut?: string;
  workHours: number;
  overtime: number;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'annual' | 'sick' | 'personal' | 'unpaid' | 'maternity';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  attachment?: string;
  appliedOn: string;
}

export interface LeaveBalance {
  type: string;
  used: number;
  total: number;
  color: string;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface JobCandidate {
  id: string;
  name: string;
  role: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'hired';
  rating: number;
}

export interface PerformanceGoal {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: 'on_track' | 'at_risk' | 'completed' | 'overdue';
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  category: 'individual' | 'team' | 'department' | 'company';
  alignedTo?: string;
  keyResults?: { text: string; completed: boolean }[];
}

export interface Feedback {
  id: string;
  fromId: string;
  toId: string;
  message: string;
  type: 'praise' | 'constructive' | 'request';
  timestamp: string;
  tags: string[];
  reactions?: number;
}

export interface PayrollEntry {
  employeeId: string;
  employeeName: string;
  department: string;
  grossPay: number;
  earnings: {
    basic: number;
    housing: number;
    transport: number;
    overtime: number;
    bonus: number;
  };
  deductions: {
    tax: number;
    pension: number;
    insurance: number;
    loans: number;
  };
  netPay: number;
  status: 'processed' | 'pending';
  attendance?: {
    present: number;
    absent: number;
    late: number;
    overtimeHours: number;
  };
}

export interface Benefit {
  id: string;
  type: 'health' | 'life' | 'retirement' | 'equity' | 'perk' | 'wellness' | 'fsa';
  title: string;
  provider?: string;
  planName?: string;
  value: string;
  status: 'active' | 'enrolling' | 'pending' | 'inactive';
  icon: string;
  color: string;
}

export interface LoanRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  interest: number;
  duration: number; // months
  monthlyInstallment: number;
  remainingBalance: number;
  status: 'active' | 'completed' | 'paused';
  startDate: string;
}

export interface ComplianceTask {
  id: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'completed';
  type: 'tax' | 'pension' | 'insurance' | 'audit';
}

export interface TaxBracket {
  range: string;
  rate: number;
}
