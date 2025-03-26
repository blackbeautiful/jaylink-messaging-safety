
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AuthFormProps {
  type: "login" | "register";
}

const AuthForm = ({ type }: AuthFormProps) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    rememberMe: false,
    acceptTerms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (type === "register" && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      if (type === "login") {
        toast.success("Login successful");
        // In a real app, we would redirect to dashboard after successful login
      } else {
        toast.success("Registration successful. Check your email for verification.");
      }
    }, 1500);
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={formVariants}
      className="w-full max-w-md mx-auto"
    >
      <div className="text-center mb-8">
        <motion.h1 
          variants={itemVariants}
          className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
        >
          {type === "login" ? "Welcome back" : "Create your account"}
        </motion.h1>
        <motion.p 
          variants={itemVariants}
          className="text-gray-600 dark:text-gray-300"
        >
          {type === "login" 
            ? "Sign in to access your JayLink SMS account" 
            : "Get started with JayLink SMS for secure messaging"}
        </motion.p>
      </div>

      <motion.form 
        variants={formVariants}
        onSubmit={handleSubmit} 
        className="space-y-6"
      >
        <motion.div variants={itemVariants}>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            className="mt-1"
          />
        </motion.div>

        {type === "register" && (
          <motion.div variants={itemVariants}>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+234 800 123 4567"
              value={formData.phone}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </motion.div>

        {type === "register" && (
          <motion.div variants={itemVariants}>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative mt-1">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="pr-10"
              />
            </div>
          </motion.div>
        )}

        {type === "login" ? (
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div className="flex items-center">
              <Checkbox
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onCheckedChange={(checked) => 
                  setFormData({...formData, rememberMe: checked as boolean})}
              />
              <Label htmlFor="rememberMe" className="ml-2 text-sm">
                Remember me
              </Label>
            </div>
            <Link to="/forgot-password" className="text-sm text-jaylink-600 hover:text-jaylink-700">
              Forgot password?
            </Link>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} className="flex items-start">
            <Checkbox
              id="acceptTerms"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onCheckedChange={(checked) => 
                setFormData({...formData, acceptTerms: checked as boolean})}
              required
              className="mt-1"
            />
            <Label htmlFor="acceptTerms" className="ml-2 text-sm">
              I agree to the <Link to="#" className="text-jaylink-600 hover:text-jaylink-700">Terms of Service</Link> and <Link to="#" className="text-jaylink-600 hover:text-jaylink-700">Privacy Policy</Link>
            </Label>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <Button 
            type="submit" 
            className="w-full bg-jaylink-600 hover:bg-jaylink-700 text-white py-6 rounded-lg flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {type === "login" ? "Sign in" : "Create account"}
          </Button>
        </motion.div>
      </motion.form>

      <motion.div
        variants={itemVariants}
        className="mt-8 text-center"
      >
        <p className="text-gray-600 dark:text-gray-300">
          {type === "login" 
            ? "Don't have an account yet? " 
            : "Already have an account? "}
          <Link to={type === "login" ? "/register" : "/login"} className="text-jaylink-600 hover:text-jaylink-700 font-medium">
            {type === "login" ? "Sign up" : "Sign in"}
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default AuthForm;
