
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import AuthForm from "@/components/AuthForm";
import LogoImg from "@/assets/logo.svg";

const Login = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
          
          {/* Auth form card */}
          <div className="bg-white dark:bg-gray-800 shadow-elevated rounded-2xl p-8">
            <AuthForm type="login" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
