// src/pages/Settings.tsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import SettingsForm from "@/components/SettingsForm";

const Settings = () => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <DashboardLayout 
      title="Settings" 
      backLink="/dashboard"
      currentPath={location.pathname}
    >
      <div className="max-w-4xl mx-auto">
        <SettingsForm />
      </div>
    </DashboardLayout>
  );
};

export default Settings;