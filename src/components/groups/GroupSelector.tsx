
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UsersRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Contact } from "@/components/contacts/ContactSelector";

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: number;
}

interface GroupSelectorProps {
  onGroupSelected: (group: Group, contacts?: Contact[]) => void;
  buttonText?: string;
  groups: Group[];
  showContacts?: boolean;
  contacts?: Contact[];
}

const GroupSelector = ({ 
  onGroupSelected, 
  buttonText = "Select Group", 
  groups, 
  showContacts = false,
  contacts = []
}: GroupSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const filteredGroups = groups.filter(
    group => 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
  };

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
    if (selectedGroup) {
      onGroupSelected(selectedGroup, showContacts ? selectedContacts : undefined);
      setIsOpen(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchQuery("");
      setSelectedGroup(null);
      setSelectedContacts([]);
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
          <UsersRound className="h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className={isMobile ? "w-[95vw] max-w-[95vw]" : "max-w-md w-full"}>
        <DialogHeader>
          <DialogTitle>Select Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />
          
          <ScrollArea className="h-[200px] border rounded-md p-2">
            {filteredGroups.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                No groups found
              </div>
            ) : (
              <div className="space-y-2">
                {filteredGroups.map(group => (
                  <div 
                    key={group.id}
                    className={`flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer ${
                      selectedGroup?.id === group.id ? "bg-muted" : ""
                    }`}
                    onClick={() => handleSelectGroup(group)}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">{group.name}</div>
                      {group.description && (
                        <div className="text-xs text-muted-foreground">{group.description}</div>
                      )}
                      <div className="text-xs text-muted-foreground">{group.members} members</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {showContacts && selectedGroup && (
            <>
              <div className="text-sm font-medium">Add Contacts to Group</div>
              <ScrollArea className="h-[200px] border rounded-md p-2">
                {contacts.length === 0 ? (
                  <div className="text-center p-4 text-muted-foreground">
                    No contacts available
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contacts.map(contact => (
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
            </>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedGroup}
            >
              Select
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupSelector;
