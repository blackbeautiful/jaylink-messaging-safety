/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Plus, X, Users, UserCheck, AlertCircle, UserMinus } from "lucide-react";
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
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  // Load group data when dialog opens
  useEffect(() => {
    if (group && open) {
      setName(group.name);
      setDescription(group.description || "");
      setSearchQuery("");
      setAvailableContacts([]);
      setErrors({});
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
      setErrors({});
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
        return;
      }

      try {
        setLoadingContacts(true);
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

  const validateForm = () => {
    const newErrors: { name?: string; description?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Group name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Group name must be at least 2 characters";
    } else if (name.trim().length > 50) {
      newErrors.name = "Group name must be less than 50 characters";
    }

    if (description.trim().length > 200) {
      newErrors.description = "Description must be less than 200 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !validateForm()) return;
    
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
    setHasChanges(true);
  };

  const removeContact = (contactId: string) => {
    setSelectedContacts(prev => prev.filter(c => c.id !== contactId));
    setHasChanges(true);
  };

  const formatPhoneNumber = (phone: string) => {
    if (phone.length === 11 && phone.startsWith('0')) {
      return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
    }
    return phone;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Edit Group
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="name">
                    Group Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                    }}
                    placeholder="Enter group name"
                    required
                    className={`mt-1 ${errors.name ? "border-red-500" : ""}`}
                    maxLength={50}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{name.length}/50 characters</p>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (errors.description) setErrors(prev => ({ ...prev, description: undefined }));
                    }}
                    placeholder="Enter group description (optional)"
                    rows={3}
                    className={`mt-1 ${errors.description ? "border-red-500" : ""}`}
                    maxLength={200}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{description.length}/200 characters</p>
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
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="contact-search" className="text-sm">Add Contacts</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="contact-search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search contacts to add..."
                      className="pl-9"
                    />
                  </div>
                </div>
                
                {/* Search Results */}
                {searchQuery.length >= 2 && (
                  <div className="border rounded-lg max-h-32 overflow-hidden">
                    <ScrollArea className="h-full">
                      {loadingContacts ? (
                        <div className="p-3 text-center text-sm text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                          Searching...
                        </div>
                      ) : availableContacts.length > 0 ? (
                        <div className="divide-y">
                          {availableContacts.map(contact => (
                            <button
                              key={contact.id}
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between group"
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
                        <div className="p-3 text-center text-sm text-gray-500">
                          No contacts found matching "{searchQuery}"
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </div>

              {/* Selected Contacts */}
              <div className="space-y-3">
                <Label className="text-sm">Selected Contacts</Label>
                {loadingGroupContacts ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading contacts...</span>
                  </div>
                ) : selectedContacts.length > 0 ? (
                  <div className="border rounded-lg max-h-64 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-2 space-y-2">
                        {selectedContacts.map(contact => (
                          <div
                            key={contact.id}
                            className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-3 group hover:bg-gray-100 dark:hover:bg-gray-700"
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
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
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

          <DialogFooter className="px-6 py-4 border-t gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !name.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save Changes
                  {hasChanges && <span className="ml-1 text-xs">*</span>}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditGroupDialog;