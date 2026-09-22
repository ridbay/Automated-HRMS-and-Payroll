import React, { useEffect, useState, Suspense } from "react";
import Sidebar from "./layouts/Sidebar";
import Header from "./layouts/Header";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NavigationProvider, useNavigation } from "./context/NavigationContext";
import { BrandingProvider } from "./context/BrandingContext";
import { PopupProvider } from "./components/PopupProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import PageLoader from "./components/PageLoader";

// Lazy-loaded pages
const RegisterPage = React.lazy(() => import("./features/core/RegisterPage"));
const CareersPage = React.lazy(() => import("./features/public/CareersPage"));
const LoginPage = React.lazy(() => import("./features/core/LoginPage"));
const Dashboard = React.lazy(() => import("./features/core/Dashboard"));
const HRDashboard = React.lazy(() => import("./features/admin/HRDashboard"));
const Workforce = React.lazy(() => import("./features/admin/Workforce"));
const Payroll = React.lazy(() => import("./features/payroll/Payroll"));
const PayrollDashboard = React.lazy(() => import("./features/payroll/PayrollDashboard"));
const Recruitment = React.lazy(() => import("./features/recruitment/Recruitment"));
const RecruiterDashboard = React.lazy(() => import("./features/recruitment/RecruiterDashboard"));
const RecruitmentAnalytics = React.lazy(() => import("./features/recruitment/RecruitmentAnalytics"));
const Attendance = React.lazy(() => import("./features/employee/Attendance"));
const AttendanceManagement = React.lazy(() => import("./features/admin/AttendanceManagement"));
const Performance = React.lazy(() => import("./features/employee/Performance"));
const PerformanceManagement = React.lazy(() => import("./features/admin/PerformanceManagement"));
const EmployeePortal = React.lazy(() => import("./features/employee/EmployeePortal"));
const ManagerDashboard = React.lazy(() => import("./features/manager/ManagerDashboard"));
const TeamReports = React.lazy(() => import("./features/manager/TeamReports"));
const Benefits = React.lazy(() => import("./features/employee/Benefits"));
const BenefitsAdmin = React.lazy(() => import("./features/admin/BenefitsAdmin"));
const Leave = React.lazy(() => import("./features/employee/Leave"));
const AdminLeaveRequests = React.lazy(() => import("./features/admin/AdminLeaveRequests"));
const MyPayroll = React.lazy(() => import("./features/employee/MyPayroll"));
const Reports = React.lazy(() => import("./features/admin/Reports"));
const Settings = React.lazy(() => import("./features/core/Settings"));
const Profile = React.lazy(() => import("./features/employee/Profile"));
const AssetManagement = React.lazy(() => import("./features/admin/AssetManagement"));
const Onboarding = React.lazy(() => import("./features/admin/Onboarding"));
const EmployeeOnboarding = React.lazy(() => import("./features/employee/EmployeeOnboarding"));
const Directory = React.lazy(() => import("./features/core/Directory"));
const SurveysAdmin = React.lazy(() => import("./features/admin/SurveysAdmin"));
const LMSAdmin = React.lazy(() => import("./features/admin/LMSAdmin"));
const EmployeeSurveys = React.lazy(() => import("./features/employee/EmployeeSurveys"));
const EmployeeLMS = React.lazy(() => import("./features/employee/EmployeeLMS"));
const Support = React.lazy(() => import("./features/support/Support"));
const CompanyDocuments = React.lazy(() => import("./features/admin/CompanyDocuments"));

// The app has no client-side router anywhere else — this is the one
// deliberately narrow exception, letting the public careers page be reached
// at a real shareable URL (/careers/:companyIdentifier[/:requisitionId])
// without a login gate. Everything else still renders via the activeTab
// switch below.
const CAREERS_PATH_MATCH = /^\/careers\/([^/]+)(?:\/([^/]+))?\/?$/;

