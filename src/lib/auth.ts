import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getDb } from './db';
import { User, StudentProfile, TeacherProfile } from './types';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'trinity-one-super-secret-key-2026-tei');
const COOKIE_NAME = 'trinity_session';

export interface SessionPayload {
  userId: string;
  role: string;
  email: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function getCurrentUser(): Promise<{
  user: User | null;
  student?: StudentProfile;
  teacher?: TeacherProfile;
  managedBatchIds?: string[];
}> {
  const session = await getSession();
  if (!session?.userId) {
    // Default to Ryan (student) if no cookie set so app opens immediately ready to test
    return getDefaultDemoUser('user-ryan');
  }

  const db = getDb();
  const user = db.prepare('SELECT id, email, full_name, role, avatar_url, phone, created_at FROM users WHERE id = ?').get(session.userId) as User | undefined;

  if (!user) {
    return getDefaultDemoUser('user-ryan');
  }

  return hydrateUserData(db, user);
}

export function getDefaultDemoUser(userId = 'user-ryan') {
  const db = getDb();
  const user = db.prepare('SELECT id, email, full_name, role, avatar_url, phone, created_at FROM users WHERE id = ?').get(userId) as User | undefined;
  if (!user) return { user: null };
  return hydrateUserData(db, user);
}

function hydrateUserData(db: ReturnType<typeof getDb>, user: User) {
  let student: StudentProfile | undefined;
  let teacher: TeacherProfile | undefined;
  let managedBatchIds: string[] = [];

  if (user.role === 'student') {
    const s = db.prepare(`
      SELECT s.*, b.name as batch_name, b.full_label as batch_full_label,
             c.name as class_name, c.grade_number, bd.name as board_name
      FROM students s
      JOIN batches b ON s.batch_id = b.id
      JOIN classes c ON b.class_id = c.id
      JOIN boards bd ON c.board_id = bd.id
      WHERE s.user_id = ?
    `).get(user.id) as any;

    if (s) {
      student = {
        id: s.id,
        user_id: s.user_id,
        batch_id: s.batch_id,
        roll_number: s.roll_number,
        guardian_name: s.guardian_name,
        guardian_phone: s.guardian_phone,
        admission_date: s.admission_date,
        batch: {
          id: s.batch_id,
          class_id: s.class_id,
          academic_year_id: s.academic_year_id,
          name: s.batch_name,
          full_label: s.batch_full_label,
          class_level: {
            id: s.class_id,
            board_id: s.board_id,
            name: s.class_name,
            grade_number: s.grade_number,
            board: {
              id: s.board_id,
              institution_id: s.institution_id,
              name: s.board_name
            }
          }
        }
      };
    }
  } else if (user.role === 'teacher') {
    const t = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(user.id) as any;
    if (t) {
      const subjects = db.prepare(`
        SELECT s.* FROM subjects s
        JOIN teacher_subjects ts ON ts.subject_id = s.id
        WHERE ts.teacher_id = ?
      `).all(t.id) as any[];

      teacher = {
        id: t.id,
        user_id: t.user_id,
        title: t.title,
        specialization: t.specialization,
        subjects
      };
    }
  } else if (user.role === 'batch_admin') {
    const rows = db.prepare('SELECT batch_id FROM batch_admins WHERE user_id = ?').all(user.id) as { batch_id: string }[];
    managedBatchIds = rows.map(r => r.batch_id);
  }

  return { user, student, teacher, managedBatchIds };
}

export function canManageBatch(user: User, batchId: string, managedBatchIds: string[] = []): boolean {
  if (user.role === 'super_admin') return true;
  if (user.role === 'batch_admin') return managedBatchIds.includes(batchId);
  return false;
}
