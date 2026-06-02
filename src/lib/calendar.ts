import type { CalendarEvent, ResolvedCalendarEvent } from '../types/planner';

/**
 * Celda de calendario usada por la vista mensual.
 */
export interface CalendarDayCell {
  date: Date;
  key: string;
  inCurrentMonth: boolean;
  isToday: boolean;
}

/**
 * Normaliza una fecha a medianoche para comparaciones por dia.
 *
 * @param date Fecha de entrada.
 * @returns Fecha sin componente horaria relevante.
 */
const normalize = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * Convierte el parametro `date` de la URL a un objeto `Date` valido.
 *
 * @param value Valor recibido desde query params.
 * @returns Fecha parseada o la fecha por defecto de la demo.
 */
export const parseDateParam = (value?: string | null) => {
  const date = value ? new Date(value) : new Date('2026-06-05T09:00:00');
  return Number.isNaN(date.getTime()) ? new Date('2026-06-05T09:00:00') : date;
};

/**
 * Desplaza una fecha un numero fijo de dias.
 *
 * @param date Fecha base.
 * @param days Dias a sumar o restar.
 * @returns Nueva fecha ajustada.
 */
export const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

/**
 * Desplaza una fecha un numero fijo de meses.
 *
 * @param date Fecha base.
 * @param months Meses a sumar o restar.
 * @returns Nueva fecha ajustada.
 */
export const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

/**
 * Obtiene el lunes de la semana correspondiente a una fecha.
 *
 * @param date Fecha de referencia.
 * @returns Primer dia visible de la semana.
 */
export const startOfWeek = (date: Date) => {
  const normalized = normalize(date);
  const day = normalized.getDay();
  const distance = day === 0 ? -6 : 1 - day;
  return addDays(normalized, distance);
};

/**
 * Devuelve los siete dias que conforman la semana visible.
 *
 * @param date Fecha de referencia.
 * @returns Lista ordenada de dias de la semana.
 */
export const getWeekDays = (date: Date) => {
  const weekStart = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
};

/**
 * Comprueba si dos fechas apuntan al mismo dia natural.
 *
 * @param left Fecha izquierda.
 * @param right Fecha derecha.
 * @returns `true` si ambas fechas comparten ano, mes y dia.
 */
export const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

/**
 * Genera una clave estable `YYYY-MM-DD` para indexar eventos por dia.
 *
 * @param date Fecha a serializar.
 * @returns Clave diaria estable.
 */
export const dateKey = (date: Date) => normalize(date).toISOString().slice(0, 10);

/**
 * Construye la matriz de semanas usada en la vista mensual.
 *
 * @param focusDate Fecha del mes en foco.
 * @returns Matriz de cinco semanas con metadatos visuales.
 */
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

/**
 * Ordena eventos por su fecha de inicio ascendente.
 *
 * @typeParam T Tipo concreto de evento a ordenar.
 * @param events Coleccion de eventos.
 * @returns Copia ordenada de la coleccion.
 */
export const sortEvents = <T extends CalendarEvent>(events: T[]) =>
  [...events].sort(
    (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );

/**
 * Filtra los eventos que ocurren en un dia concreto.
 *
 * @typeParam T Tipo concreto de evento a filtrar.
 * @param events Coleccion de eventos.
 * @param date Dia objetivo.
 * @returns Eventos del dia ordenados por inicio.
 */
export const eventsForDate = <T extends CalendarEvent>(events: T[], date: Date) =>
  sortEvents(
    events.filter((event) => isSameDay(new Date(event.startsAt), date)),
  );

/**
 * Agrupa la agenda semanal en bloques por dia.
 *
 * @param events Eventos ya resueltos para la UI.
 * @param focusDate Fecha que marca la semana actual.
 * @returns Lista de siete dias con sus eventos asociados.
 */
export const eventsForWeek = (events: ResolvedCalendarEvent[], focusDate: Date) =>
  getWeekDays(focusDate).map((day) => ({
    day,
    events: eventsForDate(events, day),
  }));

/**
 * Agrupa eventos por fecha de inicio para renderizar la agenda.
 *
 * @param events Eventos ya resueltos para la UI.
 * @returns Grupos diarios listos para representar en orden.
 */
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
