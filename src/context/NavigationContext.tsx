import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface NavigationContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined,
);

const pathToTab = (pathname: string): string => {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  if (!clean) return "dashboard";
  if (clean.startsWith("careers")) return "careers";
  if (clean === "employees") return "workforce";
  if (clean === "leaves") return "leave";
  if (clean === "lms") return "learning";
  return clean;
};

const tabToPath = (tab: string): string => {
  if (tab === "dashboard") return "/dashboard";
  if (tab === "careers") return window.location.pathname.startsWith("/careers") ? window.location.pathname : "/careers";
  return `/${tab}`;
};

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTabState] = useState(() => pathToTab(location.pathname));
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Sync activeTab when user navigates via browser back/forward buttons or direct URL change
  useEffect(() => {
    const tabFromUrl = pathToTab(location.pathname);
    setActiveTabState((prev) => (prev !== tabFromUrl ? tabFromUrl : prev));
  }, [location.pathname]);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    const targetPath = tabToPath(tab);
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <NavigationContext.Provider
      value={{ activeTab, setActiveTab, isSidebarOpen, toggleSidebar }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};
