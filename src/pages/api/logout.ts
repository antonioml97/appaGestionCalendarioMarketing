import type { APIRoute } from 'astro';
import { SESSION_COOKIE } from '../../lib/session';

/**
 * Elimina la cookie de sesion demo y devuelve al usuario a la pantalla de acceso.
 */
export const GET: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(SESSION_COOKIE, { path: '/' });
  return redirect('/login');
};
