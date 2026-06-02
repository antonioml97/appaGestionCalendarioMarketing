import { randomUUID } from 'node:crypto';
import { and, asc, eq } from 'drizzle-orm';
import { getDb } from './client';
import {
  calendarEvents,
  clients,
  eventTypes,
  organizations,
  users,
} from './schema';
import type {
  CalendarEvent,
  Client,
  EventStatus,
  EventType,
  Organization,
  PlannerDataset,
  PlannerIconName,
  PlannerUser,
} from '../types/planner';

const toIso = (value: Date | string | null | undefined) =>
  value ? new Date(value).toISOString() : undefined;

const mapOrganization = (row: typeof organizations.$inferSelect): Organization => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  logoUrl: row.logoUrl,
  primaryColor: row.primaryColor,
  createdAt: toIso(row.createdAt)!,
  updatedAt: toIso(row.updatedAt)!,
});

const mapUser = (row: typeof users.$inferSelect): PlannerUser => ({
  id: row.id,
  organizationId: row.organizationId,
  username: row.username,
  name: row.name,
  email: row.email,
  role: row.role,
  active: row.active,
  title: row.title,
  avatarColor: row.avatarColor,
  createdAt: toIso(row.createdAt)!,
  updatedAt: toIso(row.updatedAt)!,
});

const mapClient = (row: typeof clients.$inferSelect): Client => ({
  id: row.id,
  organizationId: row.organizationId,
  name: row.name,
  color: row.color,
  description: row.description ?? undefined,
  active: row.active,
  createdAt: toIso(row.createdAt)!,
  updatedAt: toIso(row.updatedAt)!,
});

const mapEventType = (row: typeof eventTypes.$inferSelect): EventType => ({
  id: row.id,
  organizationId: row.organizationId,
  name: row.name,
  color: row.color,
  icon: row.icon,
  description: row.description ?? undefined,
  active: row.active,
  createdAt: toIso(row.createdAt)!,
  updatedAt: toIso(row.updatedAt)!,
});

const mapEvent = (row: typeof calendarEvents.$inferSelect): CalendarEvent => ({
  id: row.id,
  organizationId: row.organizationId,
  clientId: row.clientId,
  eventTypeId: row.eventTypeId,
  title: row.title,
  description: row.description ?? undefined,
  startsAt: toIso(row.startsAt)!,
  endsAt: toIso(row.endsAt),
  status: row.status,
  customColor: row.customColor,
  responsibleUserId: row.responsibleUserId,
  createdByUserId: row.createdByUserId,
  createdAt: toIso(row.createdAt)!,
  updatedAt: toIso(row.updatedAt)!,
});

export const findUserById = async (userId?: string | null) => {
  if (!userId) {
    return undefined;
  }

  const db = await getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.active, true)))
    .limit(1);

  return user ? mapUser(user) : undefined;
};

export const authenticateUser = async (username: string, password: string) => {
  const db = await getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.username, username.trim()),
        eq(users.passwordHash, password),
        eq(users.active, true),
      ),
    )
    .limit(1);

  return user ? mapUser(user) : undefined;
};

export const getOrganizationBundle = async (user: PlannerUser): Promise<PlannerDataset> => {
  const db = await getDb();

  const [organization, organizationUsers, organizationClients, organizationEventTypes, organizationEvents] =
    await Promise.all([
      db
        .select()
        .from(organizations)
        .where(eq(organizations.id, user.organizationId))
        .limit(1),
      db
        .select()
        .from(users)
        .where(eq(users.organizationId, user.organizationId))
        .orderBy(asc(users.name)),
      db
        .select()
        .from(clients)
        .where(eq(clients.organizationId, user.organizationId))
        .orderBy(asc(clients.name)),
      db
        .select()
        .from(eventTypes)
        .where(eq(eventTypes.organizationId, user.organizationId))
        .orderBy(asc(eventTypes.name)),
      db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.organizationId, user.organizationId))
        .orderBy(asc(calendarEvents.startsAt)),
    ]);

  if (!organization[0]) {
    throw new Error('No se encontró la organización activa del usuario.');
  }

  return {
    organization: mapOrganization(organization[0]),
    users: organizationUsers.map(mapUser),
    clients: organizationClients.map(mapClient),
    eventTypes: organizationEventTypes.map(mapEventType),
    events: organizationEvents.map(mapEvent),
  };
};

export const saveOrganization = async (
  user: PlannerUser,
  input: {
    name: string;
    slug: string;
    primaryColor: string;
    description?: string | null;
  },
) => {
  const db = await getDb();

  await db
    .update(organizations)
    .set({
      name: input.name,
      slug: input.slug,
      primaryColor: input.primaryColor,
      description: input.description ?? null,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, user.organizationId));
};

