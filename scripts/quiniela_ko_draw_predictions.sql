alter table public.qn_pronosticos
  add column if not exists ganador_pred smallint;

alter table public.qn_pronosticos
  drop constraint if exists qn_pronosticos_ganador_pred_chk;

alter table public.qn_pronosticos
  add constraint qn_pronosticos_ganador_pred_chk
  check (ganador_pred is null or ganador_pred in (1, 2));

drop function if exists public.qn_guardar_pronostico(text, text, bigint, integer, integer, text);

create or replace function public.qn_guardar_pronostico(
  p_nombre text,
  p_pin text,
  p_match_id bigint,
  p_gl integer,
  p_gv integer,
  p_def text default null,
  p_ganador_pred smallint default null
) returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_part uuid;
  v_kick timestamptz;
  v_fin boolean;
  v_abre int;
  v_bloq int;
  v_res text;
  v_ronda text;
  v_ko boolean;
  v_def text;
  v_ganador_pred smallint;
begin
  v_part := public.qn_verify(p_nombre, p_pin);
  if v_part is null then raise exception 'CREDENCIALES'; end if;
  if p_gl is null or p_gv is null or p_gl < 0 or p_gv < 0 or p_gl > 30 or p_gv > 30 then
    raise exception 'MARCADOR_INVALIDO';
  end if;

  select kickoff, finalizado, ronda into v_kick, v_fin, v_ronda
  from public.qn_partidos
  where id = p_match_id;

  if v_kick is null then raise exception 'PARTIDO_NO_EXISTE'; end if;

  v_ko := v_ronda in ('Dieciseisavos','Octavos de final','Cuartos de final','Semifinal','Final','Tercer lugar');
  v_ganador_pred := case
    when not v_ko then null
    when p_gl > p_gv then 1
    when p_gl < p_gv then 2
    when p_ganador_pred in (1, 2) then p_ganador_pred
    else null
  end;

  if v_ko and p_gl = p_gv and v_ganador_pred is null then
    raise exception 'CLASIFICADO_REQUERIDO';
  end if;

  select abre_horas_antes, bloquea_minutos_antes into v_abre, v_bloq
  from public.qn_config
  where id = 1;

  if now() < v_kick - make_interval(hours => v_abre) then raise exception 'AUN_NO_ABRE'; end if;
  if now() >= v_kick - make_interval(mins => v_bloq) then raise exception 'BLOQUEADO'; end if;

  v_res := case when p_gl > p_gv then 'L' when p_gl < p_gv then 'V' else 'E' end;
  v_def := case when v_ko and p_def in ('reg','ext') then p_def else null end;

  insert into public.qn_pronosticos (
    participant_id, match_id, goles_local, goles_visita, resultado, def_pred, ganador_pred
  ) values (
    v_part, p_match_id, p_gl, p_gv, v_res, v_def, v_ganador_pred
  )
  on conflict (participant_id, match_id)
  do update set goles_local = excluded.goles_local,
                goles_visita = excluded.goles_visita,
                resultado = excluded.resultado,
                def_pred = excluded.def_pred,
                ganador_pred = excluded.ganador_pred,
                updated_at = now();
end;
$$;

grant execute on function public.qn_guardar_pronostico(text, text, bigint, integer, integer, text, smallint) to anon, authenticated;

drop function if exists public.qn_mis_pronosticos(text, text);

