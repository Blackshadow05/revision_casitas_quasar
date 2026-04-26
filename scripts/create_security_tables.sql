-- ============================================================
-- Security Module Tables (Lost & Prevention)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Bitácora de Actividad Diaria
CREATE TABLE IF NOT EXISTS daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  guard_id text NOT NULL,
  event_type text NOT NULL,
  description text,
  location_area text,
  oficial_entrega text
);

-- 2. Reporte de Incidentes
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  guard_id text NOT NULL,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('Robo', 'Médico', 'Incendio', 'Falla Técnica', 'Otro')),
  description text,
  priority text NOT NULL CHECK (priority IN ('Baja', 'Media', 'Alta')),
  status text NOT NULL DEFAULT 'Abierto' CHECK (status IN ('Abierto', 'En Investigación', 'Resuelto')),
  evidence_urls text[] DEFAULT '{}',
  resolved_at timestamptz
);

-- 3. Objetos Perdidos (Lost & Found)
CREATE TABLE IF NOT EXISTS lost_found (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  item_name text NOT NULL,
  description text,
  found_at timestamptz,
  found_location text,
  status text NOT NULL DEFAULT 'Almacenado' CHECK (status IN ('Almacenado', 'Entregado', 'Desechado')),
  image_url text,
  claimant_info jsonb DEFAULT '{}'
);

-- 4. Control de Activos y Llaves
CREATE TABLE IF NOT EXISTS asset_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_name text NOT NULL,
  guard_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('Retiro', 'Devolución')),
  condition text,
  timestamp timestamptz DEFAULT now()
);

-- ============================================================
-- Enable RLS on all tables
-- ============================================================

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_found ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies — Permissive for anon role
-- (App uses custom auth, not Supabase Auth)
-- ============================================================

-- daily_logs
CREATE POLICY "Allow anon select on daily_logs" ON daily_logs FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert on daily_logs" ON daily_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update on daily_logs" ON daily_logs FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- incidents
CREATE POLICY "Allow anon select on incidents" ON incidents FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert on incidents" ON incidents FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update on incidents" ON incidents FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- lost_found
CREATE POLICY "Allow anon select on lost_found" ON lost_found FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert on lost_found" ON lost_found FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update on lost_found" ON lost_found FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- asset_logs
CREATE POLICY "Allow anon select on asset_logs" ON asset_logs FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert on asset_logs" ON asset_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update on asset_logs" ON asset_logs FOR UPDATE TO anon USING (true) WITH CHECK (true);
