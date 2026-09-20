'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Check,
  Clock,
  AlertCircle,
  UploadCloud,
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Plus,
} from 'lucide-react';
import { formatDateLabel, formatTime12 } from '@/lib/utils';
import { triggerCelebration } from '@/lib/confetti';
import { User, StudentProfile } from '@/lib/types';

interface MyWorkViewProps {
  user: User | null;
  student?: StudentProfile;
  onOpenAssignModal: () => void;
}

type TaskFilter = 'all' | 'overdue' | 'today' | 'upcoming' | 'completed';

export default function MyWorkView({
  user,
  student,
  onOpenAssignModal,
}: MyWorkViewProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    overdue: 0,
    due_today: 0,
    upcoming: 0,
    completed: 0,
    total: 0,
  });
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState(true);

  const isTeacherOrAdmin = user?.role === 'super_admin' || user?.role === 'batch_admin' || user?.role === 'teacher';

  useEffect(() => {
    loadTasks();
  }, [filter, user?.id]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const param = filter !== 'all' ? `?filter=${filter}` : '';
      const res = await fetch(`/api/tasks${param}`);
      const data = await res.json();
      setTasks(data.tasks || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    if (nextStatus === 'COMPLETED') {
      triggerCelebration();
    }

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            my_assignment: {
              ...t.my_assignment,
              status: nextStatus,
              bucket: nextStatus === 'COMPLETED' ? 'completed' : 'today',
            },
          };
        }
        return t;
      })
    );

    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          status: nextStatus,
          submission_text: submissionNotes[taskId] || null,
        }),
      });
      loadTasks();
    } catch (err) {
      console.error(err);
      loadTasks();
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Header & Stats Banner */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {isTeacherOrAdmin ? 'Academic Tasks' : 'My Work'}
            </h2>
            <p className="text-xs text-slate-500">
              {isTeacherOrAdmin
                ? 'Track batch submissions, assignments and homework'
                : 'Assignments, worksheets, readings and revision work'}
            </p>
          </div>

          {isTeacherOrAdmin && (
            <button
              onClick={onOpenAssignModal}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Task</span>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Work ({stats.total || tasks.length})
          </button>

          <button
            onClick={() => setFilter('overdue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              filter === 'overdue'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <span>🔴 Overdue</span>
            <span className="font-mono">({stats.overdue || 0})</span>
          </button>

          <button
            onClick={() => setFilter('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              filter === 'today'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <span>🟠 Due Today</span>
            <span className="font-mono">({stats.due_today || 0})</span>
          </button>

          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === 'upcoming'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Upcoming ({stats.upcoming || 0})
          </button>

          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              filter === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <span>✅ Completed</span>
            <span className="font-mono">({stats.completed || 0})</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="text-base font-bold text-slate-800">You&apos;re all caught up 🎉</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              No tasks found in this section. Great job staying on top of your work!
            </p>
          </div>
        ) : (
          tasks.map((task) => {
            const isCompleted = task.my_assignment?.status === 'COMPLETED';
            const isOverdue = task.my_assignment?.bucket === 'overdue';
            const isDueToday = task.my_assignment?.bucket === 'today';
            const isExpanded = expandedTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  isOverdue
                    ? 'border-rose-200 bg-rose-50/15'
                    : isDueToday
                    ? 'border-amber-200 bg-amber-50/10'
                    : isCompleted
                    ? 'border-slate-200 opacity-80'
                    : 'border-slate-200/90 shadow-xs'
                }`}
              >
                {/* Main Task Header Card */}
                <div className="p-4 flex items-start gap-3.5">
                  {!isTeacherOrAdmin && (
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task.id, task.my_assignment?.status || 'TODO')}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-indigo-600 hover:bg-slate-50'
                      }`}
                      title={isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                    >
                      {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {isOverdue && (
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-rose-600 text-white tracking-wide">
                          🔴 OVERDUE
                        </span>
                      )}
                      {isDueToday && (
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-600 text-white tracking-wide">
                          🟠 DUE TODAY
                        </span>
                      )}
                      <span
                        className="text-[10px] font-bold px-2 py-0.2 rounded-full text-white"
                        style={{ backgroundColor: task.subject?.color || '#4F46E5' }}
                      >
                        {task.subject?.name}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        • {task.type}
                      </span>
                    </div>

                    <h3
                      className={`text-sm font-bold leading-snug cursor-pointer ${
                        isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    >
                      {task.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {formatDateLabel(task.due_date)} {task.due_time ? `at ${formatTime12(task.due_time)}` : ''}
                        </span>
                      </span>

                      {task.assigned_by_name && (
                        <span className="text-slate-400">
                          Assigned by {task.assigned_by_name}
                        </span>
                      )}

                      {/* Teacher stats */}
                      {isTeacherOrAdmin && task.assignment_counts && (
                        <span className="text-indigo-600 font-bold">
                          Submissions: {task.assignment_counts.completed}/{task.assignment_counts.total} completed
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded Details & Submission Area */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                    {task.description && (
                      <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80">
                        {task.description}
                      </p>
                    )}

                    {/* Attachments */}
                    {task.attachments && task.attachments.length > 0 && (
                      <div>
                        <span className="font-bold text-slate-700 block mb-1">Attached Worksheets:</span>
                        <div className="space-y-1.5">
                          {task.attachments.map((att: any, idx: number) => (
                            <a
                              key={idx}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 flex items-center justify-between text-indigo-600 font-medium transition-colors"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                                <span className="truncate">{att.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-400">{att.size}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Student Submission Box */}
                    {!isTeacherOrAdmin && (
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                        <span className="font-bold text-slate-900 block">Your Submission:</span>
                        <textarea
                          rows={2}
                          value={submissionNotes[task.id] || task.my_assignment?.submission_text || ''}
                          onChange={(e) =>
                            setSubmissionNotes({ ...submissionNotes, [task.id]: e.target.value })
                          }
                          placeholder="Type answers, working notes, or add completion remarks..."
                          className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-slate-400">
                            {task.my_assignment?.submitted_at
                              ? `Submitted on ${new Date(task.my_assignment.submitted_at).toLocaleDateString()}`
                              : 'Not submitted yet'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(task.id, task.my_assignment?.status || 'TODO')}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-xs"
                          >
                            {isCompleted ? 'Mark Incomplete' : 'Submit & Complete'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
