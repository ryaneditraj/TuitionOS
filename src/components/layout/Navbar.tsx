'use client';

import React from 'react';
import { Search, Sparkles, Bell, AlertTriangle, Shield, GraduationCap, ChevronDown } from 'lucide-react';
import { User, StudentProfile } from '@/lib/types';

interface NavbarProps {
  user: User | null;
  student?: StudentProfile;
  onOpenSearch: () => void;
  onOpenPersonaModal: () => void;
  onOpenProblemModal?: () => void;
  unreadCount?: number;
}

export default function Navbar({
  user,
  student,
  onOpenSearch,
  onOpenPersonaModal,
  onOpenProblemModal,
  unreadCount = 2,
}: NavbarProps) {
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return { label: 'Super Admin', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'batch_admin':
        return { label: 'Batch Admin', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'teacher':
        return { label: 'Faculty', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { label: 'Student', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand & Academic Context */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-200 shrink-0 tracking-tight">
            T<span className="text-indigo-300 text-xs">1</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-slate-900 truncate">
                Trinity <span className="text-indigo-600">One</span>
              </h1>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${roleInfo.bg} hidden sm:inline-block`}>
                {roleInfo.label}
              </span>
            </div>

            {/* Context Breadcrumb */}
            <p className="text-[11px] font-medium text-slate-500 truncate">
              {user?.role === 'student' && student?.batch?.full_label
                ? student.batch.full_label
                : user?.role === 'teacher'
                ? 'Faculty Portal • Trinity Institutions'
                : 'Trinity Educational Institutions'}
            </p>
          </div>
        </div>

        {/* Right Actions: Search + Switch Persona + Quick Report */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Problem Report Button */}
          {user?.role === 'student' && onOpenProblemModal && (
            <button
              onClick={onOpenProblemModal}
              title="Report an issue or error"
              className="hidden xs:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Report</span>
            </button>
          )}

          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition-colors text-xs font-medium"
            title="Global Search (⌘K)"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden md:inline text-[10px] bg-white border border-slate-200 px-1 py-0.5 rounded text-slate-400 font-sans">
              ⌘K
            </kbd>
          </button>

          {/* Persona Switcher Trigger */}
          <button
            onClick={onOpenPersonaModal}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-indigo-200/80 bg-indigo-50/60 hover:bg-indigo-100/70 transition-all text-xs font-bold text-indigo-950 group"
            title="Switch Demo Persona"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden border border-indigo-300 shrink-0 bg-white">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-indigo-600 text-xs">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-bold leading-none block text-slate-900 group-hover:text-indigo-900">
                {user?.full_name?.split(' ')[0] || 'Demo'}
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold block leading-tight">
                Switch Role
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-indigo-600 transition-transform group-hover:translate-y-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
