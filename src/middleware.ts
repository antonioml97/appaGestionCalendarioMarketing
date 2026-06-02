import { defineMiddleware } from 'astro:middleware';
import { findUserById, SESSION_COOKIE } from './lib/session';

/**
 * Rutas publicas que no requieren sesion.
 */
const publicPaths = new Set(['/login', '/api/login', '/favicon.ico']);

/**
 * Prefijos de assets que deben pasar sin control de acceso.
 */
const publicPrefixes = ['/_astro/', '/images/', '/assets/'];

/**
 * Middleware global que resuelve la sesion demo y protege las rutas privadas.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (
    publicPaths.has(pathname) ||
    publicPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return next();
  }

  const sessionUser = await findUserById(context.cookies.get(SESSION_COOKIE)?.value);

  if (!sessionUser && pathname !== '/') {
    return context.redirect('/login');
  }

  if (sessionUser) {
    context.locals.currentUser = sessionUser;
  }

  return next();
});
