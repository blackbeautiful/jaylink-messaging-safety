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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  Music
} from "lucide-react";
import { toast } from "sonner";

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
  
  const [filters, setFilters] = useState({
    type: "",
    status: "",
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
      
      if (filters.type) {
        queryParams += `&type=${filters.type}`;
      }
      
      if (filters.status) {
        queryParams += `&status=${filters.status}`;
      }
      
      if (filters.startDate) {
        queryParams += `&startDate=${new Date(filters.startDate).toISOString()}`;
      }
      
      if (filters.endDate) {
        queryParams += `&endDate=${new Date(filters.endDate).toISOString()}`;
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
  };

  const resetFilters = () => {
    setFilters({
      type: "",
      status: "",
      startDate: "",
      endDate: "",
    });
    
    // Fetch with reset filters
    fetchMessages(1);
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
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

  return (
    <DashboardLayout
      title="Message History"
      backLink="/dashboard"
      currentPath={location.pathname}
    >
      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
          <CardDescription>
            View your sent messages and their delivery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 space-y-4">
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
                    <SelectItem value="">All Types</SelectItem>
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
                    <SelectItem value="">All Status</SelectItem>
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
                <Search className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>
          
          {/* Messages Table */}
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-jaylink-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading messages...</span>
            </div>
          ) : messages.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((message) => (
                      <TableRow key={message.id}>
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
                        <TableCell>${message.cost.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => pagination.hasPrev && fetchMessages(pagination.currentPage - 1)}
                        className={pagination.hasPrev ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === pagination.totalPages || 
                        Math.abs(page - pagination.currentPage) <= 1
                      )
                      .map((page, index, array) => {
                        // Add ellipsis
                        if (index > 0 && array[index - 1] !== page - 1) {
                          return (
                            <PaginationItem key={`ellipsis-${page}`}>
                              <span className="px-4 py-2">...</span>
                            </PaginationItem>
                          );
                        }
                        
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => fetchMessages(page)}
                              isActive={page === pagination.currentPage}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => pagination.hasNext && fetchMessages(pagination.currentPage + 1)}
                        className={pagination.hasNext ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              <p className="mb-4">No messages found with the selected filters</p>
              <Button
                variant="outline"
                onClick={() => {
                  resetFilters();
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default MessageHistory;