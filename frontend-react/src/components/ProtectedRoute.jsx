import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ProtectedRoute — Auth guard component
 * Props:
 *   allowedRoles: ['admin'] or ['user'] — which roles can access this route
 */
export default function ProtectedRoute({ allowedRoles }) {
    const { isAuthenticated, user } = useAuth()

    if (!isAuthenticated) {
        return <Navigate to="/" replace />
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        // Redirect to the correct dashboard for their role
        const target = user?.role === 'admin' ? '/dashboard' : '/worker-dashboard'
        return <Navigate to={target} replace />
    }

    return <Outlet />
}
