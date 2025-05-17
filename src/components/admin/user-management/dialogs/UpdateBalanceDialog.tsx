// src/components/admin/user-management/dialogs/UpdateBalanceDialog.tsx
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
import { User, BalanceUpdate } from "../types";
import { createEmptyBalanceUpdate } from "../utils";

interface UpdateBalanceDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onBalanceUpdated: (userId: string | number, newBalance: number) => void;
}

const UpdateBalanceDialog = ({ 
  open, 
  user, 
  onClose, 
  onBalanceUpdated 
}: UpdateBalanceDialogProps) => {
  const [balanceUpdate, setBalanceUpdate] = useState<BalanceUpdate>(createEmptyBalanceUpdate());
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setBalanceUpdate(createEmptyBalanceUpdate());
    }
  }, [open]);

  const handleUpdateBalance = async () => {
    try {
      if (!user) return;
      
      setIsUpdating(true);
      
      // Validate amount
      if (!balanceUpdate.amount || parseFloat(balanceUpdate.amount) <= 0) {
        toast.error("Please enter a valid amount greater than 0");
        return;
      }
      
      const response = await adminApi.put(`${apiUtils.endpoints.admin.users}/${user.id}/balance`, {
        operation: balanceUpdate.operation,
        amount: parseFloat(balanceUpdate.amount),
        description: balanceUpdate.description || `Manual ${balanceUpdate.operation} by admin`,
      });
      
      if (response.data.success) {
        // Close dialog
        onClose();
        
        // Update balance in parent component
        onBalanceUpdated(user.id, response.data.data.balance);
        
        toast.success(`Balance ${balanceUpdate.operation === 'add' ? 'added to' : 'deducted from'} user successfully.`);
      } else {
        throw new Error(response.data.message || `Failed to ${balanceUpdate.operation} balance`);
      }
    } catch (error) {
      console.error("Error updating balance:", error);
      toast.error(apiUtils.handleError(error, `Failed to ${balanceUpdate.operation} balance`));
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update User Balance</DialogTitle>
          <DialogDescription>
            Add or deduct funds from this user's account balance.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <p className="mb-2 font-medium">User: {user.firstName} {user.lastName}</p>
            <p className="text-sm text-muted-foreground">Current Balance: ${user.balance.toFixed(2)}</p>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="operation" className="text-right">
              Operation
            </Label>
            <Select 
              value={balanceUpdate.operation} 
              onValueChange={(value: 'add' | 'deduct') => 
                setBalanceUpdate({...balanceUpdate, operation: value})
              }
            >
              <SelectTrigger id="operation" className="col-span-3">
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add Funds</SelectItem>
                <SelectItem value="deduct">Deduct Funds</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <div className="relative col-span-3">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                className="pl-7"
                value={balanceUpdate.amount}
                onChange={(e) => setBalanceUpdate({...balanceUpdate, amount: e.target.value})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              placeholder="Reason for adjustment (optional)"
              className="col-span-3"
              value={balanceUpdate.description}
              onChange={(e) => setBalanceUpdate({...balanceUpdate, description: e.target.value})}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleUpdateBalance}
            disabled={isUpdating}
            variant="default"
            className={balanceUpdate.operation === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}
          >
            {isUpdating ? 
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 
              balanceUpdate.operation === 'add' ? 'Add Funds' : 'Deduct Funds'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateBalanceDialog;