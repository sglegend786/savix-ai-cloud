import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// Requires login — redirects to /login if not logged in
export const ProtectedRoute = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// Admin only — redirects to / if not admin
export const AdminRoute = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
};
