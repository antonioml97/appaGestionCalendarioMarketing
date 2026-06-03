import { asc, eq } from 'drizzle-orm';
import type { PlannerDataset, PlannerUser } from '../../types/planner';
import { getDb } from '../client';
import { calendarEvents, clients, eventTypes, organizations, users } from '../schema';
import { mapClient, mapEvent, mapEventType, mapOrganization, mapUser } from './mappers';

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
    throw new Error('No se encontro la organizacion activa del usuario.');
  }

  return {
    organization: mapOrganization(organization[0]),
    users: organizationUsers.map(mapUser),
    clients: organizationClients.map(mapClient),
    eventTypes: organizationEventTypes.map(mapEventType),
    events: organizationEvents.map(mapEvent),
  };
};
