import type { CalendarEvent, ResolvedCalendarEvent } from '../types/planner';

export interface CalendarDayCell {
  date: Date;
  key: string;
  inCurrentMonth: boolean;
  isToday: boolean;
}

const normalize = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const parseDateParam = (value?: string | null) => {
  const date = value ? new Date(value) : new Date('2026-06-05T09:00:00');
  return Number.isNaN(date.getTime()) ? new Date('2026-06-05T09:00:00') : date;
};

export const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

export const startOfWeek = (date: Date) => {
  const normalized = normalize(date);
  const day = normalized.getDay();
  const distance = day === 0 ? -6 : 1 - day;
  return addDays(normalized, distance);
};

export const getWeekDays = (date: Date) => {
  const weekStart = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
};

export const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export const dateKey = (date: Date) => normalize(date).toISOString().slice(0, 10);

export const getMonthMatrix = (focusDate: Date): CalendarDayCell[][] => {
  const start = startOfWeek(new Date(focusDate.getFullYear(), focusDate.getMonth(), 1));
  const today = normalize(new Date());

  return Array.from({ length: 5 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = addDays(start, weekIndex * 7 + dayIndex);
      return {
        date,
        key: dateKey(date),
        inCurrentMonth: date.getMonth() === focusDate.getMonth(),
        isToday: isSameDay(date, today),
      };
    }),
  );
};

export const sortEvents = <T extends CalendarEvent>(events: T[]) =>
  [...events].sort(
    (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );

export const eventsForDate = <T extends CalendarEvent>(events: T[], date: Date) =>
  sortEvents(
    events.filter((event) => isSameDay(new Date(event.startsAt), date)),
  );

export const eventsForWeek = (events: ResolvedCalendarEvent[], focusDate: Date) =>
  getWeekDays(focusDate).map((day) => ({
    day,
    events: eventsForDate(events, day),
  }));

export const groupEventsByDay = (events: ResolvedCalendarEvent[]) => {
  const grouped = new Map<string, { date: Date; events: ResolvedCalendarEvent[] }>();

  for (const event of sortEvents(events)) {
    const date = new Date(event.startsAt);
    const key = dateKey(date);
    const existing = grouped.get(key);

    if (existing) {
      existing.events.push(event);
      continue;
    }

    grouped.set(key, { date, events: [event] });
  }

  return [...grouped.values()];
};
