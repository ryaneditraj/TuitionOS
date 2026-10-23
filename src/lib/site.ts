export const siteConfig = {
  name: 'Trinity One',
  repoName: 'TuitionOS',
  title: 'Trinity One — Tuition Centre Operating System',
  description:
    'Trinity One is a mobile-first operating system for tuition centres and schools. Students see today’s classes, homework, attendance, board-exam notes, and community updates on one screen.',
  keywords: [
    'Trinity One',
    'TuitionOS',
    'tuition centre software',
    'tuition management system',
    'school operating system',
    'student attendance app',
    'class schedule',
    'homework tracker',
    'board exam notes',
    'CBSE tuition',
    'educational operating system',
    'mobile-first school app',
  ],
  repository: 'https://github.com/ryaneditraj/TuitionOS',
  author: {
    name: 'Ryan Editraj',
    github: 'https://github.com/ryaneditraj',
    instagram: 'https://instagram.com/ryaneditraj',
  },
};

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (configured) return configured;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}
