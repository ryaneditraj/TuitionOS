import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const { user, student } = await getCurrentUser();
    const db = getDb();

    if (user?.role === 'student' && student) {
      const reports = db.prepare(`
        SELECT pr.*, s.topic as session_topic, s.date as session_date
        FROM problem_reports pr
        LEFT JOIN schedule_sessions s ON pr.reference_session_id = s.id
        WHERE pr.student_id = ?
        ORDER BY pr.created_at DESC
      `).all(student.id);

      return Response.json({ reports });
    }

    const reports = db.prepare(`
      SELECT pr.*, u.full_name as student_name, s.topic as session_topic, s.date as session_date
      FROM problem_reports pr
      LEFT JOIN students st ON pr.student_id = st.id
      LEFT JOIN users u ON st.user_id = u.id
      LEFT JOIN schedule_sessions s ON pr.reference_session_id = s.id
      ORDER BY pr.created_at DESC
    `).all();

    return Response.json({ reports });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, student } = await getCurrentUser();
    const body = await request.json();
    const { category, title, details, reference_session_id } = body;

    if (!category || !title) {
      return Response.json({ error: 'Category and title are required' }, { status: 400 });
    }

    const db = getDb();
    const id = `prob-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO problem_reports (id, student_id, category, title, details, reference_session_id, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?)
    `).run(
      id,
      student?.id || null,
      category,
      title,
      details || '',
      reference_session_id || null,
      now
    );

    return Response.json({ success: true, id });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { user } = await getCurrentUser();
    if (!user || !['super_admin', 'batch_admin'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, resolution_notes } = body;

    if (!id) return Response.json({ error: 'ID is required' }, { status: 400 });

    const db = getDb();
    db.prepare(`
      UPDATE problem_reports
      SET status = COALESCE(?, status),
          resolution_notes = COALESCE(?, resolution_notes)
      WHERE id = ?
    `).run(status || null, resolution_notes || null, id);

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
