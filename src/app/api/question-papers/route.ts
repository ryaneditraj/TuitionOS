import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const year = searchParams.get('year');

    const db = getDb();
    let query = `
      SELECT qp.*,
             sub.name as subject_name, sub.code as subject_code, sub.color as subject_color,
             c.name as class_name
      FROM exam_question_papers qp
      LEFT JOIN subjects sub ON qp.subject_id = sub.id
      LEFT JOIN classes c ON qp.class_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (subjectId) {
      query += ` AND qp.subject_id = ?`;
      params.push(subjectId);
    }

    if (year) {
      query += ` AND qp.year = ?`;
      params.push(year);
    }

    query += ` ORDER BY qp.year DESC, qp.title ASC`;

    const papers = db.prepare(query).all(...params) as any[];

    return Response.json({ papers });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentUser();
    if (!user || !['super_admin', 'batch_admin', 'teacher'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized to upload question papers' }, { status: 403 });
    }

    const body = await request.json();
    const { title, year, subject_id, class_id, file_url, solution_url, file_size } = body;

    if (!title || !year || !subject_id || !file_url) {
      return Response.json({ error: 'Missing required question paper fields' }, { status: 400 });
    }

    const db = getDb();
    const id = `qp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO exam_question_papers (
        id, title, year, subject_id, class_id, file_url, solution_url, file_size, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      year,
      subject_id,
      class_id || null,
      file_url,
      solution_url || null,
      file_size || '3.5 MB',
      now
    );

    return Response.json({ success: true, id });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
