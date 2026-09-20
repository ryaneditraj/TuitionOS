import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // overdue, today, upcoming, completed, all
    const subjectId = searchParams.get('subjectId');
    const batchId = searchParams.get('batchId');

    const { user, student, managedBatchIds } = await getCurrentUser();
    const db = getDb();

    // Reference today: September 20, 2026
    const todayStr = '2026-09-20';
    const nowIso = '2026-09-20T12:00:00Z';

    if (user?.role === 'student' && student) {
      // Student view: Fetch tasks assigned to this student
      let query = `
        SELECT t.*,
               ta.id as assignment_id, ta.status as assignment_status, ta.submitted_at, ta.submission_text, ta.submission_file_url, ta.teacher_feedback,
               sub.name as subject_name, sub.code as subject_code, sub.color as subject_color, sub.icon as subject_icon,
               u.full_name as assigned_by_name
        FROM task_assignments ta
        JOIN academic_tasks t ON ta.task_id = t.id
        LEFT JOIN subjects sub ON t.subject_id = sub.id
        LEFT JOIN users u ON t.assigned_by = u.id
        WHERE ta.student_id = ?
      `;
      const params: any[] = [student.id];

      if (subjectId) {
        query += ` AND t.subject_id = ?`;
        params.push(subjectId);
      }

      query += ` ORDER BY t.due_date ASC, t.due_time ASC`;

      const rows = db.prepare(query).all(...params) as any[];

      const tasks = rows.map(r => {
        // Automatic overdue calculation
        const dueDateTimeStr = `${r.due_date}T${r.due_time || '23:59'}:00Z`;
        const isOverdue = r.assignment_status !== 'COMPLETED' && r.due_date < todayStr;
        const isDueToday = r.due_date === todayStr;
        const isUpcoming = r.due_date > todayStr;

        let bucket: 'overdue' | 'today' | 'upcoming' | 'completed' = 'upcoming';
        if (r.assignment_status === 'COMPLETED') {
          bucket = 'completed';
        } else if (isOverdue) {
          bucket = 'overdue';
        } else if (isDueToday) {
          bucket = 'today';
        }

        return {
          id: r.id,
          title: r.title,
          description: r.description,
          subject_id: r.subject_id,
          assigned_by: r.assigned_by,
          assigned_by_name: r.assigned_by_name,
          due_date: r.due_date,
          due_time: r.due_time,
          priority: r.priority,
          type: r.type,
          attachments: r.attachments_json ? JSON.parse(r.attachments_json) : [],
          created_at: r.created_at,
          subject: {
            id: r.subject_id,
            name: r.subject_name,
            code: r.subject_code,
            color: r.subject_color,
            icon: r.subject_icon,
          },
          my_assignment: {
            id: r.assignment_id,
            status: r.assignment_status,
            submitted_at: r.submitted_at,
            submission_text: r.submission_text,
            submission_file_url: r.submission_file_url,
            teacher_feedback: r.teacher_feedback,
            is_overdue: isOverdue,
            is_due_today: isDueToday,
            bucket,
          },
        };
      });

      // Filter if requested
      const filteredTasks = filter && filter !== 'all'
        ? tasks.filter(t => t.my_assignment?.bucket === filter)
        : tasks;

      // Calculate stats
      const stats = {
        overdue: tasks.filter(t => t.my_assignment?.bucket === 'overdue').length,
        due_today: tasks.filter(t => t.my_assignment?.bucket === 'today').length,
        upcoming: tasks.filter(t => t.my_assignment?.bucket === 'upcoming').length,
        completed: tasks.filter(t => t.my_assignment?.bucket === 'completed').length,
        total: tasks.length,
      };

      return Response.json({ tasks: filteredTasks, stats });
    } else {
      // Teacher / Admin view: fetch institutional tasks with student submission stats
      let query = `
        SELECT t.*,
               sub.name as subject_name, sub.code as subject_code, sub.color as subject_color, sub.icon as subject_icon,
               u.full_name as assigned_by_name
        FROM academic_tasks t
        LEFT JOIN subjects sub ON t.subject_id = sub.id
        LEFT JOIN users u ON t.assigned_by = u.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (subjectId) {
        query += ` AND t.subject_id = ?`;
        params.push(subjectId);
      }

      query += ` ORDER BY t.due_date DESC`;

      const rows = db.prepare(query).all(...params) as any[];

      const tasks = rows.map(r => {
        const counts = db.prepare(`
          SELECT 
            count(*) as total,
            sum(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
            sum(CASE WHEN status != 'COMPLETED' THEN 1 ELSE 0 END) as pending
          FROM task_assignments
          WHERE task_id = ?
        `).get(r.id) as any;

        return {
          id: r.id,
          title: r.title,
          description: r.description,
          subject_id: r.subject_id,
          assigned_by: r.assigned_by,
          assigned_by_name: r.assigned_by_name,
          due_date: r.due_date,
          due_time: r.due_time,
          priority: r.priority,
          type: r.type,
          attachments: r.attachments_json ? JSON.parse(r.attachments_json) : [],
          created_at: r.created_at,
          subject: {
            id: r.subject_id,
            name: r.subject_name,
            code: r.subject_code,
            color: r.subject_color,
            icon: r.subject_icon,
          },
          assignment_counts: {
            total: counts.total || 0,
            completed: counts.completed || 0,
            pending: counts.pending || 0,
          },
        };
      });

      return Response.json({ tasks });
    }
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, managedBatchIds } = await getCurrentUser();
    if (!user || !['super_admin', 'batch_admin', 'teacher'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized to assign academic tasks' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      subject_id,
      due_date,
      due_time,
      priority = 'MEDIUM',
      type = 'Worksheet',
      batch_ids, // array of batch IDs or single batch_id
      student_ids, // optional individual student array
      attachments,
    } = body;

    if (!title || !subject_id || !due_date) {
      return Response.json({ error: 'Title, subject and due date are required' }, { status: 400 });
    }

    const db = getDb();
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO academic_tasks (
        id, title, description, subject_id, assigned_by, due_date, due_time, priority, type, attachments_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      taskId,
      title,
      description || null,
      subject_id,
      user.id,
      due_date,
      due_time || '23:59',
      priority,
      type,
      attachments ? JSON.stringify(attachments) : null,
      now
    );

    // Assign to students
    let targetStudentList: { id: string; batch_id: string }[] = [];

    // Case 1: Batch assignment (Batch A, multiple batches, etc.)
    const targetBatches = Array.isArray(batch_ids) ? batch_ids : (body.batch_id ? [body.batch_id] : []);
    if (targetBatches.length > 0) {
      const placeholders = targetBatches.map(() => '?').join(',');
      const studentsInBatches = db.prepare(`
        SELECT id, batch_id FROM students WHERE batch_id IN (${placeholders})
      `).all(...targetBatches) as { id: string; batch_id: string }[];

      targetStudentList = targetStudentList.concat(studentsInBatches);
    }

    // Case 2: Individual students
    if (Array.isArray(student_ids) && student_ids.length > 0) {
      const placeholders = student_ids.map(() => '?').join(',');
      const individualStudents = db.prepare(`
        SELECT id, batch_id FROM students WHERE id IN (${placeholders})
      `).all(...student_ids) as { id: string; batch_id: string }[];

      individualStudents.forEach(st => {
        if (!targetStudentList.find(x => x.id === st.id)) {
          targetStudentList.push(st);
        }
      });
    }

    // Default fallback if no batch or students specified: assign to default batch
    if (targetStudentList.length === 0) {
      const defaultStudents = db.prepare('SELECT id, batch_id FROM students WHERE batch_id = "batch-12-cbse-a"').all() as any[];
      targetStudentList = defaultStudents;
    }

    const insertAssign = db.prepare(`
      INSERT OR REPLACE INTO task_assignments (id, task_id, student_id, batch_id, status)
      VALUES (?, ?, ?, ?, 'TODO')
    `);

    targetStudentList.forEach(st => {
      const aId = `ta-${taskId}-${st.id}`;
      insertAssign.run(aId, taskId, st.id, st.batch_id);
    });

    return Response.json({ success: true, taskId, assignedCount: targetStudentList.length });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { user, student } = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { assignment_id, task_id, status, submission_text, submission_file_url } = body;

    const db = getDb();
    let assign = null;

    if (assignment_id) {
      assign = db.prepare('SELECT * FROM task_assignments WHERE id = ?').get(assignment_id) as any;
    } else if (task_id && student) {
      assign = db.prepare('SELECT * FROM task_assignments WHERE task_id = ? AND student_id = ?').get(task_id, student.id) as any;
    }

    if (!assign) {
      return Response.json({ error: 'Task assignment record not found' }, { status: 404 });
    }

    // Students can only update their own assignment
    if (user.role === 'student' && assign.student_id !== student?.id) {
      return Response.json({ error: 'Permission denied' }, { status: 403 });
    }

    const submitted_at = status === 'COMPLETED' ? new Date().toISOString() : assign.submitted_at;

    db.prepare(`
      UPDATE task_assignments
      SET status = ?, submitted_at = ?, submission_text = COALESCE(?, submission_text), submission_file_url = COALESCE(?, submission_file_url)
      WHERE id = ?
    `).run(
      status,
      submitted_at,
      submission_text || null,
      submission_file_url || null,
      assign.id
    );

    return Response.json({ success: true, status, submitted_at });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
