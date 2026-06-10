/**
 * Edge Function: delete-user-data
 *
 * Derecho de supresión (Ley 172-13 RD / RGPD). Solo ejecutable por un admin.
 *
 * Estrategia:
 *   - ELIMINA datos clínicos y personales (mensajes, diario, check-ins,
 *     tests, historial clínico, planes de crisis, etc.)
 *   - ANONIMIZA el perfil (nombre, email, avatar, datos demográficos) y
 *     los datos de cobro del terapeuta
 *   - CONSERVA registros financieros (sessions, refunds, payouts,
 *     subscription_payments) por obligación contable — quedan vinculados
 *     a un perfil anonimizado
 *   - BANEA la cuenta auth (no se elimina: borrarla dispararía CASCADE
 *     sobre profiles → sessions y destruiría el historial financiero)
 *
 * Body esperado:
 *   { user_id: string, request_id?: string }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY    = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// Tablas con datos personales/clínicos a ELIMINAR: [tabla, columnas de usuario]
const HARD_DELETE: Array<[string, string[]]> = [
  ['messages',                   ['sender_id', 'receiver_id']],
  ['mood_entries',               ['patient_id']],
  ['mood_logs',                  ['patient_id']],
  ['ai_checkins',                ['patient_id']],
  ['patient_journal',            ['patient_id']],
  ['patient_tasks',              ['patient_id']],
  ['patient_achievements',       ['patient_id']],
  ['patient_progress',           ['patient_id']],
  ['safety_plans',               ['patient_id', 'therapist_id']],
  ['clinical_history',           ['patient_id', 'therapist_id']],
  ['clinical_assessments',       ['patient_id', 'therapist_id']],
  ['clinical_opinions',          ['patient_id', 'therapist_id', 'author_id']],
  ['risk_alerts',                ['patient_id']],
  ['notifications',              ['user_id']],
  ['notification_preferences',   ['user_id']],
  ['consent_signatures',         ['patient_id']],
  ['emergency_contacts',         ['patient_id']],
  ['test_results',               ['patient_id']],
  ['test_sessions',              ['patient_id']],
  ['test_assignments',           ['patient_id', 'therapist_id']],
  ['reviews',                    ['patient_id']],
  ['group_session_participants', ['patient_id']],
  ['therapeutic_relationships',  ['patient_id', 'therapist_id']],
  ['therapist_availability',     ['therapist_id']],
  ['therapist_blocked_dates',    ['therapist_id']],
  ['therapist_credentials',      ['therapist_id']],
  ['deletion_requests',          []], // se conserva: es el registro de la solicitud
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── 1. Autorización: solo admin ──────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'No autorizado' }, 401)

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) return json({ error: 'Sesión inválida' }, 401)

    const { data: isAdmin } = await callerClient.rpc('is_admin')
    if (!isAdmin) return json({ error: 'Requiere rol admin' }, 403)

    // ── 2. Validar input ─────────────────────────────────────────────
    const { user_id, request_id } = await req.json().catch(() => ({}))
    if (!user_id) return json({ error: 'user_id requerido' }, 400)
    if (user_id === caller.id) return json({ error: 'No puedes eliminarte a ti mismo' }, 400)

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { data: profile } = await admin
      .from('profiles').select('id, role, email, avatar_url').eq('id', user_id).single()
    if (!profile) return json({ error: 'Usuario no encontrado' }, 404)
    if (profile.role === 'admin') return json({ error: 'No se puede eliminar un admin' }, 400)

    if (request_id) {
      await admin.from('deletion_requests')
        .update({ status: 'processing' }).eq('id', request_id)
    }

    const report: Record<string, string> = {}

    // ── 3. Borrado de datos clínicos/personales ──────────────────────
    // (item_responses cae por CASCADE al eliminar test_sessions)
    for (const [table, cols] of HARD_DELETE) {
      for (const col of cols) {
        const { error } = await admin.from(table).delete().eq(col, user_id)
        // Tablas que pueden no existir aún: registrar y continuar
        report[`${table}.${col}`] = error ? `skip (${error.code})` : 'ok'
      }
    }

    // ── 4. Storage: avatar y credenciales ────────────────────────────
    try {
      const { data: avatarFiles } = await admin.storage.from('avatars').list(user_id)
      if (avatarFiles?.length) {
        await admin.storage.from('avatars')
          .remove(avatarFiles.map((f) => `${user_id}/${f.name}`))
      }
      const { data: credFiles } = await admin.storage.from('credentials').list(user_id)
      if (credFiles?.length) {
        await admin.storage.from('credentials')
          .remove(credFiles.map((f) => `${user_id}/${f.name}`))
      }
      report['storage'] = 'ok'
    } catch (_e) {
      report['storage'] = 'skip'
    }

    // ── 5. Anonimizar perfil ─────────────────────────────────────────
    const anonEmail = `deleted-${user_id.slice(0, 8)}@psiconecta.app`
    await admin.from('profiles').update({
      full_name: 'Usuario eliminado',
      email: anonEmail,
      avatar_url: null,
      is_anonymous: true,
    }).eq('id', user_id)
    // Columnas que pueden no existir aún (migration_add_profile_fields)
    await admin.from('profiles').update({
      gender: null, birth_date: null,
    }).eq('id', user_id).then(() => {}, () => {})

    if (profile.role === 'therapist') {
      await admin.from('therapist_profiles').update({
        bio: null,
        verified: false,
      }).eq('user_id', user_id)
      // Datos de cobro (pueden no existir hasta migration_payouts_*)
      await admin.from('therapist_profiles').update({
        paypal_email: null, bank_name: null, bank_account_name: null,
        bank_account_number: null, bank_routing: null,
      }).eq('user_id', user_id).then(() => {}, () => {})
    }

    // ── 6. Bloquear la cuenta auth (ban 100 años + credenciales rotas) ─
    await admin.auth.admin.updateUserById(user_id, {
      email: anonEmail,
      password: crypto.randomUUID() + crypto.randomUUID(),
      ban_duration: '876000h',
      user_metadata: { deleted: true },
    })

    // ── 7. Cerrar la solicitud y dejar rastro de auditoría ───────────
    if (request_id) {
      await admin.from('deletion_requests').update({
        status: 'completed',
        processed_by: caller.id,
        processed_at: new Date().toISOString(),
      }).eq('id', request_id)
    }
    await admin.from('audit_log').insert({
      actor_id: caller.id,
      action: 'delete_user_data',
      detail: JSON.stringify({ user_id, request_id }),
    }).then(() => {}, () => {})

    return json({ success: true, report }, 200)
  } catch (err) {
    console.error('delete-user-data error:', err)
    return json({ error: 'Error interno' }, 500)
  }
})

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
