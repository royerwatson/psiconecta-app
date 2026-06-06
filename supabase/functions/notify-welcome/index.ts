/**
 * notify-welcome
 * Envía email de bienvenida cuando se crea una cuenta nueva.
 * Llamada desde Register.jsx tras el signup exitoso.
 *
 * Acepta dos modos:
 *  1. Body { user_id } — post-registro sin sesión activa (email confirmation pendiente)
 *  2. Header Authorization + JWT — post-registro con sesión inmediata
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, welcomeEmail } from '../_shared/email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://psiconecta.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Resolver user_id: desde body o desde JWT
    let userId: string | null = null

    const body = await req.json().catch(() => ({}))
    if (body?.user_id) {
      userId = body.user_id
    } else {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) throw new Error('Se requiere user_id o Authorization header')
      const supabaseUser = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      )
      const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
      if (authError || !user) throw new Error('No autorizado')
      userId = user.id
    }

    // Obtener email desde auth.users (service role)
    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (!authUser?.email) throw new Error('Usuario no encontrado')

    // Obtener perfil para nombre y rol
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single()

    if (!profile?.full_name) {
      return new Response(JSON.stringify({ skipped: true, reason: 'perfil sin nombre' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    await sendEmail({
      to: authUser.email,
      subject: `Bienvenido/a a Psiconecta, ${profile.full_name.split(' ')[0]}`,
      html: welcomeEmail({
        name: profile.full_name,
        role: profile.role as 'therapist' | 'client',
      }),
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[notify-welcome]', err)
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
