
import { useEffect } from "react";
import SettingsForm from "@/components/SettingsForm";
import DashboardLayout from "@/components/DashboardLayout";

const Settings = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <DashboardLayout title="Settings" backLink="/dashboard">
      <div className="max-w-4xl mx-auto">
        <SettingsForm />
      </div>
    </DashboardLayout>
  );
};

export default Settings;
