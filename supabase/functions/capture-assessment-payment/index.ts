import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { sendEmail, assessmentReportEmail } from '../_shared/email.ts'

serve(async (req) => {
  const cors = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: cors })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: cors })

    const { orderID, sessionId } = await req.json()
    if (!orderID || !sessionId) return new Response(JSON.stringify({ error: 'Datos incompletos' }), { status: 400, headers: cors })

    // Verificar que la sesión pertenece al usuario y no está ya pagada
    const { data: session, error: fetchErr } = await supabase
      .from('assessment_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !session) return new Response(JSON.stringify({ error: 'Sesión no encontrada' }), { status: 404, headers: cors })
    if (session.paid) return new Response(JSON.stringify({ sessionId, alreadyPaid: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })

    // Capturar pago PayPal
    const PAYPAL_BASE = Deno.env.get('PAYPAL_BASE_URL') ?? 'https://api-m.sandbox.paypal.com'
    const tokenRes = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${Deno.env.get('PAYPAL_CLIENT_ID')}:${Deno.env.get('PAYPAL_CLIENT_SECRET')}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })
    const { access_token } = await tokenRes.json()

    const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    })
    const capture = await captureRes.json()

    if (capture.status !== 'COMPLETED') throw new Error(`PayPal capture failed: ${JSON.stringify(capture)}`)

    const amountPaid = parseFloat(capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ?? '0')
    const paymentIntentId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? orderID

    // Marcar sesión como pagada
    await supabase.from('assessment_sessions').update({
      paid: true,
      amount_paid: amountPaid,
      payment_intent_id: paymentIntentId,
      paid_at: new Date().toISOString(),
    }).eq('id', sessionId)

    // Generar reporte con Claude
    const report = await generateReport(session)

    // Guardar reporte
    const { error: reportErr } = await supabase.from('assessment_reports').upsert({
      session_id: sessionId,
      user_id: user.id,
      interpretation: report.interpretation,
      normative_context: report.normativeContext,
      recommendations: report.recommendations,
    }, { onConflict: 'session_id' })

    if (reportErr) console.error('Error saving report:', reportErr)

    // Enviar reporte por correo electrónico
    try {
      const patientName = (
        await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      ).data?.full_name ?? 'Usuario'

      const emailHtml = assessmentReportEmail({
        patientName,
        instrument: session.instrument as string,
        instrumentFull: session.instrument_full as string,
        totalScore: session.total_score as number,
        maxScore: session.max_score as number,
        severityLabel: session.severity_label as string,
        severityHex: session.severity_hex as string,
        dimensionScores: (session.dimension_scores as Array<{ name: string; pct: number }>) ?? [],
        interpretation: report.interpretation,
        normativeContext: report.normativeContext,
        recommendations: report.recommendations,
        reportUrl: `${Deno.env.get('APP_URL')}/patient/evaluaciones/${sessionId}`,
      })

      await sendEmail({
        to: user.email!,
        subject: `Tu reporte de ${session.instrument_full} · Psiconecta`,
        html: emailHtml,
      })
    } catch (emailErr) {
      // No bloquear el flujo si el email falla
      console.error('Error sending assessment email:', emailErr)
    }

    return new Response(
      JSON.stringify({ sessionId, success: true, email: user.email }),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('capture-assessment-payment error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: getCorsHeaders(req) })
  }
})

async function generateReport(session: Record<string, unknown>) {
  const responses = session.responses as Array<{ index: number; value: number; label: string; text: string }>
  const formattedResponses = responses
    .map((r, i) => `P${i + 1}: "${r.text}" → ${r.label} (${r.value})`)
    .join('\n')

  const prompt = `Eres un psicólogo clínico experto en evaluación psicométrica. Generas reportes cálidos, precisos y accionables.

INSTRUMENTO: ${session.instrument_full} (${session.instrument})
PUNTUACIÓN: ${session.total_score}/${session.max_score} — Nivel: ${session.severity_label}

RESPUESTAS INDIVIDUALES:
${formattedResponses}

DIMENSIONES:
${JSON.stringify(session.dimension_scores)}

Tu tarea: genera un reporte clínico personalizado con 3 secciones. Analiza el PATRÓN de respuestas, no solo el puntaje total.

REGLAS:
- Lenguaje cálido, nunca alarmante ni minimizador
- NO repitas el puntaje numérico en la interpretación — intégralo
- Las recomendaciones deben ser CONCRETAS y ESPECÍFICAS (nunca "practica mindfulness", sí "usa la técnica 5-4-3-2-1 cuando sientas la ansiedad subir")
- La comparación normativa ubica al usuario en la población general sin alarmar
- Escribe en segunda persona ("tus respuestas sugieren que...", "el patrón indica...")

Responde ÚNICAMENTE con JSON válido (sin markdown, sin comentarios):
{
  "interpretation": "2-3 párrafos. Qué revela el patrón de respuestas sobre la experiencia específica de esta persona. Identifica los dominios más afectados.",
  "normativeContext": "1 párrafo. Ubica el resultado en la población. ¿Qué tan común es esto? Normaliza sin minimizar.",
  "recommendations": [
    { "title": "Nombre corto de la técnica o acción", "description": "Cómo aplicarla concretamente, paso a paso cuando aplique" },
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." }
  ]
}`

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1800,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const anthropicData = await anthropicRes.json()
  const raw = anthropicData.content?.[0]?.text ?? ''

  try {
    // Extraer JSON del texto (puede venir envuelto en markdown)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in Claude response')
    return JSON.parse(jsonMatch[0])
  } catch {
    // Fallback en caso de error de parseo
    return {
      interpretation: raw.slice(0, 800) || 'Reporte en proceso de generación.',
      normativeContext: 'Los resultados han sido registrados correctamente.',
      recommendations: [{ title: 'Busca apoyo profesional', description: 'Considera agendar una sesión con un psicólogo para revisar estos resultados juntos.' }],
    }
  }
}
