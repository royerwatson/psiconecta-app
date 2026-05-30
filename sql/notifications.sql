-- ─────────────────────────────────────────────────────────────────────────────
-- MOOD ENTRIES — registro diario de estado de ánimo del paciente
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists mood_entries (
  id          uuid default gen_random_uuid() primary key,
  patient_id  uuid references auth.users(id) on delete cascade not null,
  mood        int  not null check (mood between 1 and 5),
  note        text,
  created_at  timestamptz default now()
);

alter table mood_entries enable row level security;

create policy "patient_mood_all" on mood_entries
  for all using (auth.uid() = patient_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS — alertas in-app para cualquier usuario
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists notifications (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  type       text not null,
  -- Tipos: 'new_task' | 'session_confirmed' | 'session_cancelled'
  --        | 'notes_released' | 'new_message' | 'checkin_alert'
  title      text not null,
  body       text,
  link       text,          -- ruta interna: '/patient/tasks', etc.
  read       boolean default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

-- Cada usuario solo ve sus propias notificaciones
create policy "own_notifications" on notifications
  for all using (auth.uid() = user_id);

-- Índice para consultas frecuentes
create index if not exists notifications_user_unread
  on notifications(user_id, read, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: nueva tarea asignada → notificación al paciente
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function notify_new_task()
returns trigger language plpgsql security definer as $$
begin
  insert into notifications(user_id, type, title, body, link)
  values (
    new.patient_id,
    'new_task',
    '📋 Nueva tarea asignada',
    coalesce(new.title, 'Tu terapeuta te ha asignado una nueva actividad.'),
    '/patient/tasks'
  );
  return new;
end;
$$;

drop trigger if exists on_new_task on patient_tasks;
create trigger on_new_task
  after insert on patient_tasks
  for each row execute function notify_new_task();

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: sesión programada → notificación al paciente
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function notify_session_change()
returns trigger language plpgsql security definer as $$
declare
  therapist_name text;
begin
  -- Solo disparar en insert con status=scheduled, o update que cambia status
  if (TG_OP = 'INSERT' and new.status = 'scheduled') or
     (TG_OP = 'UPDATE' and old.status <> new.status) then

    select full_name into therapist_name
    from profiles where id = new.therapist_id;

    if new.status = 'scheduled' then
      insert into notifications(user_id, type, title, body, link)
      values (
        new.patient_id,
        'session_confirmed',
        '📅 Sesión confirmada',
        'Tu sesión con ' || coalesce(therapist_name, 'tu terapeuta') || ' ha sido programada.',
        '/patient/appointments'
      );
    elsif new.status = 'cancelled' then
      insert into notifications(user_id, type, title, body, link)
      values (
        new.patient_id,
        'session_cancelled',
        '❌ Sesión cancelada',
        'La sesión con ' || coalesce(therapist_name, 'tu terapeuta') || ' fue cancelada.',
        '/patient/appointments'
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_session_change on sessions;
create trigger on_session_change
  after insert or update of status on sessions
  for each row execute function notify_session_change();

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: notas clínicas liberadas → notificación al paciente
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function notify_notes_released()
returns trigger language plpgsql security definer as $$
begin
  if new.is_released = true and (old.is_released is null or old.is_released = false) then
    insert into notifications(user_id, type, title, body, link)
    values (
      new.patient_id,
      'notes_released',
      '📄 Notas clínicas disponibles',
      'Tu terapeuta ha compartido un resumen de tu sesión contigo.',
      '/patient/sessions'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_notes_released on clinical_history;
create trigger on_notes_released
  after update of is_released on clinical_history
  for each row execute function notify_notes_released();
