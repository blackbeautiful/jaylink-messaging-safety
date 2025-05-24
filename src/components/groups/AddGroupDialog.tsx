import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Users, UserPlus } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import ContactSelector, { Contact } from "../contacts/ContactSelector";

interface AddGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; description?: string; contactIds?: string[] }) => void;
  loading?: boolean;
}

const AddGroupDialog = ({ open, onOpenChange, onSave, loading = false }: AddGroupDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setName("");
      setDescription("");
      setSelectedContacts([]);
      setErrors({});
    }
  }, [open]);

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

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      contactIds: selectedContacts.length > 0 ? selectedContacts.map(c => c.id) : undefined,
    };

    console.log("Creating group with data:", data); // Debug log
    onSave(data);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleContactsSelected = (contacts: Contact[]) => {
    console.log("Contacts selected:", contacts); // Debug log
    setSelectedContacts(contacts);
  };

  // Calculate dynamic heights for mobile
  const getDialogClasses = () => {
    if (isMobile) {
      return "w-full h-full max-w-none max-h-none m-0 rounded-none flex flex-col";
    }
    return "sm:max-w-md max-h-[90vh] flex flex-col";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getDialogClasses()}>
        {/* Fixed Header */}
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Create New Group
          </DialogTitle>
          <DialogDescription>
            Create a new contact group to organize your contacts for messaging campaigns.
          </DialogDescription>
        </DialogHeader>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 min-h-0">
          {/* Basic Group Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">
                Group Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="group-name"
                placeholder="e.g., Customers, Employees, VIP Clients"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                }}
                onKeyPress={handleKeyPress}
                className={errors.name ? "border-red-500" : ""}
                disabled={loading}
                maxLength={50}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
              <p className="text-xs text-gray-500">
                {name.length}/50 characters
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="group-description">Description (Optional)</Label>
              <Textarea
                id="group-description"
                placeholder="Enter a brief description for this group..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors(prev => ({ ...prev, description: undefined }));
                }}
                className={errors.description ? "border-red-500" : ""}
                disabled={loading}
                rows={3}
                maxLength={200}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
              <p className="text-xs text-gray-500">
                {description.length}/200 characters
              </p>
            </div>
          </div>

          <Separator />

          {/* Contact Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Add Contacts (Optional)</Label>
              {selectedContacts.length > 0 && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
                </Badge>
              )}
            </div>
            
            <ContactSelector
              onContactsSelected={handleContactsSelected}
              buttonText="Select Contacts for Group"
              preSelectedContacts={selectedContacts}
              showCount={true}
              variant="outline"
            />

            {/* Selected Contacts Preview */}
            {selectedContacts.length > 0 ? (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                  Selected Contacts ({selectedContacts.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedContacts.map(contact => (
                    <div key={contact.id} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0"></div>
                      <span className="font-medium truncate">{contact.name}</span>
                      <span className="text-gray-500 text-xs truncate">({contact.phone})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                <UserPlus className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No contacts selected</p>
                <p className="text-xs">You can add contacts now or later when editing the group</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Fixed Footer */}
        <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-white dark:bg-gray-800">
          <div className="flex justify-end space-x-2 w-full">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={loading || !name.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Create Group
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddGroupDialog;