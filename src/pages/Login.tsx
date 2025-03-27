
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import AuthForm from "@/components/AuthForm";

const Login = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900"
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <span className="font-bold text-2xl text-jaylink-800 dark:text-white">
              Jay<span className="text-jaylink-600">Link</span>
            </span>
          </Link>
        </div>
        
        {/* Auth form card */}
        <div className="bg-white dark:bg-gray-800 shadow-elevated rounded-2xl p-8">
          <AuthForm type="login" />
        </div>
      </div>
    </motion.div>
  );
};

export default Login;
