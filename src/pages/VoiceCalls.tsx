
import { useEffect } from "react";
import VoiceCallForm from "@/components/VoiceCallForm";
import AppLayout from "@/components/layout/AppLayout";

const VoiceCalls = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <AppLayout title="Voice Calls" currentPath="/voice-calls">
      <VoiceCallForm />
    </AppLayout>
  );
};

export default VoiceCalls;
