
import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Volume2, Upload, Mic, Play, Pause, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const AudioMessage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [group, setGroup] = useState("");
  const [message, setMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('audio/')) {
        setSelectedFile(file);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload an audio file only"
        });
      }
    }
  };

  const toggleRecording = () => {
    setRecording(!recording);
    if (!recording) {
      toast({
        title: "Recording started",
        description: "Your audio is now being recorded"
      });
    } else {
      toast({
        title: "Recording stopped",
        description: "Your audio has been saved"
      });
    }
  };

  const togglePlayback = () => {
    setPlaying(!playing);
  };

  const handleSend = () => {
    if (!selectedFile && !recording) {
      toast({
        variant: "destructive",
        title: "Audio required",
        description: "Please upload or record an audio message"
      });
      return;
    }

    if (!group) {
      toast({
        variant: "destructive",
        title: "Group required",
        description: "Please select a recipient group"
      });
      return;
    }

    // Simulating sending process
    toast({
      title: "Audio message sent",
      description: `Your audio message has been sent to ${group}`
    });
  };

  return (
    <DashboardLayout title="Send Audio Message" backLink="/dashboard">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center">
              <Volume2 className="mr-2 h-5 w-5 text-jaylink-600" />
              Send Audio Message
            </CardTitle>
            <CardDescription>
              Upload or record an audio message to send to your contacts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="group">Select Recipient Group</Label>
                  <Select value={group} onValueChange={setGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customers">Customers</SelectItem>
                      <SelectItem value="employees">Employees</SelectItem>
                      <SelectItem value="vendors">Vendors</SelectItem>
                      <SelectItem value="subscribers">Subscribers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="message">Additional Text Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter a text message to accompany your audio"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Upload Audio File</Label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                    <Input
                      id="audio-upload"
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Label htmlFor="audio-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                      <Upload className="h-10 w-10 text-gray-400" />
                      <span className="text-sm font-medium">
                        {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                      </span>
                      <span className="text-xs text-gray-500">
                        Supported formats: MP3, WAV, M4A (Max 10MB)
                      </span>
                    </Label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Or Record Audio</Label>
                  <div className="border rounded-lg p-6 text-center flex flex-col items-center space-y-4">
                    <div className="flex justify-center items-center h-16 w-16 rounded-full bg-jaylink-100 text-jaylink-600">
                      {recording ? (
                        <div className="h-6 w-6 rounded-full bg-red-500 animate-pulse" />
                      ) : (
                        <Mic className="h-8 w-8" />
                      )}
                    </div>
                    <div className="space-x-3">
                      <Button 
                        onClick={toggleRecording} 
                        variant={recording ? "destructive" : "default"}
                        className={recording ? "bg-red-500" : "bg-jaylink-600"}
                      >
                        {recording ? "Stop Recording" : "Start Recording"}
                      </Button>
                      {!recording && (
                        <Button 
                          onClick={togglePlayback} 
                          variant="outline"
                          disabled={!selectedFile && !recording}
                        >
                          {playing ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                          {playing ? "Pause" : "Play"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex items-center text-amber-600">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span className="text-xs">Audio messages will count as multiple SMS credits based on duration</span>
              </div>
              <Button 
                onClick={handleSend}
                className="bg-jaylink-600 hover:bg-jaylink-700"
              >
                Send Audio Message
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AudioMessage;
