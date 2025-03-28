
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveRecording: (name: string, duration: number) => void;
}

const RecordDialog = ({ open, onOpenChange, onSaveRecording }: RecordDialogProps) => {
  const [audioName, setAudioName] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);
  
  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
  };
  
  const handleStopRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (audioName) {
        onSaveRecording(audioName, recordingTime);
      }
    }
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value && isRecording) {
        setIsRecording(false);
      }
      onOpenChange(value);
    }}>
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
              value={audioName}
              onChange={(e) => setAudioName(e.target.value)}
              placeholder="Enter a name for this recording"
            />
          </div>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
              <Mic className={`h-12 w-12 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} />
            </div>
            <div className="text-lg font-semibold">
              {isRecording
                ? `Recording... ${formatTime(recordingTime)}`
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
  );
};

export default RecordDialog;
