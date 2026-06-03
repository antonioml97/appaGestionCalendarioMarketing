import { eq } from 'drizzle-orm';
import { getDb } from '../client';
import { organizations } from '../schema';
import type { PlannerUser } from '../../types/planner';

export const saveOrganization = async (
  user: PlannerUser,
  input: {
    name: string;
    slug: string;
    primaryColor: string;
    description?: string | null;
  },
) => {
  const db = await getDb();

  await db
    .update(organizations)
    .set({
      name: input.name,
      slug: input.slug,
      primaryColor: input.primaryColor,
      description: input.description ?? null,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, user.organizationId));
};
