import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function FeatureRoute({ requiredFeature, children }) {
    const { user, isInitializing, hasFeature } = useAuth();

    if (isInitializing) return null;

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (!hasFeature(requiredFeature)) {
        // User does not have clearance for this specific route component
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
