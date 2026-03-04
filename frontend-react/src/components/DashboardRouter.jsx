import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../modules/admin/AdminDashboard';
import WorkerDashboard from '../modules/worker/WorkerDashboard';

export default function DashboardRouter() {
    const { user, isInitializing } = useAuth();

    if (isInitializing) return null; // Handled by AppLayout

    // Safety check just in case
    if (!user) return <Navigate to="/" replace />;
    if (!user.company_id) return <Navigate to="/limbo" replace />;

    // Read the role string, default to worker if undefined
    const roleName = user?.role?.toLowerCase() || 'worker';

    if (roleName === 'admin') {
        return <AdminDashboard />;
    } else {
        return <WorkerDashboard />;
    }
}