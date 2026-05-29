import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

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
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*, therapist_profiles(*)')
            .eq('id', user.id)
            .single()

          if (error) throw error

          set({
            user,
            profile,
            role: profile.role,
            loading: false,
            initialized: true,
          })
        } catch (error) {
          console.error('Error cargando perfil:', error)
          set({ user, loading: false, initialized: true })
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

        // El trigger handle_new_user crea el perfil base automáticamente
        // usando los metadatos (full_name, role) que pasamos arriba.
        // Esperamos a que el trigger termine antes de continuar.
        await new Promise((resolve) => setTimeout(resolve, 1500))

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
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        role: state.role,
      }),
    }
  )
)
