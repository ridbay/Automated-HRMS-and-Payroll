import React from "react";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Briefcase,
  Trophy,
  Clock,
  Settings,
  UserCircle,
  Heart,
  BarChart3,
  Laptop,
  Smartphone,
  Box,
  Monitor,
  Car,
} from "lucide-react";
import {
  Employee,
  Badge,
  PayrollEntry,
  WalletTransaction,
  JobCandidate,
  AttendanceRecord,
  LeaveBalance,
  PerformanceGoal,
  Feedback,
  LeaveRequest,
  Benefit,
  LoanRecord,
  ComplianceTask,
  TaxBracket,
  JobRequisition,
  Candidate,
  Interview,
} from "../types/index";

export const NAV_ITEMS = [
  { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "dashboard" },
  { name: "Workforce", icon: <Users size={20} />, path: "workforce" },
  { name: "Attendance", icon: <Clock size={20} />, path: "attendance" },
  { name: "Payroll & Wallet", icon: <Wallet size={20} />, path: "payroll" },
  { name: "Benefits", icon: <Heart size={20} />, path: "benefits" },
  { name: "Performance", icon: <Trophy size={20} />, path: "performance" },
  { name: "Recruitment", icon: <Briefcase size={20} />, path: "recruitment" },
  { name: "Reports", icon: <BarChart3 size={20} />, path: "reports" },
  { name: "My Portal", icon: <UserCircle size={20} />, path: "portal" },
  { name: "Settings", icon: <Settings size={20} />, path: "settings" },
];

export const MOCK_REQUISITIONS: JobRequisition[] = [
  {
    id: "REQ-001",
    title: "Senior React Developer",
    department: "Engineering",
    location: "Remote (Lagos)",
    hiringManager: "Tunde Bakare",
    managerAvatar: "https://i.pravatar.cc/150?u=tunde",
    priority: "High",
    status: "Open",
    dateOpened: "2024-05-10",
    targetHireDate: "2024-06-30",
    daysOpen: 14,
    applicantsByStage: {
      applied: 45,
      screening: 12,
      interview: 5,
      offer: 2,
      hired: 0,
    },
  },
  {
    id: "REQ-002",
    title: "Product Designer",
    department: "Design",
    location: "Lagos HQ",
    hiringManager: "Ada Obi",
    priority: "Medium",
    status: "Open",
    dateOpened: "2024-05-15",
    targetHireDate: "2024-07-15",
    daysOpen: 9,
    applicantsByStage: {
      applied: 28,
      screening: 8,
      interview: 3,
      offer: 0,
      hired: 0,
    },
  },
];

export const MOCK_CANDIDATES_DETAILED: Candidate[] = [
  {
    id: "C-001",
    name: "Chinedu Okeke",
    currentTitle: "Senior Frontend Dev",
    currentEmployer: "Paystack",
    email: "cokeke@example.com",
    phone: "+234 801 234 5678",
    location: "Lekki, Lagos",
    experience: 7,
    education: "B.Sc. Computer Science, UNILAG",
    source: "LinkedIn",
    rating: 4.8,
    skills: ["React", "TypeScript", "Redux", "System Design"],
    salaryExpectation: "₦14.0M - ₦16.0M",
    status: "interview",
    appliedDate: "2024-05-20",
    timeline: [
      { event: "Application Submitted", date: "2024-05-20" },
      {
        event: "Screening Passed",
        date: "2024-05-22",
        note: "Strong technical background.",
      },
    ],
  },
  {
    id: "C-002",
    name: "Bolanle Adeyemi",
    currentTitle: "React Engineer",
    currentEmployer: "Flutterwave",
    email: "badeyemi@example.com",
    phone: "+234 809 876 5432",
    location: "Remote",
    experience: 4,
    education: "B.Tech. Software Engineering, FUTA",
    source: "Referral",
    rating: 4.2,
    skills: ["React", "Next.js", "Tailwind", "Node.js"],
    status: "screening",
    appliedDate: "2024-05-21",
    timeline: [{ event: "Application Submitted", date: "2024-05-21" }],
  },
];

