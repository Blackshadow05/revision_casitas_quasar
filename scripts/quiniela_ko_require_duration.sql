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
  v_def := case when v_ko and p_def in ('reg','ext') then p_def else null end;
  if v_ko and v_def is null then raise exception 'DEFINICION_REQUERIDA'; end if;

  select abre_horas_antes, bloquea_minutos_antes into v_abre, v_bloq
  from public.qn_config
  where id = 1;

  if now() < v_kick - make_interval(hours => v_abre) then raise exception 'AUN_NO_ABRE'; end if;
  if now() >= v_kick - make_interval(mins => v_bloq) then raise exception 'BLOQUEADO'; end if;

  v_res := case when p_gl > p_gv then 'L' when p_gl < p_gv then 'V' else 'E' end;

  insert into public.qn_pronosticos (
    participant_id, match_id, goles_local, goles_visita, resultado, def_pred, ganador_pred
  ) values (
    v_part, p_match_id, p_gl, p_gv, v_res, v_def, null
  )
  on conflict (participant_id, match_id)
  do update set goles_local = excluded.goles_local,
                goles_visita = excluded.goles_visita,
                resultado = excluded.resultado,
                def_pred = excluded.def_pred,
                ganador_pred = null,
                updated_at = now();
end;
$$;

grant execute on function public.qn_guardar_pronostico(text, text, bigint, integer, integer, text, smallint) to anon, authenticated;
