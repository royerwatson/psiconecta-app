/**
 * generate-pack-report
 * Genera el reporte combinado cruzado de un paquete de evaluaciones usando Claude.
 * Se llama después de que el usuario completa todos los tests del pack.
 * Body: { purchaseId }
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

const SYSTEM_PROMPT_PACK = `SISTEMA — IA CLÍNICA PSICONECTA
Módulo: Reporte Integrado de Paquete Temático

Eres el motor de interpretación clínica de Psiconecta. Tu función es generar un reporte CRUZADO que analice los resultados de MÚLTIPLES instrumentos clínicos de forma integrada, identificando patrones y conexiones entre las distintas áreas evaluadas.

ROL Y TONO
- Cálido pero directo. Clínico pero accesible.
- Culturalmente adaptado al contexto latinoamericano.
- Nunca uses: diagnóstico, trastorno, patología, enfermedad, anormal.
- Sí puedes usar: patrón, señal, respuesta, experiencia, nivel, área.

OUTPUT REQUERIDO — FORMATO JSON ESTRICTO
Responde ÚNICAMENTE con un objeto JSON válido. Sin texto antes ni después.

{
  "titulo_reporte": "string — título personalizado del reporte (ej. 'Tu Mapa de Bienestar Emocional')",
  "resumen_ejecutivo": "string — 80-100 palabras. Síntesis del estado general considerando TODOS los instrumentos. Comienza con 'El conjunto de tus resultados revela...' o 'Mirando tus respuestas en conjunto...'",
  "analisis_cruzado": "string — 100-130 palabras. El insight más valioso: cómo se CONECTAN las áreas entre sí. Por ejemplo, cómo el burnout alimenta la ansiedad, o cómo el sueño deteriorado amplifica la depresión. Este es el valor diferencial del reporte integrado.",
  "patrones_clave": [
    { "titulo": "string — nombre del patrón (ej. 'Ciclo estrés-insomnio')", "descripcion": "string — 40-60 palabras explicando el patrón observado" }
  ],
  "recomendaciones": [
    { "titulo": "string", "descripcion": "string — 30-50 palabras. Recomendación concreta y accionable." }
  ],
  "frase_cierre": "string — 25-35 palabras. Mensaje integrador esperanzador pero realista."
}

REGLAS:
1. El analisis_cruzado es la pieza más importante — diferencia este reporte de reportes individuales.
2. Genera 2-3 patrones_clave basados en las combinaciones reales de resultados.
3. Genera 3-4 recomendaciones priorizadas por el nivel de urgencia implícito.
4. Si un área tiene nivel SEVERO, dale más peso en el análisis.
5. Nunca repitas la misma idea en resumen_ejecutivo y analisis_cruzado.`

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

    const { purchaseId } = await req.json()
    if (!purchaseId) return new Response(JSON.stringify({ error: 'purchaseId requerido' }), { status: 400, headers: cors })

    // Verificar compra
    const { data: purchase, error: fetchErr } = await supabase
      .from('assessment_pack_purchases')
      .select('*')
      .eq('id', purchaseId)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !purchase) return new Response(JSON.stringify({ error: 'Compra no encontrada' }), { status: 404, headers: cors })
    if (!purchase.paid) return new Response(JSON.stringify({ error: 'Pago pendiente' }), { status: 402, headers: cors })

    // Si ya existe un reporte, retornarlo
    const { data: existing } = await supabase
      .from('assessment_pack_reports')
      .select('*')
      .eq('purchase_id', purchaseId)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ success: true, report: existing }), { headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    // Obtener las sesiones de assessment completadas del usuario para este pack
    const sessionIds: string[] = purchase.session_ids ?? []
    if (sessionIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No hay tests completados aún' }), { status: 400, headers: cors })
    }

    const { data: sessions, error: sessErr } = await supabase
      .from('assessment_sessions')
      .select('slug, instrument, instrument_full, total_score, max_score, severity_label, dimension_scores, responses')
      .in('id', sessionIds)

    if (sessErr || !sessions?.length) throw new Error('No se encontraron sesiones')

    // Preparar datos para Claude
    const AREA_MAP: Record<string, string> = {
      ansiedad: 'Ansiedad & Estrés',
      depresion: 'Ánimo & Depresión',
      sueno: 'Calidad del Sueño',
      burnout: 'Trabajo & Burnout',
    }

    const inputData = {
      pack: purchase.pack_slug,
      total_instrumentos: sessions.length,
      resultados: sessions.map(s => ({
        area: AREA_MAP[s.slug] ?? s.instrument,
        instrumento: s.instrument,
        puntuacion: s.total_score,
        maximo: s.max_score,
        porcentaje: Math.round((s.total_score / s.max_score) * 100),
        nivel: s.severity_label,
        dimensiones: (s.dimension_scores ?? []).map((d: {name: string; pct: number}) => ({
          nombre: d.name,
          nivel_pct: d.pct,
          nivel: d.pct >= 67 ? 'alto' : d.pct >= 34 ? 'moderado' : 'bajo',
        })),
      })),
    }

    // Llamar a Claude
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
        system: SYSTEM_PROMPT_PACK,
        messages: [{ role: 'user', content: JSON.stringify(inputData, null, 2) }],
      }),
    })

    const anthropicData = await anthropicRes.json()
    const raw = anthropicData.content?.[0]?.text ?? ''

    let parsed: Record<string, unknown>
    try {
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No JSON in Claude response')
      parsed = JSON.parse(match[0])
    } catch {
      parsed = {
        titulo_reporte: 'Tu Reporte Integrado',
        resumen_ejecutivo: raw.slice(0, 300) || 'Reporte generado correctamente.',
        analisis_cruzado: 'Los resultados de tus evaluaciones han sido analizados.',
        patrones_clave: [],
        recomendaciones: [],
        frase_cierre: 'Este es un primer paso importante hacia tu bienestar.',
      }
    }

    // Guardar reporte
    const { data: savedReport, error: saveErr } = await supabase
      .from('assessment_pack_reports')
      .insert({
        purchase_id:     purchaseId,
        user_id:         user.id,
        pack_slug:       purchase.pack_slug,
        combined_report: [parsed.resumen_ejecutivo, parsed.analisis_cruzado].filter(Boolean).join('\n\n'),
        cross_analysis:  parsed.analisis_cruzado ?? '',
        recommendations: parsed.recomendaciones ?? parsed.recommendations ?? [],
        session_results: sessions.map(s => ({
          slug: s.slug,
          instrument: s.instrument,
          total_score: s.total_score,
          max_score: s.max_score,
          severity_label: s.severity_label,
          dimension_scores: s.dimension_scores,
        })),
      })
      .select('*')
      .single()

    if (saveErr) throw saveErr

    // Marcar pack como completado
    await supabase
      .from('assessment_pack_purchases')
      .update({ completed: true })
      .eq('id', purchaseId)

    console.log(`[generate-pack-report] Pack ${purchase.pack_slug} completado — user ${user.id}`)

    return new Response(
      JSON.stringify({ success: true, report: { ...savedReport, parsed } }),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('generate-pack-report error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: getCorsHeaders(req) })
  }
})
