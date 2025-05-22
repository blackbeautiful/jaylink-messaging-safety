// src/components/groups/AddContactDialog.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; phone: string; email?: string }) => void;
  loading?: boolean;
}

const AddContactDialog = ({ open, onOpenChange, onSave, loading = false }: AddContactDialogProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setName("");
      setPhone("");
      setEmail("");
      setErrors({});
    }
  }, [open]);

  const validatePhone = (phoneNumber: string) => {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check for various valid formats
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      return true; // Nigerian format: 08012345678
    } else if (cleaned.length === 13 && cleaned.startsWith('234')) {
      return true; // International format: 2348012345678
    } else if (cleaned.length === 10) {
      return true; // US format: 8012345678
    }
    
    return false;
  };

  const validateEmail = (emailAddress: string) => {
    if (!emailAddress.trim()) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress);
  };

  const validateForm = () => {
    const newErrors: { name?: string; phone?: string; email?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Contact name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (name.trim().length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (email.trim() && !validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhoneInput = (value: string) => {
    // Remove all non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, '');
    setPhone(cleaned);
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    onSave({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-green-600" />
            Add New Contact
          </DialogTitle>
          <DialogDescription>
            Add a new contact to your contact list for messaging campaigns.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="contact-name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact-name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
              }}
              onKeyPress={handleKeyPress}
              className={errors.name ? "border-red-500" : ""}
              disabled={loading}
              maxLength={100}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contact-phone">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact-phone"
              placeholder="+234 801 234 5678 or 08012345678"
              value={phone}
              onChange={(e) => {
                formatPhoneInput(e.target.value);
                if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
              }}
              onKeyPress={handleKeyPress}
              className={errors.phone ? "border-red-500" : ""}
              disabled={loading}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
            <p className="text-xs text-gray-500">
              Enter in format: +234801234567 or 08012345678
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contact-email">Email Address (Optional)</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="john.doe@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
              }}
              onKeyPress={handleKeyPress}
              className={errors.email ? "border-red-500" : ""}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading || !name.trim() || !phone.trim()}
            className="bg-jaylink-600 hover:bg-jaylink-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Contact'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddContactDialog;