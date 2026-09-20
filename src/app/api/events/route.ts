import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const db = getDb();
    const events = db.prepare('SELECT * FROM events ORDER BY date ASC').all() as any[];

    const parsedEvents = events.map(e => ({
      ...e,
      photos: e.photos_json ? JSON.parse(e.photos_json) : [],
    }));

    return Response.json({ events: parsedEvents });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentUser();
    if (!user || !['super_admin', 'batch_admin'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized to create events' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, date, start_time, end_time, location, category, photos } = body;

    if (!title || !description || !date) {
      return Response.json({ error: 'Missing required event fields' }, { status: 400 });
    }

    const db = getDb();
    const id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO events (
        id, institution_id, title, description, date, start_time, end_time, location, category, photos_json, created_at
      ) VALUES (?, 'inst-trinity', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      description,
      date,
      start_time || null,
      end_time || null,
      location || null,
      category || 'Academic',
      photos ? JSON.stringify(photos) : null,
      now
    );

    return Response.json({ success: true, id });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
