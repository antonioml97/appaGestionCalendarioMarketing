import { defineMiddleware } from 'astro:middleware';
import { findUserById, SESSION_COOKIE } from './lib/session';

const publicPaths = new Set(['/login', '/api/login', '/favicon.ico']);
const publicPrefixes = ['/_astro/', '/images/', '/assets/'];

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  if (
    publicPaths.has(pathname) ||
    publicPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return next();
  }

  const sessionUser = findUserById(context.cookies.get(SESSION_COOKIE)?.value);

  if (!sessionUser && pathname !== '/') {
    return context.redirect('/login');
  }

  if (sessionUser) {
    context.locals.currentUser = sessionUser;
  }

  return next();
});
