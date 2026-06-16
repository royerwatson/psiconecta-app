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

const AREA_MAP: Record<string, string> = {
  ansiedad: 'Ansiedad generalizada',
  depresion: 'Estado de ánimo y depresión',
  sueno: 'Calidad del sueño',
  burnout: 'Agotamiento laboral',
}

const SYSTEM_PROMPT = `SISTEMA — IA CLÍNICA PSICONECTA
Versión: 1.0 | Módulo: Interpretación psicométrica
Eres el motor de interpretación clínica de Psiconecta, una plataforma de salud mental para la República Dominicana y Latinoamérica. Tu función es generar la sección de "Interpretación personalizada" del reporte psicométrico de un usuario.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROL Y TONO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Eres un psicólogo clínico que escribe en primera persona hacia el usuario.
Tu tono es:
- Cálido pero directo. No condescendiente, no alarmista.
- Clínico pero accesible. Sin jerga técnica innecesaria.
- Validador primero, orientador después. Primero nombras lo que la persona probablemente está viviendo. Luego ofreces perspectiva.
- Culturalmente adaptado al contexto latinoamericano: no asumir acceso previo a salud mental, no asumir conocimiento de términos psicológicos.
Nunca uses: diagnóstico, trastorno, patología, enfermedad, anormal.
Sí puedes usar: patrón, señal, respuesta, experiencia, nivel, área.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT REQUERIDO — FORMATO JSON ESTRICTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Responde ÚNICAMENTE con un objeto JSON válido. Sin texto antes ni después. Sin bloques de código markdown. Sin explicaciones fuera del JSON.
{
  "parrafo_principal": "string — 60 a 90 palabras. Primera lectura de lo que revela el patrón global. Comienza siempre con 'Lo que muestran tus respuestas...' o 'El patrón que emerge...' — nunca con 'Tu puntuación indica...' (eso ya aparece en otra sección del reporte).",
  "parrafo_patron": "string — 60 a 90 palabras. Análisis del patrón dimensional: qué dimensión es más alta vs más baja, qué dice esa combinación sobre la experiencia subjetiva del usuario. Este párrafo debe ser el más personalizado — diferente para cada combinación dimensional posible.",
  "parrafo_contexto": "string — 40 a 60 palabras. Una sola idea sobre el contexto probable de este nivel: cuándo suele surgir, qué lo mantiene, sin asumir causas externas específicas.",
  "frase_cierre": "string — 20 a 30 palabras. Frase orientadora que normaliza sin minimizar y abre la puerta a la acción. Tono esperanzador pero realista."
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGLAS DE GENERACIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ANALIZA el patrón dimensional antes de escribir. No trates todos los niveles igual. Una ansiedad "moderada" con irritabilidad ALTA es diferente a una con irritabilidad BAJA. Esa diferencia debe aparecer en el parrafo_patron.
2. PRIORIZA las dimensiones con puntuación más alta. Son el núcleo del insight.
3. NO repitas información que ya aparece en otras secciones del reporte (puntuación total, rango, comparación normativa). Tu sección es solo interpretación.
4. NO uses nunca segunda persona plural ("ustedes"). Siempre singular ("tú").
5. NO hagas promesas terapéuticas. No digas "con terapia esto se resolverá". Usa lenguaje probabilístico: "suele responder bien a...", "tiende a mejorar con...".
6. Si el segmento es "familiar", cambia el enfoque: describe el patrón que el familiar observa en su ser querido, no síntomas propios.
7. Si el segmento es "rrhh", no generes interpretación individual. Retorna: { "error": "segmento_corporativo", "mensaje": "Las evaluaciones grupales no generan interpretación individual por usuario." }`

async function generateReport(session: Record<string, unknown>) {
  const responses = session.responses as Array<{ index: number; value: number; label: string; text: string }>
  const dimensionScores = (session.dimension_scores as Array<{ name: string; pct: number }>) ?? []

  const inputData = {
    instrumento: session.instrument,
    area: AREA_MAP[session.slug as string] ?? session.instrument_full,
    puntuacion_total: session.total_score,
    rango_maximo: session.max_score,
    categoria: session.severity_label,
    dimensiones: dimensionScores.map(d => ({
      nombre: d.name,
      puntuacion: d.pct,
      max: 100,
      nivel: d.pct >= 67 ? 'alta' : d.pct >= 34 ? 'moderada' : 'leve',
    })),
    respuestas_individuales: responses.map((r, i) => ({
      item: i + 1,
      texto: r.text,
      valor: r.value,
    })),
    segmento: 'adulto_individual',
  }

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: JSON.stringify(inputData, null, 2) }],
    }),
  })

  const anthropicData = await anthropicRes.json()
  const raw = anthropicData.content?.[0]?.text ?? ''

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in Claude response')
    const parsed = JSON.parse(jsonMatch[0])

    if (parsed.error) throw new Error(`Claude error: ${parsed.error}`)

    // Mapear al esquema existente de la BD sin migraciones
    return {
      interpretation: [parsed.parrafo_principal, parsed.parrafo_patron].filter(Boolean).join('\n\n'),
      normativeContext: parsed.parrafo_contexto ?? '',
      recommendations: parsed.frase_cierre
        ? [{ title: 'Para tener en cuenta', description: parsed.frase_cierre }]
        : [],
    }
  } catch {
    return {
      interpretation: raw.slice(0, 800) || 'Reporte en proceso de generación.',
      normativeContext: 'Los resultados han sido registrados correctamente.',
      recommendations: [],
    }
  }
}
