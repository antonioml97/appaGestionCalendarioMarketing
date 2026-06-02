import type {
  CalendarEvent,
  Client,
  EventStatus,
  PlannerDataset,
  ResolvedCalendarEvent,
  StatusTone,
} from '../types/planner';
import { addDays, sortEvents } from './calendar';
export { getOrganizationBundle } from '../db/repository';

/**
 * Etiquetas legibles para cada estado del dominio.
 */
export const statusLabels: Record<EventStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En revisión',
  completed: 'Confirmada',
  published: 'Publicado',
  cancelled: 'Cancelado',
};

/**
 * Mapeo entre estado de negocio y variante visual del badge.
 */
export const statusTone: Record<EventStatus, StatusTone> = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  published: 'mint',
  cancelled: 'muted',
};

/**
 * Resuelve el color visible final de un evento.
 *
 * @param event Evento base.
 * @param client Cliente asociado.
 * @param typeColor Color por defecto del tipo de evento.
 * @returns Color prioritario para pintar el evento.
 */
export const resolveEventColor = (
  event: CalendarEvent,
  client: Client,
  typeColor: string,
) => event.customColor || client.color || typeColor;

/**
 * Enriquece los eventos con relaciones y metadatos necesarios para la UI.
 *
 * @param dataset Dataset de una organizacion.
 * @returns Eventos resueltos y listos para render.
 */
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

/**
 * Filtros disponibles en la vista principal del calendario.
 */
export interface EventFilters {
  clientIds: string[];
  typeIds: string[];
  statuses: EventStatus[];
  search?: string;
}

/**
 * Aplica filtros combinados sobre una coleccion de eventos resueltos.
 *
 * @param items Eventos candidatos.
 * @param filters Filtros activos en la UI.
 * @returns Eventos que cumplen los filtros indicados.
 */
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

/**
 * Calcula las metricas resumidas mostradas en el dashboard.
 *
 * @param items Eventos resueltos.
 * @param baseDate Fecha de referencia para la ventana temporal.
 * @returns Totales usados por la vista de resumen.
 */
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

/**
 * Obtiene los proximos eventos a partir de una fecha base.
 *
 * @param items Eventos resueltos.
 * @param baseDate Fecha de corte inferior.
 * @param limit Numero maximo de eventos a devolver.
 * @returns Lista truncada de proximos eventos.
 */
export const getUpcomingEvents = (items: ResolvedCalendarEvent[], baseDate: Date, limit = 5) =>
  items
    .filter((event) => new Date(event.startsAt) >= baseDate)
    .slice(0, limit);

/**
 * Resume la carga semanal por cliente para la barra lateral.
 *
 * @param items Eventos resueltos.
 * @param baseDate Inicio de la ventana semanal.
 * @returns Totales y porcentajes por cliente.
 */
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
