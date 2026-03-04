import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function TenantRoute({ children }) {
    const { user, isInitializing } = useAuth();

    if (isInitializing) return null;

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (!user.company_id) {
        // Free agents cannot access tenant routes
        return <Navigate to="/limbo" replace />;
    }

    return children;
}
