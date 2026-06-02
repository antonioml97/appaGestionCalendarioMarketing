import type { APIRoute } from 'astro';
import { z } from 'zod';
import { deleteClient, saveClient } from '../../db/repository';

const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2),
  color: z.string().trim().min(4).max(16),
  description: z.string().trim().optional(),
  active: z.boolean(),
});

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  const currentUser = locals.currentUser;

  if (!currentUser) {
    return redirect('/login');
  }

  const formData = await request.formData();
  const action = String(formData.get('_action') ?? 'save');
  const redirectTo = String(formData.get('redirectTo') ?? '/clients');

  if (action === 'delete') {
    const id = String(formData.get('id') ?? '');
    await deleteClient(currentUser, id);
    return redirect(redirectTo);
  }

  const parsed = clientSchema.parse({
    id: String(formData.get('id') ?? '').trim() || undefined,
    name: formData.get('name'),
    color: formData.get('color'),
    description: String(formData.get('description') ?? '').trim() || undefined,
    active: formData.get('active') === 'on',
  });

  await saveClient(currentUser, parsed);
  return redirect(redirectTo);
};
