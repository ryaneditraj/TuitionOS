import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getCurrentUser } from '@/lib/auth';

const ALLOWED_BUCKETS = [
  'class-notes',
  'board-photos',
  'question-papers',
  'task-attachments',
  'task-submissions',
  'event-photos',
  'profile-photos',
];

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
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

    // 25MB size limit
    if (file.size > 25 * 1024 * 1024) {
      return Response.json({ error: 'File size exceeds 25MB limit' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.jpg') && !file.name.endsWith('.png')) {
      return Response.json({ error: 'File type not permitted' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', bucket);
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, safeName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${bucket}/${safeName}`;
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

    return Response.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      fileSize: sizeInMB,
      bucket,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
