-- ============================================================
-- Auto-marca montaje_hecho en operaciones_memo
-- ------------------------------------------------------------
-- Problema: el Google Apps Script refresca operaciones_memo
-- borrando TODO el contenido e insertando de nuevo, lo que
-- pierde la palabra "hecho" del campo montaje_hecho.
--
-- Solución: un trigger BEFORE INSERT que, en cada fila nueva,
-- vuelve a marcar 'hecho' si ya existe una revisión "Check in"
-- en revisiones_casitas para la misma casita + día + mes.
-- Así no hay que tocar el Google Apps Script: cada vez que el
-- script reinserta, el montaje se vuelve a marcar solo.
--
-- Ejecutar en el SQL Editor de Supabase (proyecto "Revision Casas").
-- Es idempotente: se puede correr varias veces sin problema.
-- ============================================================

-- 1. Función del trigger.
--    SECURITY DEFINER para poder leer revisiones_casitas aunque
--    el rol que inserta (anon/GAS) tenga RLS restrictiva.
CREATE OR REPLACE FUNCTION public.set_operaciones_memo_montaje_hecho()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_casita_num int;
  v_dia int;
  v_mes int;
BEGIN
  -- Solo aplica a filas de "arrivals".
  IF NEW.tipo IS NULL OR NEW.tipo NOT ILIKE '%arrival%' THEN
    RETURN NEW;
  END IF;

  -- Si el script ya envió 'hecho', no hacer nada.
  IF NEW.montaje_hecho ILIKE '%hecho%' THEN
    RETURN NEW;
  END IF;

  -- Número de casita = primer número del texto (ej: "Casita 16" -> 16).
  v_casita_num := NULLIF((regexp_match(NEW.casita, '\d+'))[1], '')::int;

  -- Día = primer número de la fecha (ej: "Friday, June 05th" -> 5).
  v_dia := (regexp_match(NEW.fecha, '\d+'))[1]::int;

  -- Mes = nombre en inglés dentro de la fecha.
  v_mes := CASE
    WHEN NEW.fecha ILIKE '%january%'   THEN 1
    WHEN NEW.fecha ILIKE '%february%'  THEN 2
    WHEN NEW.fecha ILIKE '%march%'     THEN 3
    WHEN NEW.fecha ILIKE '%april%'     THEN 4
    WHEN NEW.fecha ILIKE '%may%'       THEN 5
    WHEN NEW.fecha ILIKE '%june%'      THEN 6
    WHEN NEW.fecha ILIKE '%july%'      THEN 7
    WHEN NEW.fecha ILIKE '%august%'    THEN 8
    WHEN NEW.fecha ILIKE '%september%' THEN 9
    WHEN NEW.fecha ILIKE '%october%'   THEN 10
    WHEN NEW.fecha ILIKE '%november%'  THEN 11
    WHEN NEW.fecha ILIKE '%december%'  THEN 12
  END;

  IF v_casita_num IS NULL OR v_dia IS NULL OR v_mes IS NULL THEN
    RETURN NEW;
  END IF;

  -- ¿Existe revisión "Check in" con misma casita, día y mes?
  IF EXISTS (
    SELECT 1
    FROM public.revisiones_casitas rc
    WHERE rc.caja_fuerte ILIKE '%check in%'
      AND rc.fecha_ingreso_casita ~ '^\d+-\d+-\d+$'
      AND NULLIF((regexp_match(rc.casita, '\d+'))[1], '')::int = v_casita_num
      AND split_part(rc.fecha_ingreso_casita, '-', 1)::int = v_dia
      AND split_part(rc.fecha_ingreso_casita, '-', 2)::int = v_mes
  ) THEN
    NEW.montaje_hecho := 'hecho';
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Trigger BEFORE INSERT.
--    El GAS hace DELETE + INSERT, así que con INSERT basta.
--    No se dispara en UPDATE, para no pisar el toggle manual
--    de montaje (abrirMontajeDialog / toggleMontaje en la app).
DROP TRIGGER IF EXISTS trg_operaciones_memo_montaje_hecho ON public.operaciones_memo;

CREATE TRIGGER trg_operaciones_memo_montaje_hecho
BEFORE INSERT ON public.operaciones_memo
FOR EACH ROW
EXECUTE FUNCTION public.set_operaciones_memo_montaje_hecho();

-- 3. Backfill inmediato de las filas ya cargadas (opcional pero útil
--    para marcar lo que ya está sin esperar al próximo refresh del GAS).
UPDATE public.operaciones_memo om
SET montaje_hecho = 'hecho'
WHERE om.tipo ILIKE '%arrival%'
  AND (om.montaje_hecho IS NULL OR om.montaje_hecho NOT ILIKE '%hecho%')
  AND EXISTS (
    SELECT 1
    FROM public.revisiones_casitas rc
    WHERE rc.caja_fuerte ILIKE '%check in%'
      AND rc.fecha_ingreso_casita ~ '^\d+-\d+-\d+$'
      AND NULLIF((regexp_match(rc.casita, '\d+'))[1], '')::int
          = NULLIF((regexp_match(om.casita, '\d+'))[1], '')::int
      AND split_part(rc.fecha_ingreso_casita, '-', 1)::int
          = (regexp_match(om.fecha, '\d+'))[1]::int
      AND split_part(rc.fecha_ingreso_casita, '-', 2)::int = CASE
            WHEN om.fecha ILIKE '%january%'   THEN 1
            WHEN om.fecha ILIKE '%february%'  THEN 2
            WHEN om.fecha ILIKE '%march%'     THEN 3
            WHEN om.fecha ILIKE '%april%'     THEN 4
            WHEN om.fecha ILIKE '%may%'       THEN 5
            WHEN om.fecha ILIKE '%june%'      THEN 6
            WHEN om.fecha ILIKE '%july%'      THEN 7
            WHEN om.fecha ILIKE '%august%'    THEN 8
            WHEN om.fecha ILIKE '%september%' THEN 9
            WHEN om.fecha ILIKE '%october%'   THEN 10
            WHEN om.fecha ILIKE '%november%'  THEN 11
            WHEN om.fecha ILIKE '%december%'  THEN 12
          END
  );
