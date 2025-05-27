/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/BalanceOverview.tsx - FIXED with proper stats and improved UX
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  CreditCard, 
  Wallet, 
  Loader2, 
  RefreshCw, 
  Download,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Eye,
  Info,
  Send,
  History,
  Users,
  Settings
} from "lucide-react";
import { api } from "@/contexts/AuthContext";
import { formatDate, formatCurrency } from "@/lib/utils";
import Pagination from "@/components/Pagination";

// Types
interface Transaction {
  id: string;
  transactionId: string;
  type: 'credit' | 'debit';
  amount: number;
  balanceAfter: number;
  service?: string;
  status: 'completed' | 'pending' | 'failed';
  description?: string;
  createdAt: string;
  currencyCode?: string;
  currencySymbol?: string;
}

interface Balance {
  balance: number;
  currency: string;
  currencySymbol: string;
  lastUpdated: string;
}

interface BalanceSummary extends Balance {
  totalIn: number;
  totalOut: number;
  netFlow: number;
  monthlyIn: number;
  monthlyOut: number;
  monthlyNet: number;
  weeklyIn: number;
  weeklyOut: number;
  weeklyNet: number;
  transactionCount: number;
  minimumBalanceThreshold: number;
  lowBalance: boolean;
  recentTransactions: Transaction[];
}

interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface FilterState {
  type: string;
  startDate: string;
  endDate: string;
  service: string;
  status: string;
}

// Cache interfaces
interface BalanceCache {
  balance: BalanceSummary | null;
  lastFetch: number;
}

interface TransactionCache {
  data: Transaction[];
  pagination: PaginationInfo;
  filters: FilterState;
  lastFetch: number;
}

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache
const CURRENCY_SYMBOL = '₦'; // Nigerian Naira

