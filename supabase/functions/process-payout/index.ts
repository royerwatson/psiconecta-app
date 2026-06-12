/**
 * process-payout — Edge Function para liquidar ganancias a terapeutas
 *
 * Soporta dos modos:
 *   1. bank_transfer : crea el registro con status "processing"
 *      El admin hace la transferencia bancaria manualmente y luego
 *      llama a este mismo endpoint con { action:"confirm", payoutId, reference }
 *      para marcarla como completada.
 *
 *   2. paypal : llama a la PayPal Payouts API y envía al email PayPal
 *      del terapeuta. El terapeuta puede luego transferir a su banco desde PayPal.
 *
 * Body esperado para iniciar:
 *   { action:"create", therapistId, amount, currency?, note?, method?, periodStart?, periodEnd? }
 *
 * Body esperado para confirmar (bank_transfer):
 *   { action:"confirm", payoutId, reference }
 *
 * Body esperado para fallar:
 *   { action:"fail", payoutId, errorMessage }
 *
 * Solo admins (token de service_role o usuario con role="admin") pueden llamar esto.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { getCorsHeaders } from '../_shared/cors.ts'

// ── PayPal helpers ──────────────────────────────────────────────────────────

async function getPayPalToken(): Promise<string> {
  const clientId     = Deno.env.get('PAYPAL_CLIENT_ID')!
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')!
  const baseUrl      = Deno.env.get('PAYPAL_BASE_URL') ?? 'https://api-m.sandbox.paypal.com'

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('No se pudo obtener token de PayPal')
  return data.access_token
}

async function sendPayPalPayout(opts: {
  payoutId: string
  recipientEmail: string
  amount: number
  currency: string
  note: string
}) {
  const baseUrl = Deno.env.get('PAYPAL_BASE_URL') ?? 'https://api-m.sandbox.paypal.com'
  const token   = await getPayPalToken()

  const body = {
    sender_batch_header: {
      sender_batch_id: opts.payoutId,
      email_subject: 'Psiconecta — Tu pago está en camino',
      email_message: opts.note || 'Has recibido un pago de Psiconecta por tus sesiones completadas.',
    },
    items: [
      {
        recipient_type: 'EMAIL',
        amount: {
          value: opts.amount.toFixed(2),
          currency: opts.currency,
        },
        note: opts.note || 'Liquidación de sesiones — Psiconecta',
        sender_item_id: opts.payoutId,
        receiver: opts.recipientEmail,
        purpose: 'SERVICES',
      },
    ],
  }

  const res = await fetch(`${baseUrl}/v1/payments/payouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) throw new Error('PayPal Payouts error: ' + JSON.stringify(data))

  return {
    batchId: data.batch_header?.payout_batch_id ?? null,
    itemId:  data.items?.[0]?.payout_item_id ?? null,
  }
}

// ── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    // Verificar que el caller es admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // Verificar rol admin
    const { data: profile } = await supabaseAdmin
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') throw new Error('Forbidden: only admins can process payouts')

    const body = await req.json()
    const { action } = body

    // ── ACCION: crear payout ──────────────────────────────────────────────────
    if (action === 'create') {
      const {
        therapistId, amount, currency = 'USD',
        note, periodStart, periodEnd,
      } = body

      if (!therapistId || !amount) throw new Error('Faltan campos: therapistId, amount')

      // Obtener datos bancarios del terapeuta
      const { data: tp, error: tpErr } = await supabaseAdmin
        .from('therapist_profiles')
        .select('paypal_email, bank_name, bank_account_name, bank_account_number, bank_routing, payment_method')
        .eq('user_id', therapistId)
        .single()

      if (tpErr || !tp) throw new Error('Terapeuta no encontrado')

      const method = tp.payment_method ?? 'bank_transfer'

      // Crear registro en payouts
      const { data: payout, error: payoutErr } = await supabaseAdmin
        .from('payouts')
        .insert({
          therapist_id:        therapistId,
          amount,
          currency,
          payment_method:      method,
          paypal_email:        tp.paypal_email,
          bank_name:           tp.bank_name,
          bank_account_name:   tp.bank_account_name,
          bank_account_number: tp.bank_account_number,
          bank_routing:        tp.bank_routing,
          period_start:        periodStart ?? null,
          period_end:          periodEnd   ?? null,
          note,
          status:              method === 'paypal' ? 'processing' : 'processing',
        })
        .select('id')
        .single()

      if (payoutErr || !payout) throw new Error('Error creando payout: ' + payoutErr?.message)

      // Si es PayPal y tiene email, disparar Payouts API automáticamente
      if (method === 'paypal' && tp.paypal_email) {
        try {
          const { batchId, itemId } = await sendPayPalPayout({
            payoutId:       payout.id,
            recipientEmail: tp.paypal_email,
            amount,
            currency,
            note: note ?? `Liquidación Psiconecta — ${periodStart ?? ''} al ${periodEnd ?? ''}`,
          })

          await supabaseAdmin.from('payouts').update({
            paypal_payout_batch_id: batchId,
            paypal_payout_item_id:  itemId,
            status: 'processing',
          }).eq('id', payout.id)

          return new Response(JSON.stringify({
            success: true, payoutId: payout.id, method: 'paypal', batchId, itemId,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

        } catch (ppErr) {
          // Guardar el error pero no fallar todo — el admin puede confirmar manualmente
          await supabaseAdmin.from('payouts').update({
            status: 'failed',
            error_message: ppErr.message,
          }).eq('id', payout.id)

          throw ppErr
        }
      }

      // Bank transfer — solo crear el registro, admin hace la transferencia manualmente
      return new Response(JSON.stringify({
        success: true, payoutId: payout.id, method: 'bank_transfer',
        message: 'Payout creado. Realiza la transferencia y confirma con el ID de referencia.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── ACCION: confirmar transferencia bancaria ───────────────────────────────
    if (action === 'confirm') {
      const { payoutId, reference } = body
      if (!payoutId) throw new Error('Falta payoutId')

      const { error } = await supabaseAdmin.from('payouts').update({
        status:    'completed',
        reference: reference ?? null,
        paid_at:   new Date().toISOString(),
      }).eq('id', payoutId)

      if (error) throw new Error('Error confirmando payout: ' + error.message)

      return new Response(JSON.stringify({ success: true, payoutId, status: 'completed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── ACCION: marcar como fallido ───────────────────────────────────────────
    if (action === 'fail') {
      const { payoutId, errorMessage } = body
      if (!payoutId) throw new Error('Falta payoutId')

      await supabaseAdmin.from('payouts').update({
        status: 'failed',
        error_message: errorMessage ?? 'Error desconocido',
      }).eq('id', payoutId)

      return new Response(JSON.stringify({ success: true, payoutId, status: 'failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    throw new Error(`Acción desconocida: ${action}`)

  } catch (err) {
    console.error('[process-payout]', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
