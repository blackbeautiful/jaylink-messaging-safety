
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { User, CreditCard, PlusCircle, MinusCircle, Pencil } from "lucide-react";

interface UserBalance {
  id: string;
  name: string;
  email: string;
  currentBalance: number;
  lastUpdated: string;
}

const AdminBalanceManagement = () => {
  const [users, setUsers] = useState<UserBalance[]>([
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      currentBalance: 250.00,
      lastUpdated: "2023-05-01"
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      currentBalance: 175.50,
      lastUpdated: "2023-05-03"
    },
    {
      id: "3",
      name: "Robert Johnson",
      email: "robert@example.com",
      currentBalance: 42.25,
      lastUpdated: "2023-05-04"
    },
    {
      id: "4",
      name: "Sarah Williams",
      email: "sarah@example.com",
      currentBalance: 310.00,
      lastUpdated: "2023-05-02"
    },
    {
      id: "5",
      name: "Michael Brown",
      email: "michael@example.com",
      currentBalance: 0.00,
      lastUpdated: "2023-04-28"
    }
  ]);

  const [selectedUser, setSelectedUser] = useState<UserBalance | null>(null);
  const [operationType, setOperationType] = useState<"add" | "subtract" | "set">("add");
  const [amount, setAmount] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBalanceUpdate = () => {
    if (!selectedUser || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Please enter a valid amount.",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate API call to update user balance
    setTimeout(() => {
      const numAmount = parseFloat(amount);
      const updatedUsers = users.map(user => {
        if (user.id === selectedUser.id) {
          let newBalance: number;
          
          switch (operationType) {
            case "add":
              newBalance = user.currentBalance + numAmount;
              break;
            case "subtract":
              newBalance = Math.max(0, user.currentBalance - numAmount);
              break;
            case "set":
              newBalance = numAmount;
              break;
            default:
              newBalance = user.currentBalance;
          }
          
          return {
            ...user,
            currentBalance: newBalance,
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        }
        return user;
      });
      
      setUsers(updatedUsers);
      setDialogOpen(false);
      setAmount("");
      
      const operationText = operationType === "add" 
        ? "added to" 
        : operationType === "subtract" 
          ? "subtracted from" 
          : "set for";
      
      toast({
        title: "Balance updated",
        description: `$${amount} has been ${operationText} ${selectedUser.name}'s balance.`,
      });
      
      setIsProcessing(false);
    }, 1000);
  };

  const openBalanceDialog = (user: UserBalance, type: "add" | "subtract" | "set") => {
    setSelectedUser(user);
    setOperationType(type);
    setAmount("");
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Balance Management</h2>
        <p className="text-muted-foreground">
          Add, subtract or set balance amounts for users.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Balances</CardTitle>
          <CardDescription>Manage credits for platform services</CardDescription>
          <div className="mt-4">
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Current Balance</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>${user.currentBalance.toFixed(2)}</TableCell>
                  <TableCell>{user.lastUpdated}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openBalanceDialog(user, "add")}
                      >
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openBalanceDialog(user, "subtract")}
                      >
                        <MinusCircle className="h-4 w-4 mr-1" />
                        Subtract
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openBalanceDialog(user, "set")}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Set
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No users found matching your search criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Balance Update Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {operationType === "add" 
                ? "Add to Balance" 
                : operationType === "subtract" 
                  ? "Subtract from Balance" 
                  : "Set Balance"
              }
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  User: {selectedUser.name} ({selectedUser.email})<br />
                  Current Balance: ${selectedUser.currentBalance.toFixed(2)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="col-span-1">Amount</Label>
              <div className="relative col-span-3">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBalanceUpdate} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBalanceManagement;
