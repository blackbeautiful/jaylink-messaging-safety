
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import UploadDialog from "./UploadDialog";

interface UploadButtonProps {
  onUpload: (name: string, file: File) => void;
  isUploading: boolean;
}

const UploadButton = ({ onUpload, isUploading }: UploadButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-20 flex flex-col items-center justify-center" variant="outline">
          <Upload className="h-6 w-6 mb-1" />
          <span>Upload Audio</span>
        </Button>
      </DialogTrigger>
      <UploadDialog
        open={open}
        onOpenChange={setOpen}
        onUpload={onUpload}
        isUploading={isUploading}
      />
    </Dialog>
  );
};

export default UploadButton;