export const MOCK_INTERVIEWS: Interview[] = [
  {
    id: "INT-001",
    candidateId: "C-001",
    candidateName: "Chinedu Okeke",
    type: "Video",
    stage: "Technical",
    dateTime: "2024-05-25T14:00:00Z",
    duration: 60,
    interviewers: ["Tunde Bakare", "Emeka Okafor"],
    link: "https://zoom.us/j/8293048",
    status: "Scheduled",
  },
];

export const MOCK_BADGES: Badge[] = [
  {
    id: "b1",
    name: "Sprint Master",
    icon: "Zap",
    color: "indigo",
    rarity: "rare",
    description: "Completed all sprint goals for 4 consecutive weeks.",
    unlockedAt: "2024-03-12",
  },
  {
    id: "b2",
    name: "Culture Champion",
    icon: "Heart",
    color: "rose",
    rarity: "legendary",
    description: "Received 50+ unique peer shoutouts.",
    unlockedAt: "2024-05-01",
  },
  {
    id: "b3",
    name: "Early Bird",
    icon: "Sun",
    color: "amber",
    rarity: "common",
    description: "Clocked in before 8:30 AM for 10 days.",
    unlockedAt: "2024-01-20",
  },
  {
    id: "b4",
    name: "Security Sentinel",
    icon: "Shield",
    color: "emerald",
    rarity: "rare",
    description: "Zero policy violations in 12 months.",
    unlockedAt: "2023-11-15",
  },
];

export const MOCK_PAYROLL_ENTRIES: PayrollEntry[] = [
  {
    employeeId: "001",
    employeeName: "Nneka Onwuka",
    department: "Engineering",
    grossPay: 450000,
    earnings: {
      basic: 380000,
      housing: 40000,
      transport: 20000,
      overtime: 10000,
      bonus: 0,
    },
    deductions: { tax: 45000, pension: 30000, insurance: 8000, loans: 0 },
    netPay: 367000,
    status: "processed",
    attendance: { present: 22, absent: 0, late: 1, overtimeHours: 12.5 },
  },
  {
    employeeId: "002",
    employeeName: "Emeka Okafor",
    department: "Engineering",
    grossPay: 520000,
    earnings: {
      basic: 450000,
      housing: 40000,
      transport: 20000,
      overtime: 10000,
      bonus: 0,
    },
    deductions: { tax: 55000, pension: 35000, insurance: 8000, loans: 0 },
    netPay: 422000,
    status: "processed",
    attendance: { present: 21, absent: 1, late: 0, overtimeHours: 8 },
  },
];

export const MOCK_TRANSACTIONS: WalletTransaction[] = [
  {
    id: "tx1",
    type: "credit",
    amount: 50000000,
    description: "Bank Transfer Top-up",
    timestamp: "2024-05-20T10:00:00Z",
    status: "completed",
  },
  {
    id: "tx2",
    type: "debit",
    amount: 26200000,
    description: "May 2024 Payroll Disbursement",
    timestamp: "2024-05-25T09:00:00Z",
    status: "completed",
  },
];

export const MOCK_CANDIDATES: JobCandidate[] = [
  {
    id: "c1",
    name: "Chinedu Okeke",
    role: "Senior React Dev",
    status: "interview",
    rating: 4.8,
  },
  {
    id: "c2",
    name: "Bolanle Adeyemi",
    role: "Backend Lead",
    status: "screening",
    rating: 4.2,
  },
  {
    id: "c3",
    name: "Zainab Ahmed",
    role: "HR Manager",
    status: "applied",
    rating: 3.9,
  },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    id: "a1",
    employeeId: "001",
    date: "2024-05-24",
    clockIn: "08:55 AM",
    clockOut: "06:05 PM",
    status: "present",
    workHours: 9,
    overtime: 1,
  },
];

export const MOCK_LEAVE_BALANCES: LeaveBalance[] = [
  { type: "Annual Leave", used: 8, total: 20, color: "indigo" },
  { type: "Sick Leave", used: 2, total: 10, color: "rose" },
  { type: "Personal Leave", used: 1, total: 5, color: "amber" },
  { type: "Maternity Leave", used: 0, total: 90, color: "violet" },
];

