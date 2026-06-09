import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { usePageTracking } from '@/hooks/usePageTracking'
import { LoadingScreen } from '@/components/ui/Spinner'

// Layout y guards — siempre presentes, carga estática
import Layout        from '@/components/layout/Layout'
import AdminLayout   from '@/components/layout/AdminLayout'
import ProtectedRoute, { TherapistRoute, ClientRoute, AdminRoute } from '@/components/layout/ProtectedRoute'
import ProGate       from '@/components/layout/ProGate'

// ── Lazy: cada página carga solo cuando el usuario navega a ella ──────────

// Admin
const AdminDashboard     = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminTherapists    = lazy(() => import('@/pages/admin/AdminTherapists'))
const AdminPatients      = lazy(() => import('@/pages/admin/AdminPatients'))
const AdminSessions      = lazy(() => import('@/pages/admin/AdminSessions'))
const AdminStats         = lazy(() => import('@/pages/admin/AdminStats'))
const AdminGroupSessions = lazy(() => import('@/pages/admin/AdminGroupSessions'))
const AdminAIAlerts      = lazy(() => import('@/pages/admin/AdminAIAlerts'))
const AdminFinancial     = lazy(() => import('@/pages/admin/AdminFinancial'))
const AdminPayouts       = lazy(() => import('@/pages/admin/AdminPayouts'))
const AdminRefunds       = lazy(() => import('@/pages/admin/AdminRefunds'))
const AdminSubscriptions = lazy(() => import('@/pages/admin/AdminSubscriptions'))
const AdminActivityLog   = lazy(() => import('@/pages/admin/AdminActivityLog'))
const AdminReviews       = lazy(() => import('@/pages/admin/AdminReviews'))

// Auth
const Login          = lazy(() => import('@/pages/auth/Login'))
const Register       = lazy(() => import('@/pages/auth/Register'))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'))
const ResetPassword  = lazy(() => import('@/pages/auth/ResetPassword'))
const AdminLogin     = lazy(() => import('@/pages/auth/AdminLogin'))
const AuthCallback   = lazy(() => import('@/pages/auth/AuthCallback'))

// Terapeuta
const TherapistDashboard       = lazy(() => import('@/pages/therapist/TherapistDashboard'))
const TherapistSchedule        = lazy(() => import('@/pages/therapist/TherapistSchedule'))
const PatientList              = lazy(() => import('@/pages/therapist/PatientList'))
const PatientDetail            = lazy(() => import('@/pages/therapist/PatientDetail'))
const TherapistProfile         = lazy(() => import('@/pages/therapist/TherapistProfile'))
const TestResultPage           = lazy(() => import('@/pages/therapist/TestResultPage'))
const TherapistTestsPage       = lazy(() => import('@/pages/therapist/TherapistTestsPage'))
const DSMReferencePage         = lazy(() => import('@/pages/therapist/DSMReferencePage'))
const CIE11ReferencePage       = lazy(() => import('@/pages/therapist/CIE11ReferencePage'))
const ClinicalScalesPage       = lazy(() => import('@/pages/therapist/ClinicalScalesPage'))
const SafetyPlanPage           = lazy(() => import('@/pages/therapist/SafetyPlanPage'))
const TherapeuticLibraryPage   = lazy(() => import('@/pages/therapist/TherapeuticLibraryPage'))
const PeerConsultationPage     = lazy(() => import('@/pages/therapist/PeerConsultationPage'))
const TherapeuticProtocolsPage = lazy(() => import('@/pages/therapist/TherapeuticProtocolsPage'))
const StatsPage                = lazy(() => import('@/pages/therapist/StatsPage'))
const SubscriptionPage         = lazy(() => import('@/pages/therapist/SubscriptionPage'))

// Paciente
const PatientDashboard       = lazy(() => import('@/pages/patient/PatientDashboard'))
const FindTherapist          = lazy(() => import('@/pages/patient/FindTherapist'))
const TherapistMatchPage     = lazy(() => import('@/pages/patient/TherapistMatchPage'))
const TherapistProfileView   = lazy(() => import('@/pages/patient/TherapistProfileView'))
const MyAppointments         = lazy(() => import('@/pages/patient/MyAppointments'))
const ConsentDocumentPage    = lazy(() => import('@/pages/patient/ConsentDocumentPage'))
const GroupSessions          = lazy(() => import('@/pages/patient/GroupSessions'))
const PatientProfile         = lazy(() => import('@/pages/patient/PatientProfile'))
const MyTasksPage            = lazy(() => import('@/pages/patient/MyTasksPage'))
const JournalPage            = lazy(() => import('@/pages/patient/JournalPage'))
const SessionHistoryPage     = lazy(() => import('@/pages/patient/SessionHistoryPage'))
const CrisisPage             = lazy(() => import('@/pages/patient/CrisisPage'))
const TakeTestPage           = lazy(() => import('@/pages/patient/TakeTestPage'))
const MyResultsPage          = lazy(() => import('@/pages/patient/MyResultsPage'))
const PatientResultDetailPage = lazy(() => import('@/pages/patient/PatientResultDetailPage'))

