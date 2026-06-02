import { authenticateUser, findUserById } from '../db/repository';

/**
 * Nombre de la cookie usada para mantener la sesion de la app.
 */
export const SESSION_COOKIE = 'planner_session';

export { authenticateUser, findUserById };
