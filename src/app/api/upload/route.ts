import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getCurrentUser } from '@/lib/auth';
import { isStaffRole, publicError } from '@/lib/security';

const ALLOWED_BUCKETS = [
  'class-notes',
  'board-photos',
  'question-papers',
  'task-attachments',
  'task-submissions',
  'event-photos',
  'profile-photos',
];

const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.txt',
]);

const BLOCKED_MIME_TYPES = new Set([
  'text/html',
  'application/xhtml+xml',
  'image/svg+xml',
  'application/javascript',
  'text/javascript',
  'application/x-httpd-php',
]);

function safeUploadName(original: string): string | null {
  const base = path.basename(original);
  const ext = path.extname(base).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return null;
  const stem = base.slice(0, -ext.length).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60) || 'file';
  return `${Date.now()}-${stem}${ext}`;
}

function hasAllowedSignature(ext: string, buffer: Buffer): boolean {
  if (buffer.length === 0) return false;
  if (ext === '.txt') return true;
  if (ext === '.pdf') return buffer.subarray(0, 4).toString() === '%PDF';
  if (ext === '.jpg' || ext === '.jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (ext === '.png') return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  if (ext === '.gif') return buffer.subarray(0, 4).toString() === 'GIF8';
  if (ext === '.webp') return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
  if (ext === '.docx' || ext === '.pptx') return buffer[0] === 0x50 && buffer[1] === 0x4b;
  if (ext === '.doc' || ext === '.ppt') return buffer[0] === 0xd0 && buffer[1] === 0xcf;
  return false;
}

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (!isStaffRole(user.role)) {
      return Response.json({ error: 'Only faculty and admins can upload files' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || 'task-submissions';

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return Response.json({ error: 'Invalid storage bucket' }, { status: 400 });
    }

    if (file.size > 25 * 1024 * 1024) {
      return Response.json({ error: 'File size exceeds 25MB limit' }, { status: 400 });
    }

    if (file.type && BLOCKED_MIME_TYPES.has(file.type)) {
      return Response.json({ error: 'File type not permitted' }, { status: 400 });
    }

    const safeName = safeUploadName(file.name || 'file');
    if (!safeName) {
      return Response.json({ error: 'File type not permitted' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(safeName).toLowerCase();
    if (!hasAllowedSignature(ext, buffer)) {
      return Response.json({ error: 'File contents do not match the allowed type' }, { status: 400 });
    }

    const uploadDir = path.resolve(process.cwd(), 'public', 'uploads', bucket);
    const filePath = path.resolve(uploadDir, safeName);
    const relative = path.relative(uploadDir, filePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return Response.json({ error: 'Invalid file name' }, { status: 400 });
    }

    await mkdir(uploadDir, { recursive: true });
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${bucket}/${safeName}`;
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

    return Response.json({
      success: true,
      url: publicUrl,
      fileName: path.basename(file.name || safeName),
      fileSize: sizeInMB,
      bucket,
    });
  } catch (error: unknown) {
    return publicError(error);
  }
}
