
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters",
  }),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters",
  }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters",
  }),
  confirmPassword: z.string().min(8, {
    message: "Password must be at least 8 characters",
  }),
  terms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions" }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

type AuthFormProps = {
  type: "login" | "register";
};

const AuthForm = ({ type }: AuthFormProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const onLoginSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    try {
      // This would be an API call in a real app
      console.log("Login form submitted:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "You have successfully logged in.",
      });
      
      navigate("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid email or password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterValues) => {
    setIsLoading(true);
    try {
      // This would be an API call in a real app
      console.log("Register form submitted:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "Your account has been created successfully. Please log in.",
      });
      
      navigate("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem creating your account. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (type === "login") {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Sign in to your account
        </h2>
        
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
            <FormField
              control={loginForm.control}
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
            
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link 
                      to="/forgot-password" 
                      className="text-sm text-jaylink-600 hover:text-jaylink-700"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="password"
                      className="h-12"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={loginForm.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Remember me
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full bg-jaylink-600 hover:bg-jaylink-700 h-12 text-base" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-jaylink-600 hover:text-jaylink-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Create an account
      </h2>
      
      <Form {...registerForm}>
        <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
          <FormField
            control={registerForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="John Doe" 
                    {...field} 
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={registerForm.control}
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
          
          <FormField
            control={registerForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="password"
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={registerForm.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="password"
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={registerForm.control}
            name="terms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm">
                    I agree to the{" "}
                    <Link to="/terms" className="text-jaylink-600 hover:text-jaylink-700">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-jaylink-600 hover:text-jaylink-700">
                      Privacy Policy
                    </Link>
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full bg-jaylink-600 hover:bg-jaylink-700 h-12 text-base" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </Form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-jaylink-600 hover:text-jaylink-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
