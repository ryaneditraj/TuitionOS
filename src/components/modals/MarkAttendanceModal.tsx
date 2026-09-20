'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, CheckCheck, Loader2, UserCheck, AlertCircle } from 'lucide-react';
import { formatTime12 } from '@/lib/utils';

interface MarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onSuccess: () => void;
}

export default function MarkAttendanceModal({
  isOpen,
  onClose,
  sessionId,
  onSuccess,
}: MarkAttendanceModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && sessionId) {
      setLoading(true);
      setErrorMsg('');
      fetch(`/api/attendance?sessionId=${sessionId}`)
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to load attendance');
          }
          return res.json();
        })
        .then((data) => {
          setSession(data.session);
          setStudents(data.students || []);
        })
        .catch((err) => {
          setErrorMsg(err.message);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, sessionId]);

  if (!isOpen) return null;

  const handleToggleStatus = (index: number) => {
    setStudents((prev) => {
      const copy = [...prev];
      const cur = copy[index].status;
      // Cycle: PRESENT -> ABSENT -> LATE -> EXCUSED -> PRESENT
      let next = 'PRESENT';
      if (cur === 'PRESENT') next = 'ABSENT';
      else if (cur === 'ABSENT') next = 'LATE';
      else if (cur === 'LATE') next = 'EXCUSED';
      else next = 'PRESENT';
      copy[index] = { ...copy[index], status: next };
      return copy;
    });
  };

  const handleMarkAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: 'PRESENT' })));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      const records = students.map((s) => ({
        student_id: s.student_id,
        status: s.status,
        remarks: s.remarks,
      }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, records }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save attendance');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter((s) => s.status === 'PRESENT').length;
  const absentCount = students.filter((s) => s.status === 'ABSENT').length;
  const lateCount = students.filter((s) => s.status === 'LATE').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Mark Attendance</h2>
              <p className="text-xs text-slate-500">
                {session ? `${session.subject_name || 'Session'} • ${formatTime12(session.start_time)}` : 'Session Attendance'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border-b border-rose-100 flex items-center gap-2 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Toolbar: Stats & Mark All Present */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">
              Present: <span className="text-emerald-700 font-bold">{presentCount}</span>/{students.length}
            </span>
            {absentCount > 0 && (
              <span className="text-rose-600 font-medium">
                Absent: {absentCount}
              </span>
            )}
            {lateCount > 0 && (
              <span className="text-amber-600 font-medium">
                Late: {lateCount}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all present
          </button>
        </div>

        {/* Student List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs">Loading batch roster...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">No students enrolled in this batch.</div>
          ) : (
            students.map((student, idx) => (
              <div
                key={student.student_id}
                className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-white flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                    {student.avatar_url ? (
                      <img src={student.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      student.full_name.charAt(0)
                    )}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 truncate">{student.full_name}</p>
                    <p className="text-[10px] text-slate-400">Roll: {student.roll_number}</p>
                  </div>
                </div>

                {/* Status Toggle Button */}
                <button
                  type="button"
                  onClick={() => handleToggleStatus(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    student.status === 'PRESENT'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : student.status === 'ABSENT'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : student.status === 'LATE'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {student.status === 'PRESENT' && '✓ Present'}
                  {student.status === 'ABSENT' && '✕ Absent'}
                  {student.status === 'LATE' && '⏰ Late'}
                  {student.status === 'EXCUSED' && '• Excused'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Attendance
          </button>
        </div>
      </div>
    </div>
  );
}
