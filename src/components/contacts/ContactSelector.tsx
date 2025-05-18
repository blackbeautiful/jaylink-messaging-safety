import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search, UserPlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

export interface Contact {
  id: string | number;
  name: string;
  phone: string;
  email?: string;
}

interface ContactSelectorProps {
  onContactsSelected: (contacts: Contact[]) => void;
  buttonText?: string;
  maxSelection?: number;
  preSelectedContacts?: Contact[];
  showCount?: boolean;
}

const ContactSelector = ({
  onContactsSelected,
  buttonText = "Select Contacts",
  maxSelection = 0,
  preSelectedContacts = [],
  showCount = true,
}: ContactSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>(preSelectedContacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const isMobile = useIsMobile();

  // Fetch contacts from API
  const fetchContacts = useCallback(async (searchTerm = "", pageNum = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(`/contacts?search=${searchTerm}&page=${pageNum}&limit=10`);
      
      if (response.data.success) {
        const contactData = response.data.data.contacts;
        const pagination = response.data.data.pagination;
        
        if (pageNum === 1) {
          setContacts(contactData);
        } else {
          setContacts(prev => [...prev, ...contactData]);
        }
        
        setHasMore(pagination.hasNext);
        setPage(pagination.currentPage);
      } else {
        setError("Failed to load contacts");
        toast.error("Failed to load contacts");
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setError("Failed to load contacts");
      toast.error("Failed to load contacts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (open) {
      fetchContacts();
    }
  }, [fetchContacts, open]);

  // Search handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(1);
    fetchContacts(query, 1);
  };

  // Load more handler
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchContacts(searchQuery, page + 1);
    }
  };

  // Toggle contact selection
  const toggleContact = (contact: Contact) => {
    setSelectedContacts(prev => {
      const isSelected = prev.some(c => c.id === contact.id);
      
      if (isSelected) {
        return prev.filter(c => c.id !== contact.id);
      } else {
        // Check if we've reached the max selection (if maxSelection is set)
        if (maxSelection > 0 && prev.length >= maxSelection) {
          toast.warning(`You can only select up to ${maxSelection} contacts`);
          return prev;
        }
        return [...prev, contact];
      }
    });
  };

  // Submit handler
  const handleSubmit = () => {
    onContactsSelected(selectedContacts);
    setOpen(false);
  };

  // Reset when dialog is closed
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchQuery("");
      // Don't reset selectedContacts to maintain selections between opens
    }
  };

  // Filtered contacts for search
  const filteredContacts = contacts;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <UserPlus className="mr-2 h-4 w-4" />
          {buttonText}
          {showCount && selectedContacts.length > 0 && (
            <span className="ml-2 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
              {selectedContacts.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className={isMobile ? "w-[95vw] max-w-[95vw]" : "max-w-md w-full"}>
        <DialogHeader>
          <DialogTitle>Select Contacts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            {selectedContacts.length} contact{selectedContacts.length !== 1 ? "s" : ""} selected
            {maxSelection > 0 && ` (max ${maxSelection})`}
          </div>

          <ScrollArea className="h-[350px] rounded-md border">
            {isLoading && page === 1 ? (
              <div className="flex items-center justify-center h-20">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">{error}</div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery ? "No contacts found matching your search" : "No contacts found"}
              </div>
            ) : (
              <div className="p-2">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                    onClick={() => toggleContact(contact)}
                  >
                    <Checkbox
                      id={`contact-${contact.id}`}
                      checked={selectedContacts.some(c => c.id === contact.id)}
                      onCheckedChange={() => toggleContact(contact)}
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
                
                {hasMore && (
                  <div className="flex justify-center p-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleLoadMore}
                      disabled={isLoading}
                    >
                      {isLoading ? "Loading..." : "Load more"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={selectedContacts.length === 0}>
              Select ({selectedContacts.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactSelector;