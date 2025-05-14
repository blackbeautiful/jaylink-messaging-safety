import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import BalanceOverview from "@/components/BalanceOverview";

const Balance = () => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <DashboardLayout 
      title="Balance & Transactions" 
      backLink="/dashboard"
      currentPath={location.pathname}
    >
      {/* Removed fixed width constraint to make it fully responsive */}
      <div className="w-full">
        <BalanceOverview />
      </div>
    </DashboardLayout>
  );
};

export default Balance;