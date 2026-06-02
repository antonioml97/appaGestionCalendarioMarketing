import type { APIRoute } from 'astro';
import { z } from 'zod';
import { deleteEventType, saveEventType } from '../../db/repository';
import type { PlannerIconName } from '../../types/planner';

const eventTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2),
  color: z.string().trim().min(4).max(16),
  description: z.string().trim().optional(),
  icon: z.custom<PlannerIconName>(),
  active: z.boolean(),
});

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  const currentUser = locals.currentUser;

  if (!currentUser) {
    return redirect('/login');
  }

  const formData = await request.formData();
  const action = String(formData.get('_action') ?? 'save');
  const redirectTo = String(formData.get('redirectTo') ?? '/event-types');

  if (action === 'delete') {
    const id = String(formData.get('id') ?? '');
    await deleteEventType(currentUser, id);
    return redirect(redirectTo);
  }

  const parsed = eventTypeSchema.parse({
    id: String(formData.get('id') ?? '').trim() || undefined,
    name: formData.get('name'),
    color: formData.get('color'),
    description: String(formData.get('description') ?? '').trim() || undefined,
    icon: String(formData.get('icon') ?? 'calendar') as PlannerIconName,
    active: formData.get('active') === 'on',
  });

  await saveEventType(currentUser, parsed);
  return redirect(redirectTo);
};
