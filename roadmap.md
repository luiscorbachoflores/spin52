# Roadmap Spin52

## Estado Actual
La aplicación es un gestor de álbumes musicales personal ("Spin52") que permite a los usuarios:
-   Registrarse e iniciar sesión.
-   Buscar álbumes (vía Last.fm API).
-   Añadir álbumes a su colección con estados (Pendiente, Escuchado, etc.).
-   Registrar fechas de escucha (Historial).
-   Ver estadísticas y "milestones" (hitos).
-   Vista de Comunidad.

### Tech Stack
-   **Frontend**: React + Vite + TailwindCSS
-   **Backend**: Node.js + Express + SQLite
-   **Base de Datos**: SQLite (`albums.db`)

## Próximos Pasos (Roadmap)

### 1. Integración con Spotify
**Objetivo**: Permitir escuchar el álbum directamente desde la página de detalle.
-   [ ] **Base de Datos**: Añadir campo `spotify_url` a la tabla `albums`.
-   [ ] **Backend**: Actualizar endpoints POST y PUT para manejar el nuevo campo.
-   [ ] **Frontend**:
    -   Añadir campo para introducir/editar enlace de Spotify en el modal de edición/creación.
    -   En `AlbumDetail`, extraer el ID del álbum de Spotify y mostrar el `iframe` de reproducción.

### 2. Historial en el Calendario
**Objetivo**: Visualizar qué álbumes se escucharon en qué días.
-   [ ] **Backend**: Asegurar que el endpoint de historial devuelva los datos necesarios (ya existe `listening_history`).
-   [ ] **Frontend**:
    -   En la vista de Calendario (dentro de Dashboard), cruzar los datos de `listening_history` con los álbumes.
    -   Mostrar la carátula o título del álbum en el día correspondiente del calendario.

### 3. Mejoras Futuras / Pendientes
-   [ ] Automatización de búsqueda de enlaces de Spotify (automatch).
-   [ ] Mejoras en la vista móvil.
-   [ ] Exportación de datos.
