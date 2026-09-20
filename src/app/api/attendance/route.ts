import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const studentStats = searchParams.get('studentStats');

    const { user, student } = await getCurrentUser();
    const db = getDb();

    // If requested for student statistics (percentage, counts, history)
    if (studentStats === 'true' || user?.role === 'student') {
      const targetStudentId = student?.id;
      if (!targetStudentId) {
        return Response.json({ error: 'Student profile not found' }, { status: 404 });
      }

      // Individual student attendance summary
      const counts = db.prepare(`
        SELECT 
          count(*) as total_recorded,
          sum(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present,
          sum(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent,
          sum(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) as late,
          sum(CASE WHEN status = 'EXCUSED' THEN 1 ELSE 0 END) as excused
        FROM attendance
        WHERE student_id = ?
      `).get(targetStudentId) as any;

      const percentage = counts.total_recorded > 0 
        ? Math.round(((counts.present + counts.late * 0.5) / counts.total_recorded) * 100) 
        : 100;

      // History of attended sessions
      const history = db.prepare(`
        SELECT a.*, s.date, s.start_time, s.end_time, s.topic, s.session_type,
               sub.name as subject_name, sub.color as subject_color, sub.icon as subject_icon
        FROM attendance a
        JOIN schedule_sessions s ON a.session_id = s.id
        LEFT JOIN subjects sub ON s.subject_id = sub.id
        WHERE a.student_id = ?
        ORDER BY s.date DESC, s.start_time DESC
        LIMIT 30
      `).all(targetStudentId);

      return Response.json({
        stats: {
          total: counts.total_recorded,
          present: counts.present || 0,
          absent: counts.absent || 0,
          late: counts.late || 0,
          excused: counts.excused || 0,
          percentage,
        },
        history,
      });
    }

    // Teacher/Admin view: Get attendance list for a specific session
    if (!sessionId) {
      return Response.json({ error: 'Session ID is required' }, { status: 400 });
    }

    if (!user || !['super_admin', 'batch_admin', 'teacher'].includes(user.role)) {
      return Response.json({ error: 'Permission denied: only teachers and admins can view class attendance records' }, { status: 403 });
    }

    const session = db.prepare(`
      SELECT s.*, b.name as batch_name, b.full_label as batch_full_label,
             sub.name as subject_name
      FROM schedule_sessions s
      JOIN batches b ON s.batch_id = b.id
      LEFT JOIN subjects sub ON s.subject_id = sub.id
      WHERE s.id = ?
    `).get(sessionId) as any;

    if (!session) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    // Fetch all students in this session's batch
    const batchStudents = db.prepare(`
      SELECT s.id, s.roll_number, u.full_name, u.avatar_url
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.batch_id = ?
      ORDER BY s.roll_number ASC
    `).all(session.batch_id) as any[];

    // Fetch marked attendance records for this session
    const markedRecords = db.prepare(`
      SELECT * FROM attendance WHERE session_id = ?
    `).all(sessionId) as any[];

    const recordMap = new Map<string, any>(markedRecords.map(r => [r.student_id, r]));

    const studentsAttendance = batchStudents.map(st => {
      const rec = recordMap.get(st.id);
      return {
        student_id: st.id,
        full_name: st.full_name,
        roll_number: st.roll_number,
        avatar_url: st.avatar_url,
        status: rec ? rec.status : 'PRESENT', // default to PRESENT when opening
        remarks: rec ? rec.remarks : '',
        marked: !!rec,
      };
    });

    const presentCount = studentsAttendance.filter(s => s.status === 'PRESENT').length;

    return Response.json({
      session,
      students: studentsAttendance,
      summary: {
        total: studentsAttendance.length,
        present: presentCount,
        absent: studentsAttendance.filter(s => s.status === 'ABSENT').length,
        late: studentsAttendance.filter(s => s.status === 'LATE').length,
        excused: studentsAttendance.filter(s => s.status === 'EXCUSED').length,
      },
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentUser();
    if (!user || !['super_admin', 'batch_admin', 'teacher'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized to mark attendance' }, { status: 403 });
    }

    const body = await request.json();
    const { session_id, records } = body; // records: Array of { student_id, status, remarks }

    if (!session_id || !Array.isArray(records)) {
      return Response.json({ error: 'Session ID and student records array required' }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    const insertOrUpdate = db.prepare(`
      INSERT INTO attendance (id, session_id, student_id, status, remarks, marked_by, marked_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id, student_id) DO UPDATE SET
        status = excluded.status,
        remarks = excluded.remarks,
        marked_by = excluded.marked_by,
        marked_at = excluded.marked_at
    `);

    const updateMany = db.transaction((recs: any[]) => {
      for (const rec of recs) {
        const id = `att-${session_id}-${rec.student_id}`;
        insertOrUpdate.run(
          id,
          session_id,
          rec.student_id,
          rec.status,
          rec.remarks || null,
          user.id,
          now
        );
      }
      // Also mark session status as COMPLETED if it was in the past or in progress
      db.prepare(`UPDATE schedule_sessions SET status = 'COMPLETED' WHERE id = ? AND status = 'SCHEDULED'`).run(session_id);
    });

    updateMany(records);

    return Response.json({ success: true, count: records.length });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
