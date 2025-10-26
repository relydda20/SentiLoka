import { Navigate } from "react-router-dom";

// Check if user is authenticated
const useAuth = () => {
  const token = localStorage.getItem("authToken");
  return !!token;
};

const GuestRoute = ({ children }) => {
  const isAuthenticated = useAuth();

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, show the page (login/register)
  return children;
};

export default GuestRoute;
