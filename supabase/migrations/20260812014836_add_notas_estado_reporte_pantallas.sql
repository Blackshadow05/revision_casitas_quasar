-- notas: nota general de la revisión
-- estado: por pantalla, dentro de cada elemento de fotos jsonb
--   fotos: [{ url, ubicacion, estado }]
--   estado: 'defectuosa' | 'en buen estado'

ALTER TABLE public.reporte_pantallas
  ADD COLUMN IF NOT EXISTS notas text;

COMMENT ON COLUMN public.reporte_pantallas.notas IS 'Nota general de la revisión';
COMMENT ON COLUMN public.reporte_pantallas.fotos IS 'Arreglo JSON [{url, ubicacion, estado}] ubicacion: Living|Cuarto Queen|Cuarto King; estado: defectuosa|en buen estado';
