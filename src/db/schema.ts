import { relations } from 'drizzle-orm';
import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'manager']);
export const eventStatusEnum = pgEnum('event_status', [
  'pending',
  'in_progress',
  'completed',
  'published',
  'cancelled',
]);

const auditColumns = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 160 }).notNull(),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
  logoUrl: text('logo_url'),
  primaryColor: varchar('primary_color', { length: 16 }).notNull(),
  ...auditColumns,
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 160 }).notNull(),
  email: varchar('email', { length: 200 }).notNull(),
  passwordHash: text('password_hash'),
  authProvider: varchar('auth_provider', { length: 48 }),
  role: userRoleEnum('role').default('manager').notNull(),
  active: boolean('active').default(true).notNull(),
  ...auditColumns,
});

export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 160 }).notNull(),
  color: varchar('color', { length: 16 }).notNull(),
  description: text('description'),
  active: boolean('active').default(true).notNull(),
  ...auditColumns,
});

export const eventTypes = pgTable('event_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(),
  color: varchar('color', { length: 16 }).notNull(),
  icon: varchar('icon', { length: 48 }).default('calendar').notNull(),
  description: text('description'),
  active: boolean('active').default(true).notNull(),
  ...auditColumns,
});

export const calendarEvents = pgTable('calendar_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id),
  eventTypeId: uuid('event_type_id')
    .notNull()
    .references(() => eventTypes.id),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  status: eventStatusEnum('status').default('pending').notNull(),
  customColor: varchar('custom_color', { length: 16 }),
  responsibleUserId: uuid('responsible_user_id').references(() => users.id),
  createdByUserId: uuid('created_by_user_id')
    .notNull()
    .references(() => users.id),
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
