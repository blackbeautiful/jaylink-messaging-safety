/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Edit, MoreVertical, Search, Trash, UserPlus, X, RefreshCw, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { adminApi, apiUtils } from "@/config/api";

interface User {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: "active" | "suspended" | "inactive";
  balance: number | string;
  createdAt: string;
  company?: string;
  phone?: string;
}

const AdminUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "user",
    password: "",
    confirmPassword: "",
    company: "",
    phone: "",
    status: "active",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isUpdateBalanceOpen, setIsUpdateBalanceOpen] = useState(false);
  const [balanceOperation, setBalanceOperation] = useState<'add' | 'deduct'>('add');
  const [balanceAmount, setBalanceAmount] = useState<string>('');
  const [balanceDescription, setBalanceDescription] = useState<string>('');

  // Function to fetch users from the API
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(currentPage));
      queryParams.append('limit', '10');
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      if (filterRole !== "all") {
        queryParams.append('role', filterRole);
      }
      
      if (filterStatus !== "all") {
        queryParams.append('status', filterStatus);
      }
      
      const response = await adminApi.get(`${apiUtils.endpoints.admin.users}?${queryParams.toString()}`);
      
      if (response.data.success) {
        setUsers(response.data.data.users);
        setTotalPages(response.data.data.pages);
        setTotalUsers(response.data.data.total);
      } else {
        throw new Error(response.data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(apiUtils.handleError(error, "Failed to fetch users"));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, filterRole, filterStatus]);

  // Fetch users when component mounts or filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page
    fetchUsers();
  };

  // Handle adding a new user
  const handleAddUser = async () => {
    try {
      setIsUpdating(true);
      
      // Validate form
      if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password) {
        toast.error("Please fill in all required fields.");
        return;
      }
      
      if (newUser.password !== newUser.confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
      
      // Create user via API
      const response = await adminApi.post(apiUtils.endpoints.admin.users, {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        company: newUser.company || null,
        phone: newUser.phone || null,
        status: newUser.status,
      });
      
      if (response.data.success) {
        // Close dialog and reset form
        setIsAddUserOpen(false);
        setNewUser({
          firstName: "",
          lastName: "",
          email: "",
          role: "user",
          password: "",
          confirmPassword: "",
          company: "",
          phone: "",
          status: "active",
        });
        
        // Refresh user list
        fetchUsers();
        
        toast.success(`User ${newUser.firstName} ${newUser.lastName} has been added successfully.`);
      } else {
        throw new Error(response.data.message || "Failed to create user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error(apiUtils.handleError(error, "Failed to add user"));
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle editing a user
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
        setIsEditUserOpen(false);
        setCurrentUser(null);
        
        // Refresh user list
        fetchUsers();
        
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

  // Handle deleting a user
  const handleDeleteUser = async (id: string | number) => {
    try {
      // Confirm deletion
      if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
        return;
      }
      
      const response = await adminApi.delete(`${apiUtils.endpoints.admin.users}/${id}`);
      
      if (response.data.success) {
        // Refresh user list
        fetchUsers();
        
        toast.success(`User deleted successfully.`);
      } else {
        throw new Error(response.data.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(apiUtils.handleError(error, "Failed to delete user"));
    }
  };

  // Handle resetting a user's password
  const handleResetPassword = async () => {
    try {
      if (!currentUser) return;
      
      setIsUpdating(true);
      
      const response = await adminApi.post(`${apiUtils.endpoints.admin.users}/${currentUser.id}/reset-password`);
      
      if (response.data.success) {
        // Close dialog
        setIsResetPasswordOpen(false);
        
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

  // Handle updating a user's balance
  const handleUpdateBalance = async () => {
    try {
      if (!currentUser) return;
      
      setIsUpdating(true);
      
      // Validate amount
      if (!balanceAmount || parseFloat(balanceAmount) <= 0) {
        toast.error("Please enter a valid amount greater than 0");
        return;
      }
      
      const response = await adminApi.put(`${apiUtils.endpoints.admin.users}/${currentUser.id}/balance`, {
        operation: balanceOperation,
        amount: parseFloat(balanceAmount),
        description: balanceDescription || `Manual ${balanceOperation} by admin`,
      });
      
      if (response.data.success) {
        // Close dialog and reset form
        setIsUpdateBalanceOpen(false);
        setBalanceAmount('');
        setBalanceDescription('');
        
        // Update current user's balance in the list
        setUsers(users.map(user => 
          user.id === currentUser.id 
            ? { ...user, balance: response.data.data.balance } 
            : user
        ));
        
        // Also update the currentUser state
        setCurrentUser(prev => prev ? { ...prev, balance: response.data.data.balance } : null);
        
        toast.success(`Balance ${balanceOperation === 'add' ? 'added to' : 'deducted from'} user successfully.`);
      } else {
        throw new Error(response.data.message || `Failed to ${balanceOperation} balance`);
      }
    } catch (error) {
      console.error("Error updating balance:", error);
      toast.error(apiUtils.handleError(error, `Failed to ${balanceOperation} balance`));
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle clicking on edit button
  const handleEditClick = (user: User) => {
    setCurrentUser(user);
    setIsEditUserOpen(true);
  };

  // Handle clicking on reset password button
  const handleResetPasswordClick = (user: User) => {
    setCurrentUser(user);
    setIsResetPasswordOpen(true);
  };

  // Handle clicking on update balance button
  const handleUpdateBalanceClick = (user: User) => {
    setCurrentUser(user);
    setIsUpdateBalanceOpen(true);
    setBalanceOperation('add');
    setBalanceAmount('');
    setBalanceDescription('');
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "suspended":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400";
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Helper function to safely format balance values
  const formatBalance = (balance: any): string => {
    // Convert to number if it's not already
    const numBalance = typeof balance === 'number' 
      ? balance 
      : Number(balance);
    
    // Check if conversion resulted in a valid number
    if (isNaN(numBalance)) {
      return '0.00'; // Default to zero if not a valid number
    }
    
    // Format with 2 decimal places
    return numBalance.toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">
          Manage all users registered on the platform.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        
        <div className="flex space-x-2 w-full sm:w-auto">
          <Select value={filterRole} onValueChange={(value) => {
            setFilterRole(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterStatus} onValueChange={(value) => {
            setFilterStatus(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button className="ml-auto">
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account on the platform.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="firstName" className="text-right">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    className="col-span-3"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lastName" className="text-right">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    className="col-span-3"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    className="col-span-3"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Role
                  </Label>
                  <Select 
                    value={newUser.role} 
                    onValueChange={(value) => setNewUser({...newUser, role: value})}
                  >
                    <SelectTrigger id="role" className="col-span-3">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select 
                    value={newUser.status} 
                    onValueChange={(value: 'active' | 'suspended' | 'inactive') => 
                      setNewUser({...newUser, status: value})
                    }
                  >
                    <SelectTrigger id="status" className="col-span-3">
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
                  <Label htmlFor="company" className="text-right">
                    Company
                  </Label>
                  <Input
                    id="company"
                    placeholder="Company (Optional)"
                    className="col-span-3"
                    value={newUser.company}
                    onChange={(e) => setNewUser({...newUser, company: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    placeholder="Phone (Optional)"
                    className="col-span-3"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="col-span-3"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="confirmPassword" className="text-right">
                    Confirm
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="col-span-3"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleAddUser}
                  disabled={isUpdating}
                >
                  {isUpdating ? 
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 
                    'Create User'
                  }
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {totalUsers} users found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "admin" ? "secondary" : "outline"}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                              {user.status}
                            </span>
                          </TableCell>
                          <TableCell>${formatBalance(user.balance)}</TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit user
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateBalanceClick(user)}>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Update balance
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleResetPasswordClick(user)}>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Reset password
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete user
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Previous Page</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Next Page</span>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings.
            </DialogDescription>
          </DialogHeader>
          {currentUser && (
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
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
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

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
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
             <span className="font-bold">{currentUser?.firstName} {currentUser?.lastName}</span>?
           </p>
           <p className="mt-2 text-sm text-muted-foreground text-center">
             The user will be sent an email with a temporary password and will be prompted to change it on next login.
           </p>
         </div>
         <DialogFooter>
           <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>
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

     {/* Update Balance Dialog */}
     <Dialog open={isUpdateBalanceOpen} onOpenChange={setIsUpdateBalanceOpen}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle>Update User Balance</DialogTitle>
           <DialogDescription>
             Add or deduct funds from this user's account balance.
           </DialogDescription>
         </DialogHeader>
         <div className="grid gap-4 py-4">
           <div>
             <p className="mb-2 font-medium">User: {currentUser?.firstName} {currentUser?.lastName}</p>
             <p className="text-sm text-muted-foreground">Current Balance: ${formatBalance(currentUser?.balance)}</p>
           </div>
           
           <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="operation" className="text-right">
               Operation
             </Label>
             <Select 
               value={balanceOperation} 
               onValueChange={(value: 'add' | 'deduct') => setBalanceOperation(value)}
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
                 value={balanceAmount}
                 onChange={(e) => setBalanceAmount(e.target.value)}
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
               value={balanceDescription}
               onChange={(e) => setBalanceDescription(e.target.value)}
             />
           </div>
         </div>
         <DialogFooter>
           <Button variant="outline" onClick={() => setIsUpdateBalanceOpen(false)}>
             Cancel
           </Button>
           <Button 
             type="button" 
             onClick={handleUpdateBalance}
             disabled={isUpdating}
             variant="default"
             className={balanceOperation === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}
           >
             {isUpdating ? 
               <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 
               balanceOperation === 'add' ? 'Add Funds' : 'Deduct Funds'
             }
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   </div>
 );
};

export default AdminUserManagement;