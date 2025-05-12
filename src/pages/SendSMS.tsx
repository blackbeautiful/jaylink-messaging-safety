
import { useEffect } from "react";
import MessageForm from "@/components/MessageForm";
import DashboardLayout from "@/components/DashboardLayout";

const SendSMS = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <DashboardLayout title="Send Messages" currentPath="/send-sms">
      <div className="max-w-3xl mx-auto">
        <MessageForm />
      </div>
    </DashboardLayout>
  );
};

export default SendSMS;
