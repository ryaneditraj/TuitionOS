import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';
import { clientAddress, publicError, rateLimit } from '@/lib/security';
import { User } from '@/lib/types';

const DUMMY_HASH = bcrypt.hashSync('trinity-one-timing-pad', 10);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const limitKey = `${clientAddress(request)}:${email.toLowerCase()}`;
    if (!rateLimit(`login:${limitKey}`, 8, 10 * 60 * 1000)) {
      return Response.json({ error: 'Too many sign-in attempts. Try again in a few minutes.' }, { status: 429 });
    }

    const db = getDb();
    const user = db.prepare('SELECT id, email, full_name, role, avatar_url, password_hash FROM users WHERE LOWER(email) = LOWER(?)').get(email) as (User & { password_hash: string }) | undefined;

    const hash = user?.password_hash || DUMMY_HASH;
    const isValid = bcrypt.compareSync(password, hash);
    if (!user || !isValid) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
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
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error: unknown) {
    return publicError(error);
  }
}