const AppContent: React.FC = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const { activeTab, setActiveTab, isSidebarOpen, toggleSidebar } =
    useNavigation();

  const careersMatch =
    typeof window !== "undefined" ? window.location.pathname.match(CAREERS_PATH_MATCH) : null;

  useEffect(() => {
    if (user && (window.location.pathname === "/" || window.location.pathname === "")) {
      if (user.role === "EMPLOYEE") {
        setActiveTab("portal");
      } else if (user.role === "MANAGER") {
        setActiveTab("manager-dashboard");
      } else if (user.role === "RECRUITER") {
        setActiveTab("recruiter-dashboard");
      } else {
        setActiveTab("dashboard");
      }
    }
  }, [user, setActiveTab]);

  const renderContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case "dashboard":
        if (user.role === "HR_ADMIN" || user.role === "SUPER_ADMIN") {
          return <HRDashboard />;
        }
        if (user.role === "PAYROLL_OFFICER") {
          return <PayrollDashboard />;
        }
        return <Dashboard />;
      case "manager-dashboard":
        return <ManagerDashboard />;
      case "recruiter-dashboard":
        return <RecruiterDashboard />;
      case "workforce":
        if (user.role === "MANAGER") return <ManagerDashboard />;
        return <Workforce />;
      case "approvals":
        return <ManagerDashboard />;
      case "goals":
        return <ManagerDashboard />;
      case "payroll":
        return <Payroll />;
      case "compliance":
        return <Payroll initialTab="compliance" />;
      case "recruitment":
      case "requisitions":
      case "pipeline":
      case "candidates":
      case "pool":
      case "interviews":
      case "offers":
        // These all live inside the Recruitment hiring tool, which has its
        // own internal sub-navigation.
        return <Recruitment />;
      case "analytics":
        return <RecruitmentAnalytics />;
      case "assets":
        return <AssetManagement />;
      case "onboarding":
        return <Onboarding />;
      case "directory":
        return <Directory />;
      case "attendance":
        if (user.role === "MANAGER" || user.role === "HR_ADMIN" || user.role === "SUPER_ADMIN") {
          return <AttendanceManagement />;
        }
        return <Attendance />;
      case "performance":
        if (user.role === "MANAGER") return <ManagerDashboard />;
        if (user.role === "HR_ADMIN" || user.role === "SUPER_ADMIN") return <PerformanceManagement />;
        return <Performance />;
      case "benefits":
        if (user.role === "HR_ADMIN" || user.role === "SUPER_ADMIN") {
          return <BenefitsAdmin />;
        }
        return <Benefits />;
      case "surveys":
        if (user.role === "HR_ADMIN" || user.role === "SUPER_ADMIN") {
          return <SurveysAdmin />;
        }
        return <EmployeeSurveys />;
      case "lms":
        if (user.role === "HR_ADMIN" || user.role === "SUPER_ADMIN") {
          return <LMSAdmin />;
        }
        return <EmployeeLMS />;
      case "leave-approvals":
        return <AdminLeaveRequests />;
      case "leave":
        return <Leave />;
      case "my-payroll":
        return <MyPayroll />;
      case "reports":
        if (user.role === "MANAGER") return <TeamReports />;
        return <Reports />;
      case "portal":
        return <EmployeePortal />;
      case "profile":
        return <Profile />;
      case "documents":
        return <Profile initialTab="documents" />;
      case "help":
        return <Support />;
      case "knowledge-base":
        return <CompanyDocuments />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const [isRegistering, setIsRegistering] = useState(false);

  if (careersMatch) {
    return (
      <Suspense fallback={<PageLoader />}>
        <CareersPage companyIdentifier={careersMatch[1]} initialRequisitionId={careersMatch[2] || null} />
      </Suspense>
    );
  }

  if (!isAuthenticated) {
    if (isRegistering) {
      return (
        <Suspense fallback={<PageLoader />}>
          <RegisterPage 
            onLogin={login} 
            onNavigateLogin={() => setIsRegistering(false)} 
          />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<PageLoader />}>
        <LoginPage onLogin={login} onNavigateRegister={() => setIsRegistering(true)} />
      </Suspense>
    );
  }

  // Ensure user is not null here for Header and Sidebar
  if (!user) return null;

  if (user.status === "onboarding") {
    return (
      <Suspense fallback={<PageLoader />}>
        <EmployeeOnboarding />
      </Suspense>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        toggle={toggleSidebar}
        userRole={user.role}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header activeTab={activeTab} user={user} onLogout={logout} />
        <main className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-8">
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              {renderContent()}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <PopupProvider>
        <AuthProvider>
          <NavigationProvider>
            <BrandingProvider>
              <AppContent />
            </BrandingProvider>
          </NavigationProvider>
        </AuthProvider>
      </PopupProvider>
    </ErrorBoundary>
  );
};

export default App;