export const MOCK_GOALS: PerformanceGoal[] = [
  {
    id: "g1",
    title: "Master Wallet Architecture",
    description: "Deep dive into the micro-disbursement engine.",
    progress: 75,
    status: "on_track",
    priority: "high",
    dueDate: "2024-06-30",
    category: "individual",
    keyResults: [
      { text: "Code review completion", completed: true },
      { text: "Unit test coverage > 90%", completed: false },
    ],
  },
  {
    id: "g2",
    title: "UI Redesign V3",
    description: "Lead the mobile-first redesign initiative.",
    progress: 100,
    status: "completed",
    priority: "medium",
    dueDate: "2024-05-15",
    category: "team",
  },
];

export const MOCK_FEEDBACK: Feedback[] = [
  {
    id: "f1",
    fromId: "002",
    toId: "001",
    message: "Incredible work on the new dashboard components!",
    type: "praise",
    timestamp: "2024-05-24T14:30:00Z",
    tags: ["innovation", "design"],
    reactions: 5,
  },
];

export const MOCK_DEPENDENTS = [
  { id: "d1", name: "Chudi Onwuka", relationship: "Spouse", dob: "1992-08-15" },
  { id: "d2", name: "Amara Onwuka", relationship: "Child", dob: "2018-03-22" },
];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: "lr1",
    employeeId: "001",
    type: "annual",
    startDate: "2024-06-12",
    endDate: "2024-06-15",
    days: 4,
    reason: "Family vacation to Obudu",
    status: "pending",
    appliedOn: "2024-05-22",
  },
];

export const MOCK_BENEFITS: Benefit[] = [
  {
    id: "b1",
    type: "health",
    title: "Premium Health Cover",
    provider: "AXA Mansard",
    value: "₦5,000,000 Limit",
    status: "active",
    icon: "Shield",
    color: "emerald",
  },
  {
    id: "b2",
    type: "retirement",
    title: "Pension Matching",
    provider: "Stanbic IBTC",
    value: "8% Matching",
    status: "active",
    icon: "PieChart",
    color: "indigo",
  },
  {
    id: "b3",
    type: "wellness",
    title: "Gym Membership",
    provider: "I-Fitness",
    value: "Global Access",
    status: "active",
    icon: "Activity",
    color: "rose",
  },
];

export const MOCK_CLAIMS = [
  {
    id: "cl1",
    date: "2024-05-10",
    type: "Pharmacy",
    hospital: "Reddington Hospital",
    amount: 45000,
    status: "paid",
  },
  {
    id: "cl2",
    date: "2024-05-15",
    type: "General",
    hospital: "Lagoon Hospital",
    amount: 120000,
    status: "review",
  },
];

export const MOCK_EQUITY = [
  {
    id: "eq1",
    title: "ZenHR Stock Options",
    units: 1500,
    vested: 500,
    value: "₦12,500,000",
  },
];

export const MOCK_CHALLENGES = [
  {
    id: "ch1",
    title: "10k Steps Daily",
    goal: 10000,
    progress: 8500,
    participants: 42,
    joined: true,
  },
  {
    id: "ch2",
    title: "Water Intake",
    goal: 3000,
    progress: 1200,
    participants: 18,
    joined: false,
  },
];

export const MOCK_LOANS: LoanRecord[] = [
  {
    id: "l1",
    employeeId: "001",
    employeeName: "Nneka Onwuka",
    amount: 5000000,
    interest: 2,
    duration: 12,
    monthlyInstallment: 425000,
    remainingBalance: 3400000,
    status: "active",
    startDate: "2024-01-01",
  },
];

export const MOCK_COMPLIANCE: ComplianceTask[] = [
  {
    id: "c1",
    title: "January PAYE Filing",
    dueDate: "2026-02-10",
    status: "completed",
    type: "tax",
  },
  {
    id: "c2",
    title: "Pension Remittance",
    dueDate: "2026-02-07",
    status: "pending",
    type: "pension",
  },
  {
    id: "c3",
    title: "Annual Tax Returns",
    dueDate: "2026-03-31",
    status: "pending",
    type: "tax",
  },
];

