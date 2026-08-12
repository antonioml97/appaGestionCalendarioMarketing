import type { APIRoute } from 'astro';
import { getCalendarFeedSecret } from '../../config/env';
import { findUserById, getOrganizationBundle } from '../../db/repository';
import {
  buildCalendarFeed,
  isCalendarFeedTokenValid,
  type CalendarFeedEvent,
} from '../../lib/calendarFeed';
import { resolveEvents } from '../../lib/planner';

export const GET: APIRoute = async ({ url }) => {
  const userId = url.searchParams.get('user') ?? '';
  const token = url.searchParams.get('token') ?? '';
  const secret = getCalendarFeedSecret();

  if (!secret) {
    return new Response('La suscripcion de calendario no esta configurada.', { status: 503 });
  }

  if (!userId || !token || !isCalendarFeedTokenValid(userId, token, secret)) {
    return new Response('Enlace de calendario no valido.', { status: 403 });
  }

  const user = await findUserById(userId);

  if (!user) {
    return new Response('Calendario no encontrado.', { status: 404 });
  }

  const dataset = await getOrganizationBundle(user);
  const events: CalendarFeedEvent[] = resolveEvents(dataset).map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    updatedAt: event.updatedAt,
    status: event.status,
    clientName: event.client.name,
    typeName: event.eventType.name,
    responsibleName: event.responsible?.name,
    color: event.displayColor,
    url: new URL(`/calendar?event=${encodeURIComponent(event.id)}`, url.origin).toString(),
  }));
  const feed = buildCalendarFeed({
    name: `${dataset.organization.name} · Marketing Planner`,
    sourceUrl: url.toString(),
    events,
  });

  return new Response(feed, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="marketing-planner.ics"',
      'Cache-Control': 'private, no-store, max-age=0',
    },
  });
};
