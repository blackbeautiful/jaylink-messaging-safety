
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import RecordDialog from "./RecordDialog";

interface RecordButtonProps {
  onSaveRecording: (name: string, duration: number) => void;
}

const RecordButton = ({ onSaveRecording }: RecordButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-20 flex flex-col items-center justify-center bg-red-600 hover:bg-red-700">
          <Mic className="h-6 w-6 mb-1" />
          <span>Record Audio</span>
        </Button>
      </DialogTrigger>
      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        onSaveRecording={onSaveRecording}
      />
    </Dialog>
  );
};

export default RecordButton;
