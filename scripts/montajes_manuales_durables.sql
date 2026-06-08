-- ============================================================
-- Montaje manual DURADERO (sobrevive al refresh del GAS)
-- ------------------------------------------------------------
-- Contexto: el Google Apps Script refresca operaciones_memo con
-- DELETE + INSERT, borrando montaje_hecho. El trigger
-- trg_operaciones_memo_montaje_hecho (ver
-- operaciones_memo_montaje_hecho_trigger.sql) ya re-marcaba
-- 'hecho' cuando existe una revisión "Check in" en
-- revisiones_casitas. PROBLEMA: el botón "Confirmar Montaje"
-- manual hacía un UPDATE directo por id, y como el id (uuid)
-- cambia en cada reinserción del GAS, esa marca se perdía si la
-- casita no tenía además un "Check in".
--
-- Solución (este script): una segunda fuente de verdad ->
-- tabla montajes_manuales con clave natural estable
-- (casita_num + dia + mes), que NO depende del uuid. El trigger
-- pasa a marcar 'hecho' si hay Check in O si hay marca manual.
-- El front-end (OperacionDiariaPage.vue -> toggleMontaje) la
-- alimenta vía los RPC confirmar/desconfirmar.
--
-- Aplicado el 2026-06-05 vía MCP al proyecto snkyczysawxjrpmvtzqy.
-- Idempotente: se puede correr varias veces.
-- ============================================================

