// src/components/admin/user-management/dialogs/EditUserDialog.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi, apiUtils } from "@/config/api";
import { User } from "../types";

interface EditUserDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onUserUpdated: () => void;
}

const EditUserDialog = ({ open, user, onClose, onUserUpdated }: EditUserDialogProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setCurrentUser({ ...user });
    }
  }, [user]);

  const handleEditUser = async () => {
    try {
      if (!currentUser) return;
      
      setIsUpdating(true);
      
      // Update user via API
      const response = await adminApi.put(`${apiUtils.endpoints.admin.users}/${currentUser.id}`, {
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        role: currentUser.role,
        company: currentUser.company || null,
        phone: currentUser.phone || null,
        status: currentUser.status,
      });
      
      if (response.data.success) {
        // Close dialog
        onClose();
        
        // Notify parent to refresh user list
        onUserUpdated();
        
        toast.success(`User updated successfully.`);
      } else {
        throw new Error(response.data.message || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(apiUtils.handleError(error, "Failed to update user"));
    } finally {
      setIsUpdating(false);
    }
  };

  if (!currentUser) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-firstName" className="text-right">
              First Name
            </Label>
            <Input
              id="edit-firstName"
              placeholder="John"
              className="col-span-3"
              value={currentUser.firstName}
              onChange={(e) => setCurrentUser({...currentUser, firstName: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-lastName" className="text-right">
              Last Name
            </Label>
            <Input
              id="edit-lastName"
              placeholder="Doe"
              className="col-span-3"
              value={currentUser.lastName}
              onChange={(e) => setCurrentUser({...currentUser, lastName: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-email" className="text-right">
              Email
            </Label>
            <Input
              id="edit-email"
              type="email"
              placeholder="user@example.com"
              className="col-span-3"
              value={currentUser.email}
              onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-role" className="text-right">
              Role
            </Label>
            <Select 
              value={currentUser.role} 
              onValueChange={(value) => setCurrentUser({...currentUser, role: value})}
            >
              <SelectTrigger id="edit-role" className="col-span-3">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-status" className="text-right">
              Status
            </Label>
            <Select 
              value={currentUser.status} 
              onValueChange={(value: "active" | "suspended" | "inactive") => 
                setCurrentUser({...currentUser, status: value})
              }
            >
              <SelectTrigger id="edit-status" className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-company" className="text-right">
              Company
            </Label>
            <Input
              id="edit-company"
              placeholder="Company (Optional)"
              className="col-span-3"
              value={currentUser.company || ''}
              onChange={(e) => setCurrentUser({...currentUser, company: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-phone" className="text-right">
              Phone
            </Label>
            <Input
              id="edit-phone"
              placeholder="Phone (Optional)"
              className="col-span-3"
              value={currentUser.phone || ''}
              onChange={(e) => setCurrentUser({...currentUser, phone: e.target.value})}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleEditUser}
            disabled={isUpdating}
          >
            {isUpdating ? 
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : 
              'Save Changes'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;