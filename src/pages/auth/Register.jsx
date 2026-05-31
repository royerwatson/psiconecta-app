import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import Input, { Select } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Zap, User, Stethoscope, ChevronRight, FileCheck } from 'lucide-react'

const SPECIALTIES = [
  'Psicología clínica', 'Psicología cognitivo-conductual', 'Psicoanálisis',
  'Terapia familiar y de pareja', 'Psicología infantil', 'Neuropsicología',
  'Psicología del deporte', 'Psicología organizacional', 'Otra',
]

export default function Register() {
  const [step, setStep] = useState(1) // 1: rol, 2: datos personales, 3: datos profesionales
  const [role, setRole] = useState(null)
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    specialty: '', licenseNumber: '',
  })
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuthStore()
  const navigate = useNavigate()

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleRoleSelect = (r) => {
    setRole(r)
    setStep(2)
  }

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
    if (role === 'therapist') setStep(3)
    else handleSubmit()
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setLoading(true)
    try {
      await signUp({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        role,
        specialty: form.specialty,
        licenseNumber: form.licenseNumber,
      })
      toast.success('¡Cuenta creada! Revisa tu correo para verificarla.')
      navigate(role === 'therapist' ? '/therapist/dashboard' : '/patient/dashboard')
    } catch (err) {
      toast.error(err.message ?? 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-psiconecta flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-calm">
              <Zap size={24} className="text-white" strokeWidth={2} />
            </div>
          <h1 className="font-serif text-2xl font-bold text-primary-800">
            Psico<span className="text-calm-500">necta</span>
          </h1>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, ...(role === 'therapist' ? [3] : [])].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                s <= step ? 'bg-primary-600 text-white' : 'bg-warm-200 text-warm-500',
              )}>{s}</div>
              {s < (role === 'therapist' ? 3 : 2) && (
                <div className={cn('w-8 h-0.5', s < step ? 'bg-primary-400' : 'bg-warm-200')} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-float p-8 border border-warm-100">

          {/* PASO 1 — Selección de rol */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="font-serif text-xl font-semibold text-warm-900 mb-1">¿Cómo usarás Psiconecta?</h2>
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

          {/* PASO 2 — Datos personales */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="animate-fade-in flex flex-col gap-4">
              <div>
                <h2 className="font-serif text-xl font-semibold text-warm-900 mb-1">Datos personales</h2>
                <p className="text-sm text-warm-500">
                  {role === 'therapist' ? 'Cuenta profesional' : 'Cuenta de paciente'}
                </p>
              </div>

              <Input label="Nombre completo" name="fullName" placeholder="Ej. María García"
                value={form.fullName} onChange={handleChange} required />

              <Input label="Correo electrónico" name="email" type="email" placeholder="tu@correo.com"
                value={form.email} onChange={handleChange} required />

              <Input label="Contraseña" name="password" type="password" placeholder="Mínimo 8 caracteres"
                value={form.password} onChange={handleChange} required
                hint="Al menos 8 caracteres" />

              <Input label="Confirmar contraseña" name="confirmPassword" type="password" placeholder="Repite tu contraseña"
                value={form.confirmPassword} onChange={handleChange} required />

              <div className="flex gap-3 mt-2">
                <Button variant="outline" onClick={() => setStep(1)} type="button" className="flex-1">
                  Atrás
                </Button>
                <Button type="submit" className="flex-1">
                  {role === 'therapist' ? 'Continuar' : 'Crear cuenta'}
                </Button>
              </div>
            </form>
          )}

          {/* PASO 3 — Datos profesionales (solo terapeuta) */}
          {step === 3 && role === 'therapist' && (
            <form onSubmit={handleSubmit} className="animate-fade-in flex flex-col gap-4">
              <div>
                <h2 className="font-serif text-xl font-semibold text-warm-900 mb-1">Datos profesionales</h2>
                <p className="text-sm text-warm-500">
                  Verificaremos tus credenciales antes de activar tu perfil
                </p>
              </div>

              <Select label="Especialidad" name="specialty" value={form.specialty}
                onChange={handleChange} required>
                <option value="">Selecciona tu especialidad</option>
                {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>

              <Input label="Número de cédula profesional" name="licenseNumber"
                placeholder="Ej. 12345678" value={form.licenseNumber}
                onChange={handleChange} required
                hint="Tu número de licencia o cédula oficial" />

              <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                <p className="text-xs text-primary-700 font-medium mb-1 flex items-center gap-1">
                    <FileCheck size={13} /> Verificación de documentos
                  </p>
                <p className="text-xs text-primary-600">
                  En el siguiente paso podrás subir tus documentos de credencial para verificación.
                  Tu perfil estará activo una vez que validemos tus datos (24-48 hrs).
                </p>
              </div>

              <div className="flex gap-3 mt-2">
                <Button variant="outline" onClick={() => setStep(2)} type="button" className="flex-1">
                  Atrás
                </Button>
                <Button type="submit" loading={loading} className="flex-1">
                  Crear cuenta
                </Button>
              </div>
            </form>
          )}
        </div>

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