export const MOCK_TAX_BRACKETS: TaxBracket[] = [
  { range: "₦0 - ₦300,000", rate: 7 },
  { range: "₦300,001 - ₦600,000", rate: 11 },
  { range: "₦600,001 - ₦1,100,000", rate: 15 },
  { range: "₦1,100,001 - ₦1,600,000", rate: 19 },
  { range: "₦1,600,001 - ₦3,200,000", rate: 21 },
  { range: "Over ₦3,200,000", rate: 24 },
];

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: "001",
    name: "Nneka",
    lastName: "Onwuka",
    email: "nneka.onwuka@zenhr.com",
    role: "Software Engineer",
    department: "Engineering",
    location: "Lagos, Nigeria",
    employmentType: "Full-time",
    status: "active",
    phone: "+2348012345678",
    dob: "1990-01-15",
    gender: "Female",
    nationality: "Nigerian",
    maritalStatus: "Married",
    salary: 7500000,
    hireDate: "2022-03-01",
    managerName: "Chidi Okoro",
    managerId: "003",
    performanceRating: 4.5,
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29329?auto=format&fit=crop&q=80&w=100",
    badges: [MOCK_BADGES[0]],
    emergencyContacts: [
      {
        name: "Chudi Onwuka",
        relationship: "Spouse",
        phone: "+2348011223344",
        isPrimary: true,
      },
    ],
    education: [
      {
        degree: "B.Sc. Computer Science",
        institution: "University of Lagos",
        field: "Computer Science",
        year: "2012",
      },
    ],
    experience: [
      {
        role: "Software Developer",
        company: "Tech Solutions Inc.",
        duration: "5 years",
      },
    ],
    salaryHistory: [
      { date: "2022-03-01", amount: 6000000, reason: "Initial Hire" },
      { date: "2023-03-01", amount: 7500000, reason: "Annual Review" },
    ],
    bankDetails: {
      bankName: "Zenith Bank",
      accountNumber: "1234567890",
      accountName: "Nneka Onwuka",
      method: "Bank transfer",
    },
  },
  {
    id: "002",
    name: "Ahmed",
    lastName: "Musa",
    email: "ahmed.musa@zenhr.com",
    role: "Product Manager",
    department: "Product",
    location: "Lagos, Nigeria",
    employmentType: "Full-time",
    status: "active",
    phone: "+2348098765432",
    dob: "1988-05-20",
    gender: "Male",
    nationality: "Nigerian",
    maritalStatus: "Single",
    salary: 8000000,
    hireDate: "2021-08-15",
    managerName: "Chidi Okoro",
    managerId: "003",
    performanceRating: 4.2,
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100",
    badges: [MOCK_BADGES[1]],
    emergencyContacts: [
      {
        name: "Fatima Musa",
        relationship: "Sister",
        phone: "+2348011223355",
        isPrimary: true,
      },
    ],
    education: [
      {
        degree: "MBA",
        institution: "Lagos Business School",
        field: "Business",
        year: "2018",
      },
    ],
    experience: [
      {
        role: "Associate Product Manager",
        company: "Innovate Corp",
        duration: "3 years",
      },
    ],
    salaryHistory: [
      { date: "2021-08-15", amount: 7000000, reason: "Initial Hire" },
      { date: "2022-08-15", amount: 8000000, reason: "Annual Review" },
    ],
    bankDetails: {
      bankName: "GTBank",
      accountNumber: "0987654321",
      accountName: "Ahmed Musa",
      method: "Bank transfer",
    },
  },
  {
    id: "003",
    name: "Chidi",
    lastName: "Okoro",
    email: "chidi.okoro@zenhr.com",
    role: "Head of Engineering",
    department: "Engineering",
    location: "Lagos, Nigeria",
    employmentType: "Full-time",
    status: "active",
    phone: "+2348033445566",
    dob: "1985-11-10",
    gender: "Male",
    nationality: "Nigerian",
    maritalStatus: "Married",
    salary: 12000000,
    hireDate: "2020-01-01",
    managerName: "CEO", // Top level
    performanceRating: 4.8,
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cfdfeeab?auto=format&fit=crop&q=80&w=100",
    badges: [MOCK_BADGES[2]],
    emergencyContacts: [
      {
        name: "Ada Okoro",
        relationship: "Spouse",
        phone: "+2348011223366",
        isPrimary: true,
      },
    ],
    education: [
      {
        degree: "M.Sc. Software Engineering",
        institution: "University of Ibadan",
        field: "Software Engineering",
        year: "2010",
      },
    ],
    experience: [
      {
        role: "Engineering Manager",
        company: "Global Tech",
        duration: "7 years",
      },
    ],
    salaryHistory: [
      { date: "2020-01-01", amount: 10000000, reason: "Initial Hire" },
      { date: "2021-01-01", amount: 11000000, reason: "Annual Review" },
      { date: "2022-01-01", amount: 12000000, reason: "Annual Review" },
    ],
    bankDetails: {
      bankName: "First Bank",
      accountNumber: "1122334455",
      accountName: "Chidi Okoro",
      method: "Bank transfer",
    },
  },
  {
    id: "004",
    name: "Fatima",
    lastName: "Ali",
    email: "fatima.ali@zenhr.com",
    role: "HR Manager",
    department: "Human Resources",
    location: "Lagos, Nigeria",
    employmentType: "Full-time",
    status: "active",
    phone: "+2348077889900",
    dob: "1992-07-01",
    gender: "Female",
    nationality: "Nigerian",
    maritalStatus: "Single",
    salary: 6000000,
    hireDate: "2023-01-10",
    managerName: "CEO", // Top level
    performanceRating: 4.0,
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100",
    badges: [MOCK_BADGES[3]],
    emergencyContacts: [
      {
        name: "Aminu Ali",
        relationship: "Brother",
        phone: "+2348011223377",
        isPrimary: true,
      },
    ],
    education: [
      {
        degree: "M.Sc. Human Resources",
        institution: "University of Abuja",
        field: "HR",
        year: "2016",
      },
    ],
    experience: [
      {
        role: "HR Generalist",
        company: "Corporate Services Ltd.",
        duration: "4 years",
      },
    ],
    salaryHistory: [
      { date: "2023-01-10", amount: 6000000, reason: "Initial Hire" },
    ],
    bankDetails: {
      bankName: "UBA",
      accountNumber: "2233445566",
      accountName: "Fatima Ali",
      method: "Bank transfer",
    },
  },
  {
    id: "005",
    name: "David",
    lastName: "Eze",
    email: "david.eze@zenhr.com",
    role: "Junior Software Engineer",
    department: "Engineering",
    location: "Lagos, Nigeria",
    employmentType: "Full-time",
    status: "active",
    phone: "+2348011223344",
    dob: "1995-03-25",
    gender: "Male",
    nationality: "Nigerian",
    maritalStatus: "Single",
    salary: 4000000,
    hireDate: "2024-01-01",
    managerName: "Nneka Onwuka",
    managerId: "001",
    performanceRating: 3.8,
    avatar:
      "https://images.unsplash.com/photo-1507003211169-e695c6edd65d?auto=format&fit=crop&q=80&w=100",
    badges: [],
    emergencyContacts: [
      {
        name: "Grace Eze",
        relationship: "Mother",
        phone: "+2348011223388",
        isPrimary: true,
      },
    ],
    education: [
      {
        degree: "B.Sc. Computer Engineering",
        institution: "Covenant University",
        field: "Engineering",
        year: "2017",
      },
    ],
    experience: [
      {
        role: "Intern Software Engineer",
        company: "Startup Hub",
        duration: "1 year",
      },
    ],
    salaryHistory: [
      { date: "2024-01-01", amount: 4000000, reason: "Initial Hire" },
    ],
    bankDetails: {
      bankName: "Access Bank",
      accountNumber: "3344556677",
      accountName: "David Eze",
      method: "Bank transfer",
    },
  },
];

