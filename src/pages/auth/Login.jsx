import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { PsiconectaLogo } from '@/components/ui/Spinner'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(form)
      toast.success('¡Bienvenido/a de vuelta!')

      // El rol ya está en el store después de signIn → fetchProfile
      const role = useAuthStore.getState().role
      const destination = from ?? (
        role === 'therapist' ? '/therapist/dashboard' :
        role === 'admin'     ? '/admin/dashboard' :
        '/patient/dashboard'
      )
      navigate(destination, { replace: true })
    } catch (err) {
      toast.error(err.message ?? 'Error al iniciar sesión. Verifica tus datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-psiconecta flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-calm">
              <PsiconectaLogo size={36} color="white" />
            </div>
          <h1 className="font-serif text-3xl font-bold text-primary-800">
            Psico<span className="text-calm-500">necta</span>
          </h1>
          <p className="text-warm-500 mt-2 text-sm">Tu espacio de bienestar mental</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-float p-8 border border-warm-100">
          <h2 className="font-serif text-xl font-semibold text-warm-900 mb-1">Iniciar sesión</h2>
          <p className="text-sm text-warm-500 mb-6">Bienvenido/a de vuelta</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Correo electrónico"
              name="email"
              type="email"
              placeholder="tu@correo.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              prefix={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
            />

            <Input
              label="Contraseña"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              prefix={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-800 transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
              Iniciar sesión
            </Button>
          </form>

          {/* Separador */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-warm-100" />
            </div>
            <div className="relative flex justify-center text-xs text-warm-400 bg-white px-3">
              ¿No tienes cuenta?
            </div>
          </div>

          <Link to="/register">
            <Button variant="secondary" fullWidth>
              Crear cuenta nueva
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-warm-400 mt-6">
          Al continuar aceptas nuestros{' '}
          <span className="text-primary-500 cursor-pointer">Términos de uso</span>{' '}
          y{' '}
          <span className="text-primary-500 cursor-pointer">Política de privacidad</span>
        </p>

        <div className="text-center mt-4">
          <Link
            to="/admin/login"
            className="text-warm-300 hover:text-warm-500 text-xs transition-colors"
          >
            Acceso administrativo
          </Link>
        </div>
      </div>
    </div>
  )
}
