import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const { user } = await getCurrentUser();
    if (!user || !['super_admin', 'batch_admin'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = getDb();
    const today = '2026-09-20';

    const studentsCount = (db.prepare('SELECT count(*) as c FROM students').get() as any).c;
    const teachersCount = (db.prepare('SELECT count(*) as c FROM teachers').get() as any).c;
    const batchesCount = (db.prepare('SELECT count(*) as c FROM batches').get() as any).c;
    const todayClassesCount = (db.prepare('SELECT count(*) as c FROM schedule_sessions WHERE date = ?').get(today) as any).c;
    const upcomingExamsCount = (db.prepare('SELECT count(*) as c FROM exams WHERE date >= ?').get(today) as any).c;
    const pendingTasksCount = (db.prepare('SELECT count(*) as c FROM task_assignments WHERE status != "COMPLETED"').get() as any).c;
    const feedbackCount = (db.prepare('SELECT count(*) as c FROM feedback WHERE status = "Received"').get() as any).c;

    const attRow = db.prepare(`
      SELECT 
        count(*) as total,
        sum(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present
      FROM attendance
    `).get() as any;

    const overallAttendanceRate = attRow.total > 0 ? Math.round((attRow.present / attRow.total) * 100) : 92;

    const recentAnnouncements = db.prepare('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 3').all();
    const recentFeedback = db.prepare(`
      SELECT f.*, CASE WHEN f.is_anonymous = 1 THEN 'Anonymous Student' ELSE u.full_name END as author_name
      FROM feedback f
      LEFT JOIN students s ON f.student_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY f.created_at DESC
      LIMIT 3
    `).all();

    return Response.json({
      stats: {
        studentsCount,
        teachersCount,
        batchesCount,
        todayClassesCount,
        upcomingExamsCount,
        pendingTasksCount,
        feedbackCount,
        overallAttendanceRate,
      },
      recentAnnouncements,
      recentFeedback,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