// Compartido
const ChatPage  = lazy(() => import('@/pages/shared/ChatPage'))
const VideoCall = lazy(() => import('@/pages/shared/VideoCall'))

// Pagos
const PaymentSuccess      = lazy(() => import('@/pages/payment/PaymentSuccess'))
const PaymentCancel       = lazy(() => import('@/pages/payment/PaymentCancel'))
const SubscriptionSuccess = lazy(() => import('@/pages/payment/SubscriptionSuccess'))

// Público
const LandingPage            = lazy(() => import('@/pages/public/LandingPage'))
const PricingPage            = lazy(() => import('@/pages/public/PricingPage'))
const TherapistDirectoryPage = lazy(() => import('@/pages/public/TherapistDirectoryPage'))
const BlogListPage           = lazy(() => import('@/pages/public/BlogListPage'))
const BlogPostPage           = lazy(() => import('@/pages/public/BlogPostPage'))
const TermsPage              = lazy(() => import('@/pages/public/TermsPage'))
const PrivacyPage            = lazy(() => import('@/pages/public/PrivacyPage'))
const RefundPage             = lazy(() => import('@/pages/public/RefundPage'))
const NotFoundPage           = lazy(() => import('@/pages/public/NotFoundPage'))

// ── Fallback de carga ─────────────────────────────────────────────────────
function PageLoader() {
  return <LoadingScreen message="" />
}

/* Componente interno — necesita estar dentro de BrowserRouter para usar useLocation */
function AppRoutes() {
  usePageTracking()
  return null
}

export default function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [])

  return (
    <BrowserRouter>
      <AppRoutes />
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

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Páginas públicas */}
          <Route path="/"                element={<LandingPage />} />
          <Route path="/terapeutas"      element={<TherapistDirectoryPage />} />
          <Route path="/blog"            element={<BlogListPage />} />
          <Route path="/blog/:slug"      element={<BlogPostPage />} />
          <Route path="/terminos"        element={<TermsPage />} />
          <Route path="/privacidad"      element={<PrivacyPage />} />
          <Route path="/reembolsos"      element={<RefundPage />} />
          <Route path="/pricing"         element={<PricingPage />} />
          <Route path="/auth/callback"   element={<AuthCallback />} />

          {/* Auth — pacientes y terapeutas */}
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />

          {/* Auth — administradores */}
          <Route path="/admin/login"     element={<AdminLogin />} />

          {/* Video call — pantalla completa */}
          <Route path="/video-call/:sessionId" element={
            <ProtectedRoute><VideoCall /></ProtectedRoute>
          } />

          {/* Test psicométrico — pantalla completa */}
          <Route path="/patient/tests/:assignmentId" element={
            <ProtectedRoute><TakeTestPage /></ProtectedRoute>
          } />

          {/* Pago */}
          <Route path="/payment/success" element={
            <ProtectedRoute><PaymentSuccess /></ProtectedRoute>
          } />
          <Route path="/payment/cancel" element={
            <ProtectedRoute><PaymentCancel /></ProtectedRoute>
          } />
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
            <Route path="dashboard"     element={<AdminDashboard />} />
            <Route path="ai-alerts"     element={<AdminAIAlerts />} />
            <Route path="therapists"    element={<AdminTherapists />} />
            <Route path="patients"      element={<AdminPatients />} />
            <Route path="sessions"      element={<AdminSessions />} />
            <Route path="groups"        element={<AdminGroupSessions />} />
            <Route path="stats"         element={<AdminStats />} />
            <Route path="financial"     element={<AdminFinancial />} />
            <Route path="payouts"       element={<AdminPayouts />} />
            <Route path="refunds"       element={<AdminRefunds />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="activity"      element={<AdminActivityLog />} />
            <Route path="reviews"       element={<AdminReviews />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
