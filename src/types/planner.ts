export type UserRole = 'admin' | 'manager';

export type EventStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'published'
  | 'cancelled';

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';
export type StatusTone = 'info' | 'warning' | 'success' | 'mint' | 'muted';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlannerUser {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  demoPassword: string;
  title: string;
  avatarColor: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface PlannerDataset {
  organization: Organization;
  users: PlannerUser[];
  clients: Client[];
  eventTypes: EventType[];
  events: CalendarEvent[];
}

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

export interface ResolvedCalendarEvent extends CalendarEvent {
  client: Client;
  eventType: EventType;
  responsible?: PlannerUser;
  createdBy: PlannerUser;
  displayColor: string;
  statusLabel: string;
}
