import { describe, expect, it } from 'vitest';
import {
  addDays,
  dateKey,
  getMonthMatrix,
  groupEventsByDay,
  parseDateParam,
  startOfWeek,
} from '../../src/lib/calendar';
import type { ResolvedCalendarEvent } from '../../src/types/planner';

const makeResolvedEvent = (
  id: string,
  startsAt: string,
  title = `Evento ${id}`,
): ResolvedCalendarEvent => ({
  id,
  organizationId: 'org_test',
  clientId: 'client_a',
  eventTypeId: 'type_a',
  title,
  description: 'Descripcion',
  startsAt,
  endsAt: undefined,
  status: 'pending',
  customColor: null,
  responsibleUserId: 'user_a',
  createdByUserId: 'user_a',
  createdAt: startsAt,
  updatedAt: startsAt,
  client: {
    id: 'client_a',
    organizationId: 'org_test',
    name: 'Cliente A',
    color: '#ff7a7a',
    active: true,
    createdAt: startsAt,
    updatedAt: startsAt,
  },
  eventType: {
    id: 'type_a',
    organizationId: 'org_test',
    name: 'Publicacion',
    color: '#4f46e5',
    icon: 'post',
    active: true,
    createdAt: startsAt,
    updatedAt: startsAt,
  },
  responsible: {
    id: 'user_a',
    organizationId: 'org_test',
    name: 'Lily',
    username: 'lily',
    email: 'lily@example.com',
    role: 'admin',
    active: true,
    title: 'Admin',
    avatarColor: '#4f46e5',
    createdAt: startsAt,
    updatedAt: startsAt,
  },
  createdBy: {
    id: 'user_a',
    organizationId: 'org_test',
    name: 'Lily',
    username: 'lily',
    email: 'lily@example.com',
    role: 'admin',
    active: true,
    title: 'Admin',
    avatarColor: '#4f46e5',
    createdAt: startsAt,
    updatedAt: startsAt,
  },
  displayColor: '#ff7a7a',
  statusLabel: 'Pendiente',
});

describe('calendar helpers', () => {
  it('usa la fecha demo cuando falta o es invalida', () => {
    expect(parseDateParam().toISOString()).toBe(new Date('2026-06-05T09:00:00').toISOString());
    expect(parseDateParam('fecha-rota').toISOString()).toBe(
      new Date('2026-06-05T09:00:00').toISOString(),
    );
  });

  it('calcula la semana empezando en lunes incluso si la fecha es domingo', () => {
    const weekStart = startOfWeek(new Date('2026-06-07T15:00:00'));
    expect(weekStart.toISOString()).toBe(new Date('2026-06-01T00:00:00').toISOString());
  });

  it('genera una matriz mensual estable de 5x7', () => {
    const matrix = getMonthMatrix(new Date('2026-06-05T09:00:00'));

    expect(matrix).toHaveLength(5);
    expect(matrix.every((week) => week.length === 7)).toBe(true);
    expect(matrix.flat()).toHaveLength(35);
    expect(dateKey(matrix[0][0].date)).toBe('2026-06-01');
    expect(dateKey(matrix[4][6].date)).toBe('2026-07-05');
  });

  it('agrupa eventos por dia manteniendo orden cronologico', () => {
    const events = [
      makeResolvedEvent('evt_2', '2026-06-08T12:00:00'),
      makeResolvedEvent('evt_1', '2026-06-08T09:00:00'),
      makeResolvedEvent('evt_3', '2026-06-09T10:00:00'),
    ];

    const groups = groupEventsByDay(events);

    expect(groups).toHaveLength(2);
    expect(dateKey(groups[0].date)).toBe('2026-06-08');
    expect(groups[0].events.map((event) => event.id)).toEqual(['evt_1', 'evt_2']);
    expect(dateKey(groups[1].date)).toBe('2026-06-09');
  });

  it('desplaza fechas el numero correcto de dias', () => {
    expect(addDays(new Date('2026-06-05T00:00:00'), 3).toISOString()).toBe(
      new Date('2026-06-08T00:00:00').toISOString(),
    );
  });
});
