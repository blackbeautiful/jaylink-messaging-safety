
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
}

const AdminBalanceManagement = () => {
  const [users, setUsers] = useState<User[]>([
    { id: "1", name: "John Doe", email: "john@example.com", balance: 250.50 },
    { id: "2", name: "Jane Smith", email: "jane@example.com", balance: 135.75 },
    { id: "3", name: "Robert Johnson", email: "robert@example.com", balance: 0 },
    { id: "4", name: "Emily Wilson", email: "emily@example.com", balance: 500.25 },
    { id: "5", name: "Michael Brown", email: "michael@example.com", balance: 75.10 }
  ]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [operation, setOperation] = useState<"add" | "subtract" | "set">("add");
  const [amount, setAmount] = useState<number>(0);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenBalanceDialog = (user: User) => {
    setSelectedUser(user);
    setBalanceDialogOpen(true);
    setAmount(0);
    setOperation("add");
  };

  const handleBalanceUpdate = () => {
    if (!selectedUser) return;
    
    setUsers(prev => prev.map(user => {
      if (user.id === selectedUser.id) {
        let newBalance = user.balance;
        
        switch (operation) {
          case "add":
            newBalance = user.balance + amount;
            break;
          case "subtract":
            newBalance = Math.max(0, user.balance - amount);
            break;
          case "set":
            newBalance = amount;
            break;
        }
        
        return { ...user, balance: newBalance };
      }
      return user;
    }));
    
    setBalanceDialogOpen(false);
    
    const actionText = operation === "add" 
      ? "added to" 
      : operation === "subtract" 
        ? "subtracted from" 
        : "set for";
    
    toast({
      title: "Balance Updated",
      description: `$${amount} has been ${actionText} ${selectedUser.name}'s balance.`
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Balance Management</h2>
        <p className="text-muted-foreground">
          Manage user account balances on the platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Balances</CardTitle>
          <CardDescription>
            View and modify user account balances.
          </CardDescription>
          <div className="relative w-full sm:w-72 pt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="font-semibold">${user.balance.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleOpenBalanceDialog(user)}
                      >
                        Manage Balance
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage User Balance</DialogTitle>
            <DialogDescription>
              {selectedUser && `Current balance: $${selectedUser.balance.toFixed(2)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 pt-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="balance-operation" className="text-right">
                Operation
              </Label>
              <Select 
                value={operation} 
                onValueChange={(value) => setOperation(value as "add" | "subtract" | "set")}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add to balance</SelectItem>
                  <SelectItem value="subtract">Subtract from balance</SelectItem>
                  <SelectItem value="set">Set to specific amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount ($)
              </Label>
              <div className="col-span-3">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBalanceUpdate}>
              Update Balance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBalanceManagement;
