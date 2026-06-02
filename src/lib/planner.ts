import { clients, eventTypes, events, organizations, users } from '../data/mockData';
import type {
  CalendarEvent,
  Client,
  EventStatus,
  PlannerDataset,
  PlannerUser,
  ResolvedCalendarEvent,
  StatusTone,
} from '../types/planner';
import { addDays, sortEvents } from './calendar';

export const statusLabels: Record<EventStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En revisión',
  completed: 'Confirmada',
  published: 'Publicado',
  cancelled: 'Cancelado',
};

export const statusTone: Record<EventStatus, StatusTone> = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  published: 'mint',
  cancelled: 'muted',
};

export const getOrganizationBundle = (user: PlannerUser): PlannerDataset => {
  const organization =
    organizations.find((entry) => entry.id === user.organizationId) ?? organizations[0];

  return {
    organization,
    users: users.filter((entry) => entry.organizationId === user.organizationId),
    clients: clients.filter((entry) => entry.organizationId === user.organizationId),
    eventTypes: eventTypes.filter((entry) => entry.organizationId === user.organizationId),
    events: events.filter((entry) => entry.organizationId === user.organizationId),
  };
};

export const resolveEventColor = (
  event: CalendarEvent,
  client: Client,
  typeColor: string,
) => event.customColor || client.color || typeColor;

export const resolveEvents = (dataset: PlannerDataset): ResolvedCalendarEvent[] => {
  const clientMap = new Map(dataset.clients.map((client) => [client.id, client]));
  const typeMap = new Map(dataset.eventTypes.map((type) => [type.id, type]));
  const userMap = new Map(dataset.users.map((user) => [user.id, user]));

  return sortEvents(dataset.events).reduce<ResolvedCalendarEvent[]>((accumulator, event) => {
      const client = clientMap.get(event.clientId);
      const eventType = typeMap.get(event.eventTypeId);
      const createdBy = userMap.get(event.createdByUserId);

      if (!client || !eventType || !createdBy) {
        return accumulator;
      }

      accumulator.push({
        ...event,
        client,
        eventType,
        responsible: event.responsibleUserId ? userMap.get(event.responsibleUserId) : undefined,
        createdBy,
        displayColor: resolveEventColor(event, client, eventType.color),
        statusLabel: statusLabels[event.status],
      });

      return accumulator;
    }, []);
};

export interface EventFilters {
  clientIds: string[];
  typeIds: string[];
  statuses: EventStatus[];
  search?: string;
}

export const applyEventFilters = (
  items: ResolvedCalendarEvent[],
  filters: EventFilters,
) => {
  const search = filters.search?.trim().toLowerCase();

  return items.filter((event) => {
    if (filters.clientIds.length && !filters.clientIds.includes(event.clientId)) {
      return false;
    }

    if (filters.typeIds.length && !filters.typeIds.includes(event.eventTypeId)) {
      return false;
    }

    if (filters.statuses.length && !filters.statuses.includes(event.status)) {
      return false;
    }

    if (!search) {
      return true;
    }

    const haystack = [
      event.title,
      event.description,
      event.client.name,
      event.eventType.name,
      event.responsible?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(search);
  });
};

export const getDashboardMetrics = (items: ResolvedCalendarEvent[], baseDate: Date) => {
  const weekEnd = addDays(baseDate, 7);

  return {
    weekTotal: items.filter((event) => {
      const eventDate = new Date(event.startsAt);
      return eventDate >= baseDate && eventDate <= weekEnd;
    }).length,
    pendingTotal: items.filter((event) => event.status === 'pending').length,
    publishedTotal: items.filter((event) => event.status === 'published').length,
    activeClients: new Set(items.map((event) => event.clientId)).size,
  };
};

export const getUpcomingEvents = (items: ResolvedCalendarEvent[], baseDate: Date, limit = 5) =>
  items
    .filter((event) => new Date(event.startsAt) >= baseDate)
    .slice(0, limit);

export const getWeeklyWorkload = (items: ResolvedCalendarEvent[], baseDate: Date) => {
  const weekEnd = addDays(baseDate, 7);
  const totals = new Map<string, number>();

  for (const event of items) {
    const eventDate = new Date(event.startsAt);
    if (eventDate < baseDate || eventDate > weekEnd) {
      continue;
    }

    totals.set(event.clientId, (totals.get(event.clientId) ?? 0) + 1);
  }

  const max = Math.max(...totals.values(), 1);

  return [...totals.entries()].map(([clientId, total]) => ({
    clientId,
    total,
    percentage: Math.round((total / max) * 100),
  }));
};
