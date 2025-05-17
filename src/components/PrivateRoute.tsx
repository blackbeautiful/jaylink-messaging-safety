import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const PrivateRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  
  // Use an effect to check token validity on component mount and route changes
  useEffect(() => {
    // You can add additional validation logic here if needed
    // For example, check if the token is expired and force logout
  }, [location.pathname]);
  
  // Show loading state while checking authentication
  if (loading) {
    // return (
    //   <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    //     <Loader2 className="h-8 w-8 animate-spin text-jaylink-600 dark:text-jaylink-400" />
    //     <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying authentication...</p>
    //   </div>
    // );
  }
  
  // If not authenticated, redirect to login with the current location for redirect after login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // If authenticated, render child routes
  return <Outlet />;
};

export default PrivateRoute;