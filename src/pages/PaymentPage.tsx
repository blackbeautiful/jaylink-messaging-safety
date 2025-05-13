import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CreditCard, Wallet, Check } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  
  // Get payment details from navigation state
  const paymentData = location.state || {
    amount: "",
    type: "topup",
    date: new Date().toISOString(),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      toast.success("Payment completed successfully!");
      navigate("/balance");
    }, 2000);
  };

  return (
    <DashboardLayout 
      title="Complete Payment" 
      backLink={paymentData.type === "topup" ? "/balance" : "/dashboard"}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                  <span className="font-medium">₦{parseFloat(paymentData.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Payment Type:</span>
                  <span className="font-medium capitalize">{paymentData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Date:</span>
                  <span className="font-medium">
                    {new Date(paymentData.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span className="text-lg">₦{parseFloat(paymentData.amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-4 border rounded-lg flex flex-col items-center ${
                      paymentMethod === "card"
                        ? "border-jaylink-600 bg-jaylink-50 dark:bg-jaylink-900/20"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <CreditCard className="h-6 w-6 mb-2" />
                    <span>Credit Card</span>
                    {paymentMethod === "card" && (
                      <div className="mt-2 text-jaylink-600">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("transfer")}
                    className={`p-4 border rounded-lg flex flex-col items-center ${
                      paymentMethod === "transfer"
                        ? "border-jaylink-600 bg-jaylink-50 dark:bg-jaylink-900/20"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <Wallet className="h-6 w-6 mb-2" />
                    <span>Bank Transfer</span>
                    {paymentMethod === "transfer" && (
                      <div className="mt-2 text-jaylink-600">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                </div>

                {paymentMethod === "card" && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.number}
                        onChange={(e) =>
                          setCardDetails({
                            ...cardDetails,
                            number: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardName">Name on Card</Label>
                      <Input
                        id="cardName"
                        placeholder="John Doe"
                        value={cardDetails.name}
                        onChange={(e) =>
                          setCardDetails({
                            ...cardDetails,
                            name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input
                          id="expiry"
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={(e) =>
                            setCardDetails({
                              ...cardDetails,
                              expiry: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={(e) =>
                            setCardDetails({
                              ...cardDetails,
                              cvv: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-jaylink-600 hover:bg-jaylink-700 mt-4"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing Payment
                        </>
                      ) : (
                        "Complete Payment"
                      )}
                    </Button>
                  </form>
                )}

                {paymentMethod === "transfer" && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Bank Transfer Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Bank Name:</span>
                          <span>JayLink Bank</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Account Name:</span>
                          <span>JayLink Technologies</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Account Number:</span>
                          <span>1234567890</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Reference:</span>
                          <span>TOPUP-{Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Please transfer the exact amount and use the reference above. Your balance
                      will be updated once we confirm your payment.
                    </p>
                    <Button
                      onClick={() => {
                        toast.success("Bank details copied to clipboard");
                        navigator.clipboard.writeText(
                          `JayLink Bank\nAccount Name: JayLink Technologies\nAccount Number: 1234567890\nAmount: ₦${paymentData.amount}\nReference: TOPUP-${Math.random()
                            .toString(36)
                            .substring(2, 10)
                            .toUpperCase()}`
                        );
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Copy Bank Details
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentPage;