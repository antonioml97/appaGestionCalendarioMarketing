import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

export const getDb = () => {
  const connectionString = import.meta.env.DATABASE_URL;

  if (!connectionString) {
    return null;
  }

  const client = neon(connectionString);
  return drizzle({ client });
};
