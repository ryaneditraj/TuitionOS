-- ====================================================================
-- TRINITY ONE - DIGITAL OPERATING SYSTEM FOR TRINITY EDUCATIONAL INSTITUTIONS
-- SUPABASE POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS) & STORAGE
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CUSTOM TYPES
CREATE TYPE user_role AS ENUM ('super_admin', 'batch_admin', 'teacher', 'student');
CREATE TYPE session_type AS ENUM ('CLASS', 'PRACTICE', 'STUDY', 'EXAM', 'EVENT', 'HOLIDAY', 'IDLE');
CREATE TYPE session_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
CREATE TYPE task_priority AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE task_type AS ENUM (
  'Reading', 'Worksheet', 'Question Paper', 'Book/Chapter', 
  'Practice', 'Project', 'Revision', 'Submission', 'Other'
);
CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE feedback_status AS ENUM ('Received', 'Reviewing', 'Planned', 'Implemented', 'Not Planned');
CREATE TYPE community_post_status AS ENUM ('OPEN', 'RESPONDED', 'CLOSED', 'HIDDEN');
CREATE TYPE announcement_priority AS ENUM ('NORMAL', 'URGENT', 'CRITICAL');
CREATE TYPE announcement_target AS ENUM ('ALL', 'BOARD', 'CLASS', 'BATCH', 'SUBJECT');

-- 3. INSTITUTIONS & ACADEMIC HIERARCHY
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE academic_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  full_label TEXT NOT NULL,
  max_students INTEGER DEFAULT 40,
  color_code TEXT DEFAULT '#4F46E5',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366F1',
  icon TEXT NOT NULL DEFAULT 'BookOpen',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER DEFAULT 40,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. USERS & ROLES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
  roll_number TEXT NOT NULL,
  guardian_name TEXT,
  guardian_phone TEXT,
  admission_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  specialization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE teacher_subjects (
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (teacher_id, subject_id)
);

CREATE TABLE batch_admins (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, batch_id)
);

-- 5. SCHEDULE SYSTEM & SESSIONS
CREATE TABLE schedule_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  session_type session_type NOT NULL DEFAULT 'CLASS',
  status session_status NOT NULL DEFAULT 'SCHEDULED',
  topic TEXT,
  notes_summary TEXT,
  recurring_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

CREATE INDEX idx_sessions_batch_date ON schedule_sessions(batch_id, date);
CREATE INDEX idx_sessions_teacher_date ON schedule_sessions(teacher_id, date);
CREATE INDEX idx_sessions_room_date ON schedule_sessions(room_id, date);

CREATE TABLE recurring_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  session_type session_type NOT NULL DEFAULT 'CLASS',
  topic_template TEXT,
  start_date DATE NOT NULL,
  until_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ATTENDANCE & TEST ATTENDANCE
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES schedule_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status attendance_status NOT NULL DEFAULT 'PRESENT',
  remarks TEXT,
  marked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_session ON attendance(session_id);

CREATE TABLE test_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status attendance_status NOT NULL DEFAULT 'PRESENT',
  remarks TEXT,
  marks_obtained NUMERIC(5,2),
  marked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

-- 7. CLASS MATERIALS & BOARD PHOTOS
CREATE TABLE class_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES schedule_sessions(id) ON DELETE SET NULL,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  uploader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK(file_type IN ('pdf', 'pptx', 'docx', 'image', 'link')),
  file_size TEXT,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE class_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES schedule_sessions(id) ON DELETE SET NULL,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  uploader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ACADEMIC TASKS & SUBMISSIONS
CREATE TABLE academic_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  due_date DATE NOT NULL,
  due_time TIME,
  priority task_priority NOT NULL DEFAULT 'MEDIUM',
  type task_type NOT NULL DEFAULT 'Worksheet',
  attachments_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES academic_tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  status task_status NOT NULL DEFAULT 'TODO',
  submitted_at TIMESTAMPTZ,
  submission_text TEXT,
  submission_file_url TEXT,
  teacher_feedback TEXT,
  UNIQUE(task_id, student_id)
);

CREATE INDEX idx_task_assign_student ON task_assignments(student_id);

-- 9. EXAMS & QUESTION PAPERS
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  syllabus TEXT,
  instructions TEXT,
  exam_type TEXT NOT NULL,
  max_marks INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'UPCOMING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exam_question_papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  solution_url TEXT,
  file_size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. EVENTS & ANNOUNCEMENTS
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  category TEXT NOT NULL,
  photos_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_type announcement_target NOT NULL DEFAULT 'ALL',
  target_id UUID,
  priority announcement_priority NOT NULL DEFAULT 'NORMAL',
  is_pinned BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. FEEDBACK & COMMUNITY
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT false,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status feedback_status NOT NULL DEFAULT 'Received',
  admin_reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT false,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  status community_post_status NOT NULL DEFAULT 'OPEN',
  admin_response TEXT,
  responded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE community_votes (
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE problem_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  reference_session_id UUID REFERENCES schedule_sessions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_reports ENABLE ROW LEVEL SECURITY;

-- Helper function: get user role
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function: get student batch_id
CREATE OR REPLACE FUNCTION auth_student_batch()
RETURNS UUID AS $$
  SELECT batch_id FROM students WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. Profiles: Users can read own profile; Admins can read all
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid() OR auth_user_role() = 'super_admin');

-- 2. Students: Students can view classmates in their batch, admins full access
CREATE POLICY "Students can view classmates in batch" ON students
  FOR SELECT USING (
    user_id = auth.uid() 
    OR batch_id = auth_student_batch() 
    OR auth_user_role() IN ('super_admin', 'batch_admin', 'teacher')
  );

-- 3. Sessions: Students can view sessions for their batch; Admins/teachers can view all
CREATE POLICY "Sessions visibility by batch" ON schedule_sessions
  FOR SELECT USING (
    batch_id = auth_student_batch() 
    OR auth_user_role() IN ('super_admin', 'batch_admin', 'teacher')
  );

-- 4. Attendance: Students can only read their OWN attendance; Teachers/Admins can read & write
CREATE POLICY "Students can only read own attendance" ON attendance
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    OR auth_user_role() IN ('super_admin', 'batch_admin', 'teacher')
  );

CREATE POLICY "Teachers and admins can manage attendance" ON attendance
  FOR ALL USING (auth_user_role() IN ('super_admin', 'batch_admin', 'teacher'));

-- 5. Tasks: Students see tasks assigned to them; Teachers/Admins manage
CREATE POLICY "Students see assigned tasks" ON task_assignments
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    OR auth_user_role() IN ('super_admin', 'batch_admin', 'teacher')
  );

CREATE POLICY "Students can update their own task status" ON task_assignments
  FOR UPDATE USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  ) WITH CHECK (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

-- 6. Storage Buckets (Supabase Storage configuration)
-- insert into storage.buckets (id, name, public) values 
--   ('class-notes', 'class-notes', false),
--   ('board-photos', 'board-photos', false),
--   ('question-papers', 'question-papers', false),
--   ('task-attachments', 'task-attachments', false),
--   ('task-submissions', 'task-submissions', false),
--   ('event-photos', 'event-photos', true),
--   ('profile-photos', 'profile-photos', true);
