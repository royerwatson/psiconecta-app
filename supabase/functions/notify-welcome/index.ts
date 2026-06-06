/**
 * notify-welcome
 * Envía email de bienvenida cuando se crea una cuenta nueva.
 * Llamada desde Register.jsx tras el signup exitoso.
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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    // Verificar JWT — el usuario recién creado ya tiene sesión
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) throw new Error('No autorizado')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Obtener perfil para nombre y rol
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    if (!user.email || !profile?.full_name) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    await sendEmail({
      to: user.email,
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
    // Falla silenciosamente — el registro ya fue exitoso
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
