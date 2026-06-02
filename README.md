# Marketing Planner

Aplicacion web para gestionar un calendario editorial desde un panel privado. Esta pensada para agencias o equipos de marketing que necesitan organizar clientes, tipos de contenido y eventos en una sola interfaz.

Hoy el proyecto ya funciona con persistencia real:

- login con cookie de sesion
- base de datos PostgreSQL real en produccion
- CRUD persistente para clientes, tipos de evento y eventos
- despliegue SSR en Netlify

La base de datos usada en produccion no es Netlify Database. La app esta preparada para usar una `DATABASE_URL` externa, y ahora mismo el flujo recomendado es Neon Postgres.

## Que hace la app

- Protege las rutas privadas con login y cookie de sesion.
- Muestra un dashboard con metricas y proximos eventos.
- Permite navegar el planner en vistas mensual, semanal, diaria y agenda.
- Filtra por cliente, tipo, estado y texto de busqueda.
- Permite crear, editar y borrar clientes.
- Permite crear, editar y borrar tipos de evento.
- Permite crear, editar, duplicar, actualizar y borrar eventos.
- Mantiene la informacion separada por organizacion.

## Estado actual

- La app ya lee y escribe contra base de datos real mediante Drizzle.
- En produccion, `DATABASE_URL` es obligatoria.
- En local, si falta `DATABASE_URL`, se usa `PGlite` dentro de `.data/marketing-planner-db`.
- El seed inicial ya no carga clientes, tipos ni eventos demo.
- El seed solo deja:
  - una organizacion base
  - un usuario admin inicial
- Ese usuario admin se toma de `DEMO_USERNAME` y `DEMO_PASSWORD` y se sincroniza en la base de datos en el arranque.

Importante:

- Vaciar `src/data/mockData.ts` deja vacio el seed para bases nuevas o limpias.
- No borra automaticamente datos antiguos de una base remota ya existente.

## Stack

- Astro 6
- TypeScript
- Tailwind CSS 4
- Drizzle ORM
- Neon serverless driver
- Astro Netlify adapter
- PGlite para desarrollo local sin PostgreSQL remoto

## Variables de entorno

La app usa estas variables:

```env
DEMO_USERNAME=admin
DEMO_PASSWORD=admin123
DATABASE_URL=postgresql://usuario:password@host:5432/database?sslmode=require
```

Que hace cada una:

- `DEMO_USERNAME`: usuario admin inicial.
- `DEMO_PASSWORD`: password del admin inicial.
- `DATABASE_URL`: conexion a PostgreSQL real. Obligatoria en produccion.

Notas:

- No subas credenciales reales al repositorio.
- Si compartes una cadena real de `DATABASE_URL`, rotala despues.

## Credenciales de acceso

No hay credenciales fijas hardcodeadas como parte del producto final.

El acceso visible en `/login` usa:

- `DEMO_USERNAME`
- `DEMO_PASSWORD`

Y ese mismo usuario queda insertado o actualizado en la base de datos.

## Estructura de carpetas

```text
.
|-- drizzle/                # Migraciones generadas por Drizzle
|-- public/                 # Archivos publicos
|-- src/
|   |-- components/         # Componentes compartidos y piezas del planner
|   |   `-- planner/        # Calendario, agenda, filtros, panel lateral, modales
|   |-- data/               # Seed inicial minimo
|   |-- db/                 # Cliente DB, schema y repositorio
|   |-- layouts/            # Layouts base
|   |-- lib/                # Sesion, planner, calendario y utilidades
|   |-- pages/              # Rutas Astro
|   |   `-- api/            # Endpoints de login, logout y CRUD
|   |-- styles/             # Estilos globales
|   `-- types/              # Tipos del dominio
|-- .netlify/               # Estado local del enlace con Netlify
|-- astro.config.mjs        # Configuracion Astro + Netlify
|-- drizzle.config.ts       # Configuracion de migraciones
|-- package.json            # Scripts y dependencias
`-- README.md
```

