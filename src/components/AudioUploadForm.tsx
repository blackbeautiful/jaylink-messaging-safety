
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Upload, MessageSquare, Plus } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import AudioFileList from "@/components/audio/AudioFileList";
import RecordButton from "@/components/audio/RecordButton";
import TTSButton from "@/components/audio/TTSButton";
import UploadButton from "@/components/audio/UploadButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface AudioFile {
  id: string;
  name: string;
  duration: string;
  type: "upload" | "recording" | "tts";
  created: string;
  url?: string;
}

const AudioUploadForm = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([
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
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

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
      setDialogOpen(false);
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
    setDialogOpen(false);
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
      setDialogOpen(false);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card>
        <CardContent className="pt-6">
          {/* Mobile View */}
          <div className="md:hidden">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full py-6 flex flex-col items-center justify-center gap-2">
                  <Plus size={24} />
                  <span>New Audio</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Audio</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Button onClick={() => setDialogOpen(false)} variant="outline" className="w-full py-6 flex flex-col items-center justify-center gap-2">
                    <Mic size={24} />
                    <span>Record Audio</span>
                  </Button>
                  
                  <Button onClick={() => setDialogOpen(false)} variant="outline" className="w-full py-6 flex flex-col items-center justify-center gap-2">
                    <Upload size={24} />
                    <span>Upload Audio</span>
                  </Button>
                  
                  <Button onClick={() => setDialogOpen(false)} variant="outline" className="w-full py-6 flex flex-col items-center justify-center gap-2">
                    <MessageSquare size={24} />
                    <span>Text to Speech</span>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Desktop View */}
          <div className="hidden md:grid grid-cols-3 gap-4">
            <RecordButton onRecordingComplete={handleRecordingComplete} />
            <UploadButton onUpload={handleUpload} isUploading={isUploading} />
            <TTSButton onCreateTTS={handleCreateTTS} />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
    </motion.div>
  );
};

export default AudioUploadForm;
