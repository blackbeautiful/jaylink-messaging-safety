
import { useEffect } from "react";
import VoiceCallForm from "@/components/VoiceCallForm";
import DashboardLayout from "@/components/DashboardLayout";

const VoiceCalls = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <DashboardLayout title="Voice Calls" backLink="/dashboard" currentPath="/voice-calls">
      <VoiceCallForm />
    </DashboardLayout>
  );
};

export default VoiceCalls;
