import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const batchId = searchParams.get('batchId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const { user, student } = await getCurrentUser();
    const effectiveBatchId = batchId || (user?.role === 'student' ? student?.batch_id : undefined);

    const db = getDb();

    let query = `
      SELECT s.*,
             sub.name as subject_name, sub.code as subject_code, sub.color as subject_color, sub.icon as subject_icon,
             u.full_name as teacher_name, u.avatar_url as teacher_avatar,
             r.name as room_name,
             b.name as batch_name, b.full_label as batch_full_label
      FROM schedule_sessions s
      LEFT JOIN subjects sub ON s.subject_id = sub.id
      LEFT JOIN teachers t ON s.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN rooms r ON s.room_id = r.id
      LEFT JOIN batches b ON s.batch_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (effectiveBatchId) {
      query += ` AND s.batch_id = ?`;
      params.push(effectiveBatchId);
    }

    if (date) {
      query += ` AND s.date = ?`;
      params.push(date);
    } else if (startDate && endDate) {
      query += ` AND s.date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY s.date ASC, s.start_time ASC`;

    const rawSessions = db.prepare(query).all(...params) as any[];

    // Hydrate attendance summary & my_attendance
    const sessions = rawSessions.map(sess => {
      let my_attendance = undefined;
      if (student?.id) {
        my_attendance = db.prepare(`
          SELECT * FROM attendance WHERE session_id = ? AND student_id = ?
        `).get(sess.id, student.id);
      }

      const attRows = db.prepare(`
        SELECT status, count(*) as count FROM attendance WHERE session_id = ? GROUP BY status
      `).all(sess.id) as { status: string; count: number }[];

      let total = 0;
      let present = 0;
      let absent = 0;
      let late = 0;
      attRows.forEach(r => {
        total += r.count;
        if (r.status === 'PRESENT') present = r.count;
        if (r.status === 'ABSENT') absent = r.count;
        if (r.status === 'LATE') late = r.count;
      });

      return {
        id: sess.id,
        batch_id: sess.batch_id,
        subject_id: sess.subject_id,
        teacher_id: sess.teacher_id,
        room_id: sess.room_id,
        date: sess.date,
        start_time: sess.start_time,
        end_time: sess.end_time,
        session_type: sess.session_type,
        status: sess.status,
        topic: sess.topic,
        notes_summary: sess.notes_summary,
        created_at: sess.created_at,
        subject: sess.subject_id ? {
          id: sess.subject_id,
          name: sess.subject_name,
          code: sess.subject_code,
          color: sess.subject_color,
          icon: sess.subject_icon,
        } : undefined,
        teacher: sess.teacher_id ? {
          id: sess.teacher_id,
          full_name: sess.teacher_name,
          avatar_url: sess.teacher_avatar,
        } : undefined,
        room: sess.room_id ? {
          id: sess.room_id,
          name: sess.room_name,
        } : undefined,
        batch: {
          id: sess.batch_id,
          name: sess.batch_name,
          full_label: sess.batch_full_label,
        },
        attendance_summary: total > 0 ? { total, present, absent, late } : undefined,
        my_attendance,
      };
    });

    return Response.json({ sessions });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, managedBatchIds } = await getCurrentUser();
    if (!user || !['super_admin', 'batch_admin', 'teacher'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized to schedule classes' }, { status: 403 });
    }

    const body = await request.json();
    const {
      batch_id,
      subject_id,
      teacher_id,
      room_id,
      date,
      start_time,
      end_time,
      session_type,
      topic,
      notes_summary,
      recurring_days, // e.g. [1, 3] for Mon & Wed
      recurring_until, // e.g. "2026-12-31"
    } = body;

    if (!batch_id || !date || !start_time || !end_time || !session_type) {
      return Response.json({ error: 'Missing required scheduling fields' }, { status: 400 });
    }

    if (user.role === 'batch_admin' && !managedBatchIds?.includes(batch_id)) {
      return Response.json({ error: 'You do not have permission to schedule for this batch' }, { status: 403 });
    }

    if (start_time >= end_time) {
      return Response.json({ error: 'Start time must be before end time' }, { status: 400 });
    }

    const db = getDb();

    // Check Conflict Function
    const conflict = checkConflict(db, {
      batch_id,
      teacher_id,
      room_id,
      date,
      start_time,
      end_time,
    });

    if (conflict) {
      return Response.json({ error: conflict }, { status: 409 });
    }

    const id = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO schedule_sessions (
        id, batch_id, subject_id, teacher_id, room_id, date, start_time, end_time, session_type, status, topic, notes_summary, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED', ?, ?, ?)
    `).run(
      id,
      batch_id,
      subject_id || null,
      teacher_id || null,
      room_id || null,
      date,
      start_time,
      end_time,
      session_type,
      topic || null,
      notes_summary || null,
      now
    );

    // If recurring options are provided, generate recurring sessions
    let generatedCount = 1;
    if (recurring_days && Array.isArray(recurring_days) && recurring_days.length > 0 && recurring_until) {
      const recId = `rec-${Date.now()}`;
      const startDateObj = new Date(date);
      const untilDateObj = new Date(recurring_until);

      const cur = new Date(startDateObj);
      cur.setDate(cur.getDate() + 1); // Start next day

      while (cur <= untilDateObj) {
        const dayOfWeek = cur.getDay();
        if (recurring_days.includes(dayOfWeek)) {
          const dStr = cur.toISOString().split('T')[0];
          // Check conflict for each recurring date
          const subConflict = checkConflict(db, {
            batch_id,
            teacher_id,
            room_id,
            date: dStr,
            start_time,
            end_time,
          });

          if (!subConflict) {
            const occId = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
            db.prepare(`
              INSERT INTO schedule_sessions (
                id, batch_id, subject_id, teacher_id, room_id, date, start_time, end_time, session_type, status, topic, notes_summary, recurring_id, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED', ?, ?, ?, ?)
            `).run(
              occId,
              batch_id,
              subject_id || null,
              teacher_id || null,
              room_id || null,
              dStr,
              start_time,
              end_time,
              session_type,
              topic || null,
              notes_summary || null,
              recId,
              now
            );
            generatedCount++;
          }
        }
        cur.setDate(cur.getDate() + 1);
      }
    }

    return Response.json({ success: true, id, generatedCount });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { user, managedBatchIds } = await getCurrentUser();
    if (!user || !['super_admin', 'batch_admin', 'teacher'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized to update schedule' }, { status: 403 });
    }

    const body = await request.json();
    const { id, batch_id, subject_id, teacher_id, room_id, date, start_time, end_time, session_type, status, topic, notes_summary } = body;

    if (!id) {
      return Response.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM schedule_sessions WHERE id = ?').get(id) as any;
    if (!existing) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    const targetBatchId = batch_id || existing.batch_id;
    if (user.role === 'batch_admin' && !managedBatchIds?.includes(targetBatchId)) {
      return Response.json({ error: 'Permission denied for this batch' }, { status: 403 });
    }

    const newDate = date || existing.date;
    const newStart = start_time || existing.start_time;
    const newEnd = end_time || existing.end_time;
    const newTeacher = teacher_id !== undefined ? teacher_id : existing.teacher_id;
    const newRoom = room_id !== undefined ? room_id : existing.room_id;

    // Check conflict excluding this session
    const conflict = checkConflict(db, {
      batch_id: targetBatchId,
      teacher_id: newTeacher,
      room_id: newRoom,
      date: newDate,
      start_time: newStart,
      end_time: newEnd,
      exclude_session_id: id,
    });

    if (conflict) {
      return Response.json({ error: conflict }, { status: 409 });
    }

    db.prepare(`
      UPDATE schedule_sessions
      SET batch_id = ?, subject_id = ?, teacher_id = ?, room_id = ?, date = ?, start_time = ?, end_time = ?, session_type = ?, status = ?, topic = ?, notes_summary = ?
      WHERE id = ?
    `).run(
      targetBatchId,
      subject_id !== undefined ? subject_id : existing.subject_id,
      newTeacher,
      newRoom,
      newDate,
      newStart,
      newEnd,
      session_type || existing.session_type,
      status || existing.status,
      topic !== undefined ? topic : existing.topic,
      notes_summary !== undefined ? notes_summary : existing.notes_summary,
      id
    );

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, managedBatchIds } = await getCurrentUser();
    if (!user || !['super_admin', 'batch_admin'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized to delete session' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'Session ID is required' }, { status: 400 });

    const db = getDb();
    const sess = db.prepare('SELECT batch_id FROM schedule_sessions WHERE id = ?').get(id) as any;
    if (sess && user.role === 'batch_admin' && !managedBatchIds?.includes(sess.batch_id)) {
      return Response.json({ error: 'Permission denied for this batch' }, { status: 403 });
    }

    db.prepare('DELETE FROM schedule_sessions WHERE id = ?').run(id);
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function checkConflict(
  db: ReturnType<typeof getDb>,
  params: {
    batch_id: string;
    teacher_id?: string | null;
    room_id?: string | null;
    date: string;
    start_time: string;
    end_time: string;
    exclude_session_id?: string;
  }
): string | null {
  const { batch_id, teacher_id, room_id, date, start_time, end_time, exclude_session_id } = params;

  // 1. Check Batch conflict: Batch cannot have two classes at the same time
  const batchConflictQuery = `
    SELECT s.*, b.full_label as batch_label, sub.name as subject_name
    FROM schedule_sessions s
    JOIN batches b ON s.batch_id = b.id
    LEFT JOIN subjects sub ON s.subject_id = sub.id
    WHERE s.date = ?
      AND s.status != 'CANCELLED'
      AND s.batch_id = ?
      AND s.start_time < ?
      AND s.end_time > ?
      ${exclude_session_id ? 'AND s.id != ?' : ''}
    LIMIT 1
  `;
  const batchArgs = [date, batch_id, end_time, start_time];
  if (exclude_session_id) batchArgs.push(exclude_session_id);

  const batchOverlap = db.prepare(batchConflictQuery).get(...batchArgs) as any;
  if (batchOverlap) {
    const act = batchOverlap.subject_name || batchOverlap.session_type;
    return `Scheduling conflict: ${batchOverlap.batch_label} already has ${act} from ${batchOverlap.start_time}–${batchOverlap.end_time}.`;
  }

  // 2. Check Teacher conflict: Teacher cannot be scheduled for two classes simultaneously
  if (teacher_id) {
    const teacherConflictQuery = `
      SELECT s.*, b.full_label as batch_label, sub.name as subject_name, u.full_name as teacher_name
      FROM schedule_sessions s
      JOIN teachers t ON s.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN batches b ON s.batch_id = b.id
      LEFT JOIN subjects sub ON s.subject_id = sub.id
      WHERE s.date = ?
        AND s.status != 'CANCELLED'
        AND s.teacher_id = ?
        AND s.start_time < ?
        AND s.end_time > ?
        ${exclude_session_id ? 'AND s.id != ?' : ''}
      LIMIT 1
    `;
    const tArgs = [date, teacher_id, end_time, start_time];
    if (exclude_session_id) tArgs.push(exclude_session_id);

    const teacherOverlap = db.prepare(teacherConflictQuery).get(...tArgs) as any;
    if (teacherOverlap) {
      return `Scheduling conflict: Teacher ${teacherOverlap.teacher_name} is already teaching ${teacherOverlap.subject_name || 'a session'} for ${teacherOverlap.batch_label} from ${teacherOverlap.start_time}–${teacherOverlap.end_time}.`;
    }
  }

  // 3. Check Room conflict: Room cannot be occupied by two sessions simultaneously
  if (room_id) {
    const roomConflictQuery = `
      SELECT s.*, r.name as room_name, b.full_label as batch_label, sub.name as subject_name
      FROM schedule_sessions s
      JOIN rooms r ON s.room_id = r.id
      JOIN batches b ON s.batch_id = b.id
      LEFT JOIN subjects sub ON s.subject_id = sub.id
      WHERE s.date = ?
        AND s.status != 'CANCELLED'
        AND s.room_id = ?
        AND s.start_time < ?
        AND s.end_time > ?
        ${exclude_session_id ? 'AND s.id != ?' : ''}
      LIMIT 1
    `;
    const rArgs = [date, room_id, end_time, start_time];
    if (exclude_session_id) rArgs.push(exclude_session_id);

    const roomOverlap = db.prepare(roomConflictQuery).get(...rArgs) as any;
    if (roomOverlap) {
      return `Scheduling conflict: ${roomOverlap.room_name} is already occupied by ${roomOverlap.batch_label} (${roomOverlap.subject_name || roomOverlap.session_type}) from ${roomOverlap.start_time}–${roomOverlap.end_time}.`;
    }
  }

  return null;
}
