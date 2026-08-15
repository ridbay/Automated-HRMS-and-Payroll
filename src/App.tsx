import React, { useEffect, useState } from "react";
const RegisterPage = React.lazy(() => import('./features/core/RegisterPage'));
import Sidebar from "./layouts/Sidebar";
import Header from "./layouts/Header";
import Dashboard from "./features/core/Dashboard";
import HRDashboard from "./features/admin/HRDashboard";
import Workforce from "./features/admin/Workforce";
import Payroll from "./features/payroll/Payroll";
import PayrollDashboard from "./features/payroll/PayrollDashboard";
import Recruitment from "./features/recruitment/Recruitment";
import RecruiterDashboard from "./features/recruitment/RecruiterDashboard";
import RecruitmentAnalytics from "./features/recruitment/RecruitmentAnalytics";
import Attendance from "./features/employee/Attendance";
import Performance from "./features/employee/Performance";
import PerformanceManagement from "./features/admin/PerformanceManagement";
import EmployeePortal from "./features/employee/EmployeePortal";
import ManagerDashboard from "./features/manager/ManagerDashboard";
import TeamReports from "./features/manager/TeamReports";
import Benefits from "./features/employee/Benefits";
import Leave from "./features/employee/Leave";
import MyPayroll from "./features/employee/MyPayroll";
import Reports from "./features/admin/Reports";
import Settings from "./features/core/Settings";
import LoginPage from "./features/core/LoginPage";
import Profile from "./features/employee/Profile";
import AssetManagement from "./features/admin/AssetManagement";
import Onboarding from "./features/admin/Onboarding";
import Directory from "./features/core/Directory";
import AdminLeaveRequests from "./features/admin/AdminLeaveRequests";
import AttendanceManagement from "./features/admin/AttendanceManagement";
import BenefitsAdmin from "./features/admin/BenefitsAdmin";
import SurveysAdmin from "./features/admin/SurveysAdmin";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NavigationProvider, useNavigation } from "./context/NavigationContext";

import Support from "./features/support/Support";
import EmployeeOnboarding from "./features/employee/EmployeeOnboarding";

const AppContent: React.FC = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const { activeTab, setActiveTab, isSidebarOpen, toggleSidebar } =
    useNavigation();

  useEffect(() => {
    if (user) {
      if (user.role === "EMPLOYEE") {
        setActiveTab("portal");
      } else if (user.role === "MANAGER") {
        setActiveTab("manager-dashboard");
      } else if (user.role === "RECRUITER") {
        setActiveTab("recruiter-dashboard");
      } else {
        // HR_ADMIN, SUPER_ADMIN, PAYROLL_OFFICER all land on "dashboard" —
        // renderContent below picks the right dashboard component per role.
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
        return <Dashboard />;
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
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const [isRegistering, setIsRegistering] = useState(false);

  if (!isAuthenticated) {
    if (isRegistering) {
      return (
        <React.Suspense fallback={<div>Loading...</div>}>
          <RegisterPage 
            onLogin={login} 
            onNavigateLogin={() => setIsRegistering(false)} 
          />
        </React.Suspense>
      );
    }
    return <LoginPage onLogin={login} onNavigateRegister={() => setIsRegistering(true)} />;
  }

  // Ensure user is not null here for Header and Sidebar
  if (!user) return null;

  if (user.status === "onboarding") {
    return <EmployeeOnboarding />;
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
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

import { PopupProvider } from "./components/PopupProvider";

const App: React.FC = () => {
  return (
    <PopupProvider>
      <AuthProvider>
        <NavigationProvider>
          <AppContent />
        </NavigationProvider>
      </AuthProvider>
    </PopupProvider>
  );
};

export default App;
