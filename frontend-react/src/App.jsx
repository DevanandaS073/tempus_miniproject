import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './modules/auth/LoginPage'
import AdminDashboard from './modules/admin/AdminDashboard'
import WorkerDashboard from './modules/worker/WorkerDashboard'
import CalendarPage from './modules/calendar/CalendarPage'
import PosterGenPage from './modules/poster/PosterGenPage'
import ProtectedRoute from './components/ProtectedRoute'
import FreeAgentPage from './modules/onboarding/FreeAgentPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/limbo" element={<FreeAgentPage />} />

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/dashboard" element={<AdminDashboard />} />
      </Route>

      {/* Worker routes */}
      <Route element={<ProtectedRoute allowedRoles={['user']} />}>
        <Route path="/worker-dashboard" element={<WorkerDashboard />} />
      </Route>

      {/* Shared routes (any authenticated user) */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'user']} />}>
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/poster-gen" element={<PosterGenPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
