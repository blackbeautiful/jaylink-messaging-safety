import { useState, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const AdminRoute = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        
        if (!token) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
        
        // Verify admin token with backend
        const response = await axios.get(`${API_URL}/admin/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.data.success && response.data.data.admin.role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          toast.error("Could not verify admin privileges.");
          localStorage.removeItem("adminToken");
        }
      } catch (error) {
        console.error("Admin verification error:", error);
        setIsAdmin(false);
        localStorage.removeItem("adminToken");
      } finally {
        setIsLoading(false);
      }
    };
    
    verifyAdmin();
  }, []);
  
  // Show loading while checking admin status
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <Loader2 className="h-8 w-8 animate-spin text-jaylink-600 dark:text-jaylink-400" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying admin access...</p>
      </div>
    );
  }
  
  // If not admin, redirect to admin login
  if (!isAdmin) {
    return <Navigate to="/jayadminlink/login" state={{ from: location }} replace />;
  }
  
  // If admin, render child routes
  return <Outlet />;
};

export default AdminRoute;