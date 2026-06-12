/**
 * create-daily-room — Crea una sala de Daily.co server-side.
 *
 * Recibe: { sessionId, isGroup?, maxParticipants? }
 * Devuelve: { url } — URL de la sala creada
 *
 * Variables de entorno requeridas:
 *   DAILY_API_KEY          — API Key de Daily.co (guardada como secret en Supabase)
 *   DAILY_BASE_URL         — opcional, default https://api.daily.co/v1
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { getCorsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const { sessionId, isGroup = false, maxParticipants } = await req.json()
    if (!sessionId) throw new Error('sessionId is required')

    // Verificar que el usuario es el terapeuta o paciente de esa sesión
    const { data: session, error: sessError } = await supabase
      .from('sessions')
      .select('id, therapist_id, patient_id, video_room_url')
      .eq('id', sessionId)
      .maybeSingle()

    if (sessError || !session) throw new Error('Session not found')
    if (session.therapist_id !== user.id && session.patient_id !== user.id) {
      throw new Error('Forbidden: not a participant of this session')
    }

    // Si ya existe URL, devolverla
    if (session.video_room_url?.startsWith('https://')) {
      return new Response(
        JSON.stringify({ url: session.video_room_url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Crear sala en Daily.co
    const dailyKey = Deno.env.get('DAILY_API_KEY')
    if (!dailyKey) throw new Error('DAILY_API_KEY not configured')

    const dailyBase = Deno.env.get('DAILY_BASE_URL') ?? 'https://api.daily.co/v1'

    const roomRes = await fetch(`${dailyBase}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dailyKey}`,
      },
      body: JSON.stringify({
        name: `psiconecta-${sessionId.slice(0, 8)}-${Date.now()}`,
        properties: {
          exp: Math.floor(Date.now() / 1000) + 3600 * 2,   // 2 horas
          max_participants: isGroup ? (maxParticipants ?? 20) : 2,
          enable_chat: isGroup,
          enable_screenshare: false,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    })

    const room = await roomRes.json()
    if (!room.url) throw new Error(room.error ?? 'Daily.co did not return a room URL')

    // Guardar URL y pasar sesión a in_progress (solo si es individual)
    const updateData: Record<string, unknown> = { video_room_url: room.url }
    if (!isGroup) updateData.status = 'in_progress'

    await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId)

    return new Response(
      JSON.stringify({ url: room.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
