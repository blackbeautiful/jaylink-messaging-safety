
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 100 
      }
    }
  };

  const iconVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 200, 
        delay: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <motion.div 
        className="max-w-md text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={iconVariants} className="mb-8 inline-block">
          <div className="relative">
            <MessageSquare size={120} className="text-jaylink-200 dark:text-jaylink-900" />
            <motion.div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-bold text-4xl text-jaylink-600"
              animate={{ 
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              404
            </motion.div>
          </div>
        </motion.div>
        
        <motion.h1 variants={itemVariants} className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">
          Page Not Found
        </motion.h1>
        
        <motion.p variants={itemVariants} className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Oops! The SMS you're looking for seems to have been delivered to another address.
        </motion.p>
        
        <motion.div variants={itemVariants}>
          <Link to="/">
            <Button className="bg-jaylink-600 hover:bg-jaylink-700 mr-2">
              <ArrowLeft size={16} className="mr-2" />
              Back to Login
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" className="border-jaylink-200 text-jaylink-700 hover:bg-jaylink-50 mt-2 sm:mt-0">
              Go to Dashboard
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
