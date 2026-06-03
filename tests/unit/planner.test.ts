import { describe, expect, it } from 'vitest';
import type { PlannerDataset } from '../../src/types/planner';
import {
  applyEventFilters,
  getDashboardMetrics,
  getUpcomingEvents,
  getWeeklyWorkload,
  resolveEventColor,
  resolveEvents,
} from '../../src/lib/planner';

const dataset: PlannerDataset = {
  organization: {
    id: 'org_test',
    name: 'Org test',
    slug: 'org-test',
    primaryColor: '#4f46e5',
    createdAt: '2026-06-01T09:00:00',
    updatedAt: '2026-06-01T09:00:00',
  },
  users: [
    {
      id: 'user_lily',
      organizationId: 'org_test',
      name: 'Lily',
      username: 'lily',
      email: 'lily@example.com',
      role: 'admin',
      active: true,
      title: 'Admin',
      avatarColor: '#4f46e5',
      createdAt: '2026-06-01T09:00:00',
      updatedAt: '2026-06-01T09:00:00',
    },
  ],
  clients: [
    {
      id: 'client_red',
      organizationId: 'org_test',
      name: 'Cliente Rojo',
      color: '#ff7a7a',
      active: true,
      description: 'Restaurante',
      createdAt: '2026-06-01T09:00:00',
      updatedAt: '2026-06-01T09:00:00',
    },
    {
      id: 'client_blue',
      organizationId: 'org_test',
      name: 'Cliente Azul',
      color: '#5b8def',
      active: true,
      description: 'Clinica',
      createdAt: '2026-06-01T09:00:00',
      updatedAt: '2026-06-01T09:00:00',
    },
  ],
  eventTypes: [
    {
      id: 'type_post',
      organizationId: 'org_test',
      name: 'Publicacion',
      color: '#4f46e5',
      icon: 'post',
      active: true,
      description: 'Feed',
      createdAt: '2026-06-01T09:00:00',
      updatedAt: '2026-06-01T09:00:00',
    },
    {
      id: 'type_story',
      organizationId: 'org_test',
      name: 'Story',
      color: '#9b5cf6',
      icon: 'story',
      active: true,
      description: 'Stories',
      createdAt: '2026-06-01T09:00:00',
      updatedAt: '2026-06-01T09:00:00',
    },
  ],
  events: [
    {
      id: 'evt_a',
      organizationId: 'org_test',
      clientId: 'client_red',
      eventTypeId: 'type_post',
      title: 'Menu verano',
      description: 'Reel y publicacion',
      startsAt: '2026-06-05T10:00:00',
      endsAt: '2026-06-05T11:00:00',
      status: 'pending',
      customColor: '#000000',
      responsibleUserId: 'user_lily',
      createdByUserId: 'user_lily',
      createdAt: '2026-06-01T09:00:00',
      updatedAt: '2026-06-01T09:00:00',
    },
    {
      id: 'evt_b',
      organizationId: 'org_test',
      clientId: 'client_blue',
      eventTypeId: 'type_story',
      title: 'Story dental',
      description: 'Consejo rapido',
      startsAt: '2026-06-09T12:00:00',
      endsAt: '2026-06-09T12:15:00',
      status: 'published',
      customColor: null,
      responsibleUserId: 'user_lily',
      createdByUserId: 'user_lily',
      createdAt: '2026-06-01T09:00:00',
      updatedAt: '2026-06-01T09:00:00',
    },
    {
      id: 'evt_orphan',
      organizationId: 'org_test',
      clientId: 'missing_client',
      eventTypeId: 'type_story',
      title: 'Debe ignorarse',
      description: 'sin relaciones',
      startsAt: '2026-06-10T12:00:00',
      endsAt: '2026-06-10T12:15:00',
      status: 'cancelled',
      customColor: null,
      responsibleUserId: 'user_lily',
      createdByUserId: 'user_lily',
      createdAt: '2026-06-01T09:00:00',
      updatedAt: '2026-06-01T09:00:00',
    },
  ],
};

describe('planner helpers', () => {
  it('prioriza el color de la empresa sobre cualquier color personalizado', () => {
    expect(resolveEventColor(dataset.events[0], dataset.clients[0], '#4f46e5')).toBe('#ff7a7a');
  });

  it('resuelve eventos enriquecidos e ignora relaciones rotas', () => {
    const resolved = resolveEvents(dataset);

    expect(resolved).toHaveLength(2);
    expect(resolved[0].id).toBe('evt_a');
    expect(resolved[0].client.name).toBe('Cliente Rojo');
    expect(resolved[0].displayColor).toBe('#ff7a7a');
    expect(resolved[1].statusLabel).toBe('Publicado');
  });

  it('aplica filtros combinados por cliente, tipo, estado y texto', () => {
    const resolved = resolveEvents(dataset);

    const filtered = applyEventFilters(resolved, {
      clientIds: ['client_blue'],
      typeIds: ['type_story'],
      statuses: ['published'],
      search: 'dental',
    });

    expect(filtered.map((event) => event.id)).toEqual(['evt_b']);
  });

  it('calcula metricas del dashboard y proximos eventos', () => {
    const resolved = resolveEvents(dataset);
    const baseDate = new Date('2026-06-05T09:00:00');

    expect(getDashboardMetrics(resolved, baseDate)).toEqual({
      weekTotal: 2,
      pendingTotal: 1,
      publishedTotal: 1,
      activeClients: 2,
    });
    expect(getUpcomingEvents(resolved, baseDate, 1).map((event) => event.id)).toEqual(['evt_a']);
  });

  it('resume la carga semanal por empresa con porcentajes relativos', () => {
    const resolved = resolveEvents(dataset);
    const workload = getWeeklyWorkload(resolved, new Date('2026-06-05T00:00:00'));

    expect(workload).toEqual([
      { clientId: 'client_red', total: 1, percentage: 100 },
      { clientId: 'client_blue', total: 1, percentage: 100 },
    ]);
  });
});
