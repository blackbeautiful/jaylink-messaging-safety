// src/components/contacts/ContactSelector.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Loader2, RefreshCw, X, AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { api } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatPhoneNumber, debounce } from "@/lib/utils";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface ContactSelectorProps {
  onContactsSelected: (contacts: Contact[]) => void;
  buttonText?: string;
  preSelectedContacts?: Contact[];
  showCount?: boolean;
  maxSelection?: number;
  disabled?: boolean;
}

const ContactSelector = ({ 
  onContactsSelected, 
  buttonText = "Select Contacts", 
  preSelectedContacts = [],
  showCount = true,
  maxSelection,
  disabled = false
}: ContactSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>(preSelectedContacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Debounced search function
  const debouncedFetchContacts = useCallback(
    debounce((page: number, search: string) => {
      fetchContacts(page, search);
    }, 300),
    []
  );

  // Fetch contacts function
  const fetchContacts = useCallback(async (page = 1, search = "") => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/contacts', {
        params: {
          page,
          limit: 50, // Higher limit for selector
          search: search.trim(),
        },
      });

      if (response.data.success) {
        const { contacts: newContacts, pagination: paginationData } = response.data.data;
        
        // If it's the first page or a new search, replace; otherwise append
        if (page === 1) {
          setContacts(newContacts);
        } else {
          setContacts(prev => [...prev, ...newContacts]);
        }
        
        setPagination(paginationData);
      } else {
        throw new Error(response.data.message || 'Failed to fetch contacts');
      }
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch contacts';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more contacts (pagination)
  const loadMore = useCallback(() => {
    if (pagination.hasNext && !loading) {
      fetchContacts(pagination.currentPage + 1, searchQuery);
    }
  }, [pagination.hasNext, pagination.currentPage, searchQuery, loading, fetchContacts]);

  // Fetch contacts when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchContacts(1, searchQuery);
    }
  }, [isOpen, fetchContacts, searchQuery]);

  // Handle search with debouncing
  useEffect(() => {
    if (isOpen) {
      debouncedFetchContacts(1, searchQuery);
    }
  }, [searchQuery, isOpen, debouncedFetchContacts]);

  // Update selected contacts when preSelectedContacts change
  useEffect(() => {
    setSelectedContacts(preSelectedContacts);
  }, [preSelectedContacts]);

  const handleToggleContact = (contact: Contact) => {
    setSelectedContacts(prev => {
      const isSelected = prev.some(c => c.id === contact.id);
      
      if (isSelected) {
        return prev.filter(c => c.id !== contact.id);
      } else {
        // Check max selection limit
        if (maxSelection && prev.length >= maxSelection) {
          toast.error(`You can only select up to ${maxSelection} contacts`);
          return prev;
        }
        return [...prev, contact];
      }
    });
  };

  const handleSelectAll = () => {
    const visibleContacts = contacts.filter(contact => 
      !selectedContacts.some(selected => selected.id === contact.id)
    );
    
    if (maxSelection) {
      const remainingSlots = maxSelection - selectedContacts.length;
      const contactsToAdd = visibleContacts.slice(0, remainingSlots);
      
      if (contactsToAdd.length < visibleContacts.length) {
        toast.error(`Only ${contactsToAdd.length} contacts added due to selection limit`);
      }
      
      setSelectedContacts(prev => [...prev, ...contactsToAdd]);
    } else {
      setSelectedContacts(prev => [...prev, ...visibleContacts]);
    }
  };

  const handleDeselectAll = () => {
    setSelectedContacts([]);
  };

  const handleRemoveSelected = (contactId: string) => {
    setSelectedContacts(prev => prev.filter(c => c.id !== contactId));
  };

  const handleSubmit = () => {
    onContactsSelected(selectedContacts);
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchQuery("");
      setError(null);
      setContacts([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        total: 0,
        hasNext: false,
        hasPrev: false,
      });
    }
  };

  const getButtonText = () => {
    if (selectedContacts.length === 0) {
      return buttonText;
    }
    
    if (showCount) {
      return `${selectedContacts.length} Contact${selectedContacts.length !== 1 ? 's' : ''} Selected`;
    }
    
    return buttonText;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full flex items-center gap-2 justify-start"
          disabled={disabled}
        >
          <Users className="h-4 w-4" />
          <span className="truncate">{getButtonText()}</span>
          {selectedContacts.length > 0 && showCount && (
            <Badge variant="secondary" className="ml-auto">
              {selectedContacts.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className={isMobile ? "w-[95vw] max-w-[95vw] h-[90vh]" : "max-w-2xl w-full h-[80vh]"}>
        <DialogHeader>
          <DialogTitle>Select Contacts</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search contacts by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected contacts preview */}
          {selectedContacts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Selected ({selectedContacts.length})</span>
                <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                {selectedContacts.map(contact => (
                  <Badge key={contact.id} variant="secondary" className="flex items-center gap-1">
                    <span className="truncate max-w-24">{contact.name}</span>
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-500" 
                      onClick={() => handleRemoveSelected(contact.id)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    fetchContacts(1, searchQuery);
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Contacts list */}
          <div className="flex-1 flex flex-col">
            {contacts.length > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  {pagination.total} contact{pagination.total !== 1 ? 's' : ''} found
                </span>
                <div className="space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                    Select All Visible
                  </Button>
                </div>
              </div>
            )}

            <ScrollArea className="flex-1 border rounded-md">
              {loading && contacts.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-jaylink-600" />
                  <span className="ml-2 text-gray-600">Loading contacts...</span>
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  {searchQuery ? 'No contacts found matching your search' : 'No contacts available'}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {contacts.map(contact => {
                    const isSelected = selectedContacts.some(c => c.id === contact.id);
                    
                    return (
                      <div 
                        key={contact.id}
                        className={`flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        onClick={() => handleToggleContact(contact)}
                      >
                        <Checkbox 
                          id={`contact-${contact.id}`}
                          checked={isSelected}
                          onChange={() => handleToggleContact(contact)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{contact.name}</div>
                          <div className="text-xs text-gray-500 truncate">{formatPhoneNumber(contact.phone)}</div>
                          {contact.email && (
                            <div className="text-xs text-gray-400 truncate">{contact.email}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Load more button */}
                  {pagination.hasNext && (
                    <div className="flex justify-center p-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={loadMore}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load More'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-jaylink-600 hover:bg-jaylink-700"
              disabled={selectedContacts.length === 0}
            >
              Select {selectedContacts.length} Contact{selectedContacts.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactSelector;