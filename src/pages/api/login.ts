import type { APIRoute } from 'astro';
import { authenticateDemoUser, SESSION_COOKIE } from '../../lib/session';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const user = authenticateDemoUser(email, password);

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
