import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import MessageForm from "@/components/MessageForm";

const SendSMS = () => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <DashboardLayout 
      title="Send SMS" 
      backLink="/dashboard"
      currentPath={location.pathname}
    >
      <div className="max-w-3xl mx-auto">
        <MessageForm />
      </div>
    </DashboardLayout>
  );
};

export default SendSMS;