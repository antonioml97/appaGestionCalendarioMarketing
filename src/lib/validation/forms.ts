import { z } from 'zod';
import type { EventStatus, PlannerIconName } from '../../types/planner';

const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2),
  color: z.string().trim().min(4).max(16),
  description: z.string().trim().optional(),
  active: z.boolean(),
});

const eventTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2),
  color: z.string().trim().min(4).max(16),
  description: z.string().trim().optional(),
  icon: z.custom<PlannerIconName>(),
  active: z.boolean(),
});

const eventSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2),
  clientId: z.string().trim().min(1),
  eventTypeId: z.string().trim().min(1),
  startsAt: z.string().trim().min(1),
  endsAt: z.string().trim().optional(),
  description: z.string().trim().optional(),
  status: z.custom<EventStatus>(),
});

const settingsSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  primaryColor: z.string().trim().min(4).max(16),
  description: z.string().trim().optional(),
});

const readString = (formData: FormData, field: string) => String(formData.get(field) ?? '');
const readTrimmed = (formData: FormData, field: string) => readString(formData, field).trim();
const readOptional = (formData: FormData, field: string) => readTrimmed(formData, field) || undefined;

export const readAction = (formData: FormData, fallback = 'save') =>
  readTrimmed(formData, '_action') || fallback;

export const readRedirectTo = (formData: FormData, fallback: string) =>
  readTrimmed(formData, 'redirectTo') || fallback;

export const readId = (formData: FormData) => readTrimmed(formData, 'id');

export const parseClientFormData = (formData: FormData) =>
  clientSchema.parse({
    id: readOptional(formData, 'id'),
    name: formData.get('name'),
    color: formData.get('color'),
    description: readOptional(formData, 'description'),
    active: formData.get('active') === 'on',
  });

export const parseEventTypeFormData = (formData: FormData) =>
  eventTypeSchema.parse({
    id: readOptional(formData, 'id'),
    name: formData.get('name'),
    color: formData.get('color'),
    description: readOptional(formData, 'description'),
    icon: readTrimmed(formData, 'icon') || 'calendar',
    active: formData.get('active') === 'on',
  });

export const parseEventFormData = (formData: FormData) => {
  const parsed = eventSchema.parse({
    id: readOptional(formData, 'id'),
    title: formData.get('title'),
    clientId: formData.get('clientId'),
    eventTypeId: formData.get('eventTypeId'),
    startsAt: formData.get('startsAt'),
    endsAt: readOptional(formData, 'endsAt'),
    description: readOptional(formData, 'description'),
    status: (readTrimmed(formData, 'status') || 'pending') as EventStatus,
  });

  return {
    ...parsed,
    startsAt: new Date(parsed.startsAt),
    endsAt: parsed.endsAt ? new Date(parsed.endsAt) : undefined,
  };
};

export const parseSettingsFormData = (formData: FormData) =>
  settingsSchema.parse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    primaryColor: formData.get('primaryColor'),
    description: readOptional(formData, 'description'),
  });
