const trim = (value?: string | null) => value?.trim() || undefined;

const readServerEnv = (key: keyof NodeJS.ProcessEnv) => trim(process.env[key]);

export const getDemoUsername = () =>
  readServerEnv('DEMO_USERNAME') || trim(import.meta.env.DEMO_USERNAME) || 'admin';

export const getDemoPassword = () =>
  readServerEnv('DEMO_PASSWORD') || trim(import.meta.env.DEMO_PASSWORD) || 'admin123';

export const getDemoCredentials = () => ({
  username: getDemoUsername(),
  password: getDemoPassword(),
});

export const getDatabaseUrl = () =>
  readServerEnv('DATABASE_URL') || trim(import.meta.env.DATABASE_URL);

export const getPlannerDataDir = () =>
  readServerEnv('PLANNER_DATA_DIR') || trim(import.meta.env.PLANNER_DATA_DIR);
