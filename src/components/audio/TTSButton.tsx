
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import TTSDialog from "./TTSDialog";

interface TTSButtonProps {
  onCreateTTS: (name: string, text: string) => void;
}

const TTSButton = ({ onCreateTTS }: TTSButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-20 flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700">
          <MessageSquare className="h-6 w-6 mb-1" />
          <span>Text to Speech</span>
        </Button>
      </DialogTrigger>
      <TTSDialog
        open={open}
        onOpenChange={setOpen}
        onCreateTTS={onCreateTTS}
      />
    </Dialog>
  );
};

export default TTSButton;
