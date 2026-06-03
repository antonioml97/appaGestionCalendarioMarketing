import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { neon } from '@neondatabase/serverless';
import { and, count, eq, sql } from 'drizzle-orm';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import {
  clients as seedClients,
  eventTypes as seedEventTypes,
  events as seedEvents,
  organizations as seedOrganizations,
  users as seedUsers,
} from '../data/mockData';
import { getDatabaseUrl, getPlannerDataDir } from '../config/env';
import { calendarEvents, clients, eventTypes, organizations, users } from './schema';

type PlannerDb = ReturnType<typeof drizzlePglite>;

const globalForDb = globalThis as typeof globalThis & {
  plannerDbPromise?: Promise<PlannerDb>;
  plannerDbInitPromise?: Promise<void>;
};

const normalizeDate = (value: string) => new Date(value);

const createDb = async (): Promise<PlannerDb> => {
  const connectionString = getDatabaseUrl();
  const plannerDataDir = getPlannerDataDir();

  if (connectionString) {
    const client = neon(connectionString);
    return drizzleNeon({ client }) as unknown as PlannerDb;
  }

  if (plannerDataDir) {
    await mkdir(plannerDataDir, { recursive: true });
    const client = new PGlite(join(plannerDataDir, 'marketing-planner-db'));
    return drizzlePglite(client);
  }

  if (import.meta.env.PROD) {
    const tempDir = join(tmpdir(), 'marketing-planner-db');
    console.warn(
      '[planner-db] DATABASE_URL no esta configurada. Se usara almacenamiento temporal en /tmp hasta configurar la base real.',
    );
    const client = new PGlite(tempDir);
    return drizzlePglite(client);
  }

  const dataDir = join(process.cwd(), '.data');
  await mkdir(dataDir, { recursive: true });
  const client = new PGlite(join(dataDir, 'marketing-planner-db'));
  return drizzlePglite(client);
};

const createSchema = async (db: PlannerDb) => {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS organizations (
      id varchar(64) PRIMARY KEY,
      name varchar(160) NOT NULL,
      slug varchar(160) NOT NULL UNIQUE,
      description text,
      logo_url text,
      primary_color varchar(16) NOT NULL,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id varchar(64) PRIMARY KEY,
      organization_id varchar(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      username varchar(80) NOT NULL UNIQUE,
      name varchar(160) NOT NULL,
      email varchar(200) NOT NULL,
      password_hash text,
      auth_provider varchar(48),
      role varchar(32) NOT NULL DEFAULT 'manager',
      title varchar(160) NOT NULL DEFAULT 'Administrador',
      avatar_color varchar(16) NOT NULL DEFAULT '#4f46e5',
      active boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS clients (
      id varchar(64) PRIMARY KEY,
      organization_id varchar(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name varchar(160) NOT NULL,
      color varchar(16) NOT NULL,
      description text,
      active boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS event_types (
      id varchar(64) PRIMARY KEY,
      organization_id varchar(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name varchar(120) NOT NULL,
      color varchar(16) NOT NULL,
      icon varchar(48) NOT NULL DEFAULT 'calendar',
      description text,
      active boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id varchar(64) PRIMARY KEY,
      organization_id varchar(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      client_id varchar(64) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      event_type_id varchar(64) NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
      title varchar(200) NOT NULL,
      description text,
      starts_at timestamp NOT NULL,
      ends_at timestamp,
      status varchar(32) NOT NULL DEFAULT 'pending',
      custom_color varchar(16),
      responsible_user_id varchar(64) REFERENCES users(id) ON DELETE SET NULL,
      created_by_user_id varchar(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    );
  `);
};

const seedDatabase = async (db: PlannerDb) => {
  const [{ total }] = await db.select({ total: count() }).from(organizations);

  if (!total) {
    await db.insert(organizations).values(
      seedOrganizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description ?? null,
        logoUrl: organization.logoUrl ?? null,
        primaryColor: organization.primaryColor,
        createdAt: normalizeDate(organization.createdAt),
        updatedAt: normalizeDate(organization.updatedAt),
      })),
    );

    await db.insert(users).values(
      seedUsers.map((user) => ({
        id: user.id,
        organizationId: user.organizationId,
        username: user.username,
        name: user.name,
        email: user.email,
        passwordHash: user.demoPassword ?? '',
        authProvider: null,
        role: user.role,
        title: user.title,
        avatarColor: user.avatarColor,
        active: user.active,
        createdAt: normalizeDate(user.createdAt),
        updatedAt: normalizeDate(user.updatedAt),
      })),
    );

    await db.insert(clients).values(
      seedClients.map((client) => ({
        ...client,
        createdAt: normalizeDate(client.createdAt),
        updatedAt: normalizeDate(client.updatedAt),
      })),
    );

    await db.insert(eventTypes).values(
      seedEventTypes.map((eventType) => ({
        ...eventType,
        createdAt: normalizeDate(eventType.createdAt),
        updatedAt: normalizeDate(eventType.updatedAt),
      })),
    );

    await db.insert(calendarEvents).values(
      seedEvents.map((event) => ({
        ...event,
        startsAt: normalizeDate(event.startsAt),
        endsAt: event.endsAt ? normalizeDate(event.endsAt) : null,
        createdAt: normalizeDate(event.createdAt),
        updatedAt: normalizeDate(event.updatedAt),
      })),
    );
  }

  const adminSeed = seedUsers[0];

  await db
    .insert(users)
    .values({
      id: adminSeed.id,
      organizationId: adminSeed.organizationId,
      username: adminSeed.username,
      name: adminSeed.name,
      email: adminSeed.email,
      passwordHash: adminSeed.demoPassword ?? '',
      authProvider: null,
      role: 'admin',
      title: adminSeed.title,
      avatarColor: adminSeed.avatarColor,
      active: true,
      createdAt: normalizeDate(adminSeed.createdAt),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        username: adminSeed.username,
        name: adminSeed.name,
        email: adminSeed.email,
        passwordHash: adminSeed.demoPassword ?? '',
        role: 'admin',
        title: adminSeed.title,
        avatarColor: adminSeed.avatarColor,
        active: true,
        updatedAt: new Date(),
      },
    });

  await db
    .update(calendarEvents)
    .set({
      responsibleUserId: adminSeed.id,
      createdByUserId: adminSeed.id,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(calendarEvents.organizationId, adminSeed.organizationId),
        sql`${calendarEvents.createdByUserId} <> ${adminSeed.id}`,
      ),
    );
};

const initializeDatabase = async (db: PlannerDb) => {
  await createSchema(db);
  await seedDatabase(db);
};

export const getDb = async () => {
  if (!globalForDb.plannerDbPromise) {
    globalForDb.plannerDbPromise = createDb();
  }

  let db: PlannerDb;

  try {
    db = await globalForDb.plannerDbPromise;
  } catch (error) {
    globalForDb.plannerDbPromise = undefined;
    throw error;
  }

  if (!globalForDb.plannerDbInitPromise) {
    globalForDb.plannerDbInitPromise = initializeDatabase(db);
  }

  try {
    await globalForDb.plannerDbInitPromise;
  } catch (error) {
    globalForDb.plannerDbInitPromise = undefined;
    throw error;
  }

  return db;
};
