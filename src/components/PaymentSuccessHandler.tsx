/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/PaymentSuccessHandler.tsx - Handle payment redirects
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/contexts/AuthContext';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PaymentSuccessHandlerProps {
  onPaymentProcessed?: (success: boolean, data?: any) => void;
}

const PaymentSuccessHandler = ({ onPaymentProcessed }: PaymentSuccessHandlerProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);

  const handlePaymentReturn = useCallback(async (reference: string | null) => {
    if (!reference || processing) return;

    setProcessing(true);
    setProcessed(true);

    try {
      // Verify the payment with backend
      const response = await api.get(`/payments/verify/${reference}`);

      if (response.data.success) {
        const paymentData = response.data.data;
        
        toast.success(
          `Payment successful! ₦${paymentData.amount.toFixed(2)} has been added to your account.`,
          {
            duration: 5000,
            description: `Transaction reference: ${reference}`
          }
        );

        // Callback to parent component (Balance page) to refresh data
        if (onPaymentProcessed) {
          onPaymentProcessed(true, paymentData);
        }

        // Clean up URL parameters
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('payment');
        newSearchParams.delete('reference');
        newSearchParams.delete('trxref');
        setSearchParams(newSearchParams, { replace: true });

      } else {
        throw new Error(response.data.message || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Payment verification failed';
      
      toast.error(
        'Payment verification failed',
        {
          duration: 7000,
          description: errorMessage
        }
      );

      // Still callback to parent to refresh data (in case webhook worked)
      if (onPaymentProcessed) {
        onPaymentProcessed(false, { error: errorMessage, reference });
      }

      // Clean up URL parameters even on error
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('payment');
      newSearchParams.delete('reference');
      newSearchParams.delete('trxref');
      setSearchParams(newSearchParams, { replace: true });
    } finally {
      setProcessing(false);
    }
  }, [onPaymentProcessed, processing, searchParams, setSearchParams]);

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref'); // Paystack also sends this

    // Check if this is a payment redirect
    if ((paymentStatus === 'success' || trxref) && (reference || trxref) && !processed) {
      handlePaymentReturn(reference || trxref);
    }
  }, [searchParams, processed, handlePaymentReturn]);

  // Show processing indicator
  if (processing) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Verifying Payment</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we confirm your payment...
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentSuccessHandler;