import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { EventStatus, PlannerUser } from '../../types/planner';
import { getDb } from '../client';
import { calendarEvents, clients, eventTypes } from '../schema';

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
    throw new Error('La empresa o el tipo de evento no pertenecen a la organizacion actual.');
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
    throw new Error('No se encontro el evento a duplicar.');
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
