import type { APIRoute } from 'astro';
import { saveOrganization } from '../../db/repository';
import { parseSettingsFormData } from '../../lib/validation/forms';

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  const currentUser = locals.currentUser;

  if (!currentUser) {
    return redirect('/login');
  }

  const formData = await request.formData();
  await saveOrganization(currentUser, parseSettingsFormData(formData));
  return redirect('/settings');
};
