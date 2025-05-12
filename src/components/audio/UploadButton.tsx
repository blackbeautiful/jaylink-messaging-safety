
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import UploadDialog from "./UploadDialog";
import { UploadButtonProps } from "./UploadButtonProps";

const UploadButton = ({ onUpload, isUploading, onChange }: UploadButtonProps) => {
  const [open, setOpen] = useState(false);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && onChange) {
      onChange(Array.from(files));
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Button 
        className="h-20 flex flex-col items-center justify-center" 
        variant="outline"
        onClick={() => document.getElementById('file-upload')?.click()}
        type="button"
      >
        <Upload className="h-6 w-6 mb-1" />
        <span>Upload Audio</span>
      </Button>
      <input
        id="file-upload"
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default UploadButton;