## Rutas principales

- `/login`: acceso al panel privado
- `/dashboard`: resumen general
- `/calendar`: planner principal
- `/clients`: gestion de clientes
- `/event-types`: gestion de tipos de evento
- `/settings`: ajustes de organizacion

## Ejecutar en local

Requisitos:

- Node.js `>= 22.12.0`
- npm

Instalacion:

```bash
npm install
```

Crea un `.env` con tus valores:

```env
DEMO_USERNAME=admin
DEMO_PASSWORD=admin123
```

Si quieres trabajar con PostgreSQL real tambien en local, anade:

```env
DATABASE_URL=postgresql://usuario:password@host:5432/database?sslmode=require
```

Arranque:

```bash
npm run dev
```

La app quedara disponible en `http://localhost:4321`.

## Scripts utiles

- `npm run dev`: entorno local
- `npm run build`: build de produccion
- `npm run preview`: preview local de la build
- `npm run check`: validacion con Astro
- `npm run db:generate`: generar migraciones Drizzle
- `npm run db:studio`: abrir Drizzle Studio

## Base de datos

### Produccion

- Usa PostgreSQL real por `DATABASE_URL`.
- El proveedor recomendado para este proyecto es Neon.
- Netlify solo aloja la app SSR; no aloja la base de datos de este proyecto.

### Desarrollo local

- Sin `DATABASE_URL`, la app usa `PGlite`.
- Eso permite desarrollar sin tener PostgreSQL levantado.

### Seed actual

El seed definido en `src/data/mockData.ts` deja la aplicacion vacia de contenido operativo:

- 1 organizacion
- 1 usuario admin
- 0 clientes
- 0 tipos de evento
- 0 eventos

## Neon y costes

El flujo recomendado hoy es Neon Postgres.

Puntos practicos:

- Neon tiene plan `Free`.
- Neon indica `no credit card required` para el plan gratis.
- Para un MVP con 1 o 2 usuarios, normalmente ese plan deberia ser suficiente al inicio.
- Si mas adelante necesitas mas recursos, puedes pasar a un plan de pago sin cambiar de proveedor.

Referencia oficial:

- [Neon Pricing](https://neon.com/pricing)
- [Neon Plans Docs](https://neon.com/docs/introduction/pro-plan)

## Despliegue

### Netlify

La app esta preparada para desplegarse en Netlify con `@astrojs/netlify` y salida SSR.

Configuracion minima:

1. Conecta el repositorio en Netlify.
2. Usa este comando de build:

```bash
npm run build
```

3. Define estas variables en `Site configuration -> Environment variables`:

```env
DEMO_USERNAME=admin
DEMO_PASSWORD=admin123
DATABASE_URL=postgresql://usuario:password@host:5432/database?sslmode=require
```

4. Lanza el deploy.

Notas importantes:

- `DATABASE_URL` es obligatoria en produccion.
- Este proyecto ya no usa Netlify Database.
- Si `DATABASE_URL` esta mal formada o falta, el login y las rutas privadas fallaran en produccion.

### Netlify CLI

```bash
npm install -g netlify-cli
netlify deploy --prod --build
```

## Estado del despliegue actual

URL publica actual:

- [https://gestiontropiqo.netlify.app](https://gestiontropiqo.netlify.app)

Comportamiento esperado del acceso:

- `/` redirige a `/login` si no hay sesion
- `/login` muestra el usuario admin configurado
- `POST /api/login` crea la cookie y redirige a `/calendar`

## Siguientes pasos recomendados

- Crear los primeros clientes reales desde `/clients`.
- Crear los tipos de evento reales desde `/event-types`.
- Empezar a cargar eventos desde `/calendar`.
- Si quieres una base completamente limpia, borrar tambien los datos remotos antiguos de Neon si existieran.
