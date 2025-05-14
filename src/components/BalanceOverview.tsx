import { useState } from "react";
import { motion } from "framer-motion";
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
import { ArrowUpRight, ArrowDownRight, Plus, CreditCard, Wallet, Loader2 } from "lucide-react";

const BalanceOverview = () => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const handleTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setShowDialog(false);
      setAmount("");
      toast.success("Balance topped up successfully!");
    }, 1500);
  };

  // Mock transaction data
  const transactions = [
    {
      id: "1",
      date: "2023-05-15",
      type: "topup",
      amount: 5000,
      description: "Account Top Up",
      balance: 5000,
    },
    {
      id: "2",
      date: "2023-05-16",
      type: "sms",
      amount: -250,
      description: "Bulk SMS Campaign",
      balance: 4750,
    },
    {
      id: "3",
      date: "2023-05-18",
      type: "voice",
      amount: -500,
      description: "Voice Call Campaign",
      balance: 4250,
    },
    {
      id: "4",
      date: "2023-05-20",
      type: "topup",
      amount: 2000,
      description: "Account Top Up",
      balance: 6250,
    },
    {
      id: "5",
      date: "2023-05-22",
      type: "sms",
      amount: -300,
      description: "SMS Notifications",
      balance: 5950,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Changed grid gap and added better responsive behavior */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Current Balance</CardDescription>
              <CardTitle className="text-2xl sm:text-4xl font-bold text-jaylink-700">₦5,950</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <p className="text-xs sm:text-sm text-gray-500">Updated just now</p>
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
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
                          <Label htmlFor="amount">Amount (₦)</Label>
                          <Input
                            id="amount"
                            placeholder="Enter amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Payment Method</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Button type="button" variant="outline" className="justify-start">
                              <CreditCard className="mr-2 h-4 w-4" />
                              Credit Card
                            </Button>
                            <Button type="button" variant="outline" className="justify-start">
                              <Wallet className="mr-2 h-4 w-4" />
                              Bank Transfer
                            </Button>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="flex-col sm:flex-row">
                        <Button type="submit" disabled={loading} className="bg-jaylink-600 hover:bg-jaylink-700 w-full">
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing
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
              <CardDescription>Money In</CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">₦7,000</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-2" />
                <p className="text-xs sm:text-sm text-gray-500">Total top-ups this month</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="sm:col-span-2 lg:col-span-1" // Full width on mobile, half on tablet, 1/3 on desktop
        >
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Money Out</CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-bold text-red-600">₦1,050</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ArrowDownRight className="h-4 w-4 text-red-500 mr-2" />
                <p className="text-xs sm:text-sm text-gray-500">Total spending this month</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              Your recent transactions and payment history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              {/* Changed tabs layout to be more mobile friendly */}
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="topup">Top Ups</TabsTrigger>
                <TabsTrigger value="sms">SMS</TabsTrigger>
                <TabsTrigger value="voice">Voice & Audio</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <div className="border rounded-lg">
                  <div className="overflow-x-auto w-full"> {/* Critical for mobile scrolling */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Date</TableHead>
                          <TableHead className="whitespace-nowrap">Description</TableHead>
                          <TableHead className="whitespace-nowrap">Type</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="whitespace-nowrap font-medium">{transaction.date}</TableCell>
                            <TableCell className="whitespace-nowrap">{transaction.description}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                transaction.type === "topup"
                                  ? "bg-green-100 text-green-800"
                                  : transaction.type === "sms"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}>
                                {transaction.type === "topup" ? "Top Up" : 
                                  transaction.type === "sms" ? "SMS" : "Voice"}
                              </span>
                            </TableCell>
                            <TableCell className={`text-right whitespace-nowrap ${
                              transaction.amount > 0 ? "text-green-600" : "text-red-600"
                            }`}>
                              {transaction.amount > 0 ? "+" : ""}
                              ₦{Math.abs(transaction.amount).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap font-medium">
                              ₦{transaction.balance.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="topup">
                <div className="border rounded-lg">
                  <div className="overflow-x-auto w-full"> {/* Critical for mobile scrolling */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Date</TableHead>
                          <TableHead className="whitespace-nowrap">Description</TableHead>
                          <TableHead className="whitespace-nowrap">Type</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.filter(t => t.type === "topup").map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="whitespace-nowrap font-medium">{transaction.date}</TableCell>
                            <TableCell className="whitespace-nowrap">{transaction.description}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                Top Up
                              </span>
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap text-green-600">
                              +₦{Math.abs(transaction.amount).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap font-medium">
                              ₦{transaction.balance.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="sms">
                <div className="border rounded-lg">
                  <div className="overflow-x-auto w-full"> {/* Critical for mobile scrolling */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Date</TableHead>
                          <TableHead className="whitespace-nowrap">Description</TableHead>
                          <TableHead className="whitespace-nowrap">Type</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.filter(t => t.type === "sms").map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="whitespace-nowrap font-medium">{transaction.date}</TableCell>
                            <TableCell className="whitespace-nowrap">{transaction.description}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                SMS
                              </span>
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap text-red-600">
                              ₦{Math.abs(transaction.amount).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap font-medium">
                              ₦{transaction.balance.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="voice">
                <div className="border rounded-lg">
                  <div className="overflow-x-auto w-full"> {/* Critical for mobile scrolling */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Date</TableHead>
                          <TableHead className="whitespace-nowrap">Description</TableHead>
                          <TableHead className="whitespace-nowrap">Type</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.filter(t => t.type === "voice").map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="whitespace-nowrap font-medium">{transaction.date}</TableCell>
                            <TableCell className="whitespace-nowrap">{transaction.description}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                Voice
                              </span>
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap text-red-600">
                              ₦{Math.abs(transaction.amount).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap font-medium">
                              ₦{transaction.balance.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default BalanceOverview;