# Log de Seguimiento - Problema de Carga en DetailsPage

## Descripción del Problema

Al recargar la página de detalles de una casa (`DetailsPage.vue`), la aplicación pierde el estado de `selectedCasa` almacenado en Pinia. Esto obliga al usuario a regresar al inicio para volver a seleccionar la casa.

## Intentos Realizados

1. **Intento 1: Rutas Dinámicas (`/details/:id`)**
   - **Resultado:** Falló con un error 404.
   - **Causa probable:** Configuración del servidor de desarrollo con `vueRouterMode: 'history'` no manejando correctamente sub-rutas anidadas en el refresco o falta de configuración de "fallback" en el entorno local.

2. **Intento 2: Reversión a Ruta Simple (`/details`)**
   - **Resultado:** El 404 desapareció, pero persiste la pérdida de información al recargar.

## Plan de Acción (Estrategia de Persistencia Local)

Para que la información sobreviva a la recarga sin depender de la URL (evitando el 404), se implementará:

- **LocalStorage:** Guardar el ID o el objeto completo de la casa seleccionada en el almacenamiento local del navegador.
- **Hydration:** Al cargar `DetailsPage.vue`, si el store está vacío, intentar recuperar la información desde `localStorage`.

## Registro de Diagnóstico (Logs implementados)

- `[CasasStore] setSelectedCasa`: Registra cuándo se guarda una casa.
- `[CasasStore] persistData`: Registra el guardado en localStorage.
- `[DetailsPage] onMounted`: Registra el intento de recuperación de datos.
- `[DetailsPage] Data Found`: Indica si se recuperó exitosamente.
