
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { ReactComponent as Logo } from "@/assets/logo.svg";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type FormValues = z.infer<typeof formSchema>;

const ForgotPassword = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      // In a real app, this would call an API to send a reset password email
      console.log("Reset password for:", data.email);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Password reset link sent",
        description: "Please check your email for password reset instructions",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem sending the password reset link",
      });
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
              <Logo width={120} height={40} />
            </Link>
          </div>
          
          {/* Forgot Password form card */}
          <div className="bg-white dark:bg-gray-800 shadow-elevated rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Reset Password
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="name@example.com" 
                          {...field} 
                          type="email"
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full bg-jaylink-600 hover:bg-jaylink-700 h-12 text-base">
                  Send Reset Link
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-jaylink-600 hover:text-jaylink-700">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
