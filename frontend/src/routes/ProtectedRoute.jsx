import { Navigate } from "react-router-dom";

// Simple auth check - replace with your actual auth logic
const useAuth = () => {
  // Check localStorage, context, or your auth state management
  const token = localStorage.getItem("authToken");
  return !!token;
};

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
