import React, { useEffect } from "react";
import Sidebar from "./layouts/Sidebar";
import Header from "./layouts/Header";
import Dashboard from "./features/core/Dashboard";
import HRDashboard from "./features/admin/HRDashboard";
import Workforce from "./features/admin/Workforce";
import Payroll from "./features/payroll/Payroll";
import Recruitment from "./features/recruitment/Recruitment";
import Attendance from "./features/employee/Attendance";
import Performance from "./features/employee/Performance";
import EmployeePortal from "./features/employee/EmployeePortal";
import ManagerDashboard from "./features/manager/ManagerDashboard";
import Benefits from "./features/employee/Benefits";
import Leave from "./features/employee/Leave";
import MyPayroll from "./features/employee/MyPayroll";
import Reports from "./features/admin/Reports";
import Settings from "./features/core/Settings";
import LoginPage from "./features/core/LoginPage";
import Profile from "./features/employee/Profile";
import AssetManagement from "./features/admin/AssetManagement";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NavigationProvider, useNavigation } from "./context/NavigationContext";

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
        return <Dashboard />;
      case "manager-dashboard":
        return <ManagerDashboard />;
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
        return <Recruitment />;
      case "assets":
        return <AssetManagement />;
      case "attendance":
        return <Attendance />;
      case "performance":
        if (user.role === "MANAGER") return <ManagerDashboard />;
        return <Performance />;
      case "benefits":
        return <Benefits />;
      case "leave":
        return <Leave />;
      case "my-payroll":
        return <MyPayroll />;
      case "reports":
        if (user.role === "MANAGER") return <ManagerDashboard />;
        return <Reports />;
      case "portal":
        return <EmployeePortal />;
      case "profile":
        return <Profile />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  // Ensure user is not null here for Header and Sidebar
  if (!user) return null;

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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </AuthProvider>
  );
};

export default App;
