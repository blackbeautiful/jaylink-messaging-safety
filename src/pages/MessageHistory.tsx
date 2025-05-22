import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/contexts/AuthContext";
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  Search, 
  RefreshCw,
  Check,
  X,
  Clock,
  Send as SendIcon,
  MessageSquare,
  Phone,
  Music,
  Trash2,
  Download,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import MessageDetailDialog from "@/components/messages/MessageDetailDialog";
import Pagination from "@/components/Pagination";
import { formatDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MessageHistory = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
    hasNext: false,
    hasPrev: false,
  });
  
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isBatchDelete, setIsBatchDelete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchMessages(1);
  }, []);

  const fetchMessages = async (page = 1) => {
    try {
      setLoading(true);
      
      // Build query parameters
      let queryParams = `?page=${page}&limit=${pagination.limit}`;
      
      if (filters.type && filters.type !== "all") {
        queryParams += `&type=${filters.type}`;
      }
      
      if (filters.status && filters.status !== "all") {
        queryParams += `&status=${filters.status}`;
      }
      
      if (filters.startDate) {
        queryParams += `&startDate=${new Date(filters.startDate).toISOString()}`;
      }
      
      if (filters.endDate) {
        queryParams += `&endDate=${new Date(filters.endDate).toISOString()}`;
      }

      if (searchQuery) {
        queryParams += `&search=${searchQuery}`;
      }
      
      const response = await api.get(`/sms/history${queryParams}`);
      
      if (response.data.success) {
        setMessages(response.data.data.messages);
        setPagination(response.data.data.pagination);
      } else {
        toast.error("Failed to fetch message history");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to fetch message history");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const applyFilters = () => {
    fetchMessages(1);
    setIsFilterOpen(false);
  };

  const resetFilters = () => {
    setFilters({
      type: "all",
      status: "all",
      startDate: "",
      endDate: "",
    });
    setSearchQuery("");
    
    // Fetch with reset filters
    fetchMessages(1);
  };

  const handleSearch = () => {
    fetchMessages(1);
  };
  
  // Get icon for message type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'voice':
        return <Phone className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };
  
  // Get icon for message status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'sent':
        return <SendIcon className="h-4 w-4 text-blue-500" />;
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Get recipients text
  const getRecipientsText = (recipients) => {
    if (!recipients) return 'No recipients';
    
    try {
      const parsedRecipients = Array.isArray(recipients) 
        ? recipients 
        : JSON.parse(recipients);
      
      if (parsedRecipients.length === 0) return 'No recipients';
      
      if (parsedRecipients.length === 1) return parsedRecipients[0];
      
      return `${parsedRecipients[0]} +${parsedRecipients.length - 1} more`;
    } catch (error) {
      return 'Unknown recipients';
    }
  };

  const handleViewMessage = (message) => {
    setSelectedMessage(message);
    setIsDetailOpen(true);
  };

  const handleDeleteMessage = (message) => {
    setMessageToDelete(message);
    setIsBatchDelete(false);
    setDeleteDialogOpen(true);
  };

  const handleBatchDelete = () => {
    if (selectedItems.length === 0) {
      toast.error("No messages selected");
      return;
    }
    
    setIsBatchDelete(true);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (isBatchDelete) {
        // Delete multiple messages
        // const response = await api.post('/sms/batch-delete', { messageIds: selectedItems });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast.success(`${selectedItems.length} messages deleted successfully`);
        setSelectedItems([]);
        setSelectAll(false);
      } else if (messageToDelete) {
        // Delete single message
        // const response = await api.delete(`/sms/delete/${messageToDelete.id}`);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast.success("Message deleted successfully");
        
        // Remove message from list
        setMessages(messages.filter(m => m.id !== messageToDelete.id));
      }
    } catch (error) {
      console.error("Error deleting message(s):", error);
      toast.error("Failed to delete message(s)");
    } finally {
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(messages.map(message => message.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectItem = (messageId) => {
    if (selectedItems.includes(messageId)) {
      setSelectedItems(selectedItems.filter(id => id !== messageId));
    } else {
      setSelectedItems([...selectedItems, messageId]);
    }
  };

  const exportData = () => {
    // In a real app, this would generate a CSV or Excel file
    toast.success("Exporting message data...");
    setTimeout(() => {
      toast.success("Message data exported successfully");
    }, 2000);
  };

  return (
    <DashboardLayout
      title="Message History"
      backLink="/dashboard"
      currentPath={location.pathname}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Message History</CardTitle>
              <CardDescription>
                View your sent messages and their delivery status
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportData}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              {selectedItems.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBatchDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete ({selectedItems.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              </div>
              <Button 
                onClick={handleSearch}
                className="bg-jaylink-600 hover:bg-jaylink-700"
              >
                Search
              </Button>
            </div>
            
            {isFilterOpen && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="type">Message Type</Label>
                    <Select
                      value={filters.type}
                      onValueChange={(value) => handleFilterChange("type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="voice">Voice</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => handleFilterChange("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="queued">Queued</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange("startDate", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange("endDate", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={resetFilters}
                  >
                    Reset Filters
                  </Button>
                  <Button 
                    onClick={applyFilters}
                    className="bg-jaylink-600 hover:bg-jaylink-700"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Messages Table */}
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-jaylink-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading messages...</span>
            </div>
          ) : messages.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectAll} 
                        onCheckedChange={toggleSelectAll} 
                        aria-label="Select all" 
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => (
                    <TableRow 
                      key={message.id}
                      className={selectedItems.includes(message.id) ? "bg-muted/50" : ""}
                    >
                      <TableCell>
                        <Checkbox 
                          checked={selectedItems.includes(message.id)} 
                          onCheckedChange={() => toggleSelectItem(message.id)} 
                          aria-label={`Select message ${message.id}`} 
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatDate(message.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getTypeIcon(message.type)}
                          <span className="ml-2 capitalize">{message.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRecipientsText(message.recipients)}
                        <div className="text-xs text-gray-500">
                          {message.recipientCount} recipient(s)
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getStatusIcon(message.status)}
                          <span className="ml-2 capitalize">{message.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>${typeof message.cost === 'number' ? message.cost.toFixed(2) : '0.00'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewMessage(message)}>
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteMessage(message)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              <p className="mb-4">No messages found with the selected filters</p>
              <Button
                variant="outline"
                onClick={resetFilters}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          )}
          
          {/* Pagination */}
          {!loading && messages.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={fetchMessages}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message details dialog */}
      <MessageDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        message={selectedMessage}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isBatchDelete 
                ? `Delete ${selectedItems.length} messages?` 
                : "Delete this message?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete 
              {isBatchDelete 
                ? ` the selected ${selectedItems.length} messages` 
                : " this message"} 
              from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default MessageHistory;
