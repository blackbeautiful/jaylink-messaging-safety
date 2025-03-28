
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TTSDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTTS: (name: string, text: string) => void;
}

const TTSDialog = ({ open, onOpenChange, onCreateTTS }: TTSDialogProps) => {
  const [audioName, setAudioName] = useState("");
  const [ttsText, setTtsText] = useState("");
  
  const handleCreateTTS = () => {
    if (audioName && ttsText) {
      onCreateTTS(audioName, ttsText);
    }
  };
  
  const getEstimatedDuration = (text: string) => {
    return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 3));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={audioName}
              onChange={(e) => setAudioName(e.target.value)}
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
              {ttsText.length} characters | Estimated duration: {getEstimatedDuration(ttsText)} seconds
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateTTS}
            disabled={!audioName || !ttsText}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Generate Audio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TTSDialog;
