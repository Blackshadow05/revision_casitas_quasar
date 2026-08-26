-- Registro de IP y hora al iniciar sesión.
-- Aplicado en el proyecto Revision Casas; se deja aquí como referencia.

ALTER TABLE public."Usuarios"
  ADD COLUMN IF NOT EXISTS ultimo_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS ultimo_login_ip text;

COMMENT ON COLUMN public."Usuarios".ultimo_login_at IS 'Fecha y hora del último inicio de sesión exitoso';
COMMENT ON COLUMN public."Usuarios".ultimo_login_ip IS 'Dirección IP del último inicio de sesión exitoso';

CREATE TABLE IF NOT EXISTS public.login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logged_at timestamptz NOT NULL DEFAULT now(),
  user_id smallint,
  usuario text NOT NULL,
  ip_address text,
  user_agent text,
  metodo text NOT NULL CHECK (metodo IN ('password', 'google', 'authenticator'))
);

COMMENT ON TABLE public.login_logs IS 'Historial de inicios de sesión: IP, hora y método de acceso';

CREATE INDEX IF NOT EXISTS login_logs_usuario_logged_at_idx
  ON public.login_logs (usuario, logged_at DESC);

CREATE INDEX IF NOT EXISTS login_logs_user_id_logged_at_idx
  ON public.login_logs (user_id, logged_at DESC);

ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select on login_logs" ON public.login_logs;
CREATE POLICY "Allow select on login_logs"
  ON public.login_logs
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.login_logs TO anon, authenticated;
GRANT ALL ON public.login_logs TO service_role;
