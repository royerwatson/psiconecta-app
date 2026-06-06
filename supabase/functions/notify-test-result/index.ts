/**
 * notify-test-result
 * Notifica al paciente que su terapeuta liberó un resultado de test.
 * Llamada desde PatientDetail.jsx cuando toggleReleaseNote activa is_released = true.
 *
 * Body: { patientId: string, testName: string }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, testResultAvailableEmail } from '../_shared/email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://psiconecta.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    // Solo terapeutas autenticados pueden invocar esta función
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) throw new Error('No autorizado')

    const { patientId, testName } = await req.json()
    if (!patientId || !testName) throw new Error('Faltan patientId o testName')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verificar que el terapeuta tiene relación con el paciente
    const { data: relationship } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .eq('therapist_id', user.id)
      .eq('patient_id', patientId)
      .limit(1)
      .single()

    if (!relationship) throw new Error('No autorizado: sin relación con este paciente')

    const [patientAuth, patientProfile, therapistProfile] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(patientId),
      supabaseAdmin.from('profiles').select('full_name').eq('id', patientId).single(),
      supabaseAdmin.from('profiles').select('full_name').eq('id', user.id).single(),
    ])

    const patientEmail = patientAuth.data?.user?.email
    if (!patientEmail) throw new Error('Email del paciente no encontrado')

    await sendEmail({
      to: patientEmail,
      subject: `Tu resultado de ${testName} está disponible en Psiconecta`,
      html: testResultAvailableEmail({
        patientName:   patientProfile.data?.full_name ?? 'Paciente',
        testName,
        therapistName: therapistProfile.data?.full_name ?? 'Tu terapeuta',
      }),
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[notify-test-result]', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
