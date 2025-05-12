
import { useEffect } from "react";
import MessageForm from "@/components/MessageForm";
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation } from "react-router-dom";

const SendSMS = () => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <DashboardLayout 
      title="Send Messages" 
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
