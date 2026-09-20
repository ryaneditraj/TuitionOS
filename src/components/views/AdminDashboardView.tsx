'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  CheckSquare,
  GraduationCap,
  Bell,
  MessageSquare,
  Plus,
  Upload,
  UserCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { formatTime12, formatDateLabel } from '@/lib/utils';
import { User, StudentProfile } from '@/lib/types';

interface AdminDashboardViewProps {
  user: User | null;
  onOpenScheduleModal: () => void;
  onOpenAssignModal: () => void;
  onOpenUploadModal: () => void;
  onOpenAttendanceModal: (sessionId?: string) => void;
  onNavigateTab: (tab: any) => void;
}

export default function AdminDashboardView({
  user,
  onOpenScheduleModal,
  onOpenAssignModal,
  onOpenUploadModal,
  onOpenAttendanceModal,
  onNavigateTab,
}: AdminDashboardViewProps) {
  const [stats, setStats] = useState<any>(null);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Today reference date: 2026-09-20
  const todayStr = '2026-09-20';

  useEffect(() => {
    loadAdminStats();
  }, [user?.id]);

  const loadAdminStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data.stats);
      setRecentFeedback(data.recentFeedback || []);
      setAnnouncements(data.recentAnnouncements || []);

      const schedRes = await fetch(`/api/schedule?date=${todayStr}`);
      const schedData = await schedRes.json();
      setTodayClasses(schedData.sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 pb-20 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-slate-900/10 flex items-start justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-bold text-slate-200 mb-2 border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Institutional Management</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Institutional Operations Desk
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Overview of classes, attendance, students and faculty for Trinity Institutions.
          </p>
        </div>
      </div>

      {/* QUICK ACTIONS ROW */}
      <section className="space-y-2">
        <span className="text-xs font-black tracking-wider uppercase text-slate-400">QUICK ACTIONS</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={onOpenScheduleModal}
            className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-500 hover:shadow-md transition-all text-left group shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900">Schedule Class</p>
            <p className="text-[10px] text-slate-400">With conflict check</p>
          </button>

          <button
            onClick={onOpenAssignModal}
            className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-500 hover:shadow-md transition-all text-left group shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900">Assign Task</p>
            <p className="text-[10px] text-slate-400">To batch or student</p>
          </button>

          <button
            onClick={onOpenUploadModal}
            className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-500 hover:shadow-md transition-all text-left group shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Upload className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900">Upload Notes</p>
            <p className="text-[10px] text-slate-400">PDFs or board photos</p>
          </button>

          <button
            onClick={() => onOpenAttendanceModal(todayClasses[0]?.id)}
            className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-500 hover:shadow-md transition-all text-left group shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900">Mark Attendance</p>
            <p className="text-[10px] text-slate-400">Class or test roster</p>
          </button>
        </div>
      </section>

      {/* METRICS GRID */}
      <section className="space-y-2">
        <span className="text-xs font-black tracking-wider uppercase text-slate-400">INSTITUTION STATS</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400">Total Students</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {stats?.studentsCount || 5}
            </div>
            <p className="text-[10px] text-slate-500">{stats?.batchesCount || 4} Active Batches</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400">Attendance Rate</span>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">
              {stats?.overallAttendanceRate || 94}%
            </div>
            <p className="text-[10px] text-slate-500">Institution-wide</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400">Today&apos;s Classes</span>
            <div className="text-2xl font-black text-indigo-600 mt-0.5">
              {stats?.todayClassesCount || todayClasses.length}
            </div>
            <p className="text-[10px] text-slate-500">Scheduled Today</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400">Upcoming Exams</span>
            <div className="text-2xl font-black text-rose-600 mt-0.5">
              {stats?.upcomingExamsCount || 3}
            </div>
            <p className="text-[10px] text-slate-500">This Month</p>
          </div>
        </div>
      </section>

      {/* TODAY'S SESSIONS MONITOR */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black tracking-wider uppercase text-slate-400">TODAY&apos;S SESSIONS</span>
          <button
            onClick={() => onNavigateTab('schedule')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            Full schedule →
          </button>
        </div>

        <div className="space-y-2">
          {todayClasses.map((sess) => (
            <div
              key={sess.id}
              className="bg-white rounded-2xl p-3.5 border border-slate-200/80 flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 text-center shrink-0">
                  <span className="text-xs font-bold text-slate-900 block leading-tight">
                    {formatTime12(sess.start_time)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{formatTime12(sess.end_time)}</span>
                </div>

                <div 
                  className="w-1 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: sess.subject?.color || '#cbd5e1' }}
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">
                      {sess.subject?.name || sess.session_type}
                    </span>
                    <span className="text-[10px] text-slate-500">• {sess.batch?.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{sess.topic}</p>
                </div>
              </div>

              <button
                onClick={() => onOpenAttendanceModal(sess.id)}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0 transition-colors"
              >
                Attendance
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT FEEDBACK FOR MANAGEMENT */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black tracking-wider uppercase text-slate-400">RECENT STUDENT FEEDBACK</span>
          <button
            onClick={() => onNavigateTab('community')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            All feedback →
          </button>
        </div>

        <div className="space-y-2">
          {recentFeedback.map((fb) => (
            <div
              key={fb.id}
              className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-1 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">{fb.author_name}</span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-100 text-amber-800">
                  {fb.status}
                </span>
              </div>
              <h4 className="font-black text-slate-900">{fb.subject}</h4>
              <p className="text-slate-600 line-clamp-2">{fb.message}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
