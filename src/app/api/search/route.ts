import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';

    if (!q || q.length < 2) {
      return Response.json({ results: [] });
    }

    const db = getDb();
    const queryPattern = `%${q}%`;

    // 1. Sessions
    const sessions = db.prepare(`
      SELECT s.id, s.topic as title, s.date, s.start_time, s.end_time, s.session_type,
             sub.name as subject_name, sub.color as subject_color
      FROM schedule_sessions s
      LEFT JOIN subjects sub ON s.subject_id = sub.id
      WHERE s.topic LIKE ? OR s.notes_summary LIKE ? OR sub.name LIKE ?
      LIMIT 6
    `).all(queryPattern, queryPattern, queryPattern) as any[];

    // 2. Materials / Notes
    const materials = db.prepare(`
      SELECT m.id, m.title, m.file_name, m.file_type, m.file_size, m.file_url,
             sub.name as subject_name, sub.color as subject_color
      FROM class_materials m
      LEFT JOIN subjects sub ON m.subject_id = sub.id
      WHERE m.title LIKE ? OR m.description LIKE ? OR sub.name LIKE ?
      LIMIT 6
    `).all(queryPattern, queryPattern, queryPattern) as any[];

    // 3. Board Photos
    const photos = db.prepare(`
      SELECT p.id, p.title, p.photo_url, p.caption,
             sub.name as subject_name, sub.color as subject_color
      FROM class_photos p
      LEFT JOIN subjects sub ON p.subject_id = sub.id
      WHERE p.title LIKE ? OR p.caption LIKE ? OR sub.name LIKE ?
      LIMIT 6
    `).all(queryPattern, queryPattern, queryPattern) as any[];

    // 4. Tasks
    const tasks = db.prepare(`
      SELECT t.id, t.title, t.due_date, t.priority, t.type,
             sub.name as subject_name, sub.color as subject_color
      FROM academic_tasks t
      LEFT JOIN subjects sub ON t.subject_id = sub.id
      WHERE t.title LIKE ? OR t.description LIKE ? OR sub.name LIKE ?
      LIMIT 6
    `).all(queryPattern, queryPattern, queryPattern) as any[];

    // 5. Exams
    const exams = db.prepare(`
      SELECT e.id, e.title, e.date, e.start_time, e.exam_type, e.syllabus,
             sub.name as subject_name, sub.color as subject_color
      FROM exams e
      LEFT JOIN subjects sub ON e.subject_id = sub.id
      WHERE e.title LIKE ? OR e.syllabus LIKE ? OR sub.name LIKE ?
      LIMIT 6
    `).all(queryPattern, queryPattern, queryPattern) as any[];

    // 6. Question Papers
    const questionPapers = db.prepare(`
      SELECT qp.id, qp.title, qp.year, qp.file_url,
             sub.name as subject_name, sub.color as subject_color
      FROM exam_question_papers qp
      LEFT JOIN subjects sub ON qp.subject_id = sub.id
      WHERE qp.title LIKE ? OR sub.name LIKE ?
      LIMIT 6
    `).all(queryPattern, queryPattern) as any[];

    // 7. Events
    const events = db.prepare(`
      SELECT e.id, e.title, e.date, e.location, e.category
      FROM events e
      WHERE e.title LIKE ? OR e.description LIKE ?
      LIMIT 6
    `).all(queryPattern, queryPattern) as any[];

    return Response.json({
      query: q,
      totalCount: sessions.length + materials.length + photos.length + tasks.length + exams.length + questionPapers.length + events.length,
      results: {
        sessions: sessions.map(s => ({ ...s, itemType: 'session' })),
        materials: materials.map(m => ({ ...m, itemType: 'material' })),
        photos: photos.map(p => ({ ...p, itemType: 'photo' })),
        tasks: tasks.map(t => ({ ...t, itemType: 'task' })),
        exams: exams.map(e => ({ ...e, itemType: 'exam' })),
        questionPapers: questionPapers.map(qp => ({ ...qp, itemType: 'question_paper' })),
        events: events.map(e => ({ ...e, itemType: 'event' })),
      },
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
