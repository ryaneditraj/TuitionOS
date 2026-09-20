import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const data = await getCurrentUser();
    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
