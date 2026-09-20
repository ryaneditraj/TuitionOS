import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();

    const boards = db.prepare('SELECT * FROM boards').all();
    const classes = db.prepare('SELECT * FROM classes ORDER BY grade_number DESC').all();
    const batches = db.prepare(`
      SELECT b.*, c.name as class_name, bd.name as board_name,
             (SELECT count(*) FROM students s WHERE s.batch_id = b.id) as student_count
      FROM batches b
      JOIN classes c ON b.class_id = c.id
      JOIN boards bd ON c.board_id = bd.id
      ORDER BY c.grade_number DESC, b.name ASC
    `).all();

    const subjects = db.prepare('SELECT * FROM subjects ORDER BY name ASC').all();
    const rooms = db.prepare('SELECT * FROM rooms ORDER BY name ASC').all();
    const teachers = db.prepare(`
      SELECT t.id, t.title, t.specialization, u.full_name, u.avatar_url, u.email
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      ORDER BY u.full_name ASC
    `).all();

    return Response.json({
      boards,
      classes,
      batches,
      subjects,
      rooms,
      teachers,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
