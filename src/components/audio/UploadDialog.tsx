
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileAudio } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (name: string, file: File) => void;
  isUploading: boolean;
}

const UploadDialog = ({ open, onOpenChange, onUpload, isUploading }: UploadDialogProps) => {
  const [audioName, setAudioName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setAudioName(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = () => {
    if (file && audioName) {
      onUpload(audioName, file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={audioName}
              onChange={(e) => setAudioName(e.target.value)}
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
              {file && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {file.name}
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || !file || !audioName}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? "Uploading..." : "Upload Audio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
