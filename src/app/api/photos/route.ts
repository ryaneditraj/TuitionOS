import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const sessionId = searchParams.get('sessionId');
    const batchId = searchParams.get('batchId');

    const { user, student } = await getCurrentUser();
    const db = getDb();

    let query = `
      SELECT p.*,
             sub.name as subject_name, sub.code as subject_code, sub.color as subject_color,
             u.full_name as uploader_name,
             s.topic as session_topic, s.date as session_date
      FROM class_photos p
      LEFT JOIN subjects sub ON p.subject_id = sub.id
      LEFT JOIN users u ON p.uploader_id = u.id
      LEFT JOIN schedule_sessions s ON p.session_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (subjectId) {
      query += ` AND p.subject_id = ?`;
      params.push(subjectId);
    }

    if (sessionId) {
      query += ` AND p.session_id = ?`;
      params.push(sessionId);
    }

    const effectiveBatch = batchId || (user?.role === 'student' ? student?.batch_id : undefined);
    if (effectiveBatch) {
      query += ` AND p.batch_id = ?`;
      params.push(effectiveBatch);
    }

    query += ` ORDER BY p.created_at DESC`;

    const photos = db.prepare(query).all(...params) as any[];

    return Response.json({ photos });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentUser();
    if (!user || !['super_admin', 'batch_admin', 'teacher'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized to upload board photos' }, { status: 403 });
    }

    const body = await request.json();
    const { session_id, batch_id, subject_id, title, photo_url, caption } = body;

    if (!batch_id || !subject_id || !photo_url) {
      return Response.json({ error: 'Missing required photo fields' }, { status: 400 });
    }

    const db = getDb();
    const id = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO class_photos (
        id, session_id, batch_id, subject_id, uploader_id, title, photo_url, caption, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      session_id || null,
      batch_id,
      subject_id,
      user.id,
      title || 'Classroom Board Photo',
      photo_url,
      caption || null,
      now
    );

    return Response.json({ success: true, id });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { user } = await getCurrentUser();
    if (!user || !['super_admin', 'batch_admin', 'teacher'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'Photo ID is required' }, { status: 400 });

    const db = getDb();
    db.prepare('DELETE FROM class_photos WHERE id = ?').run(id);

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
