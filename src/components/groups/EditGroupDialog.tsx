/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/groups/EditGroupDialog.tsx - Fixed UI disruption issues
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Plus, X, Users, UserCheck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  contactCount: number;
  contacts?: Contact[];
}

interface EditGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group | null;
  onSave: (groupId: string, data: { name: string; description?: string; contactIds?: string[] }) => Promise<void>;
  loading?: boolean;
}

const EditGroupDialog = ({ open, onOpenChange, group, onSave, loading = false }: EditGroupDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingGroupContacts, setLoadingGroupContacts] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Load group data when dialog opens
  useEffect(() => {
    if (group && open) {
      setName(group.name);
      setDescription(group.description || "");
      setSearchQuery("");
      setAvailableContacts([]);
      setShowSearchResults(false);
      loadGroupContacts(group.id);
    }
  }, [group, open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setSearchQuery("");
      setAvailableContacts([]);
      setSelectedContacts([]);
      setHasChanges(false);
      setShowSearchResults(false);
    }
  }, [open]);

  // Track changes
  useEffect(() => {
    if (group) {
      const nameChanged = name !== group.name;
      const descChanged = description !== (group.description || "");
      setHasChanges(nameChanged || descChanged);
    }
  }, [name, description, group]);

  // Load existing contacts in the group
  const loadGroupContacts = async (groupId: string) => {
    try {
      setLoadingGroupContacts(true);
      const response = await api.get(`/groups/${groupId}/contacts`);
      if (response.data.success) {
        setSelectedContacts(response.data.data.contacts || []);
      } else {
        throw new Error(response.data.message || 'Failed to load group contacts');
      }
    } catch (error: any) {
      console.error('Error loading group contacts:', error);
      toast.error('Failed to load group contacts');
      setSelectedContacts([]);
    } finally {
      setLoadingGroupContacts(false);
    }
  };

  // Search for available contacts to add
  useEffect(() => {
    const fetchAvailableContacts = async () => {
      if (searchQuery.length < 2) {
        setAvailableContacts([]);
        setShowSearchResults(false);
        return;
      }

      try {
        setLoadingContacts(true);
        setShowSearchResults(true);
        const response = await api.get('/contacts', {
          params: { search: searchQuery, limit: 50 }
        });
        if (response.data.success) {
          const contacts = response.data.data.contacts;
          // Filter out contacts that are already selected
          const availableOnes = contacts.filter(
            (contact: Contact) => !selectedContacts.some(sc => sc.id === contact.id)
          );
          setAvailableContacts(availableOnes);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setAvailableContacts([]);
      } finally {
        setLoadingContacts(false);
      }
    };

    const timer = setTimeout(() => {
      fetchAvailableContacts();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedContacts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;
    
    try {
      await onSave(group.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        contactIds: selectedContacts.map(c => c.id)
      });
    } catch (error) {
      console.error('Error saving group:', error);
    }
  };

  const addContact = (contact: Contact) => {
    setSelectedContacts(prev => [...prev, contact]);
    setAvailableContacts(prev => prev.filter(c => c.id !== contact.id));
    setSearchQuery("");
    setShowSearchResults(false);
    setHasChanges(true);
  };

  const removeContact = (contactId: string) => {
    setSelectedContacts(prev => prev.filter(c => c.id !== contactId));
    setHasChanges(true);
  };

  const formatPhoneNumber = (phone: string) => {
    // Simple phone formatting
    if (phone.length === 11 && phone.startsWith('0')) {
      return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
    }
    return phone;
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.length < 2) {
      setShowSearchResults(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSearchResults(false);
    setAvailableContacts([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Edit Group
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            {/* Scrollable Content */}
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-6 py-4">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="name">Group Name *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter group name"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter group description (optional)"
                        rows={3}
                        className="mt-1 resize-none"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contact Management */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Manage Contacts</Label>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {/* Add Contacts Search */}
                  <div className="space-y-2">
                    <Label htmlFor="contact-search" className="text-sm">Add Contacts</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="contact-search"
                        value={searchQuery}
                        onChange={handleSearchInputChange}
                        placeholder="Search contacts to add..."
                        className="pl-9 pr-10"
                      />
                      {searchQuery && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                          onClick={clearSearch}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Search Results - Fixed positioning and scrolling */}
                    {showSearchResults && (
                      <div className="relative">
                        <div className="absolute top-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-40 overflow-hidden">
                          <ScrollArea className="h-full">
                            {loadingContacts ? (
                              <div className="p-4 text-center text-sm text-gray-500">
                                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                Searching...
                              </div>
                            ) : availableContacts.length > 0 ? (
                              <div className="py-1">
                                {availableContacts.map(contact => (
                                  <button
                                    key={contact.id}
                                    type="button"
                                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between group transition-colors"
                                    onClick={() => addContact(contact)}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-gray-900 dark:text-white truncate">
                                        {contact.name}
                                      </div>
                                      <div className="text-gray-500 text-xs truncate">
                                        {formatPhoneNumber(contact.phone)}
                                        {contact.email && ` • ${contact.email}`}
                                      </div>
                                    </div>
                                    <Plus className="h-4 w-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0 ml-2" />
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 text-center text-sm text-gray-500">
                                No contacts found matching "{searchQuery}"
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                        {/* Spacer to prevent layout shift */}
                        <div className="h-40"></div>
                      </div>
                    )}
                  </div>

                  {/* Selected Contacts */}
                  <div className="space-y-2">
                    <Label className="text-sm">Selected Contacts</Label>
                    {loadingGroupContacts ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">Loading contacts...</span>
                      </div>
                    ) : selectedContacts.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2">
                        {selectedContacts.map(contact => (
                          <div
                            key={contact.id}
                            className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-md p-3 group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                                <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                  {contact.name}
                                </div>
                                <div className="text-gray-500 text-xs truncate">
                                  {formatPhoneNumber(contact.phone)}
                                  {contact.email && ` • ${contact.email}`}
                                </div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeContact(contact.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          This group has no contacts yet. Use the search above to add contacts to this group.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Fixed Footer */}
            <DialogFooter className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !name.trim()}
                  className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>Save Changes{hasChanges && ' *'}</>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditGroupDialog;