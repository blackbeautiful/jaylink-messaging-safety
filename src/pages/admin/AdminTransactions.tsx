import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Download, Filter } from 'lucide-react';

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: 'credit' | 'debit';
  amount: number;
  service: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
}

const AdminTransactions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all'); // Changed from empty string to "all"
  const [filterService, setFilterService] = useState<string>('all'); // Changed from empty string to "all"

  const transactions: Transaction[] = [
    {
      id: 'TX-2023-001',
      userId: '1',
      userName: 'John Doe',
      type: 'debit',
      amount: 10.5,
      service: 'SMS',
      status: 'completed',
      date: '2023-05-15T09:30:00Z',
    },
    {
      id: 'TX-2023-002',
      userId: '2',
      userName: 'Jane Smith',
      type: 'credit',
      amount: 50.0,
      service: 'Account Refill',
      status: 'completed',
      date: '2023-05-16T14:22:00Z',
    },
    {
      id: 'TX-2023-003',
      userId: '3',
      userName: 'Robert Johnson',
      type: 'debit',
      amount: 5.75,
      service: 'Voice Call',
      status: 'completed',
      date: '2023-05-17T11:45:00Z',
    },
    {
      id: 'TX-2023-004',
      userId: '4',
      userName: 'Emily Wilson',
      type: 'debit',
      amount: 2.3,
      service: 'Audio Storage',
      status: 'pending',
      date: '2023-05-18T16:10:00Z',
    },
    {
      id: 'TX-2023-005',
      userId: '5',
      userName: 'Michael Brown',
      type: 'credit',
      amount: 100.0,
      service: 'Account Refill',
      status: 'completed',
      date: '2023-05-19T10:05:00Z',
    },
    {
      id: 'TX-2023-006',
      userId: '1',
      userName: 'John Doe',
      type: 'debit',
      amount: 8.25,
      service: 'TTS Conversion',
      status: 'failed',
      date: '2023-05-20T13:20:00Z',
    },
    {
      id: 'TX-2023-007',
      userId: '2',
      userName: 'Jane Smith',
      type: 'debit',
      amount: 12.5,
      service: 'SMS',
      status: 'completed',
      date: '2023-05-21T09:15:00Z',
    },
  ];

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.userName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesService = filterService === 'all' || tx.service === filterService;

    return matchesSearch && matchesType && matchesService;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const uniqueServices = Array.from(new Set(transactions.map((tx) => tx.service)));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
        <p className="text-muted-foreground">View all transactions across the platform.</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID or user..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
              <SelectItem value="debit">Debit</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterService} onValueChange={setFilterService}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {uniqueServices.map((service) => (
                <SelectItem key={service} value={service}>
                  {service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>{filteredTransactions.length} transactions found</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                    <TableCell>{tx.userName}</TableCell>
                    <TableCell>
                      <Badge variant={tx.type === 'credit' ? 'default' : 'secondary'}>
                        {tx.type === 'credit' ? '+Credit' : '-Debit'}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`font-medium ${
                        tx.type === 'credit' ? 'text-green-600 dark:text-green-400' : ''
                      }`}
                    >
                      ${tx.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{tx.service}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          tx.status
                        )}`}
                      >
                        {tx.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(tx.date)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTransactions;
