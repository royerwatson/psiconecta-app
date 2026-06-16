/**
 * Register.jsx — Formulario de registro multi-paso.
 *
 * Pasos:
 *   1. Selección de rol (paciente / terapeuta)
 *   2. Datos personales (nombre, email, contraseña)
 *   3. Información de contacto (ciudad, país, teléfono, contacto de emergencia*)
 *      * contacto de emergencia solo para pacientes
 *   4. Datos profesionales (solo terapeuta: especialidad, cédula)
 *   5. Método de pago PayPal (opcional, puede completarse luego)
 *   6. Términos y condiciones + Política de privacidad
 */
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input, { Select } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  User, Stethoscope, ChevronRight, FileCheck,
  MapPin, Phone, Shield, CreditCard, CheckSquare,
  AlertCircle, ExternalLink, Check,
} from 'lucide-react'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import SocialLoginButtons from '@/components/auth/SocialLoginButtons'

// ─── Constantes ───────────────────────────────────────────────────────────────

const SPECIALTIES = [
  'Psicología clínica', 'Psicología cognitivo-conductual', 'Psicoanálisis',
  'Terapia familiar y de pareja', 'Psicología infantil', 'Neuropsicología',
  'Psicología del deporte', 'Psicología organizacional', 'Otra',
]

// ─── Sanitización ────────────────────────────────────────────────────────────
function sanitize(str) {
  return str.replace(/<[^>]*>/g, '').replace(/[<>"'`]/g, '').trim()
}

// ─── Fortaleza de contraseña ──────────────────────────────────────────────────
function getPasswordStrength(pwd) {
  if (!pwd) return null
  const passed = [
    pwd.length >= 8,
    /[A-Z]/.test(pwd),
    /[0-9]/.test(pwd),
    /[^A-Za-z0-9]/.test(pwd),
  ].filter(Boolean).length
  if (passed <= 1) return { label: 'Débil',   color: 'bg-red-400',    text: 'text-red-600',    width: 'w-1/4' }
  if (passed === 2) return { label: 'Regular', color: 'bg-amber-400',  text: 'text-amber-600',  width: 'w-2/4' }
  if (passed === 3) return { label: 'Buena',   color: 'bg-yellow-400', text: 'text-yellow-600', width: 'w-3/4' }
  return               { label: 'Fuerte',  color: 'bg-green-500',  text: 'text-green-600',  width: 'w-full' }
}

const GENDERS = [
  { value: 'male',              label: 'Masculino' },
  { value: 'female',            label: 'Femenino' },
  { value: 'non_binary',        label: 'No binario' },
  { value: 'prefer_not_to_say', label: 'Prefiero no decir' },
]

const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
  { value: 'fr', label: 'Francés' },
  { value: 'pt', label: 'Portugués' },
  { value: 'de', label: 'Alemán' },
  { value: 'it', label: 'Italiano' },
  { value: 'ar', label: 'Árabe' },
  { value: 'other', label: 'Otro' },
]

const COUNTRIES = [
  { code: 'DO', name: 'República Dominicana' },
  { code: 'MX', name: 'México' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Perú' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'CU', name: 'Cuba' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'HN', name: 'Honduras' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'PA', name: 'Panamá' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'ES', name: 'España' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'OTHER', name: 'Otro' },
]

// ─── Utilidades ───────────────────────────────────────────────────────────────

function getSteps(role) {
  const base = [1, 2, 3] // rol, datos personales, contacto
  if (role === 'therapist') return [...base, 4, 5, 6] // + profesional, pago, T&C
  return [...base, 4, 5]                               // + pago, T&C
}

function stepLabel(s, role) {
  const labels = {
    1: 'Rol',
    2: 'Datos',
    3: 'Contacto',
    4: role === 'therapist' ? 'Profesional' : 'Pago',
    5: role === 'therapist' ? 'Pago' : 'Términos',
    6: 'Términos',
  }
  return labels[s] ?? s
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function RoleCard({ Icon, title, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-center gap-4 p-4 rounded-2xl border-2 border-warm-100 hover:border-primary-300 hover:bg-primary-50 transition-all group"
    >
      <div className="w-12 h-12 flex items-center justify-center bg-primary-50 rounded-xl group-hover:bg-primary-100 transition-colors text-primary-600">
        <Icon size={24} strokeWidth={1.8} />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-warm-900">{title}</p>
        <p className="text-sm text-warm-500">{desc}</p>
      </div>
      <ChevronRight size={18} className="text-warm-300 group-hover:text-primary-400 transition-colors" />
    </button>
  )
}

function StepDots({ steps, current }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1.5">
          <div className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all',
            s < current  ? 'bg-primary-500 text-white'
            : s === current ? 'bg-primary-600 text-white ring-2 ring-primary-200 ring-offset-1'
            : 'bg-warm-200 text-warm-400',
          )}>
            {s < current ? <Check size={12} strokeWidth={2.5} /> : s}
          </div>
          {i < steps.length - 1 && (
            <div className={cn('w-6 h-0.5 rounded-full transition-all', s < current ? 'bg-primary-400' : 'bg-warm-200')} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── PayPal Step ─────────────────────────────────────────────────────────────

function PaymentStep({ onNext, onBack, paypalLinked, setPaypalLinked }) {
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID
  const containerRef = useRef(null)
  const [sdkReady, setSdkReady] = useState(false)
  const [processing, setProcessing] = useState(false)
  const rendered = useRef(false)

  useEffect(() => {
    if (window.paypal) { setSdkReady(true); return }
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&vault=true&intent=tokenize`
    script.async = true
    script.onload = () => setSdkReady(true)
    script.onerror = () => setSdkReady(false)
    document.body.appendChild(script)
    return () => { rendered.current = false }
  }, [clientId])

  useEffect(() => {
    if (!sdkReady || !containerRef.current || rendered.current || paypalLinked) return
    rendered.current = true
    if (!window.paypal?.Buttons) return

    window.paypal.Buttons({
      style: { layout: 'horizontal', color: 'blue', shape: 'pill', label: 'paypal', height: 44 },
      createOrder: async () => {
        // Orden mínima de $0.01 solo para vincular la cuenta PayPal
        // En producción usar Vault/Billing Agreements
        return null
      },
      onApprove: async (data) => {
        setProcessing(true)
        setPaypalLinked(true)
        toast.success('Cuenta PayPal vinculada correctamente')
        setProcessing(false)
      },
      onError: () => {},
    }).render(containerRef.current).catch(() => {})
  }, [sdkReady, paypalLinked])

  return (
    <div className="animate-fade-in flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-warm-900 mb-1">Método de pago</h2>
        <p className="text-sm text-warm-500">
          Vincula tu cuenta PayPal o tarjeta para agilizar tus pagos. Puedes hacerlo ahora o más tarde.
        </p>
      </div>

      {paypalLinked ? (
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <Check size={20} strokeWidth={2} className="text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-primary-800 text-sm">PayPal vinculado</p>
            <p className="text-xs text-primary-600 mt-0.5">Tu método de pago está listo</p>
          </div>
        </div>
      ) : (
        <>
          {/* PayPal Button */}
          <div className="bg-white border border-warm-100 rounded-2xl p-5">
            <p className="text-xs font-medium text-warm-600 mb-3 flex items-center gap-1.5">
              <CreditCard size={13} strokeWidth={1.8} /> Vincular cuenta PayPal
            </p>
            {!sdkReady && (
              <div className="h-11 rounded-full bg-warm-100 animate-pulse flex items-center justify-center">
                <span className="text-xs text-warm-400">Cargando PayPal...</span>
              </div>
            )}
            <div ref={containerRef} className={sdkReady ? 'block' : 'hidden'} />
          </div>

          {/* Tarjeta directa */}
          <div className="bg-warm-50 border border-warm-100 rounded-2xl p-4">
            <p className="text-xs font-medium text-warm-600 mb-3 flex items-center gap-1.5">
              <CreditCard size={13} strokeWidth={1.8} /> O paga directamente con tarjeta vía PayPal
            </p>
            <p className="text-xs text-warm-500 leading-relaxed">
              Al agendar tu primera sesión, PayPal te permitirá pagar con Visa, Mastercard,
              American Express u otras tarjetas. Tus datos de pago están protegidos por PayPal.
            </p>
          </div>

          {/* Nota seguridad */}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
            <Shield size={14} strokeWidth={1.8} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Psiconecta <strong>nunca almacena</strong> datos de tarjetas. Todo el procesamiento
              de pagos es gestionado por PayPal con cifrado de 256 bits.
            </p>
          </div>
        </>
      )}

      <div className="flex gap-3 mt-2">
        <Button variant="outline" onClick={onBack} type="button" className="flex-1">Atrás</Button>
        <Button onClick={onNext} className="flex-1">
          {paypalLinked ? 'Continuar' : 'Continuar sin vincular'}
        </Button>
      </div>
    </div>
  )
}

// ─── Terms Step ──────────────────────────────────────────────────────────────

function TermsStep({ onSubmit, onBack, loading, acceptTerms, setAcceptTerms, acceptPrivacy, setAcceptPrivacy }) {
  const canSubmit = acceptTerms && acceptPrivacy

  return (
    <form onSubmit={onSubmit} className="animate-fade-in flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-warm-900 mb-1">Términos y privacidad</h2>
        <p className="text-sm text-warm-500">Lee y acepta nuestras condiciones para continuar</p>
      </div>

      {/* Resumen T&C */}
      <div className="bg-warm-50 border border-warm-100 rounded-2xl p-4 max-h-40 overflow-y-auto">
        <p className="text-xs font-semibold text-warm-700 mb-2">Términos y Condiciones</p>
        <p className="text-xs text-warm-600 leading-relaxed">
          Al registrarte en Psiconecta aceptas que: (1) La plataforma es un canal de conexión
          entre pacientes y terapeutas certificados; (2) Psiconecta no presta servicios
          terapéuticos directos ni es responsable del contenido de las sesiones;
          (3) Los pagos se procesan a través de PayPal y están sujetos a sus políticas;
          (4) En caso de emergencia psicológica, debes contactar los servicios de crisis
          locales — Psiconecta no es un servicio de emergencias; (5) Puedes cancelar tu cuenta
          en cualquier momento desde tu perfil; (6) Las sesiones grabadas (solo con consentimiento
          explícito de ambas partes) se almacenan cifradas durante 90 días;
          (7) Nos reservamos el derecho de suspender cuentas que incumplan estas condiciones.
        </p>
      </div>

      {/* Resumen Privacidad */}
      <div className="bg-warm-50 border border-warm-100 rounded-2xl p-4 max-h-40 overflow-y-auto">
        <p className="text-xs font-semibold text-warm-700 mb-2">Política de Privacidad</p>
        <p className="text-xs text-warm-600 leading-relaxed">
          Tu privacidad es prioritaria en Psiconecta: (1) Recopilamos únicamente los datos
          necesarios para prestarte el servicio (nombre, email, datos de contacto);
          (2) Tus datos clínicos (notas de sesión, diagnósticos, tests) son confidenciales
          y solo accesibles por ti y tu terapeuta; (3) No vendemos ni compartimos tu
          información con terceros salvo obligación legal; (4) Puedes solicitar la eliminación
          de tus datos en cualquier momento escribiendo a privacidad@psiconecta.app;
          (5) Usamos cifrado en tránsito (TLS 1.3) y en reposo (AES-256) para todos los datos;
          (6) Las cookies se usan exclusivamente para mantener tu sesión activa;
          (7) Cumplimos con el RGPD y las leyes de protección de datos aplicables.
        </p>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-col gap-3">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div
            onClick={() => setAcceptTerms(v => !v)}
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer',
              acceptTerms ? 'bg-primary-600 border-primary-600' : 'border-warm-300 bg-white group-hover:border-primary-400'
            )}
          >
            {acceptTerms && <Check size={11} strokeWidth={3} className="text-white" />}
          </div>
          <span className="text-sm text-warm-700 leading-snug">
            He leído y acepto los{' '}
            <a href="#" className="text-primary-600 font-medium hover:underline" onClick={e => e.stopPropagation()}>
              Términos y Condiciones
            </a>{' '}
            de Psiconecta. <span className="text-red-500">*</span>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <div
            onClick={() => setAcceptPrivacy(v => !v)}
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer',
              acceptPrivacy ? 'bg-primary-600 border-primary-600' : 'border-warm-300 bg-white group-hover:border-primary-400'
            )}
          >
            {acceptPrivacy && <Check size={11} strokeWidth={3} className="text-white" />}
          </div>
          <span className="text-sm text-warm-700 leading-snug">
            Acepto la{' '}
            <a href="#" className="text-primary-600 font-medium hover:underline" onClick={e => e.stopPropagation()}>
              Política de Privacidad
            </a>{' '}
            y el tratamiento de mis datos personales. <span className="text-red-500">*</span>
          </span>
        </label>
      </div>

      {!canSubmit && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
          <AlertCircle size={13} strokeWidth={1.8} className="shrink-0" />
          Debes aceptar ambos documentos para crear tu cuenta.
        </div>
      )}

      <div className="flex gap-3 mt-1">
        <Button variant="outline" onClick={onBack} type="button" className="flex-1">Atrás</Button>
        <Button type="submit" loading={loading} disabled={!canSubmit} className="flex-1">
          Crear cuenta
        </Button>
      </div>
    </form>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Register() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState(null)
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    // Datos personales
    gender: '', birthDate: '', preferredLanguage: 'es',
    // Contacto
    city: '', country: '', phone: '',
    emergencyContact: '', emergencyPhone: '',
    // Profesional (terapeuta)
    specialty: '', licenseNumber: '',
  })
  const [acceptTerms, setAcceptTerms]     = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [paypalLinked, setPaypalLinked]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailPendingVerification, setEmailPendingVerification] = useState(false)

  const { signUp, updateProfile } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const steps = role ? getSteps(role) : [1]
  const totalSteps = steps.length

  // ── Paso 1: selección de rol
  const handleRoleSelect = (r) => {
    setRole(r)
    setStep(2)
  }

  // ── Paso 2: validar datos personales
  const handleStep2 = (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (form.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (!/[A-Z]/.test(form.password)) {
      toast.error('La contraseña debe tener al menos una letra mayúscula')
      return
    }
    if (!/[0-9]/.test(form.password)) {
      toast.error('La contraseña debe tener al menos un número')
      return
    }
    if (!/[^A-Za-z0-9]/.test(form.password)) {
      toast.error('La contraseña debe tener al menos un carácter especial (!@#$...)')
      return
    }
    if (!form.gender) {
      toast.error('Selecciona tu sexo')
      return
    }
    if (!form.birthDate) {
      toast.error('Ingresa tu fecha de nacimiento')
      return
    }
    // Validar edad mínima
    const today = new Date()
    const birth = new Date(form.birthDate)
    const age = today.getFullYear() - birth.getFullYear() -
      (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0)
    const minAge = role === 'therapist' ? 21 : 13
    if (age < minAge) {
      toast.error(`Debes tener al menos ${minAge} años para registrarte${role === 'therapist' ? ' como terapeuta' : ''}`)
      return
    }
    if (age > 120) {
      toast.error('Fecha de nacimiento inválida')
      return
    }
    setStep(3)
  }

  // ── Paso 3: validar contacto
  const handleStep3 = (e) => {
    e.preventDefault()
    if (!form.city.trim())    { toast.error('Ingresa tu ciudad');  return }
    if (!form.country)         { toast.error('Selecciona tu país'); return }
    if (!form.phone.trim())    { toast.error('Ingresa tu teléfono'); return }
    if (role === 'client') {
      if (!form.emergencyContact.trim()) { toast.error('Ingresa el nombre del contacto de emergencia'); return }
      if (!form.emergencyPhone.trim())   { toast.error('Ingresa el teléfono de emergencia'); return }
    }
    setStep(4)
  }

  // ── Paso 4 terapeuta: datos profesionales
  const handleStep4Therapist = (e) => {
    e.preventDefault()
    if (!form.specialty)          { toast.error('Selecciona tu especialidad'); return }
    if (!form.licenseNumber.trim()) { toast.error('Ingresa tu número de cédula'); return }
    setStep(5) // → pago
  }

  // ── Paso pago: avanzar
  const handlePaymentNext = () => {
    setStep(role === 'therapist' ? 6 : 5)
  }

  // ── Paso final: crear cuenta
  const handleFinalSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const now = new Date().toISOString()
      // signUp retorna { user, session } — user siempre viene aunque session sea null
      const signUpData = await signUp({
        email:        form.email,
        password:     form.password,
        fullName:     form.fullName,
        role,
        specialty:    form.specialty,
        licenseNumber: form.licenseNumber,
      })
      const newUserId = signUpData?.user?.id

      // Actualizar campos extendidos del perfil (service role via authStore)
      if (newUserId) {
        await supabase.from('profiles').update({
          city:                sanitize(form.city),
          country:             form.country,
          phone:               sanitize(form.phone),
          gender:              form.gender || null,
          birth_date:          form.birthDate || null,
          preferred_language:  form.preferredLanguage || 'es',
          terms_accepted_at:   now,
          privacy_accepted_at: now,
        }).eq('id', newUserId)

        // Contacto de emergencia → tabla separada con RLS estricta
        // (solo el paciente, su terapeuta activo y el admin pueden leerla)
        if (role === 'client' && form.emergencyContact.trim()) {
          await supabase.from('emergency_contacts').upsert({
            patient_id:    newUserId,
            contact_name:  sanitize(form.emergencyContact),
            contact_phone: sanitize(form.emergencyPhone),
          }, { onConflict: 'patient_id' })
        }
      }

      // Enviar email de bienvenida usando el user_id del signup
      // (no depende de sesión activa — notify-welcome usa service role)
      if (newUserId) {
        supabase.functions.invoke('notify-welcome', {
          body: { user_id: newUserId },
        }).catch(() => {})
      }

      // Si Supabase requiere confirmación de email, session será null
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setEmailPendingVerification(true)
        return
      }

      toast.success('¡Cuenta creada!')
      // Use the store role (populated by fetchProfile inside signUp) — more
      // reliable than the local form state which can be stale after async ops.
      const storeRole = useAuthStore.getState().role
      // Respetar redirect de evaluaciones (state o localStorage)
      const fromState = location.state?.from?.pathname
      const lsRedirect = localStorage.getItem('psiconecta_auth_redirect')
      if (lsRedirect) localStorage.removeItem('psiconecta_auth_redirect')
      const destination = fromState ?? lsRedirect ?? (
        storeRole === 'therapist' ? '/therapist/dashboard' :
        storeRole === 'admin'     ? '/admin/dashboard' :
        '/patient/dashboard'
      )
      navigate(destination)
    } catch (err) {
      toast.error(err.message ?? 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  // ── Pantalla de verificación de email ────────────────────────────────────────
  if (emailPendingVerification) {
    return (
      <div className="min-h-dvh bg-psiconecta flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-float p-10 text-center border border-warm-100">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-warm-900 mb-2">Verifica tu correo</h2>
            <p className="text-warm-500 text-sm leading-relaxed mb-6">
              Te enviamos un enlace de verificación a <strong>{form.email}</strong>.
              Revisa tu bandeja de entrada (y carpeta de spam) y haz clic en el enlace para activar tu cuenta.
            </p>
            <Button variant="secondary" fullWidth onClick={() => navigate('/login')}>
              Ir al inicio de sesión
            </Button>
            <p className="text-xs text-warm-400 mt-4">
              ¿No recibiste el correo?{' '}
              <button
                className="text-primary-500 hover:underline"
                onClick={async () => {
                  await supabase.auth.resend({ type: 'signup', email: form.email })
                  toast.success('Correo reenviado')
                }}
              >
                Reenviar
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  const isPaymentStep = (role === 'therapist' && step === 5) || (role === 'client' && step === 4)
  const isTermsStep   = (role === 'therapist' && step === 6) || (role === 'client' && step === 5)

  return (
    <div className="min-h-dvh bg-psiconecta flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-calm">
            <PsiconectaLogo size={30} color="white" />
          </div>
          <h1 className="text-2xl font-bold text-primary-800">
            Psico<span className="text-calm-500">necta</span>
          </h1>
        </div>

        {/* Indicador de pasos */}
        {step > 1 && <StepDots steps={steps} current={step} />}

        <div className="bg-white rounded-3xl shadow-float p-8 border border-warm-100">

          {/* ── PASO 1: Selección de rol ── */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold text-warm-900 mb-1">¿Cómo usarás Psiconecta?</h2>
              <p className="text-sm text-warm-500 mb-6">Elige tu rol para personalizar tu experiencia</p>
              <div className="flex flex-col gap-3">
                <RoleCard
                  Icon={User}
                  title="Soy paciente"
                  desc="Busco apoyo psicológico profesional"
                  onClick={() => handleRoleSelect('client')}
                />
                <RoleCard
                  Icon={Stethoscope}
                  title="Soy terapeuta"
                  desc="Quiero ofrecer mis servicios profesionales"
                  onClick={() => handleRoleSelect('therapist')}
                />
              </div>
            </div>
          )}

          {/* ── PASO 2: Datos personales ── */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="animate-fade-in flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold text-warm-900 mb-1">Datos personales</h2>
                <p className="text-sm text-warm-500">
                  {role === 'therapist' ? 'Cuenta profesional' : 'Cuenta de paciente'}
                </p>
              </div>

              <Input label="Nombre completo" name="fullName" placeholder="Ej. María García"
                value={form.fullName} onChange={handleChange} required />

              <Input label="Correo electrónico" name="email" type="email" placeholder="tu@correo.com"
                value={form.email} onChange={handleChange} required />

              <div className="flex flex-col gap-1">
                <Input label="Contraseña" name="password" type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={form.password} onChange={handleChange} required />
                {form.password && (() => {
                  const s = getPasswordStrength(form.password)
                  return (
                    <div className="flex flex-col gap-1 mt-0.5">
                      <div className="h-1.5 w-full bg-warm-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${s.color} ${s.width}`} />
                      </div>
                      <p className={`text-xs font-medium ${s.text}`}>{s.label} — usa mayúsculas, números y símbolos</p>
                    </div>
                  )
                })()}
              </div>

              <Input label="Confirmar contraseña" name="confirmPassword" type="password"
                placeholder="Repite tu contraseña"
                value={form.confirmPassword} onChange={handleChange} required />

              {/* Sexo + Fecha de nacimiento */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-warm-700">Sexo <span className="text-red-400">*</span></label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-800 outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                  >
                    <option value="">Selecciona</option>
                    {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-warm-700">Fecha de nacimiento <span className="text-red-400">*</span></label>
                  <input
                    type="date"
                    name="birthDate"
                    value={form.birthDate}
                    onChange={handleChange}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-800 outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                  />
                </div>
              </div>

              {/* Idioma preferido */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-warm-700">Idioma preferido <span className="text-red-400">*</span></label>
                <select
                  name="preferredLanguage"
                  value={form.preferredLanguage}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-800 outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                >
                  {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>

              <div className="flex gap-3 mt-2">
                <Button variant="outline" onClick={() => setStep(1)} type="button" className="flex-1">Atrás</Button>
                <Button type="submit" className="flex-1">Continuar</Button>
              </div>
            </form>
          )}

          {/* ── PASO 3: Información de contacto ── */}
          {step === 3 && (
            <form onSubmit={handleStep3} className="animate-fade-in flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold text-warm-900 mb-1">Información de contacto</h2>
                <p className="text-sm text-warm-500">Dónde te encontramos y cómo comunicarnos</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Ciudad" name="city" placeholder="Ej. Santo Domingo"
                  value={form.city} onChange={handleChange} required />

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-warm-700">País <span className="text-red-400">*</span></label>
                  <select
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-800 outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                  >
                    <option value="">Selecciona</option>
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Input label="Teléfono" name="phone" type="tel" placeholder="Ej. +1 809 555 0000"
                value={form.phone} onChange={handleChange} required
                hint="Incluye código de país" />

              {/* Contacto de emergencia — solo pacientes */}
              {role === 'client' && (
                <>
                  <div className="pt-1 border-t border-warm-100">
                    <p className="text-xs font-semibold text-warm-700 mb-3 flex items-center gap-1.5">
                      <Shield size={13} strokeWidth={1.8} className="text-primary-500" />
                      Contacto de emergencia
                    </p>
                    <div className="flex flex-col gap-3">
                      <Input label="Nombre completo" name="emergencyContact"
                        placeholder="Ej. Juan García (padre)"
                        value={form.emergencyContact} onChange={handleChange} required />
                      <Input label="Teléfono de emergencia" name="emergencyPhone"
                        type="tel" placeholder="Ej. +1 809 555 1234"
                        value={form.emergencyPhone} onChange={handleChange} required
                        hint="A quién contactar en caso de crisis" />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 mt-2">
                <Button variant="outline" onClick={() => setStep(2)} type="button" className="flex-1">Atrás</Button>
                <Button type="submit" className="flex-1">Continuar</Button>
              </div>
            </form>
          )}

          {/* ── PASO 4 (terapeuta): Datos profesionales ── */}
          {step === 4 && role === 'therapist' && (
            <form onSubmit={handleStep4Therapist} className="animate-fade-in flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold text-warm-900 mb-1">Datos profesionales</h2>
                <p className="text-sm text-warm-500">Verificaremos tus credenciales antes de activar tu perfil</p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-warm-700">Especialidad <span className="text-red-400">*</span></label>
                <select
                  name="specialty"
                  value={form.specialty}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-800 outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                >
                  <option value="">Selecciona tu especialidad</option>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <Input label="Número de cédula profesional" name="licenseNumber"
                placeholder="Ej. 12345678"
                value={form.licenseNumber} onChange={handleChange} required
                hint="Tu número de licencia o cédula oficial" />

              <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                <p className="text-xs text-primary-700 font-medium mb-1 flex items-center gap-1">
                  <FileCheck size={13} /> Verificación de documentos
                </p>
                <p className="text-xs text-primary-600">
                  En tu perfil podrás subir tus documentos de credencial (título, exequátur y colegio).
                  Tu perfil se activa una vez validemos tus datos (24-48 hrs).
                </p>
              </div>

              <div className="flex gap-3 mt-2">
                <Button variant="outline" onClick={() => setStep(3)} type="button" className="flex-1">Atrás</Button>
                <Button type="submit" className="flex-1">Continuar</Button>
              </div>
            </form>
          )}

          {/* ── PASO pago ── */}
          {isPaymentStep && (
            <PaymentStep
              onNext={handlePaymentNext}
              onBack={() => setStep(role === 'therapist' ? 4 : 3)}
              paypalLinked={paypalLinked}
              setPaypalLinked={setPaypalLinked}
            />
          )}

          {/* ── PASO términos ── */}
          {isTermsStep && (
            <TermsStep
              onSubmit={handleFinalSubmit}
              onBack={() => setStep(role === 'therapist' ? 5 : 4)}
              loading={loading}
              acceptTerms={acceptTerms}
              setAcceptTerms={setAcceptTerms}
              acceptPrivacy={acceptPrivacy}
              setAcceptPrivacy={setAcceptPrivacy}
            />
          )}

        </div>

        {/* Login social — solo en paso 1 */}
        {step === 1 && (
          <div className="mt-5">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-warm-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="text-xs text-warm-400 bg-psiconecta px-3">o regístrate con</span>
              </div>
            </div>
            <SocialLoginButtons />
          </div>
        )}

        <p className="text-center mt-5 text-sm text-warm-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:text-primary-800">
            Iniciar sesión
          </Link>
        </p>

      </div>
    </div>
  )
}
