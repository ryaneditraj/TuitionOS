'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  LogOut,
  Sparkles,
  BookOpen,
  Award,
  Shield,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { User as UserType, StudentProfile } from '@/lib/types';

interface ProfileViewProps {
  user: UserType | null;
  student?: StudentProfile;
  onOpenPersonaModal: () => void;
  onLogout: () => void;
}

export default function ProfileView({
  user,
  student,
  onOpenPersonaModal,
  onLogout,
}: ProfileViewProps) {
  const [attStats, setAttStats] = useState<any>(null);
  const [taskStats, setTaskStats] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'student') {
      fetch('/api/attendance?studentStats=true')
        .then((res) => res.json())
        .then((data) => setAttStats(data.stats))
        .catch(console.error);

      fetch('/api/tasks')
        .then((res) => res.json())
        .then((data) => setTaskStats(data.stats))
        .catch(console.error);
    }
  }, [user?.id]);

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left relative">
        <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-indigo-100 shadow-md shrink-0 bg-slate-100">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-black text-2xl text-indigo-600">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {user?.full_name}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>

          {student?.batch && (
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 flex-wrap text-xs font-semibold text-slate-700">
              <span className="px-2 py-0.5 rounded-lg bg-slate-100">
                Class 12
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-100">
                CBSE Board
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-100">
                Batch A
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-100">
                2026–27
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Academic Highlights & Stats */}
      {user?.role === 'student' && (
        <div className="grid grid-cols-2 gap-3">
          {/* Attendance Card */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Attendance
            </span>
            <div className="text-2xl font-black text-emerald-600">
              {attStats?.percentage || 94}%
            </div>
            <p className="text-[11px] text-slate-500">
              {attStats?.present || 31} attended of {attStats?.total || 33} total sessions
            </p>
          </div>

          {/* Task Completion Card */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Tasks Finished
            </span>
            <div className="text-2xl font-black text-indigo-600">
              {taskStats?.completed || 14}
            </div>
            <p className="text-[11px] text-slate-500">
              {taskStats?.due_today || 1} due today, {taskStats?.overdue || 1} overdue
            </p>
          </div>
        </div>
      )}

      {/* Subjects Enrolled */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
        <h3 className="text-sm font-black text-slate-900 tracking-tight">Enrolled Subjects</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'Physics', code: 'PHY', color: '#6366F1' },
            { name: 'Chemistry', code: 'CHEM', color: '#EC4899' },
            { name: 'Mathematics', code: 'MATH', color: '#3B82F6' },
            { name: 'Biology', code: 'BIO', color: '#10B981' },
          ].map((sub) => (
            <div
              key={sub.code}
              className="p-2.5 rounded-2xl border border-slate-100 bg-slate-50 flex items-center gap-2.5"
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: sub.color }}
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{sub.name}</p>
                <p className="text-[10px] text-slate-400">{sub.code}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-3xl p-2 border border-slate-200/90 shadow-xs space-y-1">
        <button
          onClick={onOpenPersonaModal}
          className="w-full p-3.5 rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-between group text-xs font-bold text-slate-800"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>Switch Role / Demo Persona</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600" />
        </button>

        <button
          onClick={onLogout}
          className="w-full p-3.5 rounded-2xl hover:bg-rose-50 transition-colors flex items-center justify-between group text-xs font-bold text-rose-600"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            <span>Sign Out</span>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-300 group-hover:text-rose-600" />
        </button>
      </div>

      <div className="text-center pt-2 text-[11px] text-slate-400 font-medium">
        Trinity One v2.4 • Trinity Educational Institutions
      </div>
    </div>
  );
}
