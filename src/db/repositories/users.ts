import { and, eq } from 'drizzle-orm';
import { getDb } from '../client';
import { users } from '../schema';
import { mapUser } from './mappers';

export const findUserById = async (userId?: string | null) => {
  if (!userId) {
    return undefined;
  }

  const db = await getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.active, true)))
    .limit(1);

  return user ? mapUser(user) : undefined;
};

export const authenticateUser = async (username: string, password: string) => {
  const db = await getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.username, username.trim()),
        eq(users.passwordHash, password),
        eq(users.active, true),
      ),
    )
    .limit(1);

  return user ? mapUser(user) : undefined;
};
