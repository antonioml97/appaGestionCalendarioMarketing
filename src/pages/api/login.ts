import type { APIRoute } from 'astro';
import { authenticateUser, SESSION_COOKIE } from '../../lib/session';

/**
 * Procesa el login demo, persiste la cookie de sesion y redirige al calendario.
 */
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const username = String(formData.get('username') ?? '');
  const password = String(formData.get('password') ?? '');

  const user = await authenticateUser(username, password);

  if (!user) {
    return redirect('/login?error=1');
  }

  cookies.set(SESSION_COOKIE, user.id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: 60 * 60 * 8,
  });

  return redirect('/calendar');
};
