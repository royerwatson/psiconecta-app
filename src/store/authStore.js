/**
 * Store global de autenticación — Zustand + persistencia en localStorage
 *
 * Estado:
 *   user     — objeto de Supabase Auth (id, email, etc.)
 *   profile  — registro de la tabla `profiles` (full_name, role, avatar_url, therapist_profiles[])
 *   role     — 'therapist' | 'client' | 'admin' | null
 *   loading  — true mientras se inicializa la sesión al arrancar la app
 *   initialized — false hasta que initialize() termine (evita flashes de login)
 *
 * Nota: `therapist_profiles` dentro de `profile` es un ARRAY (relación 1-a-muchos).
 * Acceder siempre como `profile.therapist_profiles?.[0]` para obtener los datos del terapeuta.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { setSentryUser } from '@/lib/sentry'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      role: null, // 'therapist' | 'client'
      loading: true,
      initialized: false,

      // Inicializar sesión al arrancar la app
      initialize: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            await get().fetchProfile(session.user)
          } else {
            set({ user: null, profile: null, role: null, loading: false, initialized: true })
          }
        } catch (error) {
          console.error('Error inicializando sesión:', error)
          set({ loading: false, initialized: true })
        }
      },

      // Cargar perfil del usuario desde la BD
      fetchProfile: async (user) => {
        try {
          // Step 1: basic profile (always works if RLS allows)
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (error) throw error

          // Step 2: therapist extended data (best-effort, not critical)
          let therapistProfiles = []
          if (profile.role === 'therapist') {
            const { data: tp } = await supabase
              .from('therapist_profiles')
              .select('*')
              .eq('user_id', user.id)
            therapistProfiles = tp ?? []
          }

          set({
            user,
            profile: { ...profile, therapist_profiles: therapistProfiles },
            role: profile.role,
            loading: false,
            initialized: true,
          })
          setSentryUser(user, profile.role)
        } catch (error) {
          console.error('Error cargando perfil:', error)
          // Fallback: read role from JWT metadata so the app stays usable
          // even when the profiles table query fails (RLS, network, etc.)
          const fallbackRole = user?.user_metadata?.role ?? null
          set({ user, role: fallbackRole, loading: false, initialized: true })
        }
      },

      // Login con email y contraseña
      signIn: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        await get().fetchProfile(data.user)
        return data
      },

      // Registro — con selección de rol
      signUp: async ({ email, password, fullName, role, specialty, licenseNumber }) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role },
          },
        })
        if (error) throw error

        // El trigger handle_new_user crea el perfil base automáticamente.
        // Esperamos brevemente y luego verificamos; si el trigger falló
        // silenciosamente, creamos el perfil como fallback.
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', data.user.id)
          .single()

        if (!existingProfile) {
          // Trigger silently failed — create profile manually
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullName,
            email,
            role,
          })
          if (profileError) throw profileError
        } else {
          // Trigger ran — but may have saved a default name ('Usuario') if
          // raw_user_meta_data wasn't ready. Always overwrite with the real values.
          await supabase.from('profiles').update({
            full_name: fullName,
            role,
          }).eq('id', data.user.id)
          // Silently ignored if RLS blocks (e.g. email confirmation pending with no session)
        }

        // Si es terapeuta, crear perfil extendido
        if (role === 'therapist') {
          const { error: therapistError } = await supabase.from('therapist_profiles').upsert({
            user_id: data.user.id,
            specialty: specialty ?? '',
            license_number: licenseNumber ?? '',
            verified: false,
            verification_status: 'pending',
            price_per_session: 0,
          })
          if (therapistError) throw therapistError
        }

        // Cargar el perfil recién creado en el store
        await get().fetchProfile(data.user)

        return data
      },

      // Cerrar sesión
      signOut: async () => {
        setSentryUser(null)
        await supabase.auth.signOut()
        set({ user: null, profile: null, role: null })
      },

      // Actualizar perfil local
      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : updates,
        })),

      // Helpers de rol
      isTherapist: () => get().role === 'therapist',
      isClient:    () => get().role === 'client',
    }),
    {
      name: 'psiconecta-auth',
      // Solo persistir el user (contiene el JWT de Supabase).
      // role y profile se cargan frescos desde la BD en cada initialize(),
      // eliminando el riesgo de que un atacante manipule el rol en localStorage.
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
)