export const saveClient = async (
  user: PlannerUser,
  input: {
    id?: string;
    name: string;
    color: string;
    description?: string | null;
    active: boolean;
  },
) => {
  const db = await getDb();

  if (input.id) {
    await db
      .update(clients)
      .set({
        name: input.name,
        color: input.color,
        description: input.description ?? null,
        active: input.active,
        updatedAt: new Date(),
      })
      .where(and(eq(clients.id, input.id), eq(clients.organizationId, user.organizationId)));

    return input.id;
  }

  const id = randomUUID();

  await db.insert(clients).values({
    id,
    organizationId: user.organizationId,
    name: input.name,
    color: input.color,
    description: input.description ?? null,
    active: input.active,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return id;
};

export const deleteClient = async (user: PlannerUser, clientId: string) => {
  const db = await getDb();

  await db
    .delete(clients)
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, user.organizationId)));
};

export const saveEventType = async (
  user: PlannerUser,
  input: {
    id?: string;
    name: string;
    color: string;
    description?: string | null;
    icon: PlannerIconName;
    active: boolean;
  },
) => {
  const db = await getDb();

  if (input.id) {
    await db
      .update(eventTypes)
      .set({
        name: input.name,
        color: input.color,
        description: input.description ?? null,
        icon: input.icon,
        active: input.active,
        updatedAt: new Date(),
      })
      .where(and(eq(eventTypes.id, input.id), eq(eventTypes.organizationId, user.organizationId)));

    return input.id;
  }

  const id = randomUUID();

  await db.insert(eventTypes).values({
    id,
    organizationId: user.organizationId,
    name: input.name,
    color: input.color,
    description: input.description ?? null,
    icon: input.icon,
    active: input.active,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return id;
};

export const deleteEventType = async (user: PlannerUser, eventTypeId: string) => {
  const db = await getDb();

  await db
    .delete(eventTypes)
    .where(
      and(eq(eventTypes.id, eventTypeId), eq(eventTypes.organizationId, user.organizationId)),
    );
};

export const saveEvent = async (
  user: PlannerUser,
  input: {
    id?: string;
    title: string;
    clientId: string;
    eventTypeId: string;
    startsAt: Date;
    endsAt?: Date | null;
    description?: string | null;
    status: EventStatus;
  },
) => {
  const db = await getDb();

  if (input.endsAt && input.endsAt < input.startsAt) {
    throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio.');
  }

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, input.clientId), eq(clients.organizationId, user.organizationId)))
    .limit(1);

  const [eventType] = await db
    .select({ id: eventTypes.id })
    .from(eventTypes)
    .where(
      and(eq(eventTypes.id, input.eventTypeId), eq(eventTypes.organizationId, user.organizationId)),
    )
    .limit(1);

  if (!client || !eventType) {
    throw new Error('La empresa o el tipo de evento no pertenecen a la organización actual.');
  }

  if (input.id) {
    await db
      .update(calendarEvents)
      .set({
        title: input.title,
        clientId: input.clientId,
        eventTypeId: input.eventTypeId,
        startsAt: input.startsAt,
        endsAt: input.endsAt ?? null,
        description: input.description ?? null,
        status: input.status,
        customColor: null,
        responsibleUserId: user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(calendarEvents.id, input.id),
          eq(calendarEvents.organizationId, user.organizationId),
        ),
      );

    return input.id;
  }

  const id = randomUUID();

  await db.insert(calendarEvents).values({
    id,
    organizationId: user.organizationId,
    clientId: input.clientId,
    eventTypeId: input.eventTypeId,
    title: input.title,
    description: input.description ?? null,
    startsAt: input.startsAt,
    endsAt: input.endsAt ?? null,
    status: input.status,
    customColor: null,
    responsibleUserId: user.id,
    createdByUserId: user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return id;
};

export const deleteEvent = async (user: PlannerUser, eventId: string) => {
  const db = await getDb();

  await db
    .delete(calendarEvents)
    .where(
      and(eq(calendarEvents.id, eventId), eq(calendarEvents.organizationId, user.organizationId)),
    );
};

export const updateEventStatus = async (
  user: PlannerUser,
  eventId: string,
  status: EventStatus,
) => {
  const db = await getDb();

  await db
    .update(calendarEvents)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(
      and(eq(calendarEvents.id, eventId), eq(calendarEvents.organizationId, user.organizationId)),
    );
};

export const duplicateEvent = async (user: PlannerUser, eventId: string) => {
  const db = await getDb();
  const [source] = await db
    .select()
    .from(calendarEvents)
    .where(
      and(eq(calendarEvents.id, eventId), eq(calendarEvents.organizationId, user.organizationId)),
    )
    .limit(1);

  if (!source) {
    throw new Error('No se encontró el evento a duplicar.');
  }

  const id = randomUUID();

  await db.insert(calendarEvents).values({
    ...source,
    id,
    title: `${source.title} (copia)`,
    customColor: null,
    responsibleUserId: user.id,
    createdByUserId: user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return id;
};
