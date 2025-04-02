
import { useEffect } from "react";
import MessageForm from "@/components/MessageForm";
import AppLayout from "@/components/layout/AppLayout";

const SendSMS = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <AppLayout title="Send Messages" currentPath="/send-sms">
      <MessageForm />
    </AppLayout>
  );
};

export default SendSMS;
