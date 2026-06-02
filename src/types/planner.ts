/**
 * Roles disponibles dentro del planner.
 */
export type UserRole = 'admin' | 'manager';

/**
 * Estados posibles para un evento del calendario.
 */
export type EventStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'published'
  | 'cancelled';

/**
 * Vistas disponibles en la UI del calendario.
 */
export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

/**
 * Variantes visuales usadas por los badges de estado.
 */
export type StatusTone = 'info' | 'warning' | 'success' | 'mint' | 'muted';

/**
 * Datos base de una organizacion dentro del entorno multi-tenant.
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Usuario operativo del planner.
 */
export interface PlannerUser {
  id: string;
  organizationId: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  active: boolean;
  demoPassword?: string;
  title: string;
  avatarColor: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cliente o empresa asociada a una organizacion.
 */
export interface Client {
  id: string;
  organizationId: string;
  name: string;
  color: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Categoria de evento representada con color e icono propios.
 */
export interface EventType {
  id: string;
  organizationId: string;
  name: string;
  color: string;
  icon: PlannerIconName;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Registro base de un evento del calendario.
 */
export interface CalendarEvent {
  id: string;
  organizationId: string;
  clientId: string;
  eventTypeId: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  status: EventStatus;
  customColor?: string | null;
  responsibleUserId?: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Conjunto completo de datos necesarios para renderizar la app de una organizacion.
 */
export interface PlannerDataset {
  organization: Organization;
  users: PlannerUser[];
  clients: Client[];
  eventTypes: EventType[];
  events: CalendarEvent[];
}

/**
 * Identificadores de iconos soportados por el componente compartido de iconografia.
 */
export type PlannerIconName =
  | 'search'
  | 'plus'
  | 'chevron-left'
  | 'chevron-right'
  | 'calendar'
  | 'agenda'
  | 'company'
  | 'dashboard'
  | 'reel'
  | 'post'
  | 'video'
  | 'story'
  | 'campaign'
  | 'meeting'
  | 'settings'
  | 'user'
  | 'clock'
  | 'filter'
  | 'menu'
  | 'close'
  | 'duplicate'
  | 'edit'
  | 'publish'
  | 'trash'
  | 'spark'
  | 'logout';

/**
 * Evento enriquecido con las relaciones necesarias para la UI.
 */
export interface ResolvedCalendarEvent extends CalendarEvent {
  client: Client;
  eventType: EventType;
  responsible?: PlannerUser;
  createdBy: PlannerUser;
  displayColor: string;
  statusLabel: string;
}
