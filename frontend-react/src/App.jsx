import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './modules/auth/LoginPage'
import DashboardRouter from './components/DashboardRouter'
import CalendarPage from './modules/calendar/CalendarPage'
import PosterGenPage from './modules/poster/PosterGenPage'
import FreeAgentPage from './modules/onboarding/FreeAgentPage'
import NetworkPage from './modules/network/NetworkPage'
import OperationsPage from './modules/operations/OperationsPage'
import CertificateDashboard from './modules/operations/certificates/CertificateDashboard'
import ReportsPage from './modules/reports/ReportsPage'
import SettingsPage from './modules/settings/SettingsPage'
import RoleList from './modules/settings/RoleList'
import RoleBuilder from './modules/settings/RoleBuilder'
import AppLayout from './components/AppLayout'
import TenantRoute from './components/guards/TenantRoute'
import FeatureRoute from './components/guards/FeatureRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/limbo" element={<FreeAgentPage />} />

      {/* Layout Routes (Automatically protects against unauthenticated + no company_id) */}
      <Route element={<AppLayout />}>
        {/* Foundation routes: Anyone in a company can access their dashboard */}
        <Route path="/dashboard" element={
          <TenantRoute><DashboardRouter /></TenantRoute>
        } />

        <Route path="/calendar" element={
          <FeatureRoute requiredFeature="calendar:view"><CalendarPage /></FeatureRoute>
        } />

        {/* Specialized routes: Requires specific feature flags */}
        <Route path="/network" element={
          <FeatureRoute requiredFeature="network:view"><NetworkPage /></FeatureRoute>
        } />

        <Route path="/operations" element={
          <FeatureRoute requiredFeature="event:view"><OperationsPage /></FeatureRoute>
        } />

        <Route path="/operations/certificates" element={
          <FeatureRoute requiredFeature="event:generate_certificates"><CertificateDashboard /></FeatureRoute>
        } />

        <Route path="/reports" element={
          <FeatureRoute requiredFeature="reports:personal">
            <ReportsPage />
          </FeatureRoute>
        } />

        {/* ─── Settings & Role Management ──────────────────────────────── */}
        <Route path="/settings" element={
          <TenantRoute>
            <SettingsPage />
          </TenantRoute>
        } />

        <Route path="/settings/roles" element={
          <FeatureRoute requiredFeature="role:create"><RoleList /></FeatureRoute>
        } />

        <Route path="/settings/roles/new" element={
          <FeatureRoute requiredFeature="role:create"><RoleBuilder /></FeatureRoute>
        } />

        <Route path="/settings/roles/edit/:id" element={
          <FeatureRoute requiredFeature="role:edit"><RoleBuilder /></FeatureRoute>
        } />

        <Route path="/poster-gen" element={<PosterGenPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
