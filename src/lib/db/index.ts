import Database from 'better-sqlite3';
import path from 'path';
import { seedDatabase } from './seed';

const dbPath = path.join(process.cwd(), 'trinity.db');

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    dbInstance.pragma('busy_timeout = 5000');
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS institutions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      logo_url TEXT,
      address TEXT,
      phone TEXT
    );

    CREATE TABLE IF NOT EXISTS academic_years (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL REFERENCES institutions(id),
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_current INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL REFERENCES institutions(id),
      name TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id),
      name TEXT NOT NULL,
      grade_number INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL REFERENCES classes(id),
      academic_year_id TEXT NOT NULL REFERENCES academic_years(id),
      name TEXT NOT NULL,
      full_label TEXT NOT NULL,
      max_students INTEGER DEFAULT 40,
      color_code TEXT DEFAULT '#3B82F6'
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL REFERENCES institutions(id),
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL REFERENCES institutions(id),
      name TEXT NOT NULL,
      capacity INTEGER DEFAULT 40
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT CHECK(role IN ('super_admin', 'batch_admin', 'teacher', 'student')) NOT NULL,
      avatar_url TEXT,
      phone TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      batch_id TEXT NOT NULL REFERENCES batches(id),
      roll_number TEXT NOT NULL,
      guardian_name TEXT,
      guardian_phone TEXT,
      admission_date TEXT
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      specialization TEXT
    );

    CREATE TABLE IF NOT EXISTS teacher_subjects (
      teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      PRIMARY KEY (teacher_id, subject_id)
    );

    CREATE TABLE IF NOT EXISTS batch_admins (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, batch_id)
    );

    CREATE TABLE IF NOT EXISTS schedule_sessions (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL REFERENCES batches(id),
      subject_id TEXT REFERENCES subjects(id),
      teacher_id TEXT REFERENCES teachers(id),
      room_id TEXT REFERENCES rooms(id),
      date TEXT NOT NULL, -- YYYY-MM-DD
      start_time TEXT NOT NULL, -- HH:MM
      end_time TEXT NOT NULL, -- HH:MM
      session_type TEXT CHECK(session_type IN ('CLASS', 'PRACTICE', 'STUDY', 'EXAM', 'EVENT', 'HOLIDAY', 'IDLE')) NOT NULL,
      status TEXT CHECK(status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) NOT NULL DEFAULT 'SCHEDULED',
      topic TEXT,
      notes_summary TEXT,
      recurring_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_batch_date ON schedule_sessions(batch_id, date);
    CREATE INDEX IF NOT EXISTS idx_sessions_teacher_date ON schedule_sessions(teacher_id, date);
    CREATE INDEX IF NOT EXISTS idx_sessions_room_date ON schedule_sessions(room_id, date);

    CREATE TABLE IF NOT EXISTS recurring_schedules (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL REFERENCES batches(id),
      subject_id TEXT REFERENCES subjects(id),
      teacher_id TEXT REFERENCES teachers(id),
      room_id TEXT REFERENCES rooms(id),
      day_of_week INTEGER NOT NULL, -- 0=Sun, 1=Mon, ..., 6=Sat
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      session_type TEXT NOT NULL DEFAULT 'CLASS',
      topic_template TEXT,
      start_date TEXT NOT NULL,
      until_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES schedule_sessions(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      status TEXT CHECK(status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')) NOT NULL,
      remarks TEXT,
      marked_by TEXT REFERENCES users(id),
      marked_at TEXT NOT NULL,
      UNIQUE(session_id, student_id)
    );

    CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);

    CREATE TABLE IF NOT EXISTS test_attendance (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      status TEXT CHECK(status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')) NOT NULL,
      remarks TEXT,
      marks_obtained REAL,
      marked_by TEXT REFERENCES users(id),
      marked_at TEXT NOT NULL,
      UNIQUE(exam_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS class_materials (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES schedule_sessions(id) ON DELETE SET NULL,
      batch_id TEXT NOT NULL REFERENCES batches(id),
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      uploader_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_type TEXT CHECK(file_type IN ('pdf', 'pptx', 'docx', 'image', 'link')) NOT NULL,
      file_size TEXT,
      download_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS class_photos (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES schedule_sessions(id) ON DELETE SET NULL,
      batch_id TEXT NOT NULL REFERENCES batches(id),
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      uploader_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      photo_url TEXT NOT NULL,
      caption TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS academic_tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      assigned_by TEXT NOT NULL REFERENCES users(id),
      due_date TEXT NOT NULL, -- YYYY-MM-DD
      due_time TEXT, -- HH:MM
      priority TEXT CHECK(priority IN ('HIGH', 'MEDIUM', 'LOW')) NOT NULL DEFAULT 'MEDIUM',
      type TEXT CHECK(type IN ('Reading', 'Worksheet', 'Question Paper', 'Book/Chapter', 'Practice', 'Project', 'Revision', 'Submission', 'Other')) NOT NULL,
      attachments_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_assignments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES academic_tasks(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      batch_id TEXT NOT NULL REFERENCES batches(id),
      status TEXT CHECK(status IN ('TODO', 'IN_PROGRESS', 'COMPLETED')) NOT NULL DEFAULT 'TODO',
      submitted_at TEXT,
      submission_text TEXT,
      submission_file_url TEXT,
      teacher_feedback TEXT,
      UNIQUE(task_id, student_id)
    );

    CREATE INDEX IF NOT EXISTS idx_task_assign_student ON task_assignments(student_id);

    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      batch_id TEXT NOT NULL REFERENCES batches(id),
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      room_id TEXT REFERENCES rooms(id),
      syllabus TEXT,
      instructions TEXT,
      exam_type TEXT NOT NULL,
      max_marks INTEGER NOT NULL DEFAULT 50,
      status TEXT CHECK(status IN ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED')) NOT NULL DEFAULT 'UPCOMING'
    );

    CREATE TABLE IF NOT EXISTS exam_question_papers (
      id TEXT PRIMARY KEY,
      exam_id TEXT REFERENCES exams(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      year INTEGER NOT NULL,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      class_id TEXT REFERENCES classes(id),
      file_url TEXT NOT NULL,
      solution_url TEXT,
      file_size TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL REFERENCES institutions(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      location TEXT,
      category TEXT NOT NULL,
      photos_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      target_type TEXT CHECK(target_type IN ('ALL', 'BOARD', 'CLASS', 'BATCH', 'SUBJECT')) NOT NULL,
      target_id TEXT,
      priority TEXT CHECK(priority IN ('NORMAL', 'URGENT', 'CRITICAL')) NOT NULL DEFAULT 'NORMAL',
      is_pinned INTEGER DEFAULT 0,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
      is_anonymous INTEGER DEFAULT 0,
      category TEXT CHECK(category IN ('general', 'teacher', 'class', 'tuition', 'suggestion', 'problem')) NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT CHECK(status IN ('Received', 'Reviewing', 'Planned', 'Implemented', 'Not Planned')) NOT NULL DEFAULT 'Received',
      admin_reply TEXT,
      replied_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      is_anonymous INTEGER DEFAULT 0,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT CHECK(status IN ('OPEN', 'RESPONDED', 'CLOSED', 'HIDDEN')) NOT NULL DEFAULT 'OPEN',
      admin_response TEXT,
      responded_by TEXT REFERENCES users(id),
      responded_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS community_votes (
      post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY(post_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS problem_reports (
      id TEXT PRIMARY KEY,
      student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
      category TEXT CHECK(category IN ('wrong_timing', 'missing_notes', 'attendance_mistake', 'broken_link', 'app_issue', 'other')) NOT NULL,
      title TEXT NOT NULL,
      details TEXT NOT NULL,
      reference_session_id TEXT REFERENCES schedule_sessions(id) ON DELETE SET NULL,
      status TEXT CHECK(status IN ('OPEN', 'RESOLVING', 'RESOLVED')) NOT NULL DEFAULT 'OPEN',
      resolution_notes TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Check if institution exists, if not run seed
  const existing = db.prepare('SELECT count(*) as count FROM institutions').get() as { count: number };
  if (!existing || existing.count === 0) {
    seedDatabase(db);
  }
}
