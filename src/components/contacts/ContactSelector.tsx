
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface ContactSelectorProps {
  onContactsSelected: (contacts: Contact[]) => void;
  buttonText?: string;
  contacts: Contact[];
}

const ContactSelector = ({ onContactsSelected, buttonText = "Select Contacts", contacts }: ContactSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const filteredContacts = contacts.filter(
    contact => 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery) ||
      (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleToggleContact = (contact: Contact) => {
    setSelectedContacts(prev => {
      const isSelected = prev.some(c => c.id === contact.id);
      if (isSelected) {
        return prev.filter(c => c.id !== contact.id);
      } else {
        return [...prev, contact];
      }
    });
  };

  const handleSubmit = () => {
    onContactsSelected(selectedContacts);
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchQuery("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full flex items-center gap-2"
          onClick={() => setIsOpen(true)}
        >
          <Search className="h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className={isMobile ? "w-[95vw] max-w-[95vw]" : "max-w-md w-full"}>
        <DialogHeader>
          <DialogTitle>Select Contacts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />

          <div className="text-sm text-muted-foreground mb-2">
            {selectedContacts.length} contact(s) selected
          </div>
          
          <ScrollArea className="h-[300px] border rounded-md p-2">
            {filteredContacts.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                No contacts found
              </div>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map(contact => (
                  <div 
                    key={contact.id}
                    className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                    onClick={() => handleToggleContact(contact)}
                  >
                    <Checkbox 
                      id={`contact-${contact.id}`}
                      checked={selectedContacts.some(c => c.id === contact.id)}
                      onCheckedChange={() => handleToggleContact(contact)}
                    />
                    <div className="flex flex-col">
                      <label 
                        htmlFor={`contact-${contact.id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {contact.name}
                      </label>
                      <span className="text-xs text-muted-foreground">{contact.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Add {selectedContacts.length} Contact{selectedContacts.length !== 1 && 's'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactSelector;
