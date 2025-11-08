import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Register from "../pages/Register";
import SentimentMap from "../pages/dashboard/SentimentMap";
import AIReplyGenerator from "../pages/dashboard/AIReplyGenerator";
import ProtectedRoute from "./ProtectedRoute";
import GuestRoute from "./GuestRoute";
import DashboardLayout from "../pages/dashboard/DashboardLayout";
import Dashboard from "../pages/dashboard/Dashboard";
import Profile from "../pages/dashboard/Profile";
import CaseStudies from "../pages/CaseStudies";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />

      {/* Guest Only Routes (redirects to dashboard if authenticated) */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />

      <Route path="/case-studies" element={<CaseStudies />} /> 

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="sentiment-map" element={<SentimentMap />} />
        <Route path="ai-reply" element={<AIReplyGenerator />} />
        <Route path="profile/:slug" element={<Profile />} />
      </Route>

      {/* Catch all - redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
