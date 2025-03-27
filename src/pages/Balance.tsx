
import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import BalanceOverview from "@/components/BalanceOverview";

const Balance = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <DashboardLayout title="Balance & Transactions" backLink="/dashboard">
      <div className="max-w-6xl mx-auto">
        <BalanceOverview />
      </div>
    </DashboardLayout>
  );
};

export default Balance;
