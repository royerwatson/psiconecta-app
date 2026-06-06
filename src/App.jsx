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
import AdminAIAlerts       from '@/pages/admin/AdminAIAlerts'
import AdminFinancial      from '@/pages/admin/AdminFinancial'
import AdminPayouts        from '@/pages/admin/AdminPayouts'
import AdminRefunds        from '@/pages/admin/AdminRefunds'
import AdminSubscriptions  from '@/pages/admin/AdminSubscriptions'
import AdminActivityLog    from '@/pages/admin/AdminActivityLog'
import AdminReviews        from '@/pages/admin/AdminReviews'

// Auth
import Login          from '@/pages/auth/Login'
import Register       from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword  from '@/pages/auth/ResetPassword'
import AdminLogin     from '@/pages/auth/AdminLogin'
import AuthCallback   from '@/pages/auth/AuthCallback'

// Terapeuta
import TherapistDashboard  from '@/pages/therapist/TherapistDashboard'
import TherapistSchedule   from '@/pages/therapist/TherapistSchedule'
import PatientList         from '@/pages/therapist/PatientList'
import PatientDetail       from '@/pages/therapist/PatientDetail'
import TherapistProfile    from '@/pages/therapist/TherapistProfile'
import TestResultPage      from '@/pages/therapist/TestResultPage'
import TherapistTestsPage  from '@/pages/therapist/TherapistTestsPage'
import DSMReferencePage    from '@/pages/therapist/DSMReferencePage'
import CIE11ReferencePage  from '@/pages/therapist/CIE11ReferencePage'
import ClinicalScalesPage  from '@/pages/therapist/ClinicalScalesPage'
import SafetyPlanPage           from '@/pages/therapist/SafetyPlanPage'
import TherapeuticLibraryPage  from '@/pages/therapist/TherapeuticLibraryPage'
import PeerConsultationPage         from '@/pages/therapist/PeerConsultationPage'
import TherapeuticProtocolsPage    from '@/pages/therapist/TherapeuticProtocolsPage'

// Paciente
import PatientDashboard from '@/pages/patient/PatientDashboard'
import FindTherapist    from '@/pages/patient/FindTherapist'
import MyAppointments        from '@/pages/patient/MyAppointments'
import ConsentDocumentPage   from '@/pages/patient/ConsentDocumentPage'
import GroupSessions    from '@/pages/patient/GroupSessions'
import PatientProfile   from '@/pages/patient/PatientProfile'
import MyTasksPage     from '@/pages/patient/MyTasksPage'
import JournalPage          from '@/pages/patient/JournalPage'
import SessionHistoryPage   from '@/pages/patient/SessionHistoryPage'
import CrisisPage          from '@/pages/patient/CrisisPage'
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
import SubscriptionSuccess from '@/pages/payment/SubscriptionSuccess'

