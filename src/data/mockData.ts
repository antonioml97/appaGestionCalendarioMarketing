import type {
  CalendarEvent,
  Client,
  EventType,
  Organization,
  PlannerUser,
} from '../types/planner';

const createdAt = '2026-05-01T09:00:00';

/**
 * Nombre de usuario configurable para la cuenta admin inicial.
 */
const adminUsername =
  process.env.DEMO_USERNAME?.trim() || import.meta.env.DEMO_USERNAME?.trim() || 'admin';

/**
 * Contrasena configurable para la cuenta admin inicial.
 */
const adminPassword =
  process.env.DEMO_PASSWORD?.trim() ||
  import.meta.env.DEMO_PASSWORD?.trim() ||
  'admin123';

/**
 * Organizacion inicial usada para el primer arranque del planner.
 */
export const organizations: Organization[] = [
  {
    id: 'org_marketing-planner',
    name: 'Marketing Planner Studio',
    slug: 'marketing-planner-studio',
    primaryColor: '#4f46e5',
    createdAt,
    updatedAt: createdAt,
  },
];

/**
 * Usuario administrador inicial que se sincroniza con la base de datos.
 */
export const users: PlannerUser[] = [
  {
    id: 'usr_admin',
    organizationId: 'org_marketing-planner',
    name: 'Administrador',
    username: adminUsername,
    email: `${adminUsername}@planner.demo`,
    role: 'admin',
    active: true,
    demoPassword: adminPassword,
    title: 'Administrador',
    avatarColor: '#4f46e5',
    createdAt,
    updatedAt: createdAt,
  },
];

/**
 * Sin datos precargados de clientes.
 */
export const clients: Client[] = [];

/**
 * Sin datos precargados de tipos de evento.
 */
export const eventTypes: EventType[] = [];

/**
 * Sin datos precargados de eventos.
 */
export const events: CalendarEvent[] = [];
