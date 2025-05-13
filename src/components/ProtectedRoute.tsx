import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Simple mock protected route component that doesn't block anything
// since this is a mock implementation for now
const ProtectedRoute = () => {
  // We'll always allow access regardless of auth state for development
  return <Outlet />;
  
  /* The following would be the actual implementation for production:
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? 
    <Outlet /> : 
    <Navigate to="/" state={{ from: location }} replace />;
  */
};

export default ProtectedRoute;