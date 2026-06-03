import type { APIRoute } from 'astro';
import { deleteClient, saveClient } from '../../db/repository';
import {
  parseClientFormData,
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
  const redirectTo = readRedirectTo(formData, '/clients');

  if (action === 'delete') {
    const id = readId(formData);
    await deleteClient(currentUser, id);
    return redirect(redirectTo);
  }

  await saveClient(currentUser, parseClientFormData(formData));
  return redirect(redirectTo);
};
