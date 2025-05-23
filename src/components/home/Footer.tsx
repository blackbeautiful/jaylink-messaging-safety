
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 pt-16 pb-8">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          <div>
            <Link to="/" className="inline-block mb-6">
              <span className="font-bold text-2xl text-jaylink-800 dark:text-white">
                Jay<span className="text-jaylink-600">Link</span>
              </span>
            </Link>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Secure, reliable messaging solutions for businesses of all sizes.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-jaylink-600 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-jaylink-600 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-jaylink-600 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-jaylink-600 transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-6 text-gray-900 dark:text-white">
              Quick Links
            </h3>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-jaylink-600 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/#features" className="text-gray-600 dark:text-gray-300 hover:text-jaylink-600 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/#pricing" className="text-gray-600 dark:text-gray-300 hover:text-jaylink-600 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-jaylink-600 transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-600 dark:text-gray-300 hover:text-jaylink-600 transition-colors">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-6 text-gray-900 dark:text-white">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-jaylink-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-300">
                  123 Business Avenue, Lagos, Nigeria
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-jaylink-600 mr-3 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-300">
                  +234 800 123 4567
                </span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-jaylink-600 mr-3 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-300">
                  support@jaylinksms.com
                </span>
              </li>
            </ul>
          </div>
          
          <div id="contact">
            <h3 className="font-semibold text-lg mb-6 text-gray-900 dark:text-white">
              Subscribe to Our Newsletter
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Stay updated with our latest features and announcements.
            </p>
            <form className="space-y-3">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-white dark:bg-gray-800 border-gray-200"
              />
              <Button className="w-full bg-jaylink-600 hover:bg-jaylink-700">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 md:mb-0">
              © {currentYear} JayLink SMS. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link to="#" className="text-gray-500 dark:text-gray-400 text-sm hover:text-jaylink-600 transition-colors">
                Privacy Policy
              </Link>
              <Link to="#" className="text-gray-500 dark:text-gray-400 text-sm hover:text-jaylink-600 transition-colors">
                Terms of Service
              </Link>
              <Link to="#" className="text-gray-500 dark:text-gray-400 text-sm hover:text-jaylink-600 transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
