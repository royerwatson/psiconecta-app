/**
 * Edge Function: ai-checkin
 *
 * Analiza las respuestas del check-in diario con la API de Claude,
 * determina el nivel de riesgo, guarda en ai_checkins y retorna el resultado.
 *
 * Body esperado:
 *   { patient_id: string, questions_answers: string }
 *
 * Respuesta:
 *   { risk_level: 'low'|'medium'|'high', message: string }
 *
 * Variables de entorno requeridas (Supabase Dashboard → Settings → Edge Functions):
 *   ANTHROPIC_API_KEY   — clave API de Anthropic
 *   SUPABASE_URL        — URL del proyecto (auto-inyectada)
 *   SUPABASE_SERVICE_ROLE_KEY — clave de servicio (auto-inyectada)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, riskAlertEmail } from '../_shared/email.ts'

const ANTHROPIC_API_KEY      = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
const SUPABASE_URL           = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin':  'https://psiconecta.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Análisis de riesgo con Claude ───────────────────────────────────────────

async function analyzeWithClaude(qa: string): Promise<{ risk_level: string; message: string }> {
  const prompt = `Eres un asistente clínico especializado en salud mental. Analiza las siguientes respuestas de un paciente a un check-in de bienestar diario y determina el nivel de riesgo psicológico.

Respuestas del paciente:
${qa}

Clasifica el riesgo en UNO de estos tres niveles:
- "low": El paciente está bien o con molestias leves. No se requiere intervención urgente.
- "medium": El paciente presenta señales de malestar moderado que merecen atención próxima del terapeuta.
- "high": El paciente muestra señales de crisis, ideación negativa intensa, aislamiento extremo o riesgo inmediato. Requiere contacto urgente del terapeuta.

Responde ÚNICAMENTE con un objeto JSON con este formato exacto (sin markdown, sin texto adicional):
{"risk_level":"low","message":"Mensaje breve de 1-2 oraciones en español, empático y dirigido al paciente, apropiado para su nivel de riesgo."}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`)

  const data = await res.json()
  const text = data.content?.[0]?.text ?? ''

  // Extraer JSON de la respuesta
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in Claude response')

  const parsed = JSON.parse(match[0])
  const risk_level = ['low', 'medium', 'high'].includes(parsed.risk_level)
    ? parsed.risk_level
    : 'low'

  return { risk_level, message: parsed.message ?? '' }
}

// ─── Fallback si Claude no está disponible ────────────────────────────────────

function analyzeWithKeywords(qa: string): { risk_level: string; message: string } {
  const HIGH_RISK   = ['Muy mal', 'Sin ganas', 'No he comido', 'Muy intensos', 'Completamente', 'Para nada', 'Estoy solo']
  const MEDIUM_RISK = ['Mal', 'Muchos', 'Bastante', 'Muy baja', 'Nada', 'Muy mal']

  const highCount   = HIGH_RISK.filter(w => qa.includes(w)).length
  const mediumCount = MEDIUM_RISK.filter(w => qa.includes(w)).length

  if (highCount >= 2) {
    return {
      risk_level: 'high',
      message: 'Parece que estás pasando por un momento muy difícil. Tu terapeuta ha sido notificado y estará contigo pronto. Recuerda que no estás solo/a.',
    }
  }
  if (mediumCount >= 2 || highCount === 1) {
    return {
      risk_level: 'medium',
      message: 'Parece que puede ser un día desafiante. Recuerda las estrategias que has aprendido y que tu terapeuta está disponible si lo necesitas.',
    }
  }
  return {
    risk_level: 'low',
    message: 'Gracias por compartir cómo te sientes. Sigue adelante, lo estás haciendo muy bien.',
  }
}

// ─── Obtener terapeuta principal del paciente ─────────────────────────────────

async function getMainTherapist(supabase: ReturnType<typeof createClient>, patientId: string): Promise<string | null> {
  const { data } = await supabase
    .from('sessions')
    .select('therapist_id')
    .eq('patient_id', patientId)
    .in('status', ['scheduled', 'completed'])
    .order('scheduled_at', { ascending: false })
    .limit(1)
    .single()
  return data?.therapist_id ?? null
}

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── FIX SEGURIDAD: verificar JWT antes de procesar ─────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseUserClient = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const body = await req.json()
    const { questions_answers } = body

    // SEGURIDAD: ignorar patient_id del body — usar el del token JWT
    const patient_id = user.id

    if (!questions_answers || typeof questions_answers !== 'string') {
      return new Response(
        JSON.stringify({ error: 'questions_answers es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar longitud máxima para prevenir abuso
    if (questions_answers.length > 8000) {
      return new Response(
        JSON.stringify({ error: 'Contenido demasiado largo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // ── Rate limiting: máx 1 check-in con IA por paciente por día ─────────────
    // Si ya existe un check-in hoy, devolver el resultado cacheado sin llamar a Claude
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const { data: existingToday } = await supabase
      .from('ai_checkins')
      .select('risk_level, ai_message')
      .eq('patient_id', patient_id)
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingToday) {
      console.log(`[ai-checkin] Rate limit: paciente ${patient_id} ya completó check-in hoy, devolviendo resultado cacheado`)
      return new Response(
        JSON.stringify({
          risk_level: existingToday.risk_level,
          message:    existingToday.ai_message,
          cached:     true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Analizar con IA (Claude) o fallback
    let analysis: { risk_level: string; message: string }
    if (ANTHROPIC_API_KEY) {
      try {
        analysis = await analyzeWithClaude(questions_answers)
      } catch (err) {
        console.error('Claude error, using fallback:', err)
        analysis = analyzeWithKeywords(questions_answers)
      }
    } else {
      analysis = analyzeWithKeywords(questions_answers)
    }

    // Obtener terapeuta principal del paciente
    const therapistId = await getMainTherapist(supabase, patient_id)

    // Guardar en ai_checkins
    const { error: insertError } = await supabase
      .from('ai_checkins')
      .insert({
        patient_id,
        therapist_id:     therapistId,
        questions_answers,
        risk_level:       analysis.risk_level,
        ai_message:       analysis.message,
        notified:         false,
      })

    if (insertError) {
      console.error('Insert error:', insertError)
    }

    // Si riesgo alto o medio → enviar email de alerta al terapeuta (best-effort)
    if ((analysis.risk_level === 'high' || analysis.risk_level === 'medium') && therapistId) {
      try {
        const [therapistAuth, therapistProfile, patientProfile] = await Promise.all([
          supabase.auth.admin.getUserById(therapistId),
          supabase.from('profiles').select('full_name').eq('id', therapistId).single(),
          supabase.from('profiles').select('full_name').eq('id', patient_id).single(),
        ])

        const therapistEmail = therapistAuth.data?.user?.email
        if (therapistEmail && therapistProfile.data?.full_name) {
          await sendEmail({
            to: therapistEmail,
            subject: analysis.risk_level === 'high'
              ? `⚠️ Alerta de riesgo alto — ${patientProfile.data?.full_name ?? 'Tu paciente'}`
              : `⚡ Alerta de riesgo moderado — ${patientProfile.data?.full_name ?? 'Tu paciente'}`,
            html: riskAlertEmail({
              therapistName: therapistProfile.data.full_name,
              patientName:   patientProfile.data?.full_name ?? 'Tu paciente',
              riskLevel:     analysis.risk_level as 'high' | 'medium',
              aiMessage:     analysis.message,
              checkinDate:   new Date().toISOString(),
            }),
          })
        }

        // Marcar notificado en BD
        await supabase.from('ai_checkins')
          .update({ notified: true })
          .eq('patient_id', patient_id)
          .order('created_at', { ascending: false })
          .limit(1)

      } catch (notifErr) {
        console.error('Notification error (non-blocking):', notifErr)
      }
    }

    return new Response(
      JSON.stringify({ risk_level: analysis.risk_level, message: analysis.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('ai-checkin error:', err)
    return new Response(
      JSON.stringify({
        risk_level: 'low',
        message: 'Gracias por completar tu check-in de hoy.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
