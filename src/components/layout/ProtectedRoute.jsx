import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { LoadingScreen } from '@/components/ui/Spinner'

// Ruta protegida genérica — solo usuarios autenticados
export default function ProtectedRoute({ children }) {
  const { user, initialized } = useAuthStore()
  const location = useLocation()

  if (!initialized) return <LoadingScreen />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

// Ruta solo para terapeutas
export function TherapistRoute({ children }) {
  const { user, role, initialized } = useAuthStore()
  const location = useLocation()

  if (!initialized) return <LoadingScreen />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (role !== 'therapist') return <Navigate to="/patient/dashboard" replace />
  return children
}

// Ruta solo para pacientes
export function ClientRoute({ children }) {
  const { user, role, initialized } = useAuthStore()
  const location = useLocation()

  if (!initialized) return <LoadingScreen />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (role !== 'client') return <Navigate to="/therapist/dashboard" replace />
  return children
}

// Ruta solo para administradores
export function AdminRoute({ children }) {
  const { user, role, initialized } = useAuthStore()
  const location = useLocation()

  if (!initialized) return <LoadingScreen />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (role !== 'admin') return <Navigate to="/login" replace />
  return children
}