export interface Asset {
  id: string;
  name: string;
  category: "Laptop" | "Phone" | "Monitor" | "Vehicle" | "Other";
  serialNumber: string;
  status: "Available" | "Assigned" | "Maintenance" | "Retired";
  purchaseDate: string;
  value: number;
  assignedTo?: string; // Employee ID
  image?: string;
  condition: "New" | "Good" | "Fair" | "Poor";
}

export const MOCK_ASSETS: Asset[] = [
  {
    id: "AST-001",
    name: "MacBook Pro M3 Max",
    category: "Laptop",
    serialNumber: "FVFXL1J2H3",
    status: "Assigned",
    purchaseDate: "2024-01-15",
    value: 3500000,
    assignedTo: "001", // Nneka
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&q=80&w=100",
    condition: "Good",
  },
  {
    id: "AST-002",
    name: "Dell UltraSharp 32",
    category: "Monitor",
    serialNumber: "DL-32-4K-001",
    status: "Assigned",
    purchaseDate: "2023-11-20",
    value: 450000,
    assignedTo: "001",
    condition: "Good",
  },
  {
    id: "AST-003",
    name: "iPhone 15 Pro",
    category: "Phone",
    serialNumber: "IP15-P-992",
    status: "Available",
    purchaseDate: "2024-02-01",
    value: 1200000,
    condition: "New",
  },
  {
    id: "AST-004",
    name: "Toyota Corolla (Fleet)",
    category: "Vehicle",
    serialNumber: "LND-123-AB",
    status: "Maintenance",
    purchaseDate: "2022-06-10",
    value: 15000000,
    condition: "Fair",
  },
  {
    id: "AST-005",
    name: "HP EliteBook G9",
    category: "Laptop",
    serialNumber: "HP-EB-882",
    status: "Available",
    purchaseDate: "2023-09-15",
    value: 850000,
    condition: "Good",
  },
];

