import { relations } from 'drizzle-orm';
import {
  boolean,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import type { EventStatus, PlannerIconName, UserRole } from '../types/planner';

const auditColumns = {
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull(),
};

export const organizations = pgTable('organizations', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 160 }).notNull(),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
  description: text('description'),
  logoUrl: text('logo_url'),
  primaryColor: varchar('primary_color', { length: 16 }).notNull(),
  ...auditColumns,
});

export const users = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  organizationId: varchar('organization_id', { length: 64 })
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  username: varchar('username', { length: 80 }).notNull().unique(),
  name: varchar('name', { length: 160 }).notNull(),
  email: varchar('email', { length: 200 }).notNull(),
  passwordHash: text('password_hash'),
  authProvider: varchar('auth_provider', { length: 48 }),
  role: varchar('role', { length: 32 }).$type<UserRole>().default('manager').notNull(),
  title: varchar('title', { length: 160 }).default('Administrador').notNull(),
  avatarColor: varchar('avatar_color', { length: 16 }).default('#4f46e5').notNull(),
  active: boolean('active').default(true).notNull(),
  ...auditColumns,
});

export const clients = pgTable('clients', {
  id: varchar('id', { length: 64 }).primaryKey(),
  organizationId: varchar('organization_id', { length: 64 })
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 160 }).notNull(),
  color: varchar('color', { length: 16 }).notNull(),
  description: text('description'),
  active: boolean('active').default(true).notNull(),
  ...auditColumns,
});

export const eventTypes = pgTable('event_types', {
  id: varchar('id', { length: 64 }).primaryKey(),
  organizationId: varchar('organization_id', { length: 64 })
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(),
  color: varchar('color', { length: 16 }).notNull(),
  icon: varchar('icon', { length: 48 }).$type<PlannerIconName>().default('calendar').notNull(),
  description: text('description'),
  active: boolean('active').default(true).notNull(),
  ...auditColumns,
});

export const calendarEvents = pgTable('calendar_events', {
  id: varchar('id', { length: 64 }).primaryKey(),
  organizationId: varchar('organization_id', { length: 64 })
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  clientId: varchar('client_id', { length: 64 })
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  eventTypeId: varchar('event_type_id', { length: 64 })
    .notNull()
    .references(() => eventTypes.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  startsAt: timestamp('starts_at', { withTimezone: false }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: false }),
  status: varchar('status', { length: 32 }).$type<EventStatus>().default('pending').notNull(),
  customColor: varchar('custom_color', { length: 16 }),
  responsibleUserId: varchar('responsible_user_id', { length: 64 }).references(() => users.id, {
    onDelete: 'set null',
  }),
  createdByUserId: varchar('created_by_user_id', { length: 64 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  ...auditColumns,
});

export const organizationRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  clients: many(clients),
  eventTypes: many(eventTypes),
  calendarEvents: many(calendarEvents),
}));

export const userRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  responsibleEvents: many(calendarEvents, { relationName: 'responsible_user' }),
  createdEvents: many(calendarEvents, { relationName: 'created_by_user' }),
}));

export const clientRelations = relations(clients, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [clients.organizationId],
    references: [organizations.id],
  }),
  events: many(calendarEvents),
}));

export const eventTypeRelations = relations(eventTypes, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [eventTypes.organizationId],
    references: [organizations.id],
  }),
  events: many(calendarEvents),
}));

export const calendarEventRelations = relations(calendarEvents, ({ one }) => ({
  organization: one(organizations, {
    fields: [calendarEvents.organizationId],
    references: [organizations.id],
  }),
  client: one(clients, {
    fields: [calendarEvents.clientId],
    references: [clients.id],
  }),
  eventType: one(eventTypes, {
    fields: [calendarEvents.eventTypeId],
    references: [eventTypes.id],
  }),
  responsibleUser: one(users, {
    fields: [calendarEvents.responsibleUserId],
    references: [users.id],
    relationName: 'responsible_user',
  }),
  createdByUser: one(users, {
    fields: [calendarEvents.createdByUserId],
    references: [users.id],
    relationName: 'created_by_user',
  }),
}));
