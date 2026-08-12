-- ============================================================
-- Movimientos de pantallas + inventario por casita/ubicación
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Campos de tipo y trayecto en la revisión de pantallas
ALTER TABLE public.reporte_pantallas
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'reporte';

DO $$
BEGIN
  ALTER TABLE public.reporte_pantallas
    ADD CONSTRAINT reporte_pantallas_tipo_check
    CHECK (tipo IN ('reporte', 'movimiento'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.reporte_pantallas
  ADD COLUMN IF NOT EXISTS origen_ubicacion text,
  ADD COLUMN IF NOT EXISTS origen_habitacion text,
  ADD COLUMN IF NOT EXISTS destino_ubicacion text,
  ADD COLUMN IF NOT EXISTS destino_habitacion text;

ALTER TABLE public.reporte_pantallas
  DROP CONSTRAINT IF EXISTS reporte_pantallas_numero_casita_check;

ALTER TABLE public.reporte_pantallas
  ALTER COLUMN numero_casita DROP NOT NULL;

ALTER TABLE public.reporte_pantallas
  ADD CONSTRAINT reporte_pantallas_numero_casita_check
  CHECK (numero_casita IS NULL OR (numero_casita >= 1 AND numero_casita <= 50));

CREATE INDEX IF NOT EXISTS reporte_pantallas_tipo_idx
  ON public.reporte_pantallas (tipo);

CREATE INDEX IF NOT EXISTS reporte_pantallas_origen_idx
  ON public.reporte_pantallas (origen_ubicacion);

CREATE INDEX IF NOT EXISTS reporte_pantallas_destino_idx
  ON public.reporte_pantallas (destino_ubicacion);

CREATE INDEX IF NOT EXISTS reporte_pantallas_numero_casita_idx
  ON public.reporte_pantallas (numero_casita);

-- 2. Inventario actual de pantallas por ubicación y habitación
CREATE TABLE IF NOT EXISTS public.inventario_pantallas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ubicacion text NOT NULL,
  habitacion text NOT NULL DEFAULT '',
  cantidad integer NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ubicacion, habitacion)
);

CREATE INDEX IF NOT EXISTS inventario_pantallas_ubicacion_idx
  ON public.inventario_pantallas (ubicacion);

ALTER TABLE public.inventario_pantallas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select on inventario_pantallas" ON public.inventario_pantallas;
DROP POLICY IF EXISTS "Allow anon insert on inventario_pantallas" ON public.inventario_pantallas;
DROP POLICY IF EXISTS "Allow anon update on inventario_pantallas" ON public.inventario_pantallas;

CREATE POLICY "Allow anon select on inventario_pantallas"
  ON public.inventario_pantallas FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert on inventario_pantallas"
  ON public.inventario_pantallas FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update on inventario_pantallas"
  ON public.inventario_pantallas FOR UPDATE TO anon USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.inventario_pantallas TO anon, authenticated;

DO $$
BEGIN
  GRANT USAGE, SELECT ON SEQUENCE public.inventario_pantallas_id_seq TO anon, authenticated;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- 3. Ajuste atómico de inventario (origen -1, destino +1)
