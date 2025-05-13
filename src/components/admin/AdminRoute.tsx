
import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";

const AdminRoute = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

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
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Could not verify admin privileges.",
        });
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading admin verification...</div>;
  }

  return isAdmin ? <Outlet /> : <Navigate to="/jayadminlink/login" />;
};

export default AdminRoute;
