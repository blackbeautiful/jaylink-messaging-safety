import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Define login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const AdminLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // If redirected from a protected route, get the redirect path
  const from = location.state?.from?.pathname || "/jayadminlink/dashboard";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call to verify admin credentials
      // For this demo, we'll hardcode the admin credentials
      if (data.username === "admin" && data.password === "admin123") {
        // Set admin token in localStorage
        localStorage.setItem("adminToken", "mock-admin-token");
        
        toast.success("You have successfully logged in as admin.");
        
        // Navigate to the intended destination or dashboard
        navigate(from, { replace: true });
      } else {
        toast.error("Invalid admin credentials.");
      }
    } catch (error) {
      toast.error("An error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-jaylink-100 text-jaylink-600 mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Portal
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the admin dashboard
              <div className="mt-2 text-xs p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <span className="font-semibold">Demo credentials:</span> username: <span className="font-mono">admin</span>, password: <span className="font-mono">admin123</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="admin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-jaylink-600 hover:bg-jaylink-700" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Log in"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="link" onClick={() => navigate("/")}>
              Return to User Login
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminLogin;