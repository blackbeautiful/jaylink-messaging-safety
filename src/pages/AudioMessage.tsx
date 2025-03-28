
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UploadCloud, Mic, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/DashboardLayout";
import AudioFileList from "@/components/audio/AudioFileList";
import UploadDialog from "@/components/audio/UploadDialog";
import RecordDialog from "@/components/audio/RecordDialog";
import TTSDialog from "@/components/audio/TTSDialog";

// Mock audio file data
const mockAudioFiles = [
  {
    id: "1",
    name: "Welcome Message",
    duration: "0:45",
    size: "2.3 MB",
    created: "2023-05-15",
    type: "recording",
  },
  {
    id: "2",
    name: "Product Announcement",
    duration: "1:32",
    size: "4.1 MB",
    created: "2023-05-20",
    type: "upload",
  },
  {
    id: "3",
    name: "Customer Support Greeting",
    duration: "0:28",
    size: "1.5 MB",
    created: "2023-06-02",
    type: "tts",
  },
  {
    id: "4",
    name: "Holiday Special",
    duration: "2:15",
    size: "5.8 MB",
    created: "2023-06-15",
    type: "upload",
  },
  {
    id: "5",
    name: "Monthly Newsletter",
    duration: "1:05",
    size: "3.2 MB",
    created: "2023-07-01",
    type: "tts",
  },
];

interface AudioFile {
  id: string;
  name: string;
  duration: string;
  size: string;
  created: string;
  type: string;
}

const AudioMessage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [audioFiles, setAudioFiles] = useState<AudioFile[]>(mockAudioFiles);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openRecordDialog, setOpenRecordDialog] = useState(false);
  const [openTTSDialog, setOpenTTSDialog] = useState(false);

  const filteredAudioFiles = audioFiles.filter(
    (file) =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpload = (name: string, file: File) => {
    if (!name || !file) {
      toast("Please enter a name and select a file");
      return;
    }
    
    setIsUploading(true);
    
    // Simulate upload
    setTimeout(() => {
      const newAudio = {
        id: Date.now().toString(),
        name,
        duration: "1:30", // Example duration
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        created: new Date().toISOString().split("T")[0],
        type: "upload",
      };

      setAudioFiles([newAudio, ...audioFiles]);
      setIsUploading(false);
      setOpenUploadDialog(false);
      toast("Your audio file has been uploaded");
    }, 1500);
  };

  const handleSaveRecording = (name: string, duration: number) => {
    if (!name) {
      toast("Please enter a name for your recording");
      return;
    }
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    const newAudio = {
      id: Date.now().toString(),
      name,
      duration: `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`,
      size: "2.4 MB", // Example size
      created: new Date().toISOString().split("T")[0],
      type: "recording",
    };

    setAudioFiles([newAudio, ...audioFiles]);
    setOpenRecordDialog(false);
    toast("Your audio recording has been saved");
  };

  const handleCreateTTS = (name: string, text: string) => {
    if (!name || !text) {
      toast("Please enter a name and text");
      return;
    }
    
    // Simulate TTS processing
    setTimeout(() => {
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const estimatedDuration = Math.max(5, Math.ceil(wordCount / 3));
      const minutes = Math.floor(estimatedDuration / 60);
      const seconds = estimatedDuration % 60;
      
      const newAudio = {
        id: Date.now().toString(),
        name,
        duration: `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`,
        size: "1.2 MB", // Example size
        created: new Date().toISOString().split("T")[0],
        type: "tts",
      };

      setAudioFiles([newAudio, ...audioFiles]);
      setOpenTTSDialog(false);
      toast("Your audio file has been generated from text");
    }, 1500);
  };

  const handleDeleteAudio = (id: string) => {
    setAudioFiles(audioFiles.filter(file => file.id !== id));
    toast("The audio file has been removed");
  };

  return (
    <DashboardLayout title="Audio Messages" backLink="/dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col space-y-6">
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="w-full sm:w-96">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search audio files..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setOpenUploadDialog(true)}
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload Audio
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setOpenRecordDialog(true)}
              >
                <Mic className="mr-2 h-4 w-4" />
                Record Audio
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setOpenTTSDialog(true)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Text to Speech
              </Button>
            </div>
          </div>

          {/* Audio Files List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Audio Files</CardTitle>
              <CardDescription>
                Manage your audio recordings and uploads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid grid-cols-4 mb-6">
                  <TabsTrigger value="all">All Files</TabsTrigger>
                  <TabsTrigger value="upload">Uploads</TabsTrigger>
                  <TabsTrigger value="recording">Recordings</TabsTrigger>
                  <TabsTrigger value="tts">Text-to-Speech</TabsTrigger>
                </TabsList>
                
                <AudioFileList 
                  audioFiles={filteredAudioFiles.filter(file => 
                    Tabs.valueOf === "all" || file.type === Tabs.valueOf
                  )} 
                  onDeleteAudio={handleDeleteAudio} 
                />
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <UploadDialog
        open={openUploadDialog}
        onOpenChange={setOpenUploadDialog}
        onUpload={handleUpload}
        isUploading={isUploading}
      />
      
      <RecordDialog
        open={openRecordDialog}
        onOpenChange={setOpenRecordDialog}
        onSaveRecording={handleSaveRecording}
      />
      
      <TTSDialog
        open={openTTSDialog}
        onOpenChange={setOpenTTSDialog}
        onCreateTTS={handleCreateTTS}
      />
    </DashboardLayout>
  );
};

export default AudioMessage;
