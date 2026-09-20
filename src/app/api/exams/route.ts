import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    const { user, student } = await getCurrentUser();
    const effectiveBatchId = batchId || (user?.role === 'student' ? student?.batch_id : undefined);

    const db = getDb();

    let query = `
      SELECT e.*,
             sub.name as subject_name, sub.code as subject_code, sub.color as subject_color, sub.icon as subject_icon,
             r.name as room_name,
             b.name as batch_name, b.full_label as batch_full_label
      FROM exams e
      JOIN subjects sub ON e.subject_id = sub.id
      JOIN batches b ON e.batch_id = b.id
      LEFT JOIN rooms r ON e.room_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (effectiveBatchId) {
      query += ` AND e.batch_id = ?`;
      params.push(effectiveBatchId);
    }

    query += ` ORDER BY e.date ASC, e.start_time ASC`;

    const rawExams = db.prepare(query).all(...params) as any[];

    const exams = rawExams.map(ex => {
      let my_test_attendance = null;
      if (student?.id) {
        my_test_attendance = db.prepare(`
          SELECT * FROM test_attendance WHERE exam_id = ? AND student_id = ?
        `).get(ex.id, student.id);
      }

      const qp = db.prepare(`
        SELECT * FROM exam_question_papers WHERE exam_id = ? LIMIT 1
      `).get(ex.id) as any;

      return {
        ...ex,
        subject: {
          id: ex.subject_id,
          name: ex.subject_name,
          code: ex.subject_code,
          color: ex.subject_color,
          icon: ex.subject_icon,
        },
        room: ex.room_id ? { id: ex.room_id, name: ex.room_name } : null,
        batch: { id: ex.batch_id, name: ex.batch_name, full_label: ex.batch_full_label },
        question_paper: qp || null,
        my_test_attendance: my_test_attendance || null,
      };
    });

    return Response.json({ exams });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentUser();
    if (!user || !['super_admin', 'batch_admin', 'teacher'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized to schedule exams' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      subject_id,
      batch_id,
      date,
      start_time,
      end_time,
      room_id,
      syllabus,
      instructions,
      exam_type = 'Unit Test',
      max_marks = 50,
    } = body;

    if (!title || !subject_id || !batch_id || !date || !start_time || !end_time) {
      return Response.json({ error: 'Missing required exam fields' }, { status: 400 });
    }

    const db = getDb();
    const id = `exam-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    db.prepare(`
      INSERT INTO exams (
        id, title, subject_id, batch_id, date, start_time, end_time, room_id, syllabus, instructions, exam_type, max_marks, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'UPCOMING')
    `).run(
      id,
      title,
      subject_id,
      batch_id,
      date,
      start_time,
      end_time,
      room_id || null,
      syllabus || null,
      instructions || null,
      exam_type,
      max_marks
    );

    return Response.json({ success: true, id });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
