import { createHmac, timingSafeEqual } from 'node:crypto';

export interface CalendarFeedEvent {
  id: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  updatedAt: string;
  status: string;
  clientName: string;
  typeName: string;
  responsibleName?: string;
  color?: string;
  url?: string;
}

interface CalendarFeedOptions {
  name: string;
  sourceUrl: string;
  events: CalendarFeedEvent[];
}

const escapeText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');

const formatDate = (value: string) =>
  new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

/** Pliega lineas a 75 octetos para mantener compatibilidad RFC 5545. */
const foldLine = (line: string) => {
  const folded: string[] = [];
  let current = '';
  let bytes = 0;

  for (const character of line) {
    const characterBytes = Buffer.byteLength(character, 'utf8');

    if (bytes + characterBytes > 75) {
      folded.push(current);
      current = ` ${character}`;
      bytes = 1 + characterBytes;
      continue;
    }

    current += character;
    bytes += characterBytes;
  }

  folded.push(current);
  return folded.join('\r\n');
};

const buildEventLines = (event: CalendarFeedEvent) => {
  const details = [
    event.description,
    `Empresa: ${event.clientName}`,
    `Tipo: ${event.typeName}`,
    event.responsibleName ? `Responsable: ${event.responsibleName}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');
  const lines = [
    'BEGIN:VEVENT',
    `UID:${escapeText(event.id)}@marketing-planner`,
    `DTSTAMP:${formatDate(event.updatedAt)}`,
    `LAST-MODIFIED:${formatDate(event.updatedAt)}`,
    `DTSTART:${formatDate(event.startsAt)}`,
    event.endsAt ? `DTEND:${formatDate(event.endsAt)}` : undefined,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(details)}`,
    `CATEGORIES:${escapeText(event.clientName)},${escapeText(event.typeName)}`,
    `STATUS:${event.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
    event.color ? `COLOR:${event.color}` : undefined,
    event.url ? `URL:${event.url}` : undefined,
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(`Recordatorio: ${event.title}`)}`,
    'END:VALARM',
    'END:VEVENT',
  ];

  return lines.filter((line): line is string => Boolean(line));
};

/** Genera una suscripcion iCalendar actualizable compatible con Apple y Google Calendar. */
export const buildCalendarFeed = ({ name, sourceUrl, events }: CalendarFeedOptions) => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Marketing Planner//Calendar Feed 1.0//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(name)}`,
    'REFRESH-INTERVAL;VALUE=DURATION:PT15M',
    'X-PUBLISHED-TTL:PT15M',
    `SOURCE;VALUE=URI:${sourceUrl}`,
    ...events.flatMap(buildEventLines),
    'END:VCALENDAR',
  ];

  return `${lines.map(foldLine).join('\r\n')}\r\n`;
};

export const createCalendarFeedToken = (userId: string, secret: string) =>
  createHmac('sha256', secret).update(userId).digest('base64url');

export const isCalendarFeedTokenValid = (userId: string, token: string, secret: string) => {
  const expected = Buffer.from(createCalendarFeedToken(userId, secret));
  const received = Buffer.from(token);

  return expected.length === received.length && timingSafeEqual(expected, received);
};

export const buildCalendarFeedUrl = (origin: string, userId: string, secret: string) => {
  const url = new URL('/api/calendar-feed.ics', origin);
  url.searchParams.set('user', userId);
  url.searchParams.set('token', createCalendarFeedToken(userId, secret));
  return url.toString();
};