// Suscripciones y precios
import SubscriptionPage from '@/pages/therapist/SubscriptionPage'
import PricingPage         from '@/pages/public/PricingPage'
import LandingPage         from '@/pages/public/LandingPage'
import TherapistMatchPage  from '@/pages/patient/TherapistMatchPage'
import StatsPage        from '@/pages/therapist/StatsPage'
import ProGate         from '@/components/layout/ProGate'

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
        {/* Páginas públicas */}
        <Route path="/"                element={<LandingPage />} />
        <Route path="/pricing"         element={<PricingPage />} />
        <Route path="/auth/callback"   element={<AuthCallback />} />

        {/* Auth — pacientes y terapeutas */}
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* Auth — administradores (acceso exclusivo) */}
        <Route path="/admin/login"     element={<AdminLogin />} />

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
        {/* Sin ProtectedRoute: el componente maneja su propia auth para evitar
            redirección al login tras el full-page reload del retorno de PayPal */}
        <Route path="/payment/subscription-success" element={<SubscriptionSuccess />} />

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
          <Route path="/therapist/subscription" element={
            <TherapistRoute><SubscriptionPage /></TherapistRoute>
          } />
          {/* Rutas exclusivas plan Suscripción — ProGate bloquea a plan gratuito */}
          <Route path="/therapist/stats" element={
            <TherapistRoute><ProGate featureName="las estadísticas avanzadas"><StatsPage /></ProGate></TherapistRoute>
          } />
          <Route path="/therapist/tests" element={
            <TherapistRoute><ProGate featureName="los tests psicométricos"><TherapistTestsPage /></ProGate></TherapistRoute>
          } />
          <Route path="/therapist/test-result/:sessionId" element={
            <TherapistRoute><TestResultPage /></TherapistRoute>
          } />
          <Route path="/therapist/dsm" element={
            <TherapistRoute><ProGate featureName="el DSM-5-TR"><DSMReferencePage /></ProGate></TherapistRoute>
          } />
          <Route path="/therapist/cie" element={
            <TherapistRoute><ProGate featureName="el CIE-11"><CIE11ReferencePage /></ProGate></TherapistRoute>
          } />
          <Route path="/therapist/scales" element={
            <TherapistRoute><ProGate featureName="las escalas clínicas"><ClinicalScalesPage /></ProGate></TherapistRoute>
          } />
          <Route path="/therapist/safety-plan" element={
            <TherapistRoute><ProGate featureName="el plan de crisis"><SafetyPlanPage /></ProGate></TherapistRoute>
          } />
          <Route path="/therapist/library" element={
            <TherapistRoute><ProGate featureName="la biblioteca terapéutica"><TherapeuticLibraryPage /></ProGate></TherapistRoute>
          } />
          <Route path="/therapist/peers" element={
            <TherapistRoute><ProGate featureName="la consulta con colegas"><PeerConsultationPage /></ProGate></TherapistRoute>
          } />
          <Route path="/therapist/protocols" element={
            <TherapistRoute><ProGate featureName="los protocolos terapéuticos"><TherapeuticProtocolsPage /></ProGate></TherapistRoute>
          } />

          {/* ── Paciente ── */}
          <Route path="/patient/dashboard" element={
            <ClientRoute><PatientDashboard /></ClientRoute>
          } />
          <Route path="/patient/find" element={
            <ClientRoute><FindTherapist /></ClientRoute>
          } />
          <Route path="/patient/match" element={
            <ClientRoute><TherapistMatchPage /></ClientRoute>
          } />
          <Route path="/patient/therapist/:therapistId" element={
            <ClientRoute><TherapistProfileView /></ClientRoute>
          } />
          <Route path="/patient/appointments" element={
            <ClientRoute><MyAppointments /></ClientRoute>
          } />
          <Route path="/patient/consent/:signatureId" element={
            <ClientRoute><ConsentDocumentPage /></ClientRoute>
          } />
          <Route path="/patient/groups" element={
            <ClientRoute><GroupSessions /></ClientRoute>
          } />
          <Route path="/patient/tasks" element={
            <ClientRoute><MyTasksPage /></ClientRoute>
          } />
          <Route path="/patient/journal" element={
            <ClientRoute><JournalPage /></ClientRoute>
          } />
          <Route path="/patient/sessions" element={
            <ClientRoute><SessionHistoryPage /></ClientRoute>
          } />
          <Route path="/patient/crisis" element={
            <ClientRoute><CrisisPage /></ClientRoute>
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
          <Route path="ai-alerts"  element={<AdminAIAlerts />} />
          <Route path="therapists" element={<AdminTherapists />} />
          <Route path="patients"   element={<AdminPatients />} />
          <Route path="sessions"   element={<AdminSessions />} />
          <Route path="groups"     element={<AdminGroupSessions />} />
          <Route path="stats"      element={<AdminStats />} />
          <Route path="financial"      element={<AdminFinancial />} />
          <Route path="payouts"        element={<AdminPayouts />} />
          <Route path="refunds"        element={<AdminRefunds />} />
          <Route path="subscriptions"  element={<AdminSubscriptions />} />
          <Route path="activity"   element={<AdminActivityLog />} />
          <Route path="reviews"    element={<AdminReviews />} />
        </Route>

        {/* Redireccionamiento raíz */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
