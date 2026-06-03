import type {
  CalendarEvent,
  Client,
  EventType,
  Organization,
  PlannerUser,
} from '../../types/planner';
import { calendarEvents, clients, eventTypes, organizations, users } from '../schema';

export const toIso = (value: Date | string | null | undefined) =>
  value ? new Date(value).toISOString() : undefined;

export const mapOrganization = (
  row: typeof organizations.$inferSelect,
): Organization => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  logoUrl: row.logoUrl,
  primaryColor: row.primaryColor,
  createdAt: toIso(row.createdAt)!,
  updatedAt: toIso(row.updatedAt)!,
});

export const mapUser = (row: typeof users.$inferSelect): PlannerUser => ({
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

export const mapClient = (row: typeof clients.$inferSelect): Client => ({
  id: row.id,
  organizationId: row.organizationId,
  name: row.name,
  color: row.color,
  description: row.description ?? undefined,
  active: row.active,
  createdAt: toIso(row.createdAt)!,
  updatedAt: toIso(row.updatedAt)!,
});

export const mapEventType = (
  row: typeof eventTypes.$inferSelect,
): EventType => ({
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

export const mapEvent = (row: typeof calendarEvents.$inferSelect): CalendarEvent => ({
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
