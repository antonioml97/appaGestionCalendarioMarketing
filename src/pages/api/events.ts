import type { APIRoute } from 'astro';
import {
  deleteEvent,
  duplicateEvent,
  saveEvent,
  updateEventStatus,
} from '../../db/repository';
import {
  parseEventFormData,
  readAction,
  readId,
  readRedirectTo,
} from '../../lib/validation/forms';

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  const currentUser = locals.currentUser;

  if (!currentUser) {
    return redirect('/login');
  }

  const formData = await request.formData();
  const action = readAction(formData);
  const redirectTo = readRedirectTo(formData, '/calendar');
  const eventId = readId(formData);

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

  await saveEvent(currentUser, parseEventFormData(formData));

  return redirect(redirectTo);
};
