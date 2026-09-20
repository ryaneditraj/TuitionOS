import { cookies } from 'next/headers';

export async function POST() {
  cookies().delete('trinity_session');
  return Response.json({ success: true });
}
