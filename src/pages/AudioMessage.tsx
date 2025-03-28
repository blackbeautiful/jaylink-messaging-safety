
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Mic,
  FileAudio,
  UploadCloud,
  Edit,
  Trash2,
  Play,
  Pause,
  Clock,
  X,
  Calendar,
  FileText,
  Search,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import DashboardLayout from "@/components/DashboardLayout";

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

const AudioMessage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [audioFiles, setAudioFiles] = useState(mockAudioFiles);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openRecordDialog, setOpenRecordDialog] = useState(false);
  const [openTTSDialog, setOpenTTSDialog] = useState(false);
  const [newAudioName, setNewAudioName] = useState("");
  const [ttsText, setTtsText] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const filteredAudioFiles = audioFiles.filter(
    (file) =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setNewAudioName(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = () => {
    if (!uploadFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an audio file to upload",
      });
      return;
    }

    if (!newAudioName) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a name for your audio file",
      });
      return;
    }

    setIsUploading(true);

    // Simulate upload
    setTimeout(() => {
      const newAudio = {
        id: Date.now().toString(),
        name: newAudioName,
        duration: "1:30", // Example duration
        size: `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB`,
        created: new Date().toISOString().split("T")[0],
        type: "upload",
      };

      setAudioFiles([newAudio, ...audioFiles]);
      setIsUploading(false);
      setUploadFile(null);
      setNewAudioName("");
      setOpenDialog(false);

      toast({
        title: "Upload successful",
        description: "Your audio file has been uploaded",
      });
    }, 1500);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);

    // Simulate recording timer
    const timer = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    // Store timer ID to clear it later
    window.recordingTimer = timer;
  };

  const handleStopRecording = () => {
    if (window.recordingTimer) {
      clearInterval(window.recordingTimer);
    }
    
    setIsRecording(false);
    
    // Simulate processing recorded audio
    setTimeout(() => {
      const minutes = Math.floor(recordingTime / 60);
      const seconds = recordingTime % 60;
      
      const newAudio = {
        id: Date.now().toString(),
        name: newAudioName || "New Recording",
        duration: `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`,
        size: "2.4 MB", // Example size
        created: new Date().toISOString().split("T")[0],
        type: "recording",
      };

      setAudioFiles([newAudio, ...audioFiles]);
      setNewAudioName("");
      setOpenRecordDialog(false);

      toast({
        title: "Recording saved",
        description: "Your audio recording has been saved",
      });
    }, 1000);
  };

  const handleCreateTTS = () => {
    if (!ttsText) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter text to convert to speech",
      });
      return;
    }

    if (!newAudioName) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a name for your audio file",
      });
      return;
    }

    // Simulate TTS processing
    setTimeout(() => {
      const wordCount = ttsText.split(/\s+/).filter(Boolean).length;
      const estimatedDuration = Math.max(5, Math.ceil(wordCount / 3));
      const minutes = Math.floor(estimatedDuration / 60);
      const seconds = estimatedDuration % 60;
      
      const newAudio = {
        id: Date.now().toString(),
        name: newAudioName,
        duration: `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`,
        size: "1.2 MB", // Example size
        created: new Date().toISOString().split("T")[0],
        type: "tts",
      };

      setAudioFiles([newAudio, ...audioFiles]);
      setNewAudioName("");
      setTtsText("");
      setOpenTTSDialog(false);

      toast({
        title: "Text-to-Speech created",
        description: "Your audio file has been generated from text",
      });
    }, 1500);
  };

  const handleDeleteAudio = (id: string) => {
    setAudioFiles(audioFiles.filter(file => file.id !== id));
    toast({
      title: "Audio deleted",
      description: "The audio file has been removed",
    });
  };

  const togglePlayPause = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
    }
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
              {/* Upload Dialog */}
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload Audio
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Audio File</DialogTitle>
                    <DialogDescription>
                      Upload an audio file to use in your voice campaigns
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="audio-name">Audio Name</Label>
                      <Input
                        id="audio-name"
                        value={newAudioName}
                        onChange={(e) => setNewAudioName(e.target.value)}
                        placeholder="Enter a name for this audio"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Audio File</Label>
                      <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        <FileAudio className="mx-auto h-10 w-10 text-gray-400" />
                        <div className="mt-2">
                          <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-500">
                            Click to upload
                            <Input
                              id="file-upload"
                              type="file"
                              accept="audio/*"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="text-xs text-gray-500">MP3, WAV, or OGG up to 10MB</p>
                        </div>
                        {uploadFile && (
                          <div className="mt-2 text-sm text-gray-600">
                            Selected: {uploadFile.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isUploading ? "Uploading..." : "Upload Audio"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Record Dialog */}
              <Dialog open={openRecordDialog} onOpenChange={setOpenRecordDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Mic className="mr-2 h-4 w-4" />
                    Record Audio
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Audio</DialogTitle>
                    <DialogDescription>
                      Create a new audio recording for your campaigns
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="recording-name">Recording Name</Label>
                      <Input
                        id="recording-name"
                        value={newAudioName}
                        onChange={(e) => setNewAudioName(e.target.value)}
                        placeholder="Enter a name for this recording"
                      />
                    </div>
                    <div className="flex flex-col items-center justify-center py-6 space-y-4">
                      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                        <Mic className={`h-12 w-12 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} />
                      </div>
                      <div className="text-lg font-semibold">
                        {isRecording
                          ? `Recording... ${Math.floor(recordingTime / 60)}:${recordingTime % 60 < 10 ? '0' : ''}${recordingTime % 60}`
                          : 'Ready to Record'}
                      </div>
                      {isRecording ? (
                        <Button
                          variant="destructive"
                          size="lg"
                          className="rounded-full px-6"
                          onClick={handleStopRecording}
                        >
                          <X className="mr-2 h-4 w-4" /> Stop Recording
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          className="rounded-full px-6 bg-red-600 hover:bg-red-700"
                          onClick={handleStartRecording}
                        >
                          <Mic className="mr-2 h-4 w-4" /> Start Recording
                        </Button>
                      )}
                    </div>
                  </div>
                  <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
                    <Button variant="outline" onClick={() => setOpenRecordDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleStopRecording}
                      disabled={!isRecording}
                      className="mb-2 sm:mb-0 bg-blue-600 hover:bg-blue-700"
                    >
                      Save Recording
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Text-to-Speech Dialog */}
              <Dialog open={openTTSDialog} onOpenChange={setOpenTTSDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Text to Speech
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Text-to-Speech Audio</DialogTitle>
                    <DialogDescription>
                      Convert your text into natural-sounding speech
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="tts-name">Audio Name</Label>
                      <Input
                        id="tts-name"
                        value={newAudioName}
                        onChange={(e) => setNewAudioName(e.target.value)}
                        placeholder="Enter a name for this audio"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tts-text">Text to Convert</Label>
                      <Textarea
                        id="tts-text"
                        value={ttsText}
                        onChange={(e) => setTtsText(e.target.value)}
                        placeholder="Enter the text you want to convert to speech..."
                        rows={5}
                      />
                      <p className="text-xs text-gray-500">
                        {ttsText.length} characters | Estimated duration: {Math.max(1, Math.ceil(ttsText.split(/\s+/).filter(Boolean).length / 3))} seconds
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenTTSDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateTTS}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Generate Audio
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="h-[400px] md:h-auto w-full">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead className="w-[100px]">Duration</TableHead>
                            <TableHead className="hidden sm:table-cell w-[100px]">Size</TableHead>
                            <TableHead className="hidden md:table-cell w-[150px]">Created</TableHead>
                            <TableHead className="hidden sm:table-cell w-[100px]">Type</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAudioFiles.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="h-32 text-center text-gray-500"
                              >
                                No audio files found. Upload or record an audio file to get started.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredAudioFiles.map((file) => (
                              <TableRow key={file.id}>
                                <TableCell className="font-medium">{file.name}</TableCell>
                                <TableCell className="flex items-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-full mr-2 text-gray-500 hover:text-gray-700"
                                    onClick={() => togglePlayPause(file.id)}
                                  >
                                    {playingId === file.id ? (
                                      <Pause className="h-3 w-3" />
                                    ) : (
                                      <Play className="h-3 w-3" />
                                    )}
                                  </Button>
                                  {file.duration}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">{file.size}</TableCell>
                                <TableCell className="hidden md:table-cell">{file.created}</TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      file.type === "upload"
                                        ? "bg-blue-100 text-blue-800"
                                        : file.type === "recording"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-purple-100 text-purple-800"
                                    }`}
                                  >
                                    {file.type === "upload"
                                      ? "Uploaded"
                                      : file.type === "recording"
                                      ? "Recording"
                                      : "TTS"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">Actions</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Rename
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteAudio(file.id)} className="text-red-600">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

// For TypeScript
declare global {
  interface Window {
    recordingTimer: NodeJS.Timeout;
  }
}

export default AudioMessage;
