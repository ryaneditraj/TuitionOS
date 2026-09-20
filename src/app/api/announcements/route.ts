import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { user, student } = await getCurrentUser();
    const db = getDb();

    // Student sees: ALL, or matching batch, or matching class, or matching board
    let query = `
      SELECT a.*, u.full_name as created_by_name, u.role as created_by_role
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (user?.role === 'student' && student) {
      query += ` AND (
        a.target_type = 'ALL' 
        OR (a.target_type = 'BATCH' AND a.target_id = ?)
        OR a.target_type = 'SUBJECT'
      )`;
      params.push(student.batch_id);
    }

    query += ` ORDER BY a.is_pinned DESC, a.created_at DESC`;

    const announcements = db.prepare(query).all(...params);

    return Response.json({ announcements });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentUser();
    if (!user || !['super_admin', 'batch_admin', 'teacher'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized to post announcements' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, target_type = 'ALL', target_id, priority = 'NORMAL', is_pinned = false } = body;

    if (!title || !content) {
      return Response.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const db = getDb();
    const id = `ann-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO announcements (
        id, title, content, target_type, target_id, priority, is_pinned, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      content,
      target_type,
      target_id || null,
      priority,
      is_pinned ? 1 : 0,
      user.id,
      now
    );

    return Response.json({ success: true, id });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
