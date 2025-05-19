import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Protected route component that redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ user, children }) => {
  const location = useLocation();
  
  if (!user) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  return children;
};

export default ProtectedRoute;
