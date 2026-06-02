import { defineConfig } from 'drizzle-kit';

/**
 * Configuracion de Drizzle Kit para generar migraciones del planner.
 */
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/marketing_planner',
  },
  strict: true,
  verbose: true,
});
