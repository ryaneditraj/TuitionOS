'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: string;
}

export default function ScheduleClassModal({
  isOpen,
  onClose,
  onSuccess,
  initialDate = '2026-09-20',
}: ScheduleModalProps) {
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [batchId, setBatchId] = useState('batch-12-cbse-a');
  const [subjectId, setSubjectId] = useState('sub-phy');
  const [teacherId, setTeacherId] = useState('t-priya');
  const [roomId, setRoomId] = useState('room-2');
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:00');
  const [sessionType, setSessionType] = useState('CLASS');
  const [topic, setTopic] = useState('');
  const [notesSummary, setNotesSummary] = useState('');

  // Recurring options
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<number[]>([1, 3]); // Mon & Wed
  const [recurringUntil, setRecurringUntil] = useState('2026-12-31');

  const [loading, setLoading] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/metadata')
        .then((res) => res.json())
        .then((data) => {
          setBatches(data.batches || []);
          setSubjects(data.subjects || []);
          setRooms(data.rooms || []);
          setTeachers(data.teachers || []);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);
    setLoading(true);

    try {
      const payload: any = {
        batch_id: batchId,
        subject_id: sessionType === 'IDLE' || sessionType === 'STUDY' ? null : subjectId,
        teacher_id: sessionType === 'IDLE' || sessionType === 'STUDY' ? null : teacherId,
        room_id: roomId || null,
        date,
        start_time: startTime,
        end_time: endTime,
        session_type: sessionType,
        topic: topic || `${sessionType} session`,
        notes_summary: notesSummary || null,
      };

      if (isRecurring) {
        payload.recurring_days = recurringDays;
        payload.recurring_until = recurringUntil;
      }

      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setConflictError(data.error);
        } else {
          setConflictError(data.error || 'Failed to schedule class');
        }
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setConflictError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayNum: number) => {
    setRecurringDays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
    );
  };

  const DAYS = [
    { num: 1, label: 'M' },
    { num: 2, label: 'T' },
    { num: 3, label: 'W' },
    { num: 4, label: 'T' },
    { num: 5, label: 'F' },
    { num: 6, label: 'S' },
    { num: 0, label: 'S' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Schedule Class Session</h2>
              <p className="text-xs text-slate-500">Live conflict detection and recurring schedules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {conflictError && (
          <div className="p-3.5 bg-rose-50 border-b border-rose-100 flex items-start gap-2.5 text-rose-800 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-bold">Conflict Warning:</span> {conflictError}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Batch Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Batch / Class</label>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.full_label} ({b.student_count || 0} students)
                </option>
              ))}
            </select>
          </div>

          {/* Session Type */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Session Type</label>
            <div className="grid grid-cols-4 gap-1.5">
              {['CLASS', 'PRACTICE', 'STUDY', 'IDLE'].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setSessionType(type)}
                  className={`py-2 px-1 rounded-xl font-bold text-center border transition-all ${
                    sessionType === type
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Subject & Teacher (if not IDLE/STUDY) */}
          {sessionType !== 'IDLE' && sessionType !== 'STUDY' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teacher</label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Room & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Classroom / Room</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Start Time & End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Topic & Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Topic / Chapter</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Electrostatics: Gauss's Law & Applications"
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Recurring Schedule Option */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-800">Repeat Weekly (Recurring)</span>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            {isRecurring && (
              <div className="p-3 bg-slate-50 rounded-xl space-y-3">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">Repeats on days:</span>
                  <div className="flex gap-1.5">
                    {DAYS.map((d) => (
                      <button
                        type="button"
                        key={d.num}
                        onClick={() => toggleDay(d.num)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          recurringDays.includes(d.num)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">Until date:</span>
                  <input
                    type="date"
                    value={recurringUntil}
                    onChange={(e) => setRecurringUntil(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Schedule Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
