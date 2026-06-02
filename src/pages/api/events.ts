import type { APIRoute } from 'astro';
import { z } from 'zod';
import {
  deleteEvent,
  duplicateEvent,
  saveEvent,
  updateEventStatus,
} from '../../db/repository';
import type { EventStatus } from '../../types/planner';

const eventSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2),
  clientId: z.string().trim().min(1),
  eventTypeId: z.string().trim().min(1),
  startsAt: z.string().trim().min(1),
  endsAt: z.string().trim().optional(),
  description: z.string().trim().optional(),
  status: z.custom<EventStatus>(),
  customColor: z.string().trim().optional(),
});

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  const currentUser = locals.currentUser;

  if (!currentUser) {
    return redirect('/login');
  }

  const formData = await request.formData();
  const action = String(formData.get('_action') ?? 'save');
  const redirectTo = String(formData.get('redirectTo') ?? '/calendar');
  const eventId = String(formData.get('id') ?? '').trim();

  if (action === 'delete') {
    await deleteEvent(currentUser, eventId);
    return redirect(redirectTo);
  }

  if (action === 'publish') {
    await updateEventStatus(currentUser, eventId, 'published');
    return redirect(redirectTo);
  }

  if (action === 'duplicate') {
    await duplicateEvent(currentUser, eventId);
    return redirect(redirectTo);
  }

  const parsed = eventSchema.parse({
    id: eventId || undefined,
    title: formData.get('title'),
    clientId: formData.get('clientId'),
    eventTypeId: formData.get('eventTypeId'),
    startsAt: formData.get('startsAt'),
    endsAt: String(formData.get('endsAt') ?? '').trim() || undefined,
    description: String(formData.get('description') ?? '').trim() || undefined,
    status: String(formData.get('status') ?? 'pending') as EventStatus,
    customColor: String(formData.get('customColor') ?? '').trim() || undefined,
  });

  await saveEvent(currentUser, {
    ...parsed,
    startsAt: new Date(parsed.startsAt),
    endsAt: parsed.endsAt ? new Date(parsed.endsAt) : undefined,
  });

  return redirect(redirectTo);
};
