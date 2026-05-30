import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

// Layout
import Layout from '@/components/layout/Layout'
import AdminLayout from '@/components/layout/AdminLayout'
import ProtectedRoute, { TherapistRoute, ClientRoute, AdminRoute } from '@/components/layout/ProtectedRoute'

// Admin
import AdminDashboard      from '@/pages/admin/AdminDashboard'
import AdminTherapists     from '@/pages/admin/AdminTherapists'
import AdminPatients       from '@/pages/admin/AdminPatients'
import AdminSessions       from '@/pages/admin/AdminSessions'
import AdminStats          from '@/pages/admin/AdminStats'
import AdminGroupSessions  from '@/pages/admin/AdminGroupSessions'

// Auth
import Login          from '@/pages/auth/Login'
import Register       from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword  from '@/pages/auth/ResetPassword'

// Terapeuta
import TherapistDashboard from '@/pages/therapist/TherapistDashboard'
import TherapistSchedule  from '@/pages/therapist/TherapistSchedule'
import PatientList        from '@/pages/therapist/PatientList'
import PatientDetail      from '@/pages/therapist/PatientDetail'
import TherapistProfile   from '@/pages/therapist/TherapistProfile'
import TestResultPage     from '@/pages/therapist/TestResultPage'

// Paciente
import PatientDashboard from '@/pages/patient/PatientDashboard'
import FindTherapist    from '@/pages/patient/FindTherapist'
import MyAppointments   from '@/pages/patient/MyAppointments'
import GroupSessions    from '@/pages/patient/GroupSessions'
import PatientProfile   from '@/pages/patient/PatientProfile'
import TherapistProfileView from '@/pages/patient/TherapistProfileView'

// Compartido
import ChatPage  from '@/pages/shared/ChatPage'
import VideoCall from '@/pages/shared/VideoCall'

// Tests psicométricos
import TakeTestPage              from '@/pages/patient/TakeTestPage'
import MyResultsPage             from '@/pages/patient/MyResultsPage'
import PatientResultDetailPage   from '@/pages/patient/PatientResultDetailPage'

// Pagos
import PaymentSuccess from '@/pages/payment/PaymentSuccess'
import PaymentCancel  from '@/pages/payment/PaymentCancel'

export default function App() {
  const { initialize, initialized } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [])

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: "'Open Sans', sans-serif",
            fontSize: '14px',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* Auth */}
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* Video call — fuera del layout (pantalla completa) */}
        <Route path="/video-call/:sessionId" element={
          <ProtectedRoute><VideoCall /></ProtectedRoute>
        } />

        {/* Test psicométrico — pantalla completa sin layout */}
        <Route path="/patient/tests/:assignmentId" element={
          <ProtectedRoute><TakeTestPage /></ProtectedRoute>
        } />

        {/* Pago — fuera del layout */}
        <Route path="/payment/success" element={
          <ProtectedRoute><PaymentSuccess /></ProtectedRoute>
        } />
        <Route path="/payment/cancel" element={
          <ProtectedRoute><PaymentCancel /></ProtectedRoute>
        } />

        {/* App con Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>

          {/* ── Terapeuta ── */}
          <Route path="/therapist/dashboard" element={
            <TherapistRoute><TherapistDashboard /></TherapistRoute>
          } />
          <Route path="/therapist/schedule" element={
            <TherapistRoute><TherapistSchedule /></TherapistRoute>
          } />
          <Route path="/therapist/patients" element={
            <TherapistRoute><PatientList /></TherapistRoute>
          } />
          <Route path="/therapist/patients/:patientId" element={
            <TherapistRoute><PatientDetail /></TherapistRoute>
          } />
          <Route path="/therapist/chat" element={
            <TherapistRoute><ChatPage /></TherapistRoute>
          } />
          <Route path="/therapist/profile" element={
            <TherapistRoute><TherapistProfile /></TherapistRoute>
          } />
          <Route path="/therapist/test-result/:sessionId" element={
            <TherapistRoute><TestResultPage /></TherapistRoute>
          } />

          {/* ── Paciente ── */}
          <Route path="/patient/dashboard" element={
            <ClientRoute><PatientDashboard /></ClientRoute>
          } />
          <Route path="/patient/find" element={
            <ClientRoute><FindTherapist /></ClientRoute>
          } />
          <Route path="/patient/therapist/:therapistId" element={
            <ClientRoute><TherapistProfileView /></ClientRoute>
          } />
          <Route path="/patient/appointments" element={
            <ClientRoute><MyAppointments /></ClientRoute>
          } />
          <Route path="/patient/groups" element={
            <ClientRoute><GroupSessions /></ClientRoute>
          } />
          <Route path="/patient/chat" element={
            <ClientRoute><ChatPage /></ClientRoute>
          } />
          <Route path="/patient/profile" element={
            <ClientRoute><PatientProfile /></ClientRoute>
          } />
          <Route path="/patient/my-results" element={
            <ClientRoute><MyResultsPage /></ClientRoute>
          } />
          <Route path="/patient/results/:sessionId" element={
            <ClientRoute><PatientResultDetailPage /></ClientRoute>
          } />

        </Route>

        {/* ── Admin ── */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"  element={<AdminDashboard />} />
          <Route path="therapists" element={<AdminTherapists />} />
          <Route path="patients"   element={<AdminPatients />} />
          <Route path="sessions"   element={<AdminSessions />} />
          <Route path="groups"     element={<AdminGroupSessions />} />
          <Route path="stats"      element={<AdminStats />} />
        </Route>

        {/* Redireccionamiento raíz */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
