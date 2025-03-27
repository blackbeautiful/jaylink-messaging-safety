
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Current Balance</CardDescription>
              <CardTitle className="text-4xl font-bold text-jaylink-700">₦5,950</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Updated just now</p>
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-jaylink-600 hover:bg-jaylink-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Top Up
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
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
                          <div className="grid grid-cols-2 gap-2">
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
                      <DialogFooter>
                        <Button type="submit" disabled={loading} className="bg-jaylink-600 hover:bg-jaylink-700">
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
              <CardTitle className="text-2xl font-bold text-green-600">₦7,000</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-2" />
                <p className="text-sm text-gray-500">Total top-ups this month</p>
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
              <CardDescription>Money Out</CardDescription>
              <CardTitle className="text-2xl font-bold text-red-600">₦1,050</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ArrowDownRight className="h-4 w-4 text-red-500 mr-2" />
                <p className="text-sm text-gray-500">Total spending this month</p>
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
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="topup">Top Ups</TabsTrigger>
                <TabsTrigger value="sms">SMS</TabsTrigger>
                <TabsTrigger value="voice">Voice & Audio</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
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
                          <TableCell className={`text-right ${
                            transaction.amount > 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {transaction.amount > 0 ? "+" : ""}
                            ₦{Math.abs(transaction.amount).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₦{transaction.balance.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="topup">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.filter(t => t.type === "topup").map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              Top Up
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            +₦{Math.abs(transaction.amount).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₦{transaction.balance.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="sms">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.filter(t => t.type === "sms").map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              SMS
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            ₦{Math.abs(transaction.amount).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₦{transaction.balance.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="voice">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.filter(t => t.type === "voice").map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Voice
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            ₦{Math.abs(transaction.amount).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₦{transaction.balance.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
