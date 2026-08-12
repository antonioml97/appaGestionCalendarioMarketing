import { describe, expect, it } from 'vitest';
import {
  buildCalendarFeed,
  buildCalendarFeedUrl,
  createCalendarFeedToken,
  isCalendarFeedTokenValid,
} from '../../src/lib/calendarFeed';

describe('calendar feed', () => {
  it('genera un calendario actualizable con eventos y recordatorio', () => {
    const feed = buildCalendarFeed({
      name: 'Tropiqo Marketing',
      sourceUrl: 'https://example.com/api/calendar-feed.ics?token=secret',
      events: [
        {
          id: 'event_1',
          title: 'Revisión, campaña',
          description: 'Revisar copies; y creatividades',
          startsAt: '2026-08-15T10:00:00.000Z',
          endsAt: '2026-08-15T11:00:00.000Z',
          updatedAt: '2026-08-12T09:00:00.000Z',
          status: 'pending',
          clientName: 'Cliente A',
          typeName: 'Campaña',
        },
      ],
    });

    expect(feed).toContain('BEGIN:VCALENDAR\r\n');
    expect(feed).toContain('REFRESH-INTERVAL;VALUE=DURATION:PT15M');
    expect(feed).toContain('DTSTART:20260815T100000Z');
    expect(feed).toContain('SUMMARY:Revisión\\, campaña');
    expect(feed).toContain('TRIGGER:-PT30M');
    expect(feed).toContain('END:VCALENDAR\r\n');
    expect(feed.split('\r\n').every((line) => Buffer.byteLength(line, 'utf8') <= 75)).toBe(true);
  });

  it('firma y valida el enlace privado sin exponer el secreto', () => {
    const token = createCalendarFeedToken('user_1', 'secret-test');
    const url = buildCalendarFeedUrl('https://planner.example', 'user_1', 'secret-test');

    expect(isCalendarFeedTokenValid('user_1', token, 'secret-test')).toBe(true);
    expect(isCalendarFeedTokenValid('user_2', token, 'secret-test')).toBe(false);
    expect(url).toContain(`token=${token}`);
    expect(url).not.toContain('secret-test');
  });
});