// Enhanced Payment Success Handler Component with better UX
const PaymentSuccessHandler = ({ onPaymentProcessed }: { onPaymentProcessed: (success: boolean, data?: any) => void }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const processedRef = useRef(false);

  const handlePaymentReturn = useCallback(async (reference: string | null) => {
    if (!reference || processing || processedRef.current) return;

    processedRef.current = true;
    setProcessing(true);

    try {
      // Verify the payment with backend
      const response = await api.get(`/payments/verify/${reference}`);

      if (response.data.success) {
        const data = response.data.data;
        setPaymentData(data);
        setShowSuccess(true);
        
        // Show success animation for 3 seconds
        setTimeout(() => {
          // Single toast notification (prevent duplicates)
          if (!(toast as any).isActive?.('payment-success')) {
            toast.success(
              `Payment successful! ₦${data.amount.toFixed(2)} has been added to your account.`,
              {
                id: 'payment-success',
                duration: 4000,
                description: `Transaction reference: ${reference}`
              }
            );
          }

          // Callback to parent component to refresh data
          onPaymentProcessed(true, data);

          // Clean up URL parameters
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('payment');
          newSearchParams.delete('reference');
          newSearchParams.delete('trxref');
          setSearchParams(newSearchParams, { replace: true });

          setShowSuccess(false);
        }, 3000);

      } else {
        throw new Error(response.data.message || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Payment verification failed';
      
      // Single error toast
      if (!(toast as any).isActive?.('payment-error')) {
        toast.error(
          'Payment verification failed',
          {
            id: 'payment-error',
            duration: 6000,
            description: errorMessage
          }
        );
      }

      // Still callback to parent to refresh data (in case webhook worked)
      onPaymentProcessed(false, { error: errorMessage, reference });

      // Clean up URL parameters even on error
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('payment');
      newSearchParams.delete('reference');
      newSearchParams.delete('trxref');
      setSearchParams(newSearchParams, { replace: true });
    } finally {
      setProcessing(false);
    }
  }, [processing, searchParams, setSearchParams, onPaymentProcessed]);

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref'); // Paystack also sends this

    // Check if this is a payment redirect
    if ((paymentStatus === 'success' || trxref) && (reference || trxref) && !processed && !processedRef.current) {
      handlePaymentReturn(reference || trxref);
    }
  }, [searchParams, processed, handlePaymentReturn]);

  // Show processing indicator
  if (processing || showSuccess) {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-sm mx-4 text-center"
          >
            {processing && !showSuccess && (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Verifying Payment</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Please wait while we confirm your payment...
                </p>
              </>
            )}
            
            {showSuccess && paymentData && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </motion.div>
                <motion.h3 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-semibold mb-2 text-green-600"
                >
                  Payment Successful!
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600 dark:text-gray-400 mb-2"
                >
                  ₦{paymentData.amount.toFixed(2)} has been added to your account
                </motion.p>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-gray-500 dark:text-gray-500"
                >
                  New balance: ₦{paymentData.balance.toFixed(2)}
                </motion.p>
              </>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
};

const BalanceOverview = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Balance state - FIXED to use BalanceSummary with proper stats
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  
  // Transaction state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsPagination, setTransactionsPagination] = useState<PaginationInfo>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 20,
    hasNext: false,
    hasPrev: false,
  });
  
  // UI state
  const [amount, setAmount] = useState("");
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    type: "all",
    startDate: "",
    endDate: "",
    service: "all",
    status: "all"
  });
  
  // Cache management
  const [balanceCache, setBalanceCache] = useState<BalanceCache>({
    balance: null,
    lastFetch: 0
  });
  
  const [transactionCache, setTransactionCache] = useState<TransactionCache | null>(null);
  
  // Currency configuration
  const [currencyConfig, setCurrencyConfig] = useState({
    symbol: CURRENCY_SYMBOL,
    code: 'NGN'
  });

  // Helper functions
  const isCacheValid = useCallback((lastFetch: number): boolean => {
    return Date.now() - lastFetch < CACHE_DURATION;
  }, []);

  const isTransactionCacheValid = useCallback((cache: TransactionCache | null, currentFilters: FilterState): boolean => {
    if (!cache) return false;
    const isExpired = Date.now() - cache.lastFetch > CACHE_DURATION;
    const filtersChanged = JSON.stringify(cache.filters) !== JSON.stringify(currentFilters);
    return !isExpired && !filtersChanged;
  }, []);

  // FIXED: Fetch balance summary with proper stats from backend
  const fetchBalanceSummary = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first unless force refresh
      if (!forceRefresh && isCacheValid(balanceCache.lastFetch) && balanceCache.balance) {
        setBalanceSummary(balanceCache.balance);
        return;
      }

      if (!refreshing) setLoading(true);
      setBalanceError(null);

      const response = await api.get('/balance/summary');
      
      if (response.data.success) {
        const summary = response.data.data;
        setBalanceSummary(summary);
        
        // Update cache
        setBalanceCache({
          balance: summary,
          lastFetch: Date.now()
        });
        
        // Update currency config
        if (summary.currency) {
          setCurrencyConfig({
            symbol: summary.currencySymbol || CURRENCY_SYMBOL,
            code: summary.currency
          });
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch balance summary');
      }
    } catch (error: any) {
      console.error('Error fetching balance summary:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch balance summary';
      setBalanceError(errorMessage);
      
      // Single error toast
      if (!(toast as any).isActive?.('balance-error')) {
        toast.error(errorMessage, { id: 'balance-error' });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [balanceCache, isCacheValid, refreshing]);

  // Fetch transactions with caching and filtering
  const fetchTransactions = useCallback(async (
    page = 1, 
    currentFilters = filters, 
    showLoader = true, 
    forceRefresh = false
  ) => {
    try {
      // Check cache first unless force refresh
      if (!forceRefresh && page === 1 && isTransactionCacheValid(transactionCache, currentFilters)) {
        setTransactions(transactionCache!.data);
        setTransactionsPagination(transactionCache!.pagination);
        return;
      }

      if (showLoader) setLoading(true);
      setBalanceError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: transactionsPagination.limit.toString(),
      });

      // Add filters
      if (currentFilters.type && currentFilters.type !== "all") {
        params.append('type', currentFilters.type);
      }
      
      if (currentFilters.status && currentFilters.status !== "all") {
        params.append('status', currentFilters.status);
      }
      
      if (currentFilters.startDate) {
        params.append('startDate', new Date(currentFilters.startDate).toISOString());
      }
      
      if (currentFilters.endDate) {
        params.append('endDate', new Date(currentFilters.endDate).toISOString());
      }

      const response = await api.get(`/balance/transactions?${params.toString()}`);
      
      if (response.data.success) {
        const { transactions: fetchedTransactions, pagination, currency } = response.data.data;
        
        setTransactions(fetchedTransactions);
        setTransactionsPagination(pagination);
        
        // Update currency config if provided
        if (currency) {
          setCurrencyConfig({
            symbol: currency.symbol || CURRENCY_SYMBOL,
            code: currency.code || 'NGN'
          });
        }
        
        // Update cache for page 1
        if (page === 1) {
          setTransactionCache({
            data: fetchedTransactions,
            pagination,
            filters: currentFilters,
            lastFetch: Date.now()
          });
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch transactions');
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch transactions';
      setBalanceError(errorMessage);
      
      if (!(toast as any).isActive?.('transaction-error')) {
        toast.error(errorMessage, { id: 'transaction-error' });
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [filters, transactionCache, isTransactionCacheValid, transactionsPagination.limit]);

  // Handle payment success callback
  const handlePaymentProcessed = useCallback((success: boolean, data?: any) => {
    if (success) {
      // Invalidate caches and refresh data
      setBalanceCache({ balance: null, lastFetch: 0 });
      setTransactionCache(null);
      
      // Refresh balance and transactions
      fetchBalanceSummary(true);
      fetchTransactions(1, filters, false, true);
      
      // Close any open dialogs
      setShowTopUpDialog(false);
      setAmount("");
    } else {
      // Even on verification failure, refresh data in case webhook worked
      fetchBalanceSummary(true);
      fetchTransactions(1, filters, false, true);
    }
  }, [fetchBalanceSummary, fetchTransactions, filters]);

  // Handle top up
  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const minTopUpAmount = parseFloat(import.meta.env.VITE_MIN_MIN_TOPUP_AMOUNT || '100');
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(amount) < minTopUpAmount) {
      toast.error(`Minimum top-up amount is ₦${minTopUpAmount}`);
      return;
    }

    try {
      setActionLoading('topup');
      
      // Initialize payment
      const response = await api.post('/payments/initialize', {
        amount: parseFloat(amount)
      });
      
      if (response.data.success) {
        const { authorizationUrl } = response.data.data;
        
        // Redirect to payment gateway
        window.location.href = authorizationUrl;
      } else {
        throw new Error(response.data.message || 'Failed to initialize payment');
      }
    } catch (error: any) {
      console.error('Top up error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to initialize payment';
      
      if (!(toast as any).isActive?.('topup-error')) {
        toast.error(errorMessage, { id: 'topup-error' });
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Handle filter changes
  const handleFilterChange = (name: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyFilters = () => {
    setTransactionCache(null); // Invalidate cache
    fetchTransactions(1, filters);
    setShowFilters(false);
  };

  const resetFilters = () => {
    const resetFilters = {
      type: "all",
      startDate: "",
      endDate: "",
      service: "all",
      status: "all"
    };
    
    setFilters(resetFilters);
    setTransactionCache(null); // Invalidate cache
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    fetchTransactions(page, filters);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    setBalanceCache({ balance: null, lastFetch: 0 });
    setTransactionCache(null);
    Promise.all([
      fetchBalanceSummary(true),
      fetchTransactions(1, filters, false, true)
    ]).finally(() => setRefreshing(false));
  };

  // Handle tab change with caching
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    const newFilters = {
      ...filters,
      type: value === "all" ? "all" : value
    };
    
    setFilters(newFilters);
    fetchTransactions(1, newFilters);
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Get transaction type icon
  const getTransactionIcon = (type: string, service?: string) => {
    if (type === 'credit') {
      return service === 'payment' ? <CreditCard className="h-4 w-4 text-green-600" /> : <ArrowUpRight className="h-4 w-4 text-green-500" />;
    } else {
      return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    }
  };

  // Format transaction description
  const formatTransactionDescription = (transaction: Transaction) => {
    if (transaction.description) {
      return transaction.description;
    }
    
    if (transaction.type === 'credit') {
      return transaction.service === 'payment' ? 'Payment received' : 'Account credit';
    } else {
      return transaction.service ? `${transaction.service.toUpperCase()} service` : 'Account debit';
    }
  };

  // Export transactions
  const exportTransactions = async () => {
    try {
      setActionLoading('export');
      
      const params = new URLSearchParams();
      if (filters.type !== "all") params.append('type', filters.type);
      if (filters.status !== "all") params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await api.get(`/balance/transactions/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Transaction data exported successfully");
    } catch (error: any) {
      console.error("Export error:", error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to export data';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Initial data fetch
  useEffect(() => {
    Promise.all([
      fetchBalanceSummary(),
      fetchTransactions()
    ]);
  }, [fetchBalanceSummary, fetchTransactions]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBalanceSummary(false);
      if (activeTab === "all") {
        fetchTransactions(1, filters, false, false);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [activeTab, filters, fetchBalanceSummary, fetchTransactions]);

  if (loading && !balanceSummary && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-jaylink-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading balance and transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Success Handler */}
      <PaymentSuccessHandler onPaymentProcessed={handlePaymentProcessed} />
      
      {/* Error display */}
      {balanceError && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 dark:text-red-200">{balanceError}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FIXED: Balance Cards with proper all-time statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Current Balance</CardDescription>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <CardTitle className="text-2xl sm:text-4xl font-bold text-jaylink-700">
                {balanceSummary ? formatCurrency(balanceSummary.balance, currencyConfig.symbol) : '--'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <p className="text-xs sm:text-sm text-gray-500">
                  {balanceSummary ? formatDate(balanceSummary.lastUpdated) : 'Loading...'}
                </p>
                <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-jaylink-600 hover:bg-jaylink-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Top Up
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] w-[90vw] max-w-[90vw] sm:w-auto">
                    <DialogHeader>
                      <DialogTitle>Top Up Balance</DialogTitle>
                      <DialogDescription>
                        Add funds to your account to continue sending messages.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleTopUp}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount ({currencyConfig.symbol})</Label>
                          <Input
                            id="amount"
                            placeholder="Enter amount"
                            type="number"
                            min={import.meta.env.VITE_MIN_MIN_TOPUP_AMOUNT || "100"}
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                          />
                          <p className="text-xs text-gray-500">
                            Minimum amount: {formatCurrency(parseFloat(import.meta.env.VITE_MIN_MIN_TOPUP_AMOUNT || '100'), currencyConfig.symbol)}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div className="text-xs text-blue-800 dark:text-blue-200">
                              <p className="font-medium mb-1">Payment Security:</p>
                              <p>• Secure payment via Paystack</p>
                              <p>• Your card details are encrypted</p>
                              <p>• You'll be redirected back after payment</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="flex-col sm:flex-row">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowTopUpDialog(false)}
                          disabled={!!actionLoading}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={!!actionLoading} 
                          className="bg-jaylink-600 hover:bg-jaylink-700 w-full"
                        >
                          {actionLoading === 'topup' ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Proceed to Payment"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Money In (All Time)</CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">
                {balanceSummary ? formatCurrency(balanceSummary.totalIn, currencyConfig.symbol) : '--'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                <p className="text-xs sm:text-sm text-gray-500">Total credits</p>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                This month: {balanceSummary ? formatCurrency(balanceSummary.monthlyIn, currencyConfig.symbol) : '--'}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Money Out (All Time)</CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-bold text-red-600">
                {balanceSummary ? formatCurrency(balanceSummary.totalOut, currencyConfig.symbol) : '--'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                <p className="text-xs sm:text-sm text-gray-500">Total spending</p>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                This month: {balanceSummary ? formatCurrency(balanceSummary.monthlyOut, currencyConfig.symbol) : '--'}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Net Flow (All Time)</CardDescription>
              <CardTitle className={`text-xl sm:text-2xl font-bold ${
                balanceSummary && balanceSummary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {balanceSummary ? formatCurrency(balanceSummary.netFlow, currencyConfig.symbol) : '--'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
                <p className="text-xs sm:text-sm text-gray-500">Net difference</p>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                This month: {balanceSummary ? formatCurrency(balanceSummary.monthlyNet, currencyConfig.symbol) : '--'}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Your recent transactions and payment history
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportTransactions}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'export' ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-1" />
                  )}
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            {showFilters && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="type">Transaction Type</Label>
                    <Select
                      value={filters.type}
                      onValueChange={(value) => handleFilterChange("type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="credit">Credits</SelectItem>
                        <SelectItem value="debit">Debits</SelectItem>
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
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
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

            {/* Transaction Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="credit">Credits</TabsTrigger>
                <TabsTrigger value="debit">Debits</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab}>
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-jaylink-600" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Loading transactions...</span>
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="rounded-md border">
                    <div className="overflow-x-auto w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Date</TableHead>
                            <TableHead className="whitespace-nowrap">Description</TableHead>
                            <TableHead className="whitespace-nowrap">Type</TableHead>
                            <TableHead className="whitespace-nowrap">Status</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="whitespace-nowrap font-medium">
                                <div>
                                  <div>{formatDate(transaction.createdAt, { format: 'short' })}</div>
                                  <div className="text-xs text-gray-500">
                                    {formatDate(transaction.createdAt, { format: 'short', includeTime: true }).split(' ').slice(-2).join(' ')}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {getTransactionIcon(transaction.type, transaction.service)}
                                  <div>
                                    <div className="font-medium">
                                      {formatTransactionDescription(transaction)}
                                    </div>
                                    {transaction.transactionId && (
                                      <div className="text-xs text-gray-500">
                                        ID: {transaction.transactionId}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <Badge variant={transaction.type === 'credit' ? 'default' : 'secondary'}>
                                  {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                                </Badge>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {transaction.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                  {transaction.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                                  {transaction.status === 'failed' && <X className="h-4 w-4 text-red-600" />}
                                  <Badge className={getStatusBadge(transaction.status)}>
                                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className={`text-right whitespace-nowrap font-medium ${
                                transaction.type === 'credit' ? "text-green-600" : "text-red-600"
                              }`}>
                                {transaction.type === 'credit' ? "+" : "-"}
                                {formatCurrency(Math.abs(transaction.amount), currencyConfig.symbol)}
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap font-medium">
                                {formatCurrency(transaction.balanceAfter, currencyConfig.symbol)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No transactions found</p>
                    <p className="mb-4">
                      {Object.values(filters).some(f => f && f !== 'all') 
                        ? 'No transactions match your current filters' 
                        : 'You haven\'t made any transactions yet'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      {Object.values(filters).some(f => f && f !== 'all') && (
                        <Button
                          variant="outline"
                          onClick={resetFilters}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Clear Filters
                        </Button>
                      )}
                      <Button
                        onClick={() => setShowTopUpDialog(true)}
                        className="bg-jaylink-600 hover:bg-jaylink-700"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Funds
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Pagination */}
                {!loading && transactions.length > 0 && transactionsPagination.totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={transactionsPagination.currentPage}
                      totalPages={transactionsPagination.totalPages}
                      onPageChange={handlePageChange}
                      totalItems={transactionsPagination.total}
                      itemsPerPage={transactionsPagination.limit}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Transaction Summary Cards */}
      {balanceSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>This Week</CardDescription>
                <div className="flex items-baseline gap-2">
                  <CardTitle className="text-lg font-bold text-green-600">
                    +{formatCurrency(balanceSummary.weeklyIn, currencyConfig.symbol)}
                  </CardTitle>
                  <span className="text-sm text-red-600">
                    -{formatCurrency(balanceSummary.weeklyOut, currencyConfig.symbol)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-500">
                  Net: {formatCurrency(balanceSummary.weeklyNet, currencyConfig.symbol)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>This Month</CardDescription>
                <div className="flex items-baseline gap-2">
                  <CardTitle className="text-lg font-bold text-green-600">
                    +{formatCurrency(balanceSummary.monthlyIn, currencyConfig.symbol)}
                  </CardTitle>
                  <span className="text-sm text-red-600">
                    -{formatCurrency(balanceSummary.monthlyOut, currencyConfig.symbol)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-500">
                  Net: {formatCurrency(balanceSummary.monthlyNet, currencyConfig.symbol)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Transactions</CardDescription>
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                  {balanceSummary.transactionCount.toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-500">
                  All-time activity
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Enhanced Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Frequently used balance and payment actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => setShowTopUpDialog(true)}
              >
                <Plus className="h-6 w-6" />
                <span>Top Up</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={exportTransactions}
                disabled={!!actionLoading}
              >
                <Download className="h-6 w-6" />
                <span>Export</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className="h-6 w-6" />
                <span>Refresh</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => setShowFilters(true)}
              >
                <Filter className="h-6 w-6" />
                <span>Filter</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity Section */}
      {balanceSummary && balanceSummary.recentTransactions && balanceSummary.recentTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest 5 transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {balanceSummary.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type, transaction.service)}
                      <div>
                        <p className="font-medium text-sm">
                          {formatTransactionDescription(transaction)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(transaction.createdAt, { format: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount), currencyConfig.symbol)}
                      </p>
                      <Badge className={getStatusBadge(transaction.status)} variant="secondary">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Balance Alert */}
      {balanceSummary && balanceSummary.lowBalance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Low Balance Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-700 dark:text-amber-300 mb-4">
                Your account balance is below the recommended minimum of {formatCurrency(balanceSummary.minimumBalanceThreshold, currencyConfig.symbol)}. 
                Consider topping up to ensure uninterrupted service.
              </p>
              <Button
                onClick={() => setShowTopUpDialog(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Top Up Now
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Payment Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Security Features:</h4>
                <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• SSL encrypted transactions</li>
                  <li>• PCI DSS compliant payment processing</li>
                  <li>• Real-time fraud detection</li>
                  <li>• Secure payment gateway (Paystack)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Payment Methods:</h4>
                <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• Visa, MasterCard, Verve cards</li>
                  <li>• Bank transfers</li>
                  <li>• USSD payments</li>
                  <li>• Mobile money</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800/50 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> All payments are processed securely through Paystack. 
                You'll be redirected to complete your payment and then brought back to this page automatically.
                Minimum top-up amount is {formatCurrency(parseFloat(import.meta.env.VITE_MIN_MIN_TOPUP_AMOUNT || '100'), currencyConfig.symbol)}.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Debug Panel (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 max-w-sm">
          <details className="bg-black/80 text-white p-2 rounded text-xs">
            <summary className="cursor-pointer">Debug: Balance & Transactions</summary>
            <div className="mt-2 space-y-1">
              <div>Balance: {balanceSummary ? formatCurrency(balanceSummary.balance, currencyConfig.symbol) : 'Loading'}</div>
              <div>Total In: {balanceSummary ? formatCurrency(balanceSummary.totalIn, currencyConfig.symbol) : 'Loading'}</div>
              <div>Total Out: {balanceSummary ? formatCurrency(balanceSummary.totalOut, currencyConfig.symbol) : 'Loading'}</div>
              <div>Net Flow: {balanceSummary ? formatCurrency(balanceSummary.netFlow, currencyConfig.symbol) : 'Loading'}</div>
              <div>Transactions: {transactions.length}</div>
              <div>Page: {transactionsPagination.currentPage}/{transactionsPagination.totalPages}</div>
              <div>Total: {transactionsPagination.total}</div>
              <div>Loading: {loading.toString()}</div>
              <div>Refreshing: {refreshing.toString()}</div>
              <div>Action: {actionLoading || 'none'}</div>
              <div>Active Tab: {activeTab}</div>
              <div>Filters: {Object.values(filters).filter(f => f && f !== 'all').length}</div>
              <div>Balance Cache: {balanceCache.balance ? 'valid' : 'invalid'}</div>
              <div>Transaction Cache: {transactionCache ? 'valid' : 'invalid'}</div>
              <div>Cache Age: {balanceCache.balance ? Math.round((Date.now() - balanceCache.lastFetch) / 1000) + 's' : 'N/A'}</div>
              <div>Low Balance: {balanceSummary?.lowBalance ? 'Yes' : 'No'}</div>
              <div>Min Threshold: {balanceSummary ? formatCurrency(balanceSummary.minimumBalanceThreshold, currencyConfig.symbol) : 'N/A'}</div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default BalanceOverview;