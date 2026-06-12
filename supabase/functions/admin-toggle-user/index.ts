import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { getCorsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Verify calling user is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    // Check admin role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return new Response('Forbidden', { status: 403, headers: corsHeaders })
    }

    // Get request body
    const { userId, activate } = await req.json()
    if (!userId) return new Response('Missing userId', { status: 400, headers: corsHeaders })

    // Update profile is_active flag
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: activate })
      .eq('id', userId)

    if (profileError) throw profileError

    // Ban/unban in Supabase Auth
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: activate ? 'none' : '876000h', // unban or ban for 100 years
    })

    if (authUpdateError) {
      console.error('Auth update error (non-fatal):', authUpdateError)
      // Non-fatal: profile flag was updated, auth ban may have failed
    }

    return new Response(
      JSON.stringify({ success: true, is_active: activate }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('admin-toggle-user error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
