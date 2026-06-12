/**
 * AppEntry — punto de entrada de la PWA/app instalada (start_url: /app).
 * Redirige directo al dashboard según el rol si hay sesión persistida;
 * si no, al login. Así el terapeuta abre el ícono y cae en su agenda
 * sin pasar por la landing ni el login.
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { LoadingScreen } from '@/components/ui/Spinner'

const HOME_BY_ROLE = {
  therapist: '/therapist/dashboard',
  client:    '/patient/dashboard',
  admin:     '/admin/dashboard',
}

export default function AppEntry() {
  const { role, initialized, loading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!initialized || loading) return
    navigate(HOME_BY_ROLE[role] ?? '/login', { replace: true })
  }, [initialized, loading, role, navigate])

  return <LoadingScreen />
}
