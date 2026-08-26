-- Perfiles para Auth + Google Authenticator (el login legado sigue activo).
-- Aplicado en el proyecto Revision Casas; se deja aquí como referencia.

ALTER TABLE public."Usuarios"
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS auth_user_id uuid,
  ADD COLUMN IF NOT EXISTS totp_enrolled boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_lower_unique
  ON public."Usuarios" (lower(email))
  WHERE email IS NOT NULL AND length(btrim(email)) > 0;

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_auth_user_id_unique
  ON public."Usuarios" (auth_user_id)
  WHERE auth_user_id IS NOT NULL;
