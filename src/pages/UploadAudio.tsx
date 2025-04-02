
import { useEffect } from "react";
import AudioUploadForm from "@/components/AudioUploadForm";
import AppLayout from "@/components/layout/AppLayout";

const UploadAudio = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <AppLayout title="Upload Audio" currentPath="/upload-audio">
      <AudioUploadForm />
    </AppLayout>
  );
};

export default UploadAudio;
