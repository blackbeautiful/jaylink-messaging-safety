
import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AudioUploadForm from "@/components/AudioUploadForm";

const AudioMessage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <DashboardLayout title="Send Audio Message" backLink="/dashboard">
      <div className="max-w-3xl mx-auto">
        <AudioUploadForm />
      </div>
    </DashboardLayout>
  );
};

export default AudioMessage;
