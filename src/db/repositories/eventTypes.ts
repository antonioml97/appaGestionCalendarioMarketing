import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { PlannerIconName, PlannerUser } from '../../types/planner';
import { getDb } from '../client';
import { eventTypes } from '../schema';

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
