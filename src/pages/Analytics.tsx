import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download, Calendar } from "lucide-react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import AnalyticsCharts from "@/components/AnalyticsCharts";

const Analytics = () => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <DashboardLayout 
      title="Analytics" 
      backLink="/dashboard"
      currentPath={location.pathname}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end mb-6 gap-2">
          <Button variant="outline" size="sm" className="text-sm">
            <Calendar className="mr-2 h-4 w-4" />
            Last 30 days
          </Button>
          <Button variant="outline" size="sm" className="text-sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
        <AnalyticsCharts />
      </div>
    </DashboardLayout>
  );
};

export default Analytics;