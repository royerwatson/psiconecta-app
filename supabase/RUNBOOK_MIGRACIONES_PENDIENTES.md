# Runbook — Migraciones pendientes (2026-06-09)

Ejecutar en **Supabase SQL Editor**, en este orden. Cada archivo es idempotente (se puede re-ejecutar sin daño).

## Orden de ejecución

1. `migration_add_profile_fields.sql` — columnas `gender`, `birth_date`, `preferred_language` en `profiles`.
2. `migration_payouts_and_payment_fields.sql` — tabla `payouts`, vista `therapist_pending_earnings`, campos de cobro y de perfil profesional. **Actualizada:** política admin con `WITH CHECK` + `is_admin()`, y vista con `security_invoker = true` (sin esto la vista exponía cuentas bancarias a cualquier usuario autenticado).
3. `migration_commission_rates.sql` — comisión 20% Gratuito / 10% Pro. **Urgente: hoy se cobra 10% a todos.**
4. `migration_public_reviews.sql` — **reescrita (v2):** en lugar de abrir RLS a `anon` (exponía `patient_id`/`session_id` y de todas formas el join a `profiles` fallaba), crea la RPC `get_public_reviews()` que devuelve solo campos seguros con nombre anonimizado server-side. `LandingPage.jsx` ya fue actualizada para usarla.

## Verificación post-ejecución

```sql
-- 1. Columnas nuevas en profiles
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('gender','birth_date','preferred_language');

-- 2. Vista con security_invoker activo (debe devolver una fila)
SELECT relname, reloptions FROM pg_class
WHERE relname = 'therapist_pending_earnings';
-- reloptions debe incluir security_invoker=true

-- 3. Comisiones correctas (no debe devolver filas)
SELECT user_id, subscription_plan, commission_rate FROM therapist_profiles
WHERE (subscription_plan IN ('pro','premium') AND commission_rate <> 0.10)
   OR (subscription_plan NOT IN ('pro','premium') AND commission_rate <> 0.20);

-- 4. RPC de reviews funciona (como anon desde la landing)
SELECT * FROM get_public_reviews(5);
```

## Post-migración (código)

- `FindTherapist.jsx` y `TherapistMatchPage.jsx`: restaurar las columnas
  `languages, years_experience, approaches, education` en los SELECT
  (fueron removidas como workaround mientras la migración 2 estaba pendiente).
- Verificar testimonios de la landing en producción (ahora vía RPC).
- Verificar `/admin/payouts` con un usuario admin y con un terapeuta
  (el terapeuta NO debe poder leer la vista completa, solo sus payouts).
- Actualizar PROJECT_STATE.md §3 marcando las 4 migraciones como ejecutadas.
