# Sistema de consulta

Aplicacion React para consultar movimientos almacenados en MySQL.

## Configuracion

1. Instala las dependencias con `npm install`.
2. Ejecuta `database/schema.sql` en MySQL.
3. Crea `.env` en la raiz a partir de `.env.example` y completa tus credenciales.

## Desarrollo

Levanta la API y Vite con:

```bash
npm run dev:full
```

La aplicacion queda disponible en `http://localhost:5173`.

La API expone `GET /api/health` para comprobar MySQL y `GET /api/movimientos?cuenta=001234` para buscar movimientos.

Las credenciales permanecen en `.env`, que esta excluido de Git.
