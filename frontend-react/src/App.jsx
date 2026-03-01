import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './modules/auth/LoginPage'
import DashboardRouter from './components/DashboardRouter'
import CalendarPage from './modules/calendar/CalendarPage'
import PosterGenPage from './modules/poster/PosterGenPage'
import FreeAgentPage from './modules/onboarding/FreeAgentPage'
import NetworkPage from './modules/network/NetworkPage'
import AppLayout from './components/AppLayout'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/limbo" element={<FreeAgentPage />} />

      {/* Layout Routes (Automatically protects against unauthenticated + no company_id) */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/poster-gen" element={<PosterGenPage />} />
        <Route path="/network" element={<NetworkPage />} />
        <Route path="/reports" element={<div className="flex items-center justify-center p-20"><h1 className="text-zinc-600 font-mono text-xl tracking-widest uppercase">Analytics Engine (Coming Soon)</h1></div>} />
        <Route path="/settings" element={<div className="flex items-center justify-center p-20"><h1 className="text-zinc-600 font-mono text-xl tracking-widest uppercase">Global Settings (Coming Soon)</h1></div>} />
        {/* We'll add WorkerDashboard switching logic here later */}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
