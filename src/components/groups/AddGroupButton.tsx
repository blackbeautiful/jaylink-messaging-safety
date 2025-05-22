// src/components/groups/AddGroupButton.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import GroupDialog from "./GroupDialog";

interface AddGroupButtonProps {
  onAddGroup: (name: string, description: string) => void;
}

const AddGroupButton = ({ onAddGroup }: AddGroupButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Group
        </Button>
      </DialogTrigger>
      <GroupDialog 
        open={open} 
        onOpenChange={setOpen} 
        onSave={onAddGroup} 
      />
    </Dialog>
  );
};

export default AddGroupButton;
