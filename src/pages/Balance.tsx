// src/pages/Balance.tsx - Enhanced with full backend integration
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
      <div className="w-full space-y-6">
        <BalanceOverview />
      </div>
    </DashboardLayout>
  );
};

export default Balance;