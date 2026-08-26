-- Método de acceso por usuario: contraseña local o Google OAuth.
-- Ejecutar en el SQL Editor si no se aplicó por migración.

ALTER TABLE public."Usuarios"
  ADD COLUMN IF NOT EXISTS metodo_login text NOT NULL DEFAULT 'password';

ALTER TABLE public."Usuarios"
  DROP CONSTRAINT IF EXISTS usuarios_metodo_login_check;

ALTER TABLE public."Usuarios"
  ADD CONSTRAINT usuarios_metodo_login_check
  CHECK (metodo_login IN ('password', 'google'));

COMMENT ON COLUMN public."Usuarios".metodo_login IS 'password = usuario y contraseña; google = Iniciar sesión con Google';

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_lower_idx
  ON public."Usuarios" (lower(email))
  WHERE email IS NOT NULL AND btrim(email) <> '';
