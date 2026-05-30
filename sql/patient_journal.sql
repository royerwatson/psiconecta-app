-- ─── Diario personal del paciente ────────────────────────────────────────────
-- Ejecutar en: Supabase → SQL Editor → New query

create table if not exists patient_journal (
  id          uuid        default gen_random_uuid() primary key,
  patient_id  uuid        references auth.users(id) on delete cascade not null,
  title       text,
  content     text        not null,
  prompt      text,
  mood_tag    text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Índice para consultas por paciente ordenadas por fecha
create index if not exists idx_patient_journal_patient_date
  on patient_journal(patient_id, created_at desc);

-- ─── RLS — solo el propio paciente puede ver y modificar sus entradas ─────────
alter table patient_journal enable row level security;

-- Solo el paciente puede leer sus propias entradas
create policy "patient_journal_select"
  on patient_journal for select
  using (auth.uid() = patient_id);

-- Solo el paciente puede crear entradas
create policy "patient_journal_insert"
  on patient_journal for insert
  with check (auth.uid() = patient_id);

-- Solo el paciente puede actualizar sus entradas
create policy "patient_journal_update"
  on patient_journal for update
  using (auth.uid() = patient_id)
  with check (auth.uid() = patient_id);

-- Solo el paciente puede eliminar sus entradas
create policy "patient_journal_delete"
  on patient_journal for delete
  using (auth.uid() = patient_id);
