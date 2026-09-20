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
      SELECT m.*,
             sub.name as subject_name, sub.code as subject_code, sub.color as subject_color,
             u.full_name as uploader_name,
             s.topic as session_topic, s.date as session_date
      FROM class_materials m
      LEFT JOIN subjects sub ON m.subject_id = sub.id
      LEFT JOIN users u ON m.uploader_id = u.id
      LEFT JOIN schedule_sessions s ON m.session_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (subjectId) {
      query += ` AND m.subject_id = ?`;
      params.push(subjectId);
    }

    if (sessionId) {
      query += ` AND m.session_id = ?`;
      params.push(sessionId);
    }

    const effectiveBatch = batchId || (user?.role === 'student' ? student?.batch_id : undefined);
    if (effectiveBatch) {
      query += ` AND m.batch_id = ?`;
      params.push(effectiveBatch);
    }

    query += ` ORDER BY m.created_at DESC`;

    const materials = db.prepare(query).all(...params) as any[];

    return Response.json({ materials });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, student, managedBatchIds } = await getCurrentUser();
    if (!user || !['super_admin', 'batch_admin', 'teacher'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized to upload materials' }, { status: 403 });
    }

    const body = await request.json();
    const { session_id, batch_id, subject_id, title, description, file_name, file_url, file_type, file_size } = body;

    if (!batch_id || !subject_id || !title || !file_url) {
      return Response.json({ error: 'Missing required material fields' }, { status: 400 });
    }

    const db = getDb();
    const id = `mat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO class_materials (
        id, session_id, batch_id, subject_id, uploader_id, title, description, file_name, file_url, file_type, file_size, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      session_id || null,
      batch_id,
      subject_id,
      user.id,
      title,
      description || null,
      file_name || title,
      file_url,
      file_type || 'pdf',
      file_size || '1.5 MB',
      now
    );

    return Response.json({ success: true, id });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
