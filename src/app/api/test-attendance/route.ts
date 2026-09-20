import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');

    const { user, student } = await getCurrentUser();
    const db = getDb();

    if (user?.role === 'student' && student) {
      // Students only view their own test attendance and marks
      const myRecord = examId ? db.prepare(`
        SELECT ta.*, e.title as exam_title, e.date as exam_date, e.max_marks
        FROM test_attendance ta
        JOIN exams e ON ta.exam_id = e.id
        WHERE ta.exam_id = ? AND ta.student_id = ?
      `).get(examId, student.id) : null;

      const allMyTests = db.prepare(`
        SELECT ta.*, e.title as exam_title, e.date as exam_date, e.max_marks,
               sub.name as subject_name, sub.color as subject_color
        FROM test_attendance ta
        JOIN exams e ON ta.exam_id = e.id
        LEFT JOIN subjects sub ON e.subject_id = sub.id
        WHERE ta.student_id = ?
        ORDER BY e.date DESC
      `).all(student.id);

      return Response.json({ myRecord, tests: allMyTests });
    }

    if (!examId) {
      return Response.json({ error: 'Exam ID is required' }, { status: 400 });
    }

    const exam = db.prepare(`
      SELECT e.*, b.name as batch_name, b.full_label as batch_full_label,
             sub.name as subject_name
      FROM exams e
      JOIN batches b ON e.batch_id = b.id
      LEFT JOIN subjects sub ON e.subject_id = sub.id
      WHERE e.id = ?
    `).get(examId) as any;

    if (!exam) {
      return Response.json({ error: 'Exam not found' }, { status: 404 });
    }

    const students = db.prepare(`
      SELECT s.id, s.roll_number, u.full_name, u.avatar_url
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.batch_id = ?
      ORDER BY s.roll_number ASC
    `).all(exam.batch_id) as any[];

    const testRecords = db.prepare(`
      SELECT * FROM test_attendance WHERE exam_id = ?
    `).all(examId) as any[];

    const testMap = new Map<string, any>(testRecords.map(r => [r.student_id, r]));

    const result = students.map(st => {
      const rec = testMap.get(st.id);
      return {
        student_id: st.id,
        full_name: st.full_name,
        roll_number: st.roll_number,
        avatar_url: st.avatar_url,
        status: rec ? rec.status : 'PRESENT',
        remarks: rec ? rec.remarks : '',
        marks_obtained: rec ? rec.marks_obtained : null,
      };
    });

    return Response.json({ exam, students: result });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentUser();
    if (!user || !['super_admin', 'batch_admin', 'teacher'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized to mark test attendance' }, { status: 403 });
    }

    const body = await request.json();
    const { exam_id, records } = body;

    if (!exam_id || !Array.isArray(records)) {
      return Response.json({ error: 'Exam ID and records array required' }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    const insertOrUpdate = db.prepare(`
      INSERT INTO test_attendance (id, exam_id, student_id, status, remarks, marks_obtained, marked_by, marked_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(exam_id, student_id) DO UPDATE SET
        status = excluded.status,
        remarks = excluded.remarks,
        marks_obtained = excluded.marks_obtained,
        marked_by = excluded.marked_by,
        marked_at = excluded.marked_at
    `);

    const updateMany = db.transaction((recs: any[]) => {
      for (const rec of recs) {
        const id = `tatt-${exam_id}-${rec.student_id}`;
        insertOrUpdate.run(
          id,
          exam_id,
          rec.student_id,
          rec.status,
          rec.remarks || null,
          rec.marks_obtained !== undefined ? rec.marks_obtained : null,
          user.id,
          now
        );
      }
    });

    updateMany(records);

    return Response.json({ success: true, count: records.length });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
