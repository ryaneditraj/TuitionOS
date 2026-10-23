import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';
import { isDemoMode, publicError } from '@/lib/security';
import { User } from '@/lib/types';

export async function POST(request: Request) {
  try {
    if (!isDemoMode()) {
      return Response.json({ error: 'Demo persona switching is disabled' }, { status: 403 });
    }

    const body = await request.json();
    const userId = typeof body?.userId === 'string' ? body.userId : '';
    if (!userId) {
      return Response.json({ error: 'User id is required' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT id, email, full_name, role FROM users WHERE id = ?').get(userId) as User | undefined;
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const token = await createSessionToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions());

    return Response.json({
      success: true,
      user,
    });
  } catch (error: unknown) {
    return publicError(error);
  }
}
