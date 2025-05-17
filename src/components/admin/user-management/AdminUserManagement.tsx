// src/components/admin/user-management/AdminUserManagement.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { adminApi, apiUtils } from "@/config/api";

// Import custom components
import UserTable from "./UserTable";
import AddUserDialog from "./dialogs/AddUserDialog";
import EditUserDialog from "./dialogs/EditUserDialog";
import ResetPasswordDialog from "./dialogs/ResetPasswordDialog";
import UpdateBalanceDialog from "./dialogs/UpdateBalanceDialog";

// Import types
import { User } from "./types";

const AdminUserManagement = () => {
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Dialog states
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isUpdateBalanceOpen, setIsUpdateBalanceOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
  };

  // Handle balance update
  const handleBalanceUpdated = (userId: string | number, newBalance: number) => {
    // Update user in the list
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, balance: newBalance } 
        : user
    ));
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
          
          {/* Add User Dialog */}
          <AddUserDialog onUserAdded={fetchUsers} />
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
          <UserTable 
            users={users}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            totalUsers={totalUsers}
            onEdit={handleEditClick}
            onDelete={handleDeleteUser}
            onResetPassword={handleResetPasswordClick}
            onUpdateBalance={handleUpdateBalanceClick}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <EditUserDialog 
        open={isEditUserOpen} 
        user={currentUser}
        onClose={() => setIsEditUserOpen(false)}
        onUserUpdated={fetchUsers}
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog 
        open={isResetPasswordOpen}
        user={currentUser}
        onClose={() => setIsResetPasswordOpen(false)}
      />

      {/* Update Balance Dialog */}
      <UpdateBalanceDialog 
        open={isUpdateBalanceOpen}
        user={currentUser}
        onClose={() => setIsUpdateBalanceOpen(false)}
        onBalanceUpdated={handleBalanceUpdated}
      />
    </div>
  );
};

export default AdminUserManagement;