CREATE OR REPLACE FUNCTION public.ajustar_inventario_pantalla(
  p_ubicacion text,
  p_habitacion text,
  p_delta integer
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_hab text := COALESCE(p_habitacion, '');
  v_inicial integer;
BEGIN
  IF p_ubicacion IS NULL OR btrim(p_ubicacion) = '' THEN
    RAISE EXCEPTION 'ubicacion requerida';
  END IF;

  v_inicial := CASE WHEN p_delta > 0 THEN p_delta ELSE 0 END;

  INSERT INTO public.inventario_pantallas (ubicacion, habitacion, cantidad, updated_at)
  VALUES (p_ubicacion, v_hab, v_inicial, now())
  ON CONFLICT (ubicacion, habitacion) DO UPDATE
    SET cantidad = GREATEST(public.inventario_pantallas.cantidad + p_delta, 0),
        updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.ajustar_inventario_pantalla(text, text, integer)
  TO anon, authenticated;

-- 3b. Fijar cantidad desde un reporte (1 = hay pantalla, 0 = No hay pantalla)
CREATE OR REPLACE FUNCTION public.set_inventario_pantalla(
  p_ubicacion text,
  p_habitacion text,
  p_cantidad integer
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_hab text := COALESCE(p_habitacion, '');
  v_qty integer := GREATEST(COALESCE(p_cantidad, 0), 0);
BEGIN
  IF p_ubicacion IS NULL OR btrim(p_ubicacion) = '' THEN
    RAISE EXCEPTION 'ubicacion requerida';
  END IF;

  INSERT INTO public.inventario_pantallas (ubicacion, habitacion, cantidad, updated_at)
  VALUES (p_ubicacion, v_hab, v_qty, now())
  ON CONFLICT (ubicacion, habitacion) DO UPDATE
    SET cantidad = v_qty,
        updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_inventario_pantalla(text, text, integer)
  TO anon, authenticated;

-- 4. Registrar movimiento y actualizar inventario de origen y destino
CREATE OR REPLACE FUNCTION public.registrar_movimiento_pantalla(
  p_nombre_usuario text,
  p_fecha_hora text,
  p_notas text,
  p_origen_ubicacion text,
  p_origen_habitacion text,
  p_destino_ubicacion text,
  p_destino_habitacion text
)
RETURNS public.reporte_pantallas
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_row public.reporte_pantallas;
  v_numero integer;
  v_origen_hab text := NULLIF(btrim(COALESCE(p_origen_habitacion, '')), '');
  v_destino_hab text := NULLIF(btrim(COALESCE(p_destino_habitacion, '')), '');
BEGIN
  IF p_nombre_usuario IS NULL OR btrim(p_nombre_usuario) = '' THEN
    RAISE EXCEPTION 'nombre_usuario requerido';
  END IF;

  IF p_origen_ubicacion IS NULL OR btrim(p_origen_ubicacion) = '' THEN
    RAISE EXCEPTION 'origen_ubicacion requerida';
  END IF;

  IF p_destino_ubicacion IS NULL OR btrim(p_destino_ubicacion) = '' THEN
    RAISE EXCEPTION 'destino_ubicacion requerida';
  END IF;

  IF p_origen_ubicacion = p_destino_ubicacion
     AND COALESCE(v_origen_hab, '') = COALESCE(v_destino_hab, '') THEN
    RAISE EXCEPTION 'origen y destino no pueden ser iguales';
  END IF;

  IF p_origen_ubicacion ~ '^[0-9]+$' THEN
    v_numero := p_origen_ubicacion::integer;
  ELSIF p_destino_ubicacion ~ '^[0-9]+$' THEN
    v_numero := p_destino_ubicacion::integer;
  ELSE
    v_numero := NULL;
  END IF;

  INSERT INTO public.reporte_pantallas (
    nombre_usuario,
    fecha_hora,
    numero_casita,
    fotos,
    notas,
    tipo,
    origen_ubicacion,
    origen_habitacion,
    destino_ubicacion,
    destino_habitacion
  ) VALUES (
    p_nombre_usuario,
    p_fecha_hora::timestamp without time zone,
    v_numero,
    '[]',
    NULLIF(btrim(COALESCE(p_notas, '')), ''),
    'movimiento',
    p_origen_ubicacion,
    v_origen_hab,
    p_destino_ubicacion,
    v_destino_hab
  )
  RETURNING * INTO v_row;

  PERFORM public.ajustar_inventario_pantalla(p_origen_ubicacion, COALESCE(v_origen_hab, ''), -1);
  PERFORM public.ajustar_inventario_pantalla(p_destino_ubicacion, COALESCE(v_destino_hab, ''), 1);

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_movimiento_pantalla(
  text,
  text,
  text,
  text,
  text,
  text,
  text
) TO anon, authenticated;
