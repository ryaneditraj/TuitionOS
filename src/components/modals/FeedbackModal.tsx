'use client';

import React, { useState } from 'react';
import { X, MessageSquare, Shield, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  onSuccess,
}: FeedbackModalProps) {
  const [category, setCategory] = useState<'general' | 'teacher' | 'class' | 'tuition' | 'suggestion' | 'problem'>('tuition');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subject,
          message,
          is_anonymous: isAnonymous,
        }),
      });

      if (!res.ok) throw new Error('Feedback submission failed');

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSubject('');
        setMessage('');
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Student Feedback</h2>
              <p className="text-xs text-slate-500">Direct channel to institution leadership</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-slate-900">Feedback Submitted</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Your message has been forwarded to the director and department head. Thank you for helping us improve Trinity!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            {/* Category */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Feedback Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="tuition">Tuition Campus & Facilities</option>
                <option value="class">Class & Teaching Quality</option>
                <option value="teacher">Faculty & Mentorship</option>
                <option value="suggestion">New Idea / Academic Suggestion</option>
                <option value="general">General Institution Feedback</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Study Hall AC Noise in Curie Room"
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Message</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your experience, specific suggestions, or concerns in detail..."
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Anonymous Toggle with Clear Privacy Explanation */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-slate-600" />
                  <span className="font-bold text-slate-800">Submit Anonymously</span>
                </div>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                {isAnonymous
                  ? '🔒 Your identity is 100% confidential. Your name, student ID, and email are completely omitted from the database record seen by teachers and staff.'
                  : 'Your student profile will be visible to management to follow up directly with you.'}
              </p>
            </div>

            <div className="pt-2 flex gap-3">
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
                Submit Feedback
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