-- 1. Helpers de parseo (una sola fuente de verdad).
CREATE OR REPLACE FUNCTION public.om_casita_num(p text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF((regexp_match(p, '\d+'))[1], '')::int;
$$;

CREATE OR REPLACE FUNCTION public.om_fecha_dia(p text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT (regexp_match(p, '\d+'))[1]::int;
$$;

CREATE OR REPLACE FUNCTION public.om_fecha_mes(p text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p ILIKE '%january%'   THEN 1
    WHEN p ILIKE '%february%'  THEN 2
    WHEN p ILIKE '%march%'     THEN 3
    WHEN p ILIKE '%april%'     THEN 4
    WHEN p ILIKE '%may%'       THEN 5
    WHEN p ILIKE '%june%'      THEN 6
    WHEN p ILIKE '%july%'      THEN 7
    WHEN p ILIKE '%august%'    THEN 8
    WHEN p ILIKE '%september%' THEN 9
    WHEN p ILIKE '%october%'   THEN 10
    WHEN p ILIKE '%november%'  THEN 11
    WHEN p ILIKE '%december%'  THEN 12
  END;
$$;

-- 2. Tabla de marcas manuales (clave natural estable).
CREATE TABLE IF NOT EXISTS public.montajes_manuales (
  casita_num    int  NOT NULL,
  dia           int  NOT NULL,
  mes           int  NOT NULL,
  casita_texto  text,
  confirmado_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (casita_num, dia, mes)
);

-- RLS habilitada y bloqueada: solo se accede vía RPC SECURITY DEFINER.
ALTER TABLE public.montajes_manuales ENABLE ROW LEVEL SECURITY;

-- 3. Helpers de existencia (SECURITY DEFINER para saltar RLS de las tablas).
CREATE OR REPLACE FUNCTION public.montaje_tiene_checkin(p_casita_num int, p_dia int, p_mes int)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.revisiones_casitas rc
    WHERE rc.caja_fuerte ILIKE '%check in%'
      AND rc.fecha_ingreso_casita ~ '^\d+-\d+-\d+$'
      AND public.om_casita_num(rc.casita) = p_casita_num
      AND split_part(rc.fecha_ingreso_casita, '-', 1)::int = p_dia
      AND split_part(rc.fecha_ingreso_casita, '-', 2)::int = p_mes
  );
$$;

CREATE OR REPLACE FUNCTION public.montaje_es_manual(p_casita_num int, p_dia int, p_mes int)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.montajes_manuales m
    WHERE m.casita_num = p_casita_num AND m.dia = p_dia AND m.mes = p_mes
  );
$$;

-- 4. Trigger actualizado: 'hecho' si hay Check in O marca manual.
CREATE OR REPLACE FUNCTION public.set_operaciones_memo_montaje_hecho()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_casita_num int;
  v_dia int;
  v_mes int;
BEGIN
  IF NEW.tipo IS NULL OR NEW.tipo NOT ILIKE '%arrival%' THEN
    RETURN NEW;
  END IF;

  IF NEW.montaje_hecho ILIKE '%hecho%' THEN
    RETURN NEW;
  END IF;

  v_casita_num := public.om_casita_num(NEW.casita);
  v_dia        := public.om_fecha_dia(NEW.fecha);
  v_mes        := public.om_fecha_mes(NEW.fecha);

  IF v_casita_num IS NULL OR v_dia IS NULL OR v_mes IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.montaje_tiene_checkin(v_casita_num, v_dia, v_mes)
     OR public.montaje_es_manual(v_casita_num, v_dia, v_mes) THEN
    NEW.montaje_hecho := 'hecho';
  END IF;

  RETURN NEW;
END;
$$;

-- El trigger trg_operaciones_memo_montaje_hecho ya existe y apunta
-- a esta función; CREATE OR REPLACE conserva el binding.

-- 5. RPC: confirmar montaje manual (persiste + marca inmediato).
CREATE OR REPLACE FUNCTION public.confirmar_montaje_manual(p_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_casita text;
  v_fecha  text;
  v_casita_num int;
  v_dia int;
  v_mes int;
BEGIN
  SELECT casita, fecha INTO v_casita, v_fecha
  FROM public.operaciones_memo WHERE id = p_id;
  IF NOT FOUND THEN RETURN false; END IF;

  v_casita_num := public.om_casita_num(v_casita);
  v_dia        := public.om_fecha_dia(v_fecha);
  v_mes        := public.om_fecha_mes(v_fecha);
  IF v_casita_num IS NULL OR v_dia IS NULL OR v_mes IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.montajes_manuales (casita_num, dia, mes, casita_texto)
  VALUES (v_casita_num, v_dia, v_mes, v_casita)
  ON CONFLICT (casita_num, dia, mes)
  DO UPDATE SET confirmado_at = now(), casita_texto = EXCLUDED.casita_texto;

  UPDATE public.operaciones_memo
  SET montaje_hecho = 'hecho'
  WHERE tipo ILIKE '%arrival%'
    AND public.om_casita_num(casita) = v_casita_num
    AND public.om_fecha_dia(fecha)   = v_dia
    AND public.om_fecha_mes(fecha)   = v_mes;

  RETURN true;
END;
$$;

-- 6. RPC: desconfirmar montaje manual. Quita la marca manual y
--    re-evalúa: si aún hay Check in queda 'hecho', si no, null.
--    Devuelve true si quedó marcado por una revisión.
CREATE OR REPLACE FUNCTION public.desconfirmar_montaje_manual(p_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_casita text;
  v_fecha  text;
  v_casita_num int;
  v_dia int;
  v_mes int;
  v_tiene_checkin boolean;
BEGIN
  SELECT casita, fecha INTO v_casita, v_fecha
  FROM public.operaciones_memo WHERE id = p_id;
  IF NOT FOUND THEN RETURN false; END IF;

  v_casita_num := public.om_casita_num(v_casita);
  v_dia        := public.om_fecha_dia(v_fecha);
  v_mes        := public.om_fecha_mes(v_fecha);
  IF v_casita_num IS NULL OR v_dia IS NULL OR v_mes IS NULL THEN
    RETURN false;
  END IF;

  DELETE FROM public.montajes_manuales
  WHERE casita_num = v_casita_num AND dia = v_dia AND mes = v_mes;

  v_tiene_checkin := public.montaje_tiene_checkin(v_casita_num, v_dia, v_mes);

  UPDATE public.operaciones_memo
  SET montaje_hecho = CASE WHEN v_tiene_checkin THEN 'hecho' ELSE NULL END
  WHERE tipo ILIKE '%arrival%'
    AND public.om_casita_num(casita) = v_casita_num
    AND public.om_fecha_dia(fecha)   = v_dia
    AND public.om_fecha_mes(fecha)   = v_mes;

  RETURN v_tiene_checkin;
END;
$$;

-- 7. Permisos: el front-end (anon/authenticated) solo puede llamar los RPC.
GRANT EXECUTE ON FUNCTION public.confirmar_montaje_manual(uuid)    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.desconfirmar_montaje_manual(uuid) TO anon, authenticated;

-- 8. Backfill: preservar las marcas manuales que YA existen pero no
--    tienen Check in (se perderían en el próximo refresh del GAS).
INSERT INTO public.montajes_manuales (casita_num, dia, mes, casita_texto)
SELECT DISTINCT
  public.om_casita_num(om.casita),
  public.om_fecha_dia(om.fecha),
  public.om_fecha_mes(om.fecha),
  om.casita
FROM public.operaciones_memo om
WHERE om.tipo ILIKE '%arrival%'
  AND om.montaje_hecho ILIKE '%hecho%'
  AND public.om_casita_num(om.casita) IS NOT NULL
  AND public.om_fecha_dia(om.fecha)   IS NOT NULL
  AND public.om_fecha_mes(om.fecha)   IS NOT NULL
  AND NOT public.montaje_tiene_checkin(
        public.om_casita_num(om.casita),
        public.om_fecha_dia(om.fecha),
        public.om_fecha_mes(om.fecha))
ON CONFLICT (casita_num, dia, mes) DO NOTHING;
