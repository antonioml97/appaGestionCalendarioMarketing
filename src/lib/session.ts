import { users } from '../data/mockData';

export const SESSION_COOKIE = 'planner_session';

export const findUserById = (userId?: string | null) =>
  users.find((user) => user.id === userId && user.active);

export const authenticateDemoUser = (email: string, password: string) =>
  users.find(
    (user) =>
      user.active &&
      user.email.toLowerCase() === email.toLowerCase() &&
      user.demoPassword === password,
  );
