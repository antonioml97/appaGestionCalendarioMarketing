import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { PlannerUser } from '../../types/planner';
import { getDb } from '../client';
import { clients } from '../schema';

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
