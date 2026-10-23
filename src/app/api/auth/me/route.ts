import { getCurrentUser } from '@/lib/auth';
import { publicError } from '@/lib/security';

export async function GET() {
  try {
    const data = await getCurrentUser();
    return Response.json(data);
  } catch (error: unknown) {
    return publicError(error);
  }
}
