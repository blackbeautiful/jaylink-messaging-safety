/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import LogoImg from "@/assets/logo.svg";

// Password reset validation schema
const formSchema = z.object({
  password: z.string().min(8, {
    message: "Password must be at least 8 characters",
  }).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    "Password must include uppercase, lowercase, and a number"
  ),
  confirmPassword: z.string().min(8, {
    message: "Password must be at least 8 characters",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

const ResetPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useAuth();

  // Get reset token from URL
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Validate token exists
    if (!token) {
      toast({
        variant: "destructive",
        title: "Invalid Reset Link",
        description: "The password reset link is invalid or has expired. Please request a new link.",
      });
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!token) return;
    
    setIsSubmitting(true);
    try {
      const success = await resetPassword(token, data.password);
      
      if (success) {
        setIsSuccess(true);
        toast({
          title: "Password Reset Successful",
          description: "Your password has been reset successfully. You can now log in with your new password.",
        });
      } else {
        throw new Error("Failed to reset password");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "There was a problem resetting your password",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 bg-[url('https://images.unsplash.com/photo-1483058712412-4245e9b90334?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1800')] bg-cover bg-center bg-no-repeat bg-blend-overlay">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-block">
              <img src={LogoImg} alt="Logo" width={120} height={40} />
            </Link>
          </div>
          
          {/* Reset Password form card */}
          <div className="bg-white dark:bg-gray-800 shadow-elevated rounded-2xl p-8">
            {isSuccess ? (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Password Reset Complete
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>
                <Button 
                  onClick={() => navigate('/login')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Log In
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Reset Your Password
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create a new password for your account.
                </p>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password"
                              className="h-12"
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password"
                              className="h-12"
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resetting Password...
                        </>
                      ) : (
                        "Reset Password"
                      )}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-6 text-center">
                  <Link to="/login" className="text-sm text-blue-600 hover:text-blue-700">
                    Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;