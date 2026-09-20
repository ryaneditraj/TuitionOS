export type UserRole = 'super_admin' | 'batch_admin' | 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  created_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  batch_id: string;
  roll_number: string;
  guardian_name?: string;
  guardian_phone?: string;
  admission_date?: string;
  user?: User;
  batch?: Batch;
}

export interface TeacherProfile {
  id: string;
  user_id: string;
  title: string;
  specialization?: string;
  user?: User;
  subjects?: Subject[];
}

export interface Board {
  id: string;
  institution_id: string;
  name: string; // CBSE, State Board
  description?: string;
}

export interface ClassLevel {
  id: string;
  board_id: string;
  name: string; // Class 10, Class 11, Class 12
  grade_number: number;
  board?: Board;
}

export interface Batch {
  id: string;
  class_id: string;
  academic_year_id: string;
  name: string; // Batch A
  full_label: string; // Class 12 CBSE Batch A
  max_students?: number;
  color_code?: string;
  class_level?: ClassLevel;
  student_count?: number;
}

export interface Subject {
  id: string;
  institution_id: string;
  name: string; // Physics
  code: string; // PHY
  color: string;
  icon: string;
}

export interface Room {
  id: string;
  institution_id: string;
  name: string;
  capacity?: number;
}

export type SessionType = 'CLASS' | 'PRACTICE' | 'STUDY' | 'EXAM' | 'EVENT' | 'HOLIDAY' | 'IDLE';
export type SessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ScheduleSession {
  id: string;
  batch_id: string;
  subject_id?: string;
  teacher_id?: string;
  room_id?: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  session_type: SessionType;
  status: SessionStatus;
  topic?: string;
  notes_summary?: string;
  recurring_id?: string;
  created_at: string;
  // Joined fields
  subject?: Subject;
  teacher?: { id: string; full_name: string; avatar_url?: string };
  room?: Room;
  batch?: Batch;
  attendance_summary?: {
    total: number;
    present: number;
    absent: number;
    late: number;
  };
  my_attendance?: AttendanceRecord;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  remarks?: string;
  marked_by?: string;
  marked_at: string;
  student_name?: string;
  roll_number?: string;
}

export interface TestAttendanceRecord {
  id: string;
  exam_id: string;
  student_id: string;
  status: AttendanceStatus;
  remarks?: string;
  marks_obtained?: number;
  marked_by?: string;
  marked_at: string;
  student_name?: string;
}

export interface ClassMaterial {
  id: string;
  session_id?: string;
  batch_id: string;
  subject_id: string;
  uploader_id: string;
  title: string;
  description?: string;
  file_name: string;
  file_url: string;
  file_type: 'pdf' | 'pptx' | 'docx' | 'image' | 'link';
  file_size?: string;
  download_count: number;
  created_at: string;
  subject?: Subject;
  uploader_name?: string;
}

export interface ClassPhoto {
  id: string;
  session_id?: string;
  batch_id: string;
  subject_id: string;
  uploader_id: string;
  title: string;
  photo_url: string;
  caption?: string;
  created_at: string;
  subject?: Subject;
  uploader_name?: string;
}

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskType = 
  | 'Reading' 
  | 'Worksheet' 
  | 'Question Paper' 
  | 'Book/Chapter' 
  | 'Practice' 
  | 'Project' 
  | 'Revision' 
  | 'Submission' 
  | 'Other';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export interface AcademicTask {
  id: string;
  title: string;
  description?: string;
  subject_id: string;
  assigned_by: string;
  due_date: string; // YYYY-MM-DD
  due_time?: string; // HH:MM
  priority: TaskPriority;
  type: TaskType;
  attachments_json?: string;
  created_at: string;
  // Joined
  subject?: Subject;
  assigned_by_name?: string;
  // Student specific assignment status
  my_assignment?: {
    id: string;
    status: TaskStatus;
    submitted_at?: string;
    submission_text?: string;
    submission_file_url?: string;
    is_overdue: boolean;
  };
  // Teacher view statistics
  assignment_counts?: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
}

export interface Exam {
  id: string;
  title: string;
  subject_id: string;
  batch_id: string;
  date: string; // YYYY-MM-DD
  start_time: string;
  end_time: string;
  room_id?: string;
  syllabus?: string;
  instructions?: string;
  exam_type: string;
  max_marks: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  subject?: Subject;
  room?: Room;
  batch?: Batch;
  question_paper?: ExamQuestionPaper;
  my_test_attendance?: TestAttendanceRecord;
}

export interface ExamQuestionPaper {
  id: string;
  exam_id?: string;
  title: string;
  year: number;
  subject_id: string;
  class_id?: string;
  file_url: string;
  solution_url?: string;
  file_size?: string;
  created_at: string;
  subject?: Subject;
}

export interface EventItem {
  id: string;
  institution_id: string;
  title: string;
  description: string;
  date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  category: string;
  photos_json?: string; // array of urls
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target_type: 'ALL' | 'BOARD' | 'CLASS' | 'BATCH' | 'SUBJECT';
  target_id?: string;
  priority: 'NORMAL' | 'URGENT' | 'CRITICAL';
  is_pinned: boolean;
  created_by: string;
  created_at: string;
  created_by_name?: string;
}

export interface FeedbackItem {
  id: string;
  student_id?: string;
  is_anonymous: boolean;
  category: 'general' | 'teacher' | 'class' | 'tuition' | 'suggestion' | 'problem';
  subject: string;
  message: string;
  status: 'Received' | 'Reviewing' | 'Planned' | 'Implemented' | 'Not Planned';
  admin_reply?: string;
  replied_at?: string;
  created_at: string;
  student_name?: string;
}

export interface CommunityPost {
  id: string;
  author_id?: string;
  is_anonymous: boolean;
  title: string;
  description: string;
  category: string;
  status: 'OPEN' | 'RESPONDED' | 'CLOSED' | 'HIDDEN';
  admin_response?: string;
  responded_by?: string;
  responded_at?: string;
  created_at: string;
  author_name?: string;
  votes_count: number;
  has_voted: boolean;
}

export interface ProblemReport {
  id: string;
  student_id?: string;
  category: 'wrong_timing' | 'missing_notes' | 'attendance_mistake' | 'broken_link' | 'app_issue' | 'other';
  title: string;
  details: string;
  reference_session_id?: string;
  status: 'OPEN' | 'RESOLVING' | 'RESOLVED';
  resolution_notes?: string;
  created_at: string;
  student_name?: string;
}
