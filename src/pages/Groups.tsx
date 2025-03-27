
import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import GroupForm from "@/components/GroupForm";

const Groups = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <DashboardLayout title="Contact Groups" backLink="/dashboard">
      <div className="max-w-6xl mx-auto">
        <GroupForm />
      </div>
    </DashboardLayout>
  );
};

export default Groups;
