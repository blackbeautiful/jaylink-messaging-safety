
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, FileText, Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  user: string;
  email: string;
  type: string;
  amount: string;
  date: string;
  status: string;
}

const AdminTransactions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  // Mock transactions data
  const transactions: Transaction[] = [
    {
      id: "T12345",
      user: "John Doe",
      email: "john@example.com",
      type: "Balance Added",
      amount: "+$50.00",
      date: "2023-05-01",
      status: "Completed"
    },
    {
      id: "T12346",
      user: "Jane Smith",
      email: "jane@example.com",
      type: "SMS Message",
      amount: "-$2.50",
      date: "2023-05-02",
      status: "Completed"
    },
    {
      id: "T12347",
      user: "Robert Johnson",
      email: "robert@example.com",
      type: "Audio Upload",
      amount: "-$5.00",
      date: "2023-05-03",
      status: "Completed"
    },
    {
      id: "T12348",
      user: "Sarah Williams",
      email: "sarah@example.com",
      type: "Balance Added",
      amount: "+$100.00",
      date: "2023-05-04",
      status: "Completed"
    },
    {
      id: "T12349",
      user: "Michael Brown",
      email: "michael@example.com",
      type: "TTS Conversion",
      amount: "-$1.50",
      date: "2023-05-05",
      status: "Pending"
    },
    {
      id: "T12350",
      user: "Emily Davis",
      email: "emily@example.com",
      type: "Audio Message",
      amount: "-$3.75",
      date: "2023-05-06",
      status: "Completed"
    },
    {
      id: "T12351",
      user: "David Wilson",
      email: "david@example.com",
      type: "Balance Added",
      amount: "+$75.00",
      date: "2023-05-07",
      status: "Pending"
    },
    {
      id: "T12352",
      user: "Jennifer Taylor",
      email: "jennifer@example.com",
      type: "SMS Message",
      amount: "-$4.25",
      date: "2023-05-08",
      status: "Failed"
    }
  ];

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    // Search term filter
    const searchFilter = searchTerm === "" ||
      transaction.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type filter
    const typeFilterMatch = typeFilter === "all" || transaction.type === typeFilter;
    
    // Status filter
    const statusFilterMatch = statusFilter === "all" || transaction.status === statusFilter;
    
    // Date filter
    const transactionDate = new Date(transaction.date);
    const dateFilterMatch = 
      (!fromDate || transactionDate >= fromDate) && 
      (!toDate || transactionDate <= toDate);
    
    return searchFilter && typeFilterMatch && statusFilterMatch && dateFilterMatch;
  });

  // Get unique transaction types for filter
  const transactionTypes = ["all", ...new Set(transactions.map(t => t.type))];
  const transactionStatuses = ["all", ...new Set(transactions.map(t => t.status))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
        <p className="text-muted-foreground">
          View and manage all system transactions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Records</CardTitle>
          <CardDescription>
            Review all financial transactions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-[180px]">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type === "all" ? "All Types" : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-[180px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {transactionStatuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status === "all" ? "All Statuses" : status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-[180px]">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "PPP") : "From Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="w-[180px]">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !toDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "PPP") : "To Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
                setStatusFilter("all");
                setFromDate(undefined);
                setToDate(undefined);
              }}
            >
              Reset Filters
            </Button>
          </div>
          
          {/* Transactions Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.id}</TableCell>
                  <TableCell>
                    <div>
                      <div>{transaction.user}</div>
                      <div className="text-xs text-muted-foreground">{transaction.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{transaction.type}</TableCell>
                  <TableCell className={transaction.amount.startsWith("+") ? "text-green-600" : "text-red-600"}>
                    {transaction.amount}
                  </TableCell>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>
                    <div className={cn(
                      "px-2 py-1 rounded-full text-xs inline-block",
                      transaction.status === "Completed" ? "bg-green-100 text-green-800" :
                      transaction.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    )}>
                      {transaction.status}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    No transactions found matching your search criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Export Buttons */}
          <div className="mt-6 flex justify-end">
            <Button variant="outline" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Export Transactions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTransactions;
