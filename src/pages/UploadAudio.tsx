
import { useEffect } from "react";
import AudioUploadForm from "@/components/AudioUploadForm";
import DashboardLayout from "@/components/DashboardLayout";

const UploadAudio = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <DashboardLayout title="Upload Audio" backLink="/dashboard" currentPath="/upload-audio">
      <AudioUploadForm />
    </DashboardLayout>
  );
};

export default UploadAudio;
