import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, newMessageEmail } from '../_shared/email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://psiconecta.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { recipientId, messagePreview } = await req.json()
    if (!recipientId || !messagePreview) throw new Error('Faltan campos')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Datos del remitente y destinatario
    const [senderData, recipientData, recipientAuth] = await Promise.all([
      supabaseAdmin.from('profiles').select('full_name, role').eq('id', user.id).single(),
      supabaseAdmin.from('profiles').select('full_name, role').eq('id', recipientId).single(),
      supabaseAdmin.auth.admin.getUserById(recipientId),
    ])

    const recipientEmail = recipientAuth.data?.user?.email
    if (!recipientEmail) throw new Error('No se encontró el email del destinatario')

    const senderName    = senderData.data?.full_name ?? 'Alguien'
    const recipientName = recipientData.data?.full_name ?? 'Usuario'
    const recipientRole = recipientData.data?.role as 'patient' | 'therapist' ?? 'patient'

    // Truncar preview a 100 caracteres
    const preview = messagePreview.length > 100
      ? messagePreview.slice(0, 100) + '...'
      : messagePreview

    await sendEmail({
      to: recipientEmail,
      subject: `💬 Nuevo mensaje de ${senderName} en Psiconecta`,
      html: newMessageEmail({ recipientName, senderName, preview, role: recipientRole }),
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
