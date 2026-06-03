import type { APIRoute } from 'astro';
import { deleteEventType, saveEventType } from '../../db/repository';
import {
  parseEventTypeFormData,
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
  const redirectTo = readRedirectTo(formData, '/event-types');

  if (action === 'delete') {
    const id = readId(formData);
    await deleteEventType(currentUser, id);
    return redirect(redirectTo);
  }

  await saveEventType(currentUser, parseEventTypeFormData(formData));
  return redirect(redirectTo);
};