export interface Task {
  id: string;
  title: string;
  status: "pending" | "completed";
  category: "IT" | "HR" | "Finance" | "Admin";
  dueDate: string;
  assignedTo: string;
}

export interface Workflow {
  id: string;
  type: "Onboarding" | "Offboarding";
  employeeId: string;
  employeeName: string;
  stage:
    | "Pre-boarding"
    | "Orientation"
    | "Equipment"
    | "Training"
    | "Final Review"
    | "Exit Interview"
    | "Asset Return"
    | "Account Deactivation";
  status: "Active" | "Completed";
  progress: number;
  startDate: string;
  tasks: Task[];
}

export const MOCK_WORKFLOWS: Workflow[] = [
  {
    id: "wf1",
    type: "Onboarding",
    employeeId: "005",
    employeeName: "David Eze",
    stage: "Equipment",
    status: "Active",
    progress: 45,
    startDate: "2024-05-20",
    tasks: [
      {
        id: "t1",
        title: "Sign Offer Letter",
        status: "completed",
        category: "HR",
        dueDate: "2024-05-21",
        assignedTo: "David Eze",
      },
      {
        id: "t2",
        title: "Setup Work Laptop",
        status: "pending",
        category: "IT",
        dueDate: "2024-05-25",
        assignedTo: "IT Support",
      },
      {
        id: "t3",
        title: "Enroll in Benefits",
        status: "pending",
        category: "HR",
        dueDate: "2024-05-30",
        assignedTo: "David Eze",
      },
    ],
  },
  {
    id: "wf2",
    type: "Onboarding",
    employeeId: "004",
    employeeName: "Fatima Ali",
    stage: "Training",
    status: "Active",
    progress: 75,
    startDate: "2024-05-10",
    tasks: [
      {
        id: "t4",
        title: "HR Orientation",
        status: "completed",
        category: "HR",
        dueDate: "2024-05-12",
        assignedTo: "Fatima Ali",
      },
      {
        id: "t5",
        title: "Compliance Training",
        status: "completed",
        category: "HR",
        dueDate: "2024-05-15",
        assignedTo: "Fatima Ali",
      },
      {
        id: "t6",
        title: "Department Introduction",
        status: "pending",
        category: "Admin",
        dueDate: "2024-05-26",
        assignedTo: "Manager",
      },
    ],
  },
  {
    id: "wf3",
    type: "Offboarding",
    employeeId: "001",
    employeeName: "Sarah Connor",
    stage: "Asset Return",
    status: "Active",
    progress: 30,
    startDate: "2024-05-22",
    tasks: [
      {
        id: "t7",
        title: "Resignation Letter",
        status: "completed",
        category: "HR",
        dueDate: "2024-05-22",
        assignedTo: "Sarah Connor",
      },
      {
        id: "t8",
        title: "Return Laptop",
        status: "pending",
        category: "IT",
        dueDate: "2024-06-01",
        assignedTo: "Sarah Connor",
      },
    ],
  },
];
