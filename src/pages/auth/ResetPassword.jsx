import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [ready, setReady]         = useState(false)
  const navigate = useNavigate()

  // Supabase redirige con tokens en el hash — los procesa automáticamente
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Las contraseñas no coinciden'); return }
    if (password.length < 6)  { toast.error('La contraseña debe tener al menos 6 caracteres'); return }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('¡Contraseña actualizada exitosamente!')
      navigate('/login')
    } catch (err) {
      toast.error(err.message ?? 'Error al actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-psiconecta flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🧠</div>
          <h1 className="font-serif text-3xl font-bold text-primary-800">
            Psico<span className="text-calm-500">necta</span>
          </h1>
        </div>

        <div className="bg-white rounded-3xl shadow-float p-8 border border-warm-100">
          {!ready ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3 animate-pulse">⏳</div>
              <p className="text-warm-500 text-sm">Verificando enlace de recuperación...</p>
            </div>
          ) : (
            <>
              <h2 className="font-serif text-xl font-semibold text-warm-900 mb-1">Nueva contraseña</h2>
              <p className="text-sm text-warm-500 mb-6">Ingresa tu nueva contraseña.</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="Nueva contraseña"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  prefix={
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />
                <Input
                  label="Confirmar contraseña"
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  prefix={
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />
                <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
                  Actualizar contraseña
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
