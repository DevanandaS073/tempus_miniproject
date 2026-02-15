import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import RoleSelection from './pages/RoleSelection';
import Login from './pages/Login';
/* 
   NOTE: In a real implementation, you would use lazy loading for dashboards 
   to improve performance.
*/
import AdminDashboard from './pages/AdminDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import { getRole, isAuthenticated } from './utils/auth';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
    const isAuth = isAuthenticated();
    const userRole = getRole();

    if (!isAuth) {
        return <Navigate to="/" replace />;
    }

    if (requiredRole && userRole !== requiredRole) {
        // Redirect to their appropriate dashboard if role mismatches
        /* 
           NOTE: Simplification. In real app, consider an "Unauthorized" page.
        */
        return userRole === 'ADMIN'
            ? <Navigate to="/admin-dashboard" replace />
            : <Navigate to="/worker-dashboard" replace />;
    }

    return children;
};

const App = () => {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<RoleSelection />} />
                <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route element={<Layout />}>
                    <Route
                        path="/admin-dashboard"
                        element={
                            <ProtectedRoute requiredRole="ADMIN">
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/worker-dashboard"
                        element={
                            <ProtectedRoute requiredRole="WORKER">
                                <WorkerDashboard />
                            </ProtectedRoute>
                        }
                    />
                </Route>
            </Routes>
        </Router>
    );
};

export default App;
