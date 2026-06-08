-- ============================================================
-- Home Sync Contract for revisiones_casitas
-- Run this in Supabase SQL Editor before enabling RxDB pull sync
-- ============================================================

-- 1. Keep update_at aligned on every insert/update.
CREATE OR REPLACE FUNCTION public.set_revisiones_casitas_update_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  server_now timestamp without time zone := timezone('utc', now());
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := COALESCE(NEW.created_at, server_now);
    NEW.update_at := COALESCE(NEW.update_at, NEW.created_at, server_now);
    RETURN NEW;
  END IF;

  IF NEW.update_at IS NULL OR NEW.update_at = OLD.update_at THEN
    NEW.update_at := server_now;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_revisiones_casitas_set_update_at ON public.revisiones_casitas;

CREATE TRIGGER trg_revisiones_casitas_set_update_at
BEFORE INSERT OR UPDATE ON public.revisiones_casitas
FOR EACH ROW
EXECUTE FUNCTION public.set_revisiones_casitas_update_at();

-- 2. Support the rolling 6-month sync window by effective sync timestamp.
CREATE INDEX IF NOT EXISTS revisiones_casitas_effective_sync_idx
ON public.revisiones_casitas ((COALESCE(update_at, created_at)), id);

-- 3. Expose a checkpoint-friendly pull contract for RxDB.
CREATE OR REPLACE FUNCTION public.pull_revisiones_casitas_window(
  p_window_start timestamp without time zone,
  p_last_update_at timestamp without time zone DEFAULT NULL,
  p_last_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 250
)
RETURNS SETOF public.revisiones_casitas
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT rc.*
  FROM public.revisiones_casitas rc
  WHERE COALESCE(rc.update_at, rc.created_at) >= p_window_start
    AND (
      p_last_update_at IS NULL
      OR COALESCE(rc.update_at, rc.created_at) > p_last_update_at
      OR (
        COALESCE(rc.update_at, rc.created_at) = p_last_update_at
        AND (p_last_id IS NULL OR rc.id > p_last_id)
      )
    )
  ORDER BY COALESCE(rc.update_at, rc.created_at) ASC, rc.id ASC
  LIMIT GREATEST(COALESCE(p_limit, 250), 1);
$$;

GRANT EXECUTE ON FUNCTION public.pull_revisiones_casitas_window(
  timestamp without time zone,
  timestamp without time zone,
  uuid,
  integer
) TO anon, authenticated;