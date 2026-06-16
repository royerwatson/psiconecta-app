/**
 * AuthCallback — Maneja el redirect de OAuth (Google, Apple, Facebook).
 * Supabase redirige aquí con el token en la URL.
 * Detecta si es usuario nuevo (sin role) y lo redirige al registro de rol.
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { LoadingScreen } from '@/components/ui/Spinner'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { fetchProfile } = useAuthStore()

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase lee el token de la URL automáticamente
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        navigate('/login')
        return
      }

      // Verificar si el usuario ya tiene un perfil con role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single()

      // Actualizar el store con la sesión OAuth (no hay onAuthStateChange)
      await fetchProfile(session.user)

      const lsRedirect = localStorage.getItem('psiconecta_auth_redirect')
      if (lsRedirect) localStorage.removeItem('psiconecta_auth_redirect')

      if (!profile?.role) {
        navigate('/register?social=true')
      } else if (profile.role === 'therapist') {
        navigate('/therapist/dashboard')
      } else if (profile.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate(lsRedirect ?? '/patient/dashboard')
      }
    }

    handleCallback()
  }, [])

  return <LoadingScreen message="Completando inicio de sesión..." />
}
