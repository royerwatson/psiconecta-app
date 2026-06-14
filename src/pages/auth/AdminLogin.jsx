/**
 * AdminLogin.jsx — Login de administrador con 2FA TOTP.
 *
 * Flujo:
 *   1. Email + contraseña → Supabase Auth
 *   2. Verificar role = 'admin'
 *   3. Si MFA está enrollado → pedir código TOTP de 6 dígitos
 *   4. Si MFA no está enrollado → mostrar QR para configurar TOTP (primera vez)
 *   5. Verificar factor MFA → acceder al dashboard
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Lock, ShieldCheck, KeyRound, QrCode } from 'lucide-react'

// ── Pasos del login ───────────────────────────────────────────────────────────
const STEP = { CREDENTIALS: 'credentials', TOTP: 'totp', ENROLL: 'enroll' }

export default function AdminLogin() {
  const [step, setStep]         = useState(STEP.CREDENTIALS)
  const [form, setForm]         = useState({ email: '', password: '' })
  const [totpCode, setTotpCode] = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [mfaData, setMfaData]   = useState(null) // { factorId, qrCode, secret }
  const [mfaChallengeId, setMfaChallengeId] = useState(null)

  const { signIn } = useAuthStore()
  const navigate   = useNavigate()

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  // ── Paso 1: email + contraseña ────────────────────────────────────────────
  const handleCredentials = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(form)
      const role = useAuthStore.getState().role
      if (role !== 'admin') {
        await useAuthStore.getState().signOut()
        toast.error('Acceso denegado. Área exclusiva para administradores.')
        return
      }

      // Verificar si tiene MFA enrollado
      const { data: { factors }, error } = await supabase.auth.mfa.listFactors()
      if (error) throw error

      const totpFactor = factors?.find(f => f.factor_type === 'totp' && f.status === 'verified')

      if (totpFactor) {
        // MFA ya configurado → pedir código
        const { data: challenge, error: chalErr } = await supabase.auth.mfa.challenge({
          factorId: totpFactor.id,
        })
        if (chalErr) throw chalErr
        setMfaChallengeId(challenge.id)
        setMfaData({ factorId: totpFactor.id })
        setStep(STEP.TOTP)
      } else {
        // MFA no configurado → enrollar (primera vez)
        const { data: enrollData, error: enrollErr } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: 'Psiconecta Admin',
        })
        if (enrollErr) throw enrollErr
        setMfaData({
          factorId: enrollData.id,
          qrCode:   enrollData.totp.qr_code,
          secret:   enrollData.totp.secret,
        })
        setStep(STEP.ENROLL)
      }
    } catch (err) {
      toast.error(err.message ?? 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  // ── Paso 2 (enrollment): confirmar configuración TOTP ─────────────────────
  const handleEnrollConfirm = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: challenge } = await supabase.auth.mfa.challenge({
        factorId: mfaData.factorId,
      })
      const { error } = await supabase.auth.mfa.verify({
        factorId:    mfaData.factorId,
        challengeId: challenge.id,
        code:        totpCode.replace(/\s/g, ''),
      })
      if (error) throw new Error('Código incorrecto. Verifica tu app de autenticación.')
      toast.success('2FA configurado correctamente')
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message ?? 'Error verificando el código')
    } finally {
      setLoading(false)
    }
  }

  // ── Paso 2 (verificación): código TOTP ────────────────────────────────────
  const handleTotpVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId:    mfaData.factorId,
        challengeId: mfaChallengeId,
        code:        totpCode.replace(/\s/g, ''),
      })
      if (error) throw new Error('Código incorrecto o expirado.')
      toast.success('Bienvenido al panel de administración')
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message ?? 'Error verificando el código')
      setTotpCode('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-dvh flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}
    >
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-calm-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative animate-fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-800/60 border border-primary-700/50 mb-4 shadow-lg">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Psico<span className="text-calm-400">necta</span>
          </h1>
          <p className="text-primary-300 text-xs mt-1 tracking-widest uppercase">
            Panel de Administración
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">

          {/* ── PASO 1: Credenciales ── */}
          {step === STEP.CREDENTIALS && (
            <form onSubmit={handleCredentials} className="flex flex-col gap-4">
              <div>
                <h2 className="text-white font-semibold text-lg">Acceso restringido</h2>
                <p className="text-primary-300 text-xs mt-1">Solo personal autorizado de Psiconecta</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-primary-300 mb-1.5">Correo electrónico</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="admin@psiconecta.com" required autoComplete="email"
                  className="w-full border border-white/15 text-white placeholder-primary-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-400 transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <div>
                <label className="block text-xs font-medium text-primary-300 mb-1.5">Contraseña</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} name="password"
                    value={form.password} onChange={handleChange}
                    placeholder="••••••••" required autoComplete="current-password"
                    className="w-full border border-white/15 text-white placeholder-primary-500 rounded-xl px-4 pr-10 py-3 text-sm focus:outline-none focus:border-primary-400 transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-200">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPass
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                      }
                    </svg>
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="mt-2 w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verificando...</>
                  : <><KeyRound size={16} strokeWidth={2} />Continuar</>
                }
              </button>
            </form>
          )}

          {/* ── PASO 2a: Configurar TOTP por primera vez ── */}
          {step === STEP.ENROLL && (
            <form onSubmit={handleEnrollConfirm} className="flex flex-col gap-5">
              <div>
                <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                  <ShieldCheck size={18} className="text-calm-400" /> Configurar 2FA
                </h2>
                <p className="text-primary-300 text-xs mt-1">
                  El acceso de admin requiere autenticación de dos factores.
                </p>
              </div>

              {mfaData?.qrCode && (
                <div className="bg-white rounded-xl p-4 flex flex-col items-center gap-3">
                  <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                    <QrCode size={13} /> Escanea con Google Authenticator o Authy
                  </p>
                  <img src={mfaData.qrCode} alt="QR Code TOTP" className="w-40 h-40" />
                  {mfaData?.secret && (
                    <p className="text-[10px] text-gray-400 font-mono break-all text-center">
                      Clave manual: {mfaData.secret}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-primary-300 mb-1.5">
                  Código de verificación (6 dígitos)
                </label>
                <input type="text" value={totpCode} onChange={e => setTotpCode(e.target.value)}
                  placeholder="000000" maxLength={6} required inputMode="numeric"
                  className="w-full border border-white/15 text-white placeholder-primary-500 rounded-xl px-4 py-3 text-sm text-center tracking-[0.5em] focus:outline-none focus:border-primary-400 transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <button type="submit" disabled={loading || totpCode.length !== 6}
                className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verificando...</>
                  : <><ShieldCheck size={16} />Activar 2FA y entrar</>
                }
              </button>
            </form>
          )}

          {/* ── PASO 2b: Verificar TOTP ── */}
          {step === STEP.TOTP && (
            <form onSubmit={handleTotpVerify} className="flex flex-col gap-5">
              <div>
                <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                  <ShieldCheck size={18} className="text-calm-400" /> Verificación 2FA
                </h2>
                <p className="text-primary-300 text-xs mt-1">
                  Ingresa el código de 6 dígitos de tu app de autenticación.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <ShieldCheck size={32} strokeWidth={1.5} className="mx-auto text-calm-400 mb-2" />
                <p className="text-white text-sm font-medium">Autenticación de dos factores</p>
                <p className="text-primary-400 text-xs mt-1">Google Authenticator / Authy</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-primary-300 mb-1.5">
                  Código de 6 dígitos
                </label>
                <input type="text" value={totpCode} onChange={e => setTotpCode(e.target.value)}
                  placeholder="000000" maxLength={6} required inputMode="numeric" autoFocus
                  className="w-full border border-white/15 text-white placeholder-primary-500 rounded-xl px-4 py-3 text-sm text-center tracking-[0.5em] focus:outline-none focus:border-primary-400 transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <button type="submit" disabled={loading || totpCode.length !== 6}
                className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verificando...</>
                  : <><ShieldCheck size={16} />Verificar y entrar</>
                }
              </button>

              <button type="button" onClick={() => { setStep(STEP.CREDENTIALS); setTotpCode('') }}
                className="text-primary-400 hover:text-primary-200 text-xs text-center transition-colors">
                ← Volver al inicio de sesión
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-6 flex flex-col gap-2">
          <p className="text-primary-500 text-xs">
            <Lock size={11} className="inline mr-1" strokeWidth={2} />
            Acceso cifrado · 2FA requerido
          </p>
          <button onClick={() => navigate('/login')}
            className="text-primary-400 hover:text-primary-200 text-xs transition-colors underline underline-offset-2">
            ← Volver al acceso de pacientes / terapeutas
          </button>
        </div>
      </div>
    </div>
  )
}
