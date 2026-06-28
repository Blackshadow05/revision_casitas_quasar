update public.qn_partidos
set ganador_ko = case
    when goles_local > goles_visita then 1
    when goles_visita > goles_local then 2
    else ganador_ko
  end,
  updated_at = now()
where ronda in ('Dieciseisavos','Octavos de final','Cuartos de final','Semifinal','Final','Tercer lugar')
  and finalizado = true
  and estado_corto <> 'PEN'
  and goles_local is not null
  and goles_visita is not null
  and goles_local <> goles_visita
  and ganador_ko is null;

do $$
declare
  r record;
begin
  for r in
    select id
    from public.qn_partidos
    where ronda in ('Dieciseisavos','Octavos de final','Cuartos de final','Semifinal','Final','Tercer lugar')
      and finalizado = true
  loop
    perform public.qn_calcular_puntos(r.id);
  end loop;
end;
$$;
