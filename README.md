# Marketing Planner

Aplicación web de calendario editorial pensada para agencias o equipos de marketing que gestionan varios clientes desde un único panel.

La demo actual incluye autenticación por cookie, navegación privada y una experiencia responsive orientada a planificación de contenido. La interfaz ya está preparada para evolucionar a una versión con persistencia real usando Drizzle + Neon/Netlify Database.

## Qué hace la app

- Muestra un dashboard con métricas rápidas y próximos eventos.
- Permite navegar el calendario en vistas mensual, semanal, diaria y agenda.
- Filtra eventos por cliente, tipo, estado y búsqueda textual.
- Incluye páginas de gestión para clientes, tipos de evento y ajustes.
- Separa la información por organización para simular un entorno multi-tenant.
- Usa login demo con sesión en cookie para proteger las rutas privadas.

## Estado actual

- La app funciona hoy con datos mock definidos en `src/data/mockData.ts`.
- El login demo valida usuarios mock y guarda una cookie de sesión.
- El esquema de base de datos ya existe en `src/db/schema.ts`.
- `DATABASE_URL` solo es necesaria si vas a trabajar con Drizzle o conectar persistencia real.

## Stack

- Astro 6
- TypeScript
- Tailwind CSS 4
- Netlify Adapter para Astro
- Drizzle ORM
- Neon / Netlify Database como capa preparada para persistencia

## Credenciales demo

- Admin: `laura@planner.demo` / `demo123`
- Gestor: `diego@planner.demo` / `demo123`

## Estructura de carpetas

```text
.
|-- public/                  # Favicons y archivos públicos
|-- src/
|   |-- assets/              # SVG y recursos visuales
|   |-- components/          # Componentes compartidos y del planner
|   |   `-- planner/         # Calendario, agenda, sidebar, modal, detalle...
|   |-- data/                # Datos mock de organizaciones, usuarios y eventos
|   |-- db/                  # Cliente y esquema Drizzle
|   |-- layouts/             # Layouts base de la aplicación
|   |-- lib/                 # Utilidades de calendario, formato, sesión y filtros
|   |-- pages/               # Rutas Astro
|   |   `-- api/             # Login y logout
|   |-- styles/              # Estilos globales
|   `-- types/               # Tipos del dominio
|-- astro.config.mjs         # Configuración Astro + Netlify adapter
|-- drizzle.config.ts        # Configuración de migraciones con Drizzle
|-- package.json             # Scripts y dependencias
`-- README.md
```

## Rutas principales

- `/login`: acceso a la demo
- `/dashboard`: resumen de actividad
- `/calendar`: vista principal del planner
- `/clients`: gestión visual de empresas/clientes
- `/event-types`: catálogo de tipos de evento
- `/settings`: configuración de organización y preferencias

## Ejecutar en local

Requisitos:

- Node.js `>= 22.12.0`
- npm

Instalación:

```bash
npm install
```

Entorno opcional para base de datos:

```bash
DATABASE_URL=postgresql://usuario:password@host:5432/database
```

Desarrollo:

```bash
npm run dev
```

La app quedará disponible en `http://localhost:4321`.

## Scripts útiles

- `npm run dev`: levanta el entorno local
- `npm run build`: genera la build para producción
- `npm run preview`: previsualiza la build
- `npm run check`: valida el proyecto con Astro
- `npm run db:generate`: genera migraciones con Drizzle
- `npm run db:studio`: abre Drizzle Studio

## Cómo desplegar

### Opción recomendada: Netlify

La app ya está configurada con `@astrojs/netlify` y `output: 'server'`, así que Netlify es el despliegue natural.

1. Sube el repositorio a GitHub, GitLab o Bitbucket.
2. En Netlify, crea un sitio nuevo desde tu repositorio.
3. Configura el comando de build como:

```bash
npm run build
```

4. Si vas a usar base de datos real, añade la variable de entorno `DATABASE_URL`.
5. Lanza el deploy.

Notas:

- Si mantienes la demo con datos mock, puedes desplegar sin `DATABASE_URL`.
- El adaptador de Astro para Netlify se encarga de generar la salida serverless necesaria.

### Opción con Netlify CLI

```bash
npm install -g netlify-cli
netlify deploy --build
netlify deploy --prod --build
```

## Persistencia y base de datos

El proyecto ya deja preparada la transición a persistencia real:

- `src/db/schema.ts` define organizaciones, usuarios, clientes, tipos y eventos.
- `src/db/client.ts` crea la conexión usando `DATABASE_URL`.
- `drizzle.config.ts` deja lista la generación de migraciones.

Ahora mismo esa capa está preparada, pero la UI sigue leyendo los datos desde `src/data/mockData.ts`.

## Siguiente evolución natural

- Sustituir `mockData.ts` por consultas reales con Drizzle.
- Convertir el login demo en autenticación real.
- Añadir CRUD persistente para eventos, clientes y tipos.
- Incorporar permisos por rol y preferencias guardadas por organización.
