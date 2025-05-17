import { useState, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Create an axios instance for admin API calls
const adminApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle authentication errors
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized (401) or forbidden (403), clear token
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
    }
    return Promise.reject(error);
  }
);

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
        
        // Verify admin token with backend using our adminApi instance
        const response = await adminApi.get(`/admin/auth/me`);
        
        if (response.data.success && response.data.data.admin.role === "admin") {
          setIsAdmin(true);
          
          // Update admin data in localStorage to ensure it's fresh
          localStorage.setItem("adminUser", JSON.stringify(response.data.data.admin));
        } else {
          setIsAdmin(false);
          toast.error("Could not verify admin privileges.");
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
        }
      } catch (error) {
        console.error("Admin verification error:", error);
        setIsAdmin(false);
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
      } finally {
        setIsLoading(false);
      }
    };
    
    verifyAdmin();
    
    // Add event listener for when the page becomes visible again
    // This helps catch cases where the token might have expired while the app was in the background
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        verifyAdmin();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup event listener
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [location.pathname]); // Re-verify when path changes
  
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

// Export the API instance for use in other admin components
export { adminApi };
export default AdminRoute;