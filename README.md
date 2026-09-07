# AirSense 🌍💨

**Visor geoespacial interactivo de datos históricos de calidad del aire en el Valle del Cauca, Colombia (2011–2023).**

## Descripción

AirSense organiza registros de calidad del aire para que puedan consultarse de forma clara y contextualizada. La aplicación permite seleccionar un municipio, un año, una estación y un contaminante para consultar su lectura promedio anual, clasificación y estadísticas disponibles.

El proyecto está pensado para ciudadanía, autoridades, investigadores y organizaciones interesadas en comprender la información ambiental del territorio.

## Funcionalidades

- Interfaz web responsive en español con navegación por secciones.
- Mapa interactivo basado en Leaflet con estaciones de monitoreo.
- Consulta guiada por municipio, año, estación y contaminante.
- Lecturas promedio anuales y clasificación visual de la calidad del aire.
- Diccionario de contaminantes con símbolos, unidades y tiempos de exposición.
- Panel de resultados con estación, municipio, año y fuente de los datos.
- Consulta de ejemplo para explorar la aplicación sin configurar manualmente todos los filtros.
- Metadatos SEO, Open Graph, datos estructurados, favicon, robots.txt y sitemap.xml.
- Endpoint protegido de health check para mantener activa la conexión con PostgreSQL/Supabase.

## Arquitectura y stack

- **Frontend:** React 19, Vite 7, React Leaflet y Leaflet.
- **Backend:** Node.js y Express 5.
- **Base de datos:** PostgreSQL, compatible con conexiones SSL de Supabase.
- **Despliegue:** Vercel (frontend estático y funciones Node.js).
- **Gestor de paquetes:** pnpm.

### Estructura del repositorio

```text
.
├── backend/
│   ├── basedatos.js       # Conexión y consultas PostgreSQL
│   ├── health.js          # Health check protegido
│   └── index.js           # API Express y servidor
├── frontend/
│   ├── public/            # Favicon, imagen social, robots y sitemap
│   └── src/               # Aplicación React y estilos
├── package.json           # Scripts del proyecto
├── pnpm-workspace.yaml
└── vercel.json            # Configuración de despliegue
```

## Datos

- Cobertura histórica: 2011–2023.
- Región: Valle del Cauca, Colombia.
- Información organizada por municipios, estaciones, contaminantes y tiempos de exposición.
- Fuente oficial de referencia: [Calidad del Aire en Colombia - Promedio Anual](https://www.datos.gov.co/Ambiente-y-Desarrollo-Sostenible/Calidad-Del-Aire-En-Colombia-Promedio-Anual-/kekd-7v7h/about_data).
- Los datos consolidados también consideran registros de entidades regionales y estaciones de monitoreo públicas.

## Requisitos

- Git.
- Node.js 18 o superior.
- Corepack habilitado.
- pnpm.
- Acceso a una base de datos PostgreSQL con el esquema y los datos de AirSense.

## Instalación y desarrollo local

1. Clona el repositorio:

   ```bash
   git clone https://github.com/EmpressQueenGalaxy/Airsense.git
   cd Airsense
   ```

2. Instala pnpm y las dependencias:

   ```bash
   corepack enable
   pnpm install
   ```

3. Crea `backend/.env` con las credenciales de PostgreSQL. No guardes credenciales reales en Git:

   ```dotenv
   DB_USER=tu_usuario
   DB_PASSWORD=tu_contraseña
   DB_HOST=tu_host
   DB_NAME=postgres
   DB_PORT=6543
   HEALTH_CHECK_SECRET=un_secreto_para_health_check
   ```

   El backend intenta conectarse usando SSL, como requiere Supabase, y contempla conexiones locales sin SSL cuando el servidor lo solicita.

4. (Opcional) Configura `frontend/.env` para SEO y una API externa:

   ```dotenv
   VITE_SITE_URL=https://tu-dominio-publico.com
   # VITE_API_URL=https://tu-api-publica.com/api
   ```

   Por defecto, el frontend usa `/api`, por lo que funciona con el proxy local y con las rutas de Vercel.

5. Construye el frontend y arranca el backend:

   ```bash
   pnpm start
   ```

   `pnpm start` ejecuta primero `pnpm build` y luego inicia Express en `http://localhost:3000`.

6. Para trabajar con recarga en caliente, usa dos terminales:

   ```bash
   pnpm frontend:dev
   ```

   Abre `http://localhost:5173`. Vite redirige las peticiones `/api` al backend cuando se configura el proxy de desarrollo.

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `pnpm install` | Instala las dependencias del workspace. |
| `pnpm frontend:dev` | Inicia Vite en modo desarrollo. |
| `pnpm frontend:build` | Genera la aplicación React en `frontend/dist`. |
| `pnpm build` | Ejecuta el build del frontend. |
| `pnpm start` | Construye el frontend e inicia el servidor Express. |

## API principal

Todas las rutas de datos están disponibles bajo `/api`:

- `GET /api/municipios`
- `GET /api/anios/:id_municipio`
- `GET /api/estaciones/:id_municipio/:anio`
- `GET /api/contaminantes/:id_estacion/:anio`
- `GET /api/datos?estacion=...&anio=...&exposicion=...`
- `GET /api/diccionario`
- `GET /api/health?secret=...`

El health check requiere que el valor de `secret` coincida con `HEALTH_CHECK_SECRET` y ejecuta una consulta ligera contra la base de datos.

## Despliegue

El archivo `vercel.json` configura el build del frontend, sirve sus archivos estáticos y redirige `/api/*` a `backend/index.js`. En el proyecto de Vercel deben configurarse las variables de `backend/.env` como variables de entorno del servicio.

## Licencia

Este proyecto se publica bajo la **licencia MIT**. Consulta el archivo `LICENSE` para más información.

## Autores

- Andres Lopez
- Katherine Lopez
- Luz Amelia Ibarguen

## Contacto

Para preguntas o colaboraciones: **airsenseproyecto@gmail.com**