create or replace function public.qn_mis_pronosticos(p_nombre text, p_pin text)
returns table(
  match_id bigint,
  goles_local integer,
  goles_visita integer,
  resultado text,
  puntos integer,
  scored boolean,
  def_pred text,
  ganador_pred smallint
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_part uuid;
begin
  v_part := public.qn_verify(p_nombre, p_pin);
  if v_part is null then raise exception 'CREDENCIALES'; end if;

  return query
    select pr.match_id, pr.goles_local, pr.goles_visita, pr.resultado, pr.puntos, pr.scored, pr.def_pred, pr.ganador_pred
    from public.qn_pronosticos pr
    where pr.participant_id = v_part;
end;
$$;

grant execute on function public.qn_mis_pronosticos(text, text) to anon, authenticated;

create or replace function public.qn_calcular_puntos(p_match_id bigint)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  c_ex int;
  c_re int;
  k_ex int;
  k_re int;
  k_bo int;
begin
  select pts_exacto, pts_resultado, pts_ko_exacto, pts_ko_resultado, pts_ko_bonus
    into c_ex, c_re, k_ex, k_re, k_bo
  from public.qn_config
  where id = 1;

  update public.qn_pronosticos pr
  set puntos = (
      case when m.ronda in ('Dieciseisavos','Octavos de final','Cuartos de final','Semifinal','Final','Tercer lugar') then
        (case
           when pr.goles_local = m.goles_local and pr.goles_visita = m.goles_visita then k_ex
           when (case when m.estado_corto = 'PEN' then m.ganador_ko
                      when m.goles_local > m.goles_visita then 1
                      when m.goles_visita > m.goles_local then 2
                      else null end)
              = (case when pr.goles_local > pr.goles_visita then 1
                      when pr.goles_visita > pr.goles_local then 2
                      else pr.ganador_pred end)
             and (case when m.estado_corto = 'PEN' then m.ganador_ko
                       when m.goles_local > m.goles_visita then 1
                       when m.goles_visita > m.goles_local then 2
                       else null end) is not null
           then k_re
           else 0
         end)
        + (case when pr.def_pred = 'reg' and m.estado_corto = 'FT' then k_bo
                when pr.def_pred = 'ext' and m.estado_corto in ('AET','PEN') then k_bo
                else 0 end)
      else
        (case when pr.goles_local = m.goles_local and pr.goles_visita = m.goles_visita then c_ex
              when sign(pr.goles_local - pr.goles_visita) = sign(m.goles_local - m.goles_visita) then c_re
              else 0 end)
      end
    ),
      acertado = (pr.goles_local = m.goles_local and pr.goles_visita = m.goles_visita),
      scored = true,
      updated_at = now()
  from public.qn_partidos m
  where pr.match_id = m.id and m.id = p_match_id
    and m.finalizado = true and m.goles_local is not null and m.goles_visita is not null;
end;
$$;

grant execute on function public.qn_calcular_puntos(bigint) to anon, authenticated;

create or replace view public.qn_pronosticos_publicos as
select
  pr.match_id,
  p.nombre,
  pr.goles_local,
  pr.goles_visita,
  pr.resultado,
  pr.puntos,
  pr.scored,
  pr.def_pred,
  pr.ganador_pred
from public.qn_pronosticos pr
join public.qn_participantes p on p.id = pr.participant_id
join public.qn_partidos m on m.id = pr.match_id
cross join public.qn_config c
where c.id = 1
  and now() >= m.kickoff - make_interval(mins => c.bloquea_minutos_antes);

create or replace view public.qn_ranking as
with champ as (
  select case
    when gp.estado_corto = 'PEN' and gp.ganador_ko = 1 then gp.equipo_local
    when gp.estado_corto = 'PEN' and gp.ganador_ko = 2 then gp.equipo_visita
    when gp.goles_local > gp.goles_visita then gp.equipo_local
    when gp.goles_visita > gp.goles_local then gp.equipo_visita
    else null::text
  end as equipo
  from public.qn_partidos gp
  where gp.ronda = 'Final' and gp.finalizado = true
  order by gp.kickoff desc
  limit 1
), cfg as (
  select pts_campeon
  from public.qn_config
  where id = 1
)
select
  p.id,
  p.nombre,
  (coalesce(sum(pr.puntos), 0)::integer + coalesce(max(case when ca.equipo is not null and ch.equipo is not null and ca.equipo = ch.equipo then cfg.pts_campeon else 0 end), 0)) as puntos,
  count(*) filter (where pr.acertado) as exactos,
  count(*) filter (where pr.scored and pr.puntos > 0) as aciertos,
  count(pr.id) filter (where pr.scored) as jugados
from public.qn_participantes p
left join public.qn_pronosticos pr on pr.participant_id = p.id
left join public.qn_campeon ca on ca.participant_id = p.id
cross join cfg
left join champ ch on true
group by p.id, p.nombre, cfg.pts_campeon;

grant select on public.qn_pronosticos_publicos to anon, authenticated;
grant select on public.qn_ranking to anon, authenticated;

do $$
declare
  r record;
begin
  for r in select id from public.qn_partidos where finalizado = true loop
    perform public.qn_calcular_puntos(r.id);
  end loop;
end;
$$;
