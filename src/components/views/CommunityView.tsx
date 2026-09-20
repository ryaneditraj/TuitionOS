'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  Sparkles,
  Plus,
  Send,
  Bell,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Lock,
  EyeOff,
  User,
  ShieldCheck,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { formatDateLabel, formatTime12 } from '@/lib/utils';
import { User as UserType, StudentProfile } from '@/lib/types';

interface CommunityViewProps {
  user: UserType | null;
  student?: StudentProfile;
  onOpenFeedbackModal: () => void;
  onOpenProblemModal: () => void;
  onOpenNewSuggestionModal?: () => void;
}

type CommTab = 'suggestions' | 'announcements' | 'events' | 'feedback';

export default function CommunityView({
  user,
  student,
  onOpenFeedbackModal,
  onOpenProblemModal,
}: CommunityViewProps) {
  const [activeTab, setActiveTab] = useState<CommTab>('suggestions');
  const [posts, setPosts] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Suggestion Form inline / modal
  const [isAddingSuggestion, setIsAddingSuggestion] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isAnon, setIsAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Admin reply inline state
  const [replyingPostId, setReplyingPostId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  const isAdmin = user?.role === 'super_admin' || user?.role === 'batch_admin';

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'suggestions') {
        const res = await fetch('/api/community');
        const data = await res.json();
        setPosts(data.posts || []);
      } else if (activeTab === 'announcements') {
        const res = await fetch('/api/announcements');
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      } else if (activeTab === 'events') {
        const res = await fetch('/api/events');
        const data = await res.json();
        setEvents(data.events || []);
      } else if (activeTab === 'feedback') {
        const res = await fetch('/api/feedback');
        const data = await res.json();
        setFeedbackList(data.feedback || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (postId: string) => {
    // Optimistic vote update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextVoted = !p.has_voted;
          return {
            ...p,
            has_voted: nextVoted,
            votes_count: nextVoted ? p.votes_count + 1 : Math.max(0, p.votes_count - 1),
          };
        }
        return p;
      })
    );

    try {
      await fetch(`/api/community/${postId}/vote`, { method: 'POST' });
    } catch (err) {
      console.error(err);
      loadData();
    }
  };

  const handleCreateSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          is_anonymous: isAnon,
          category: 'Class Request',
        }),
      });

      if (!res.ok) throw new Error('Failed to post');
      setNewTitle('');
      setNewDesc('');
      setIsAddingSuggestion(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminRespond = async (postId: string) => {
    if (!adminReplyText.trim()) return;
    try {
      await fetch('/api/community', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: postId,
          admin_response: adminReplyText,
          status: 'RESPONDED',
        }),
      });
      setReplyingPostId(null);
      setAdminReplyText('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Community & Notices</h2>
            <p className="text-xs text-slate-500">Student suggestions, announcements, events & feedback</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenFeedbackModal}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              Feedback
            </button>
            {activeTab === 'suggestions' && (
              <button
                onClick={() => setIsAddingSuggestion(!isAddingSuggestion)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Suggest</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'suggestions', label: 'Suggestions', icon: MessageSquare },
            { id: 'announcements', label: 'Announcements', icon: Bell },
            { id: 'events', label: 'Events', icon: Calendar },
            { id: 'feedback', label: 'Feedback Desk', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CommTab)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-1 justify-center ${
                  isActive ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* New Suggestion Form (collapsible) */}
      {isAddingSuggestion && (
        <form
          onSubmit={handleCreateSuggestion}
          className="bg-white rounded-3xl p-5 border border-indigo-200 shadow-md space-y-3 text-xs animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Propose an Idea or Revision Session</h3>
            <button
              type="button"
              onClick={() => setIsAddingSuggestion(false)}
              className="text-slate-400 hover:text-slate-600 font-semibold"
            >
              Cancel
            </button>
          </div>

          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Can we have a Physics revision class on Gauss’s Law?"
            className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />

          <textarea
            rows={2}
            required
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Describe what would help you and other students in your batch..."
            className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnon}
                onChange={(e) => setIsAnon(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <span className="text-slate-600">Post as Anonymous Student</span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-sm"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Publish Suggestion
            </button>
          </div>
        </form>
      )}

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading community updates...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: SUGGESTIONS & UPVOTES */}
          {activeTab === 'suggestions' && (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3"
                >
                  <div className="flex items-start gap-3 justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-700">
                          {post.author_name || 'Student'}
                        </span>
                        <span className="text-xs text-slate-400">• {formatDateLabel(post.created_at?.split('T')[0])}</span>
                        {post.status === 'RESPONDED' && (
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Faculty Responded
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                        💡 {post.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {post.description}
                      </p>
                    </div>

                    {/* Upvote Button */}
                    <button
                      type="button"
                      onClick={() => handleVote(post.id)}
                      className={`px-3 py-2 rounded-2xl flex flex-col items-center justify-center min-w-[50px] border transition-all ${
                        post.has_voted
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${post.has_voted ? 'fill-current' : ''}`} />
                      <span className="text-xs font-black mt-0.5">{post.votes_count || 0}</span>
                    </button>
                  </div>

                  {/* Admin Official Response */}
                  {post.admin_response && (
                    <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Trinity Administration Response:</span>
                      </div>
                      <p className="text-xs text-indigo-950 font-medium pl-5">
                        &ldquo;{post.admin_response}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Admin Reply Action Form */}
                  {isAdmin && !post.admin_response && (
                    <div className="pt-2 border-t border-slate-100">
                      {replyingPostId === post.id ? (
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={adminReplyText}
                            onChange={(e) => setAdminReplyText(e.target.value)}
                            placeholder="Type official response (e.g. Added for Saturday 3 PM)..."
                            className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setReplyingPostId(null)}
                              className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-500"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleAdminRespond(post.id)}
                              className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                            >
                              Send Response
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setReplyingPostId(post.id);
                            setAdminReplyText('Added for Saturday.');
                          }}
                          className="text-xs font-bold text-indigo-600 hover:underline"
                        >
                          + Add Administrative Response
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`bg-white rounded-3xl p-5 border transition-all ${
                    ann.priority === 'URGENT'
                      ? 'border-amber-300 bg-amber-50/20 shadow-xs'
                      : 'border-slate-200/90 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          ann.priority === 'URGENT'
                            ? 'bg-amber-600 text-white'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        {ann.priority} NOTICE
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDateLabel(ann.created_at?.split('T')[0])}
                      </span>
                    </div>

                    <span className="text-xs font-medium text-slate-500">
                      By {ann.created_by_name || 'Admin'}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 leading-snug mb-1">
                    {ann.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: EVENTS */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs space-y-3"
                >
                  {evt.photos && evt.photos.length > 0 && (
                    <div className="h-44 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={evt.photos[0]}
                        alt={evt.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-5 pt-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        {evt.category}
                      </span>
                      <span className="text-xs text-slate-500">
                        📅 {formatDateLabel(evt.date)} ({evt.start_time || '09:00'}–{evt.end_time || '16:00'})
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900">{evt.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>
                    {evt.location && (
                      <p className="text-xs font-semibold text-slate-500">📍 {evt.location}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: FEEDBACK DESK */}
          {activeTab === 'feedback' && (
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Direct Channel to Institution</h4>
                  <p className="text-[11px] text-slate-500">
                    Submit complaints, suggestions, or facility requests anonymously or named.
                  </p>
                </div>
                <button
                  onClick={onOpenFeedbackModal}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs shrink-0"
                >
                  + New Feedback
                </button>
              </div>

              {feedbackList.map((fb) => (
                <div
                  key={fb.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">
                      {fb.category} • {fb.author_display_name || 'Student'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        fb.status === 'Implemented'
                          ? 'bg-emerald-100 text-emerald-800'
                          : fb.status === 'Reviewing'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {fb.status}
                    </span>
                  </div>

                  <h4 className="font-black text-slate-900 text-sm">{fb.subject}</h4>
                  <p className="text-slate-600 leading-relaxed">{fb.message}</p>

                  {fb.admin_reply && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 mt-2">
                      <span className="font-bold text-slate-900 block mb-0.5">Admin Response:</span>
                      {fb.admin_reply}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
