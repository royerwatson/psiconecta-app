-- ─────────────────────────────────────────────────────────────────────────────
-- DATOS BANCARIOS en perfil del terapeuta
-- ─────────────────────────────────────────────────────────────────────────────
alter table therapist_profiles
  add column if not exists paypal_email       text,     -- PayPal (opcional, para pagos automáticos)
  add column if not exists bank_name          text,     -- Nombre del banco
  add column if not exists bank_account_name  text,     -- Nombre del titular
  add column if not exists bank_account_number text,    -- Número de cuenta / IBAN
  add column if not exists bank_routing       text,     -- Routing / SWIFT / CLABE
  add column if not exists payment_method     text default 'bank_transfer'
    check (payment_method in ('paypal', 'bank_transfer'));

-- ─────────────────────────────────────────────────────────────────────────────
-- PAYOUTS — registro de liquidaciones a terapeutas
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists payouts (
  id                      uuid    default gen_random_uuid() primary key,
  therapist_id            uuid    references auth.users(id) on delete cascade not null,
  amount                  numeric(10,2) not null,           -- monto en USD / moneda local
  currency                text    default 'USD',
  payment_method          text    default 'bank_transfer'   -- paypal | bank_transfer | manual
                            check (payment_method in ('paypal','bank_transfer','manual')),

  -- Destino del pago
  paypal_email            text,                             -- si es via PayPal
  bank_name               text,                             -- si es via banco
  bank_account_name       text,
  bank_account_number     text,
  bank_routing            text,

  -- Estado y referencias externas
  status                  text    default 'pending'
                            check (status in ('pending','processing','completed','failed')),
  paypal_payout_batch_id  text,                             -- devuelto por PayPal Payouts API
  paypal_payout_item_id   text,
  reference               text,                             -- referencia de transferencia bancaria
  period_start            date,                             -- inicio del período liquidado
  period_end              date,                             -- fin del período liquidado
  note                    text,                             -- nota interna del admin
  error_message           text,                             -- detalle si falla
  created_at              timestamptz default now(),
  paid_at                 timestamptz                       -- cuando se confirmó el pago
);

alter table payouts enable row level security;

-- El terapeuta puede ver sus propios pagos (sin ver datos bancarios de otros)
create policy "therapist_view_own_payouts" on payouts
  for select using (auth.uid() = therapist_id);

-- Solo service_role (Edge Functions / admin) puede insertar y actualizar
-- (las políticas INSERT/UPDATE quedan en manos del service_role key)

-- Índices
create index if not exists payouts_therapist_status  on payouts(therapist_id, status, created_at desc);
create index if not exists payouts_status_date       on payouts(status, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- VISTA: ganancias pendientes de liquidación por terapeuta
-- ─────────────────────────────────────────────────────────────────────────────
create or replace view therapist_pending_earnings as
select
  s.therapist_id,
  p.full_name                                                   as therapist_name,
  tp.specialty,
  tp.payment_method,
  tp.paypal_email,
  tp.bank_name,
  tp.bank_account_name,
  tp.bank_account_number,
  tp.bank_routing,
  count(s.id)                                                   as sessions_count,
  coalesce(sum(s.price), 0)                                     as total_earned,
  coalesce(sum(s.price), 0) - coalesce(paid.total_paid, 0)      as pending_amount,
  coalesce(paid.total_paid, 0)                                  as total_paid,
  min(s.scheduled_at)::date                                     as earliest_session,
  max(s.scheduled_at)::date                                     as latest_session
from sessions s
join profiles         p  on p.id        = s.therapist_id
join therapist_profiles tp on tp.user_id = s.therapist_id
left join (
  select therapist_id, sum(amount) as total_paid
  from payouts
  where status = 'completed'
  group by therapist_id
) paid on paid.therapist_id = s.therapist_id
where s.status = 'completed'
group by
  s.therapist_id, p.full_name, tp.specialty, tp.payment_method,
  tp.paypal_email, tp.bank_name, tp.bank_account_name,
  tp.bank_account_number, tp.bank_routing, paid.total_paid
having coalesce(sum(s.price), 0) - coalesce(paid.total_paid, 0) > 0
order by pending_amount desc;
