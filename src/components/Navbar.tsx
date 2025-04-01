
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMobileMenuOpen(false);
  }, [location]);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Features", path: "/#features" },
    { name: "Pricing", path: "/#pricing" },
    { name: "Contact", path: "/#contact" },
  ];

  const navbarVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, x: "100%" },
    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { opacity: 0, x: "100%", transition: { duration: 0.2 } },
  };

  return (
    <>
      <motion.header
        initial="initial"
        animate="animate"
        variants={navbarVariants}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 md:px-6 py-4",
          isScrolled
            ? "bg-white/80 backdrop-blur-md shadow-subtle dark:bg-gray-900/80"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-2xl text-jaylink-800">
              Jay<span className="text-jaylink-600">Link</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-jaylink-600",
                  isActive(item.path)
                    ? "text-jaylink-600"
                    : "text-gray-600 dark:text-gray-300"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Link to="/">
              <Button variant="outline" className="border-jaylink-200 text-jaylink-700 hover:bg-jaylink-50">
                Log in
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-jaylink-600 hover:bg-jaylink-700">
                Sign up
              </Button>
            </Link>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={mobileMenuVariants}
            className="fixed inset-0 z-40 md:hidden bg-white dark:bg-gray-900 pt-20"
          >
            <div className="flex flex-col p-6 space-y-6">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "text-lg font-medium transition-colors",
                    isActive(item.path)
                      ? "text-jaylink-600"
                      : "text-gray-600 dark:text-gray-300"
                  )}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-6 space-y-4">
                <Link to="/" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full border-jaylink-200 text-jaylink-700 hover:bg-jaylink-50"
                  >
                    Log in
                  </Button>
                </Link>
                <Link to="/register" className="block">
                  <Button className="w-full bg-jaylink-600 hover:bg-jaylink-700">
                    Sign up
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
