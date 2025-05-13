import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const AdminRoute = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Check if admin token exists
        const adminToken = localStorage.getItem("adminToken");
        
        // In a real app, we would verify the token with a backend call
        // For this demo, we'll just check if the token exists
        setIsAdmin(!!adminToken);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        toast.error("Could not verify admin privileges.");
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-jaylink-600 dark:text-jaylink-400" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying admin access...</p>
      </div>
    );
  }

  // If not admin, redirect to login with the return URL
  return isAdmin ? <Outlet /> : <Navigate to="/jayadminlink/login" state={{ from: location }} replace />;
};

export default AdminRoute;