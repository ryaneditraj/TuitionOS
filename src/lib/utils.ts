import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime12(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // 0 becomes 12
  return `${h}:${m} ${ampm}`;
}

export function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date('2026-09-20T00:00:00');
  const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function getSessionTypeBadge(type: string): { bg: string; text: string; label: string } {
  switch (type) {
    case 'CLASS':
      return { bg: 'bg-indigo-50 border-indigo-100 text-indigo-700', text: 'text-indigo-700', label: 'Class' };
    case 'PRACTICE':
      return { bg: 'bg-amber-50 border-amber-100 text-amber-700', text: 'text-amber-700', label: 'Practice' };
    case 'STUDY':
      return { bg: 'bg-emerald-50 border-emerald-100 text-emerald-700', text: 'text-emerald-700', label: 'Study Hall' };
    case 'EXAM':
      return { bg: 'bg-rose-50 border-rose-100 text-rose-700', text: 'text-rose-700', label: 'Exam' };
    case 'EVENT':
      return { bg: 'bg-purple-50 border-purple-100 text-purple-700', text: 'text-purple-700', label: 'Event' };
    case 'HOLIDAY':
      return { bg: 'bg-sky-50 border-sky-100 text-sky-700', text: 'text-sky-700', label: 'Holiday' };
    case 'IDLE':
      return { bg: 'bg-slate-50 border-slate-200 text-slate-500', text: 'text-slate-500', label: 'Break / Idle' };
    default:
      return { bg: 'bg-slate-50 border-slate-200 text-slate-600', text: 'text-slate-600', label: type };
  }
}
