import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';
import { createSessionToken } from '@/lib/auth';
import { User } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
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

    cookies().set('trinity_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return Response.json({
      success: true,
      user,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
