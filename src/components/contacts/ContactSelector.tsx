/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Loader2, RefreshCw, X, AlertCircle, UserCheck, UserPlus } from "lucide-react";
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
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}

const ContactSelector = ({ 
  onContactsSelected, 
  buttonText = "Select Contacts", 
  preSelectedContacts = [],
  showCount = true,
  maxSelection,
  disabled = false,
  variant = "outline",
  size = "default"
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

  // Memoized filtered contacts
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(query) ||
      contact.phone.includes(query) ||
      contact.email?.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

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
          limit: 100,
          search: search.trim(),
        },
      });

      if (response.data.success) {
        const { contacts: newContacts, pagination: paginationData } = response.data.data;
        
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

  // Load more contacts
  const loadMore = useCallback(() => {
    if (pagination.hasNext && !loading) {
      fetchContacts(pagination.currentPage + 1, searchQuery);
    }
  }, [pagination.hasNext, pagination.currentPage, searchQuery, loading, fetchContacts]);

  // Fetch contacts when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchContacts(1, "");
    }
  }, [isOpen, fetchContacts]);

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
        if (maxSelection && prev.length >= maxSelection) {
          toast.error(`You can only select up to ${maxSelection} contacts`);
          return prev;
        }
        return [...prev, contact];
      }
    });
  };

  const handleSelectAll = () => {
    const availableContacts = filteredContacts.filter(contact => 
      !selectedContacts.some(selected => selected.id === contact.id)
    );
    
    if (maxSelection) {
      const remainingSlots = maxSelection - selectedContacts.length;
      const contactsToAdd = availableContacts.slice(0, remainingSlots);
      
      if (contactsToAdd.length < availableContacts.length) {
        toast.error(`Only ${contactsToAdd.length} contacts added due to selection limit`);
      }
      
      setSelectedContacts(prev => [...prev, ...contactsToAdd]);
    } else {
      setSelectedContacts(prev => [...prev, ...availableContacts]);
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

  const getButtonIcon = () => {
    if (selectedContacts.length > 0) {
      return <UserCheck className="h-4 w-4" />;
    }
    return <Users className="h-4 w-4" />;
  };

  // Calculate dynamic heights for mobile
  const getDialogClasses = () => {
    if (isMobile) {
      return "w-full h-full max-w-none max-h-none m-0 rounded-none flex flex-col";
    }
    return "max-w-2xl w-full max-h-[85vh] flex flex-col";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant={variant}
          size={size}
          className="w-full flex items-center gap-2 justify-start relative"
          disabled={disabled}
        >
          {getButtonIcon()}
          <span className="truncate flex-1 text-left">{getButtonText()}</span>
          {selectedContacts.length > 0 && showCount && (
            <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 flex-shrink-0">
              {selectedContacts.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className={getDialogClasses()}>
        {/* Fixed Header */}
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Select Contacts
            {selectedContacts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedContacts.length} selected
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 flex flex-col px-6 py-4 gap-4">
          {/* Search - Fixed */}
          <div className="flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search contacts by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Selected contacts preview - Collapsible */}
          {selectedContacts.length > 0 && (
            <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Selected ({selectedContacts.length})</span>
                <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
                  Clear All
                </Button>
              </div>
              <div className="max-h-20 overflow-y-auto">
                <div className="flex flex-wrap gap-1">
                  {selectedContacts.map(contact => (
                    <Badge key={contact.id} variant="secondary" className="flex items-center gap-1 text-xs max-w-[160px]">
                      <span className="truncate">{contact.name}</span>
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-500 flex-shrink-0" 
                        onClick={() => handleRemoveSelected(contact.id)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="flex-shrink-0 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
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
                    fetchContacts(1, "");
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Action Bar */}
          {filteredContacts.length > 0 && (
            <div className="flex-shrink-0 flex justify-between items-center py-2 border-y">
              <span className="text-sm text-gray-600">
                {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} found
              </span>
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
            </div>
          )}

          {/* Contacts list - Scrollable */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              {loading && contacts.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading contacts...</span>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No contacts found</p>
                  <p className="text-sm">
                    {searchQuery ? 'Try adjusting your search' : 'Add contacts to get started'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1 pb-4">
                  {filteredContacts.map(contact => {
                    const isSelected = selectedContacts.some(c => c.id === contact.id);
                    
                    return (
                      <div 
                        key={contact.id}
                        className={`flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' : ''
                        }`}
                        onClick={() => handleToggleContact(contact)}
                      >
                        <Checkbox 
                          checked={isSelected}
                          onChange={() => handleToggleContact(contact)}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate flex items-center gap-2">
                            {contact.name}
                            {isSelected && <UserCheck className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                          </div>
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
        </div>
        
        {/* Fixed Footer */}
        <div className="flex-shrink-0 flex justify-end space-x-2 px-6 py-4 border-t bg-white dark:bg-gray-800">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={selectedContacts.length === 0}
          >
            Select {selectedContacts.length} Contact{selectedContacts.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactSelector;