// src/components/groups/AddContactButton.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import ContactDialog from "./ContactDialog";

interface AddContactButtonProps {
  onAddContact: (name: string, phone: string, email: string) => void;
}

const AddContactButton = ({ onAddContact }: AddContactButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Users className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </DialogTrigger>
      <ContactDialog 
        open={open} 
        onOpenChange={setOpen} 
        onSave={onAddContact} 
      />
    </Dialog>
  );
};

export default AddContactButton;
