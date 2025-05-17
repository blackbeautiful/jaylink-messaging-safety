// src/components/admin/user-management/dialogs/ResetPasswordDialog.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi, apiUtils } from "@/config/api";
import { User } from "../types";

interface ResetPasswordDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

const ResetPasswordDialog = ({ open, user, onClose }: ResetPasswordDialogProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleResetPassword = async () => {
    try {
      if (!user) return;
      
      setIsUpdating(true);
      
      const response = await adminApi.post(`${apiUtils.endpoints.admin.users}/${user.id}/reset-password`);
      
      if (response.data.success) {
        // Close dialog
        onClose();
        
        toast.success(response.data.message || "Password has been reset and sent to the user's email.");
      } else {
        throw new Error(response.data.message || "Failed to reset password");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error(apiUtils.handleError(error, "Failed to reset password"));
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset User Password</DialogTitle>
          <DialogDescription>
            This will reset the user's password and send them a temporary password via email.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-center text-amber-600 dark:text-amber-400 font-medium">
            Are you sure you want to reset the password for user: <br />
            <span className="font-bold">{user.firstName} {user.lastName}</span>?
          </p>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            The user will be sent an email with a temporary password and will be prompted to change it on next login.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleResetPassword}
            disabled={isUpdating}
            variant="destructive"
          >
            {isUpdating ? 
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</> : 
              'Reset Password'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog;