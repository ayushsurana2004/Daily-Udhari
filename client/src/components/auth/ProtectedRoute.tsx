import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('token_expiry');
    const isExpired = tokenExpiry ? Date.now() > parseInt(tokenExpiry, 10) : false;

    if (isExpired && token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('token_expiry');
    }

    const isAuthenticated = !!token && !isExpired;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
