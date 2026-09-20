'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Bell,
  Sparkles,
  ChevronRight,
  FileText,
  UserCheck,
  Check,
} from 'lucide-react';
import { formatTime12, formatDateLabel, getSessionTypeBadge } from '@/lib/utils';
import { triggerCelebration } from '@/lib/confetti';
import { User, StudentProfile } from '@/lib/types';

interface HomeViewProps {
  user: User | null;
  student?: StudentProfile;
  onNavigateTab: (tab: any) => void;
  onOpenSessionModal?: (sessionId: string) => void;
}

export default function HomeView({
  user,
  student,
  onNavigateTab,
  onOpenSessionModal,
}: HomeViewProps) {
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [recentMaterials, setRecentMaterials] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Today reference date: 2026-09-20
  const todayStr = '2026-09-20';

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Today's sessions
      const sessRes = await fetch(`/api/schedule?date=${todayStr}`);
      const sessData = await sessRes.json();
      setTodaySessions(sessData.sessions || []);

      // 2. Academic Tasks
      const taskRes = await fetch('/api/tasks');
      const taskData = await taskRes.json();
      setTasks(taskData.tasks || []);

      // 3. Upcoming Exams
      const examRes = await fetch('/api/exams');
      const examData = await examRes.json();
      setUpcomingExams(examData.exams?.filter((e: any) => e.date >= todayStr).slice(0, 2) || []);

      // 4. Announcements
      const annRes = await fetch('/api/announcements');
      const annData = await annRes.json();
      setAnnouncements(annData.announcements?.slice(0, 2) || []);

      // 5. Recent notes/materials
      const matRes = await fetch('/api/materials');
      const matData = await matRes.json();
      setRecentMaterials(matData.materials?.slice(0, 2) || []);

      // 6. Attendance stats (for student)
      if (user?.role === 'student') {
        const attRes = await fetch('/api/attendance?studentStats=true');
        const attData = await attRes.json();
        setAttendanceStats(attData.stats);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Quick complete task
  const handleToggleTaskComplete = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    if (nextStatus === 'COMPLETED') {
      triggerCelebration();
    }

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              my_assignment: {
                ...t.my_assignment,
                status: nextStatus,
                bucket: nextStatus === 'COMPLETED' ? 'completed' : 'today',
              },
            }
          : t
      )
    );

    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, status: nextStatus }),
      });
    } catch (err) {
      console.error('Task update failed:', err);
      loadDashboardData();
    }
  };

  const studentFirstName = user?.full_name?.split(' ')[0] || 'there';

  // Tasks to display: Overdue first, then Due Today, then Upcoming (incomplete only)
  const pendingTasks = tasks.filter((t) => t.my_assignment?.status !== 'COMPLETED');
  const overdueTasks = pendingTasks.filter((t) => t.my_assignment?.bucket === 'overdue');
  const todayTasks = pendingTasks.filter((t) => t.my_assignment?.bucket === 'today');
  const upcomingTasks = pendingTasks.filter((t) => t.my_assignment?.bucket === 'upcoming');

  const primaryTasksList = [...overdueTasks, ...todayTasks, ...upcomingTasks].slice(0, 4);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Hero Greeting Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-indigo-950/10 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-40 h-40 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-indigo-200 mb-2 border border-white/10">
              <Calendar className="w-3.5 h-3.5" />
              <span>Sunday, September 20, 2026</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Good morning, {studentFirstName} 👋
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/90 mt-1">
              You have <span className="font-bold text-white">{todaySessions.length} sessions</span> and{' '}
              <span className="font-bold text-amber-300">
                {overdueTasks.length + todayTasks.length} urgent tasks
              </span>{' '}
              scheduled for today.
            </p>
          </div>

          {/* Attendance Ring / Badge */}
          {attendanceStats && (
            <button
              onClick={() => onNavigateTab('profile')}
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 rounded-2xl p-2.5 text-center shrink-0 transition-colors"
            >
              <div className="text-xs font-semibold text-indigo-200">Attendance</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-300">
                {attendanceStats.percentage}%
              </div>
              <div className="text-[10px] text-indigo-200/80">
                {attendanceStats.present}/{attendanceStats.total} Classes
              </div>
            </button>
          )}
        </div>
      </div>

      {/* TODAY'S SCHEDULE SECTION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wider uppercase text-slate-400">TODAY</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {todaySessions.length} Sessions
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('schedule')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
          >
            <span>Full schedule</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todaySessions.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200/80">
            <p className="text-sm font-semibold text-slate-700">No classes scheduled for today 🎉</p>
            <p className="text-xs text-slate-400 mt-1">Enjoy your study break or check upcoming tasks</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todaySessions.map((session, index) => {
              const badge = getSessionTypeBadge(session.session_type);
              const isIdle = session.session_type === 'IDLE';

              return (
                <div
                  key={session.id}
                  className={`bg-white rounded-2xl p-4 border transition-all duration-150 hover:shadow-md hover:border-indigo-100 flex items-start gap-3.5 relative ${
                    isIdle ? 'border-dashed border-slate-200 opacity-75' : 'border-slate-200/90 shadow-xs'
                  }`}
                >
                  {/* Left Time Badge */}
                  <div className="w-16 shrink-0 text-center pt-0.5">
                    <span className="text-xs font-black text-slate-900 block leading-tight">
                      {formatTime12(session.start_time)}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                      {formatTime12(session.end_time)}
                    </span>
                  </div>

                  {/* Vertical Divider */}
                  <div 
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{ backgroundColor: session.subject?.color || '#cbd5e1' }}
                  />

                  {/* Session Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-slate-900">
                        {session.subject?.name || session.session_type}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>

                    {session.topic && (
                      <p className="text-xs font-semibold text-slate-700 mt-0.5 line-clamp-1">
                        {session.topic}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 flex-wrap">
                      {session.room && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{session.room.name.split('(')[0]}</span>
                        </span>
                      )}
                      {session.teacher && (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span>{session.teacher.full_name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MY WORK / TASKS SECTION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wider uppercase text-slate-400">MY WORK</span>
            {pendingTasks.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                {pendingTasks.length} Pending
              </span>
            )}
          </div>
          <button
            onClick={() => onNavigateTab('my-work')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
          >
            <span>View all work</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {primaryTasksList.length === 0 ? (
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 text-center">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
            <p className="text-sm font-bold text-emerald-950">You&apos;re all caught up 🎉</p>
            <p className="text-xs text-emerald-700 mt-0.5">No pending homework or tasks due right now.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {primaryTasksList.map((task) => {
              const isOverdue = task.my_assignment?.bucket === 'overdue';
              const isDueToday = task.my_assignment?.bucket === 'today';
              const isDone = task.my_assignment?.status === 'COMPLETED';

              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-2xl p-3.5 border transition-all flex items-center justify-between gap-3 ${
                    isOverdue
                      ? 'border-rose-200/90 bg-rose-50/30'
                      : isDueToday
                      ? 'border-amber-200/90 bg-amber-50/20'
                      : 'border-slate-200/80'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Completion Checkbox Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleTaskComplete(task.id, task.my_assignment?.status || 'TODO')}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-indigo-600 hover:bg-slate-50'
                      }`}
                      title={isDone ? 'Mark Incomplete' : 'Mark Complete'}
                    >
                      {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {isOverdue && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-rose-600 text-white tracking-wide">
                            OVERDUE
                          </span>
                        )}
                        {isDueToday && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-600 text-white tracking-wide">
                            DUE TODAY
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-500">
                          {task.subject?.name}
                        </span>
                        <span className="text-[10px] text-slate-400">• {task.type}</span>
                      </div>

                      <h4 className={`text-xs font-bold leading-snug line-clamp-1 ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                      </h4>

                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                        {isOverdue ? `Due ${formatDateLabel(task.due_date)}` : isDueToday ? `Due at ${formatTime12(task.due_time)}` : `Due ${formatDateLabel(task.due_date)}`}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* UPCOMING EXAM CARD */}
      {upcomingExams.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-wider uppercase text-slate-400">UPCOMING EXAM</span>
            <button
              onClick={() => onNavigateTab('learning')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              All exams
            </button>
          </div>

          <div className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-2xl p-4 text-white shadow-md shadow-rose-500/15 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-rose-100 font-semibold mb-1">
                <GraduationCap className="w-4 h-4" />
                <span>{upcomingExams[0].exam_type} • {upcomingExams[0].subject?.name}</span>
              </div>
              <h3 className="text-base font-black tracking-tight truncate">
                {upcomingExams[0].title}
              </h3>
              <p className="text-xs text-rose-100 mt-0.5">
                📅 {formatDateLabel(upcomingExams[0].date)} at {formatTime12(upcomingExams[0].start_time)}
                {upcomingExams[0].room && ` • ${upcomingExams[0].room.name.split('(')[0]}`}
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-md rounded-xl px-3 py-2 text-center shrink-0 border border-white/20">
              <span className="text-xs font-semibold block text-rose-100">Marks</span>
              <span className="text-lg font-black block leading-none">{upcomingExams[0].max_marks}</span>
            </div>
          </div>
        </section>
      )}

      {/* RECENT UPDATES SECTION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black tracking-wider uppercase text-slate-400">RECENT</span>
          <button
            onClick={() => onNavigateTab('community')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            All updates
          </button>
        </div>

        <div className="space-y-2">
          {/* Announcements */}
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`p-3.5 rounded-2xl border flex items-start gap-3 bg-white transition-all ${
                ann.priority === 'URGENT' ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200/80 shadow-xs'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${ann.priority === 'URGENT' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-50 text-indigo-700'}`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 truncate">{ann.title}</span>
                  {ann.priority === 'URGENT' && (
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-600 text-white">
                      URGENT
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ann.content}</p>
              </div>
            </div>
          ))}

          {/* New Notes Material */}
          {recentMaterials.map((mat) => (
            <a
              key={mat.id}
              href={mat.file_url}
              target="_blank"
              rel="noreferrer"
              className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-200 hover:bg-slate-50/80 transition-all flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">{mat.subject_name}</span>
                    <span className="text-[10px] text-slate-400">• New Notes</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate">{mat.title}</h4>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
