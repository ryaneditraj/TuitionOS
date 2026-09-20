'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Filter,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { formatTime12, formatDateLabel, getSessionTypeBadge } from '@/lib/utils';
import { User, StudentProfile } from '@/lib/types';

interface ScheduleViewProps {
  user: User | null;
  student?: StudentProfile;
  onOpenScheduleModal: (date?: string) => void;
  onOpenAttendanceModal: (sessionId: string) => void;
  onOpenDigitalClassroom?: (sessionId: string) => void;
}

export default function ScheduleView({
  user,
  student,
  onOpenScheduleModal,
  onOpenAttendanceModal,
  onOpenDigitalClassroom,
}: ScheduleViewProps) {
  // Reference date: Sep 20, 2026
  const [selectedDate, setSelectedDate] = useState('2026-09-20');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const canManage = user?.role === 'super_admin' || user?.role === 'batch_admin' || user?.role === 'teacher';

  const DATES_NAV = [
    { date: '2026-09-18', label: 'Fri', num: '18' },
    { date: '2026-09-19', label: 'Sat', num: '19' },
    { date: '2026-09-20', label: 'Sun', num: '20' }, // Today
    { date: '2026-09-21', label: 'Mon', num: '21' },
    { date: '2026-09-22', label: 'Tue', num: '22' },
    { date: '2026-09-23', label: 'Wed', num: '23' },
    { date: '2026-09-24', label: 'Thu', num: '24' },
  ];

  useEffect(() => {
    loadSessions();
  }, [selectedDate, user?.id]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schedule?date=${selectedDate}`);
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Top Header & Date Navigation Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Schedule</h2>
            <p className="text-xs text-slate-500">
              {formatDateLabel(selectedDate)}, {selectedDate}
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => onOpenScheduleModal(selectedDate)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Class</span>
            </button>
          )}
        </div>

        {/* Swipeable Date Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {DATES_NAV.map((d) => {
            const isSelected = selectedDate === d.date;
            const isToday = d.date === '2026-09-20';

            return (
              <button
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                className={`flex-1 min-w-[46px] py-2 px-1 rounded-2xl text-center transition-all flex flex-col items-center ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 font-bold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 font-medium'
                }`}
              >
                <span className={`text-[10px] uppercase ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {d.label}
                </span>
                <span className="text-sm font-black mt-0.5">{d.num}</span>
                {isToday && (
                  <span
                    className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-amber-300' : 'bg-indigo-600'}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sessions Timeline */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500">Loading daily schedule...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No sessions scheduled for this day</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                No classes, exams or study halls on record.
              </p>
            </div>
            {canManage && (
              <button
                onClick={() => onOpenScheduleModal(selectedDate)}
                className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Schedule a class for this date
              </button>
            )}
          </div>
        ) : (
          sessions.map((session) => {
            const badge = getSessionTypeBadge(session.session_type);
            const isIdle = session.session_type === 'IDLE';
            const myAtt = session.my_attendance;

            return (
              <div
                key={session.id}
                className={`bg-white rounded-3xl p-4 sm:p-5 border transition-all ${
                  isIdle ? 'border-dashed border-slate-200 bg-slate-50/50' : 'border-slate-200/90 shadow-xs'
                }`}
              >
                {/* Header row: Times + Type badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900">
                      {formatTime12(session.start_time)} – {formatTime12(session.end_time)}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Student Attendance Pill (for students) */}
                  {myAtt && (
                    <div className="flex items-center gap-1 text-[11px] font-bold">
                      {myAtt.status === 'PRESENT' ? (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Present
                        </span>
                      ) : (
                        <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Absent
                        </span>
                      )}
                    </div>
                  )}

                  {/* Teacher Attendance Marked Counter (for staff) */}
                  {canManage && session.attendance_summary && (
                    <div className="text-[11px] font-semibold text-slate-500">
                      Attendance: <span className="text-emerald-700 font-bold">{session.attendance_summary.present}</span>/{session.attendance_summary.total}
                    </div>
                  )}
                </div>

                {/* Subject & Topic */}
                <div className="mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: session.subject?.color || '#94a3b8' }}
                    />
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      {session.subject?.name || session.session_type}
                    </h3>
                  </div>

                  {session.topic && (
                    <p className="text-xs font-semibold text-slate-700 mt-1 pl-4.5">
                      {session.topic}
                    </p>
                  )}
                  {session.notes_summary && (
                    <p className="text-[11px] text-slate-500 mt-1 pl-4.5 leading-relaxed">
                      {session.notes_summary}
                    </p>
                  )}
                </div>

                {/* Details Footer: Room, Teacher, Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {session.room && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{session.room.name}</span>
                      </span>
                    )}
                    {session.teacher && (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span>{session.teacher.full_name}</span>
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {canManage && (
                      <button
                        onClick={() => onOpenAttendanceModal(session.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Attendance</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
