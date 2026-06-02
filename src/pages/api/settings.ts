import type { APIRoute } from 'astro';
import { z } from 'zod';
import { saveOrganization } from '../../db/repository';

const settingsSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  primaryColor: z.string().trim().min(4).max(16),
  description: z.string().trim().optional(),
});

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  const currentUser = locals.currentUser;

  if (!currentUser) {
    return redirect('/login');
  }

  const formData = await request.formData();
  const parsed = settingsSchema.parse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    primaryColor: formData.get('primaryColor'),
    description: String(formData.get('description') ?? '').trim() || undefined,
  });

  await saveOrganization(currentUser, parsed);
  return redirect('/settings');
};
