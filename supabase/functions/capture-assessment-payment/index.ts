import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1'
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

    // Enviar reporte por correo electrónico con PDF adjunto
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

      // Generar PDF adjunto
      let pdfAttachment: Array<{ filename: string; content: string }> | undefined
      try {
        const pdfBytes = await generatePDFBytes({
          patientName,
          session,
          interpretation: report.interpretation,
          normativeContext: report.normativeContext,
          fraseCierre: report.recommendations?.[0]?.description ?? '',
        })
        const base64 = btoa(pdfBytes.reduce((s, b) => s + String.fromCharCode(b), ''))
        pdfAttachment = [{ filename: `reporte_${session.slug}_psiconecta.pdf`, content: base64 }]
      } catch (pdfErr) {
        console.error('PDF generation error (non-fatal):', pdfErr)
      }

      await sendEmail({
        to: user.email!,
        subject: `Tu reporte de ${session.instrument_full} · Psiconecta`,
        html: emailHtml,
        attachments: pdfAttachment,
      })
    } catch (emailErr) {
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

/* ── Generador de PDF server-side ────────────────────────────────────── */
async function generatePDFBytes({
  patientName,
  session,
  interpretation,
  normativeContext,
  fraseCierre,
}: {
  patientName: string
  session: Record<string, unknown>
  interpretation: string
  normativeContext: string
  fraseCierre: string
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold)

  const W = 595, H = 842, margin = 50
  const cw = W - margin * 2
  const ink   = rgb(0.08, 0.09, 0.14)
  const muted = rgb(0.38, 0.45, 0.56)
  const brand = rgb(0.31, 0.27, 0.90)

  let page = doc.addPage([W, H])
  let y = H - margin

  function wrap(text: string, font: typeof regular, size: number, maxW: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let line = ''
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(test, size) > maxW && line) {
        lines.push(line); line = word
      } else { line = test }
    }
    if (line) lines.push(line)
    return lines
  }

  function addLines(lines: string[], font: typeof regular, size: number, color = ink, leading = size * 1.55) {
    for (const line of lines) {
      if (y < margin + 30) { page = doc.addPage([W, H]); y = H - margin }
      page.drawText(line, { x: margin, y, size, font, color })
      y -= leading
    }
  }

  function addParagraph(text: string, font: typeof regular, size: number, color = ink) {
    addLines(wrap(text, font, size, cw), font, size, color)
    y -= 6
  }

  function addSection(title: string) {
    if (y < margin + 60) { page = doc.addPage([W, H]); y = H - margin }
    y -= 6
    page.drawRectangle({ x: margin, y: y - 2, width: cw, height: 1, color: rgb(0.88, 0.88, 0.92) })
    y -= 14
    addLines([title.toUpperCase()], bold, 8, brand, 14)
    y -= 4
  }

  // ── Header ──────────────────────────────────────────────────────────
  addLines(['PSICONECTA'], bold, 10, brand, 16)
  addLines(['Reporte de Evaluación Psicométrica'], bold, 16, ink, 22)
  addParagraph(session.instrument_full as string, regular, 11, muted)
  y -= 4

  // ── Score card ──────────────────────────────────────────────────────
  const cardH = 52
  page.drawRectangle({ x: margin, y: y - cardH, width: cw, height: cardH, color: rgb(0.31, 0.27, 0.90), borderRadius: 8 })
  page.drawText(`${session.total_score} / ${session.max_score}`, { x: margin + 16, y: y - 22, size: 22, font: bold, color: rgb(1, 1, 1) })
  page.drawText(session.severity_label as string, { x: margin + 16, y: y - 40, size: 10, font: regular, color: rgb(0.78, 0.75, 1) })
  page.drawText(new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' }), { x: W - margin - 120, y: y - 22, size: 9, font: regular, color: rgb(0.78, 0.75, 1) })
  page.drawText(patientName, { x: W - margin - 120, y: y - 38, size: 9, font: regular, color: rgb(0.78, 0.75, 1) })
  y -= cardH + 18

  // ── Dimensiones ─────────────────────────────────────────────────────
  const dims = (session.dimension_scores as Array<{ name: string; pct: number }>) ?? []
  if (dims.length > 0) {
    addSection('Desglose por dimensión')
    for (const d of dims) {
      addLines([`${d.name}: ${d.pct}%`], regular, 10, ink, 15)
      const barW = (cw - 80) * (d.pct / 100)
      page.drawRectangle({ x: margin, y: y - 2, width: cw - 80, height: 5, color: rgb(0.92, 0.92, 0.96), borderRadius: 2 })
      page.drawRectangle({ x: margin, y: y - 2, width: barW, height: 5, color: brand, borderRadius: 2 })
      y -= 12
    }
    y -= 4
  }

  // ── Interpretación ─────────────────────────────────────────────────
  addSection('Interpretación')
  for (const para of interpretation.split('\n\n').filter(Boolean)) {
    addParagraph(para, regular, 10)
  }

  // ── Contexto ──────────────────────────────────────────────────────
  if (normativeContext) {
    addSection('Contexto')
    addParagraph(normativeContext, regular, 10)
  }

  // ── Para tener en cuenta ──────────────────────────────────────────
  if (fraseCierre) {
    addSection('Para tener en cuenta')
    if (y < margin + 50) { page = doc.addPage([W, H]); y = H - margin }
    const quoteLines = wrap(`"${fraseCierre}"`, regular, 10, cw - 20)
    const quoteH = quoteLines.length * 16 + 16
    page.drawRectangle({ x: margin, y: y - quoteH, width: cw, height: quoteH, color: rgb(0.96, 0.95, 1), borderRadius: 6 })
    y -= 10
    addLines(quoteLines, regular, 10, brand, 16)
    y -= 8
  }

  // ── Footer ────────────────────────────────────────────────────────
  const pages = doc.getPages()
  for (const p of pages) {
    p.drawText('Este reporte es confidencial · psiconecta.app', {
      x: margin, y: 20, size: 8, font: regular, color: muted,
    })
  }

  return doc.save()
}
