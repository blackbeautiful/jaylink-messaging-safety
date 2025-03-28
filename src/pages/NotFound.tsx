
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquareOff, ArrowLeft } from "lucide-react";
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
        staggerChildren: 0.2,
        duration: 0.3 
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  // Fixed the type error by correctly typing the variant
  const iconVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 100,
        duration: 0.5 
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <motion.div 
        className="text-center max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="mb-8 flex justify-center"
          variants={iconVariants}
          initial="hidden"
          animate="visible"
          // We'll use CSS for the pulse animation instead
          className="relative animate-pulse"
        >
          <div className="relative">
            <MessageSquareOff className="h-32 w-32 text-jaylink-300 dark:text-jaylink-700" />
            <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-jaylink-100 dark:bg-jaylink-800 animate-ping opacity-75"></div>
          </div>
        </motion.div>
        
        <motion.h1 
          className="text-5xl font-extrabold mb-4 text-jaylink-800 dark:text-white"
          variants={itemVariants}
        >
          404
        </motion.h1>
        
        <motion.p 
          className="text-xl text-gray-600 dark:text-gray-300 mb-8"
          variants={itemVariants}
        >
          Oops! We couldn't find that page
        </motion.p>
        
        <motion.p 
          className="text-gray-500 dark:text-gray-400 mb-8"
          variants={itemVariants}
        >
          The page you're looking for might have been moved, deleted, or never existed.
        </motion.p>
        
        <motion.div variants={itemVariants}>
          <Link to="/dashboard">
            <Button variant="default" className="bg-jaylink-600 hover:bg-jaylink-700">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
