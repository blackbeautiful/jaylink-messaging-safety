
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Upload, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import AudioFileList from "@/components/audio/AudioFileList";
import RecordButton from "@/components/audio/RecordButton";
import TTSButton from "@/components/audio/TTSButton";
import UploadButton from "@/components/audio/UploadButton";

interface AudioFile {
  id: string;
  name: string;
  duration: string;
  type: "upload" | "recording" | "tts";
  created: string;
  url?: string;
}

const AudioMessage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch audio files on component mount
    const fetchAudioFiles = async () => {
      try {
        // Mock API call - in production, this would be a real API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        setAudioFiles([
          {
            id: "1",
            name: "Welcome Message",
            duration: "15",
            type: "tts",
            created: "2023-07-15"
          },
          {
            id: "2",
            name: "Payment Reminder",
            duration: "22",
            type: "recording",
            created: "2023-07-10"
          },
          {
            id: "3",
            name: "New Product Announcement",
            duration: "45",
            type: "upload",
            created: "2023-07-05"
          }
        ]);
      } catch (error) {
        console.error("Error fetching audio files:", error);
        toast.error("Failed to load audio files");
      }
    };

    fetchAudioFiles();
  }, []);

  const handleDeleteAudio = (id: string) => {
    setAudioFiles(prev => prev.filter(file => file.id !== id));
    toast.success("Audio file deleted");
  };

  const handleUpload = (name: string, file: File) => {
    setIsUploading(true);
    
    // Simulate API call
    setTimeout(() => {
      const newFile: AudioFile = {
        id: `upload-${Date.now()}`,
        name,
        duration: "30", // In real app, get actual duration
        type: "upload",
        created: new Date().toISOString().split('T')[0]
      };
      
      setAudioFiles(prev => [newFile, ...prev]);
      setIsUploading(false);
      toast.success("Audio file uploaded successfully");
    }, 1500);
  };

  const handleRecordingComplete = (blob: Blob, duration: number, name: string) => {
    const newFile: AudioFile = {
      id: `rec-${Date.now()}`,
      name,
      duration: Math.ceil(duration).toString(),
      type: "recording",
      created: new Date().toISOString().split('T')[0],
      url: URL.createObjectURL(blob)
    };
    
    setAudioFiles(prev => [newFile, ...prev]);
    toast.success("Recording saved successfully");
  };

  const handleCreateTTS = (name: string, text: string) => {
    // Simulate API call to create TTS
    setTimeout(() => {
      const estimatedDuration = Math.ceil(text.split(/\s+/).filter(Boolean).length / 3);
      
      const newFile: AudioFile = {
        id: `tts-${Date.now()}`,
        name,
        duration: estimatedDuration.toString(),
        type: "tts",
        created: new Date().toISOString().split('T')[0]
      };
      
      setAudioFiles(prev => [newFile, ...prev]);
      toast.success("Text-to-speech audio created successfully");
    }, 1500);
  };

  const handleUseInCampaign = () => {
    navigate("/voice-calls");
    toast.info("Select your audio file in the campaign editor");
  };

  return (
    <AppLayout title="Audio Messages" currentPath="/audio-message">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Create Audio Message</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <RecordButton onRecordingComplete={handleRecordingComplete} />
              <UploadButton onUpload={handleUpload} isUploading={isUploading} />
              <TTSButton onCreateTTS={handleCreateTTS} />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="recordings">Recordings</TabsTrigger>
            <TabsTrigger value="uploads">Uploads</TabsTrigger>
            <TabsTrigger value="tts">TTS</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <AudioFileList files={audioFiles} onDelete={handleDeleteAudio} />
          </TabsContent>
          
          <TabsContent value="recordings">
            <AudioFileList 
              files={audioFiles.filter(file => file.type === "recording")} 
              onDelete={handleDeleteAudio} 
            />
          </TabsContent>
          
          <TabsContent value="uploads">
            <AudioFileList 
              files={audioFiles.filter(file => file.type === "upload")} 
              onDelete={handleDeleteAudio} 
            />
          </TabsContent>
          
          <TabsContent value="tts">
            <AudioFileList 
              files={audioFiles.filter(file => file.type === "tts")} 
              onDelete={handleDeleteAudio} 
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button 
            onClick={handleUseInCampaign} 
            className="bg-jaylink-600 hover:bg-jaylink-700 flex items-center"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Use in Voice Campaign
          </Button>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default AudioMessage;
