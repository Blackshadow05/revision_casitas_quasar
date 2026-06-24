-- Firebase Cloud Messaging tokens for Quiniela notifications only.
-- Supabase project: snkyczysawxjrpmvtzqy

create table if not exists public.qn_fcm_tokens (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.qn_participantes(id) on delete cascade,
  token text not null unique,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.qn_fcm_tokens enable row level security;

create index if not exists qn_fcm_tokens_participant_id_idx
  on public.qn_fcm_tokens(participant_id);

create or replace function public.qn_guardar_fcm_token(
  p_nombre text,
  p_pin text,
  p_token text,
  p_ua text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant uuid;
begin
  if nullif(btrim(p_token), '') is null then
    raise exception 'TOKEN_INVALIDO';
  end if;

  v_participant := public.qn_verify(p_nombre, p_pin);

  insert into public.qn_fcm_tokens (participant_id, token, user_agent, updated_at)
  values (v_participant, btrim(p_token), p_ua, now())
  on conflict (token) do update
    set participant_id = excluded.participant_id,
        user_agent = excluded.user_agent,
        updated_at = now();
end;
$$;

create or replace function public.qn_borrar_fcm_token(p_token text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.qn_fcm_tokens
  where token = btrim(p_token);
$$;

grant execute on function public.qn_guardar_fcm_token(text, text, text, text) to anon, authenticated;
grant execute on function public.qn_borrar_fcm_token(text) to anon, authenticated;
