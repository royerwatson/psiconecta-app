import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, newMessageEmail } from '../_shared/email.ts'
import { sendPushToUser } from '../_shared/push.ts'

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

    // SEGURIDAD: verificar que el sender realmente envió un mensaje reciente al recipient.
    // Sin esto, cualquier usuario autenticado podría usar esta función para enviar
    // emails arbitrarios a otros usuarios de la plataforma (spam/phishing vector).
    const { data: recentMsg } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('sender_id', user.id)
      .eq('receiver_id', recipientId)
      .gte('created_at', new Date(Date.now() - 90 * 1000).toISOString()) // últimos 90s
      .limit(1)
      .maybeSingle()

    if (!recentMsg) {
      // No hay mensaje reciente — rechazar silenciosamente sin revelar datos del recipient
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    // Push nativa (best-effort — no bloquea si FCM no está configurado)
    await sendPushToUser(supabaseAdmin, recipientId, {
      title: `Nuevo mensaje de ${senderName}`,
      body: preview,
      route: recipientRole === 'therapist' ? '/therapist/chat' : '/patient/chat',
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
