
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TTSButton from "@/components/audio/TTSButton";
import RecordButton from "@/components/audio/RecordButton";
import UploadButton from "@/components/audio/UploadButton";
import AudioFileList from "@/components/audio/AudioFileList";
import { FileMusic, Mic, MessageSquare, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

// Type definition for audio files
interface AudioFile {
  id: string;
  name: string;
  duration: number;
  type: "tts" | "recording" | "upload";
  created: string;
}

// Mock data for audio files
const MOCK_AUDIO_FILES: AudioFile[] = [
  {
    id: "1",
    name: "Welcome Message",
    duration: 24,
    type: "tts",
    created: "2023-05-10",
  },
  {
    id: "2",
    name: "New Service Announcement",
    duration: 32,
    type: "tts",
    created: "2023-06-15",
  },
  {
    id: "3",
    name: "Customer Feedback Request",
    duration: 18,
    type: "upload",
    created: "2023-07-20",
  },
  {
    id: "4",
    name: "Office Closed Notification",
    duration: 15,
    type: "recording",
    created: "2023-08-05",
  },
  {
    id: "5",
    name: "Holiday Greetings",
    duration: 45,
    type: "upload",
    created: "2023-09-12",
  },
];

const AudioMessage = () => {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>(MOCK_AUDIO_FILES);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Filter files based on active tab and search query
  const filteredFiles = audioFiles.filter((file) => {
    const matchesTab = activeTab === "all" || file.type === activeTab;
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleCreateTTS = (name: string, text: string) => {
    // Mock TTS creation
    const newAudio = {
      id: Date.now().toString(),
      name,
      duration: Math.ceil(text.split(/\s+/).filter(Boolean).length / 3),
      type: "tts" as const,
      created: new Date().toISOString().split("T")[0],
    };

    setAudioFiles([newAudio, ...audioFiles]);
    toast.success("Text-to-Speech audio created successfully");
  };

  const handleSaveRecording = (name: string, duration: number) => {
    // Mock recording creation
    const newAudio = {
      id: Date.now().toString(),
      name,
      duration,
      type: "recording" as const,
      created: new Date().toISOString().split("T")[0],
    };

    setAudioFiles([newAudio, ...audioFiles]);
    toast.success("Audio recording saved successfully");
  };

  const handleUploadAudio = (name: string, file: File) => {
    setIsUploading(true);

    // Simulate upload
    setTimeout(() => {
      const newAudio = {
        id: Date.now().toString(),
        name,
        duration: Math.floor(Math.random() * 60) + 10, // Random duration
        type: "upload" as const,
        created: new Date().toISOString().split("T")[0],
      };

      setAudioFiles([newAudio, ...audioFiles]);
      setIsUploading(false);
      toast.success("Audio file uploaded successfully");
    }, 1500);
  };

  const handleDeleteAudio = (id: string) => {
    setAudioFiles(audioFiles.filter((file) => file.id !== id));
    toast.success("Audio file deleted successfully");
  };

  return (
    <DashboardLayout title="Audio Messages" backLink="/dashboard">
      <div className="max-w-7xl mx-auto pb-6">
        <div className="flex flex-col space-y-6">
          {/* Create Audio Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Create Audio Message</CardTitle>
                <CardDescription>
                  Create audio messages to send to your contacts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <TTSButton onCreateTTS={handleCreateTTS} />
                  <RecordButton onSaveRecording={handleSaveRecording} />
                  <UploadButton onUpload={handleUploadAudio} isUploading={isUploading} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Audio Files List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Your Audio Files</CardTitle>
                <CardDescription>
                  Manage your saved audio files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      type="search"
                      placeholder="Search audio files..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <Tabs 
                    defaultValue="all" 
                    value={activeTab} 
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <div className="overflow-x-auto pb-2">
                      <TabsList className="grid min-w-max w-full grid-cols-4 mb-6">
                        <TabsTrigger value="all">All Files</TabsTrigger>
                        <TabsTrigger value="tts" className="flex items-center justify-center">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          <span className="hidden sm:inline">TTS</span>
                        </TabsTrigger>
                        <TabsTrigger value="recording" className="flex items-center justify-center">
                          <Mic className="mr-2 h-4 w-4" />
                          <span className="hidden sm:inline">Recordings</span>
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="flex items-center justify-center">
                          <FileMusic className="mr-2 h-4 w-4" />
                          <span className="hidden sm:inline">Uploads</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value={activeTab}>
                      <AudioFileList 
                        files={filteredFiles} 
                        onDelete={handleDeleteAudio} 
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AudioMessage;
