import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const { user, student } = await getCurrentUser();
    const db = getDb();

    if (user?.role === 'student' && student) {
      // Students only view their own feedback submissions (anonymous submissions hide user name)
      const list = db.prepare(`
        SELECT f.*, 
               CASE WHEN f.is_anonymous = 1 THEN 'Anonymous Student' ELSE u.full_name END as author_display_name
        FROM feedback f
        LEFT JOIN students s ON f.student_id = s.id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE f.student_id = ?
        ORDER BY f.created_at DESC
      `).all(student.id);

      return Response.json({ feedback: list });
    }

    // Admins and teachers can view feedback (anonymous feedback strips identity)
    const list = db.prepare(`
      SELECT f.*,
             CASE WHEN f.is_anonymous = 1 THEN 'Anonymous Student (Identity Protected)' ELSE u.full_name END as author_display_name,
             CASE WHEN f.is_anonymous = 1 THEN NULL ELSE b.name END as batch_name
      FROM feedback f
      LEFT JOIN students s ON f.student_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN batches b ON s.batch_id = b.id
      ORDER BY f.created_at DESC
    `).all();

    return Response.json({ feedback: list });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, student } = await getCurrentUser();
    const body = await request.json();
    const { category, subject, message, is_anonymous } = body;

    if (!category || !subject || !message) {
      return Response.json({ error: 'Category, subject, and message are required' }, { status: 400 });
    }

    const db = getDb();
    const id = `fb-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    // When anonymous is true, do not link student_id if chosen or store anonymous flag
    const storedStudentId = is_anonymous ? null : (student?.id || null);

    db.prepare(`
      INSERT INTO feedback (id, student_id, is_anonymous, category, subject, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'Received', ?)
    `).run(
      id,
      storedStudentId,
      is_anonymous ? 1 : 0,
      category,
      subject,
      message,
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
      return Response.json({ error: 'Unauthorized to review feedback' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, admin_reply } = body;

    if (!id) {
      return Response.json({ error: 'Feedback ID is required' }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE feedback
      SET status = COALESCE(?, status),
          admin_reply = COALESCE(?, admin_reply),
          replied_at = ?
      WHERE id = ?
    `).run(status || null, admin_reply || null, now, id);

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
