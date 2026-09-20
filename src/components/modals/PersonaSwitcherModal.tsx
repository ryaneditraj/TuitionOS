'use client';

import React, { useState } from 'react';
import { X, Check, Shield, GraduationCap, Users, LogIn, LogOut, Loader2, Sparkles } from 'lucide-react';
import { User } from '@/lib/types';

interface PersonaSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChanged: () => void;
}

const PERSONAS = [
  {
    id: 'user-ryan',
    name: 'Ryan Thomas',
    role: 'student',
    roleLabel: 'Student',
    tag: 'Class 12 CBSE • Batch A',
    email: 'ryan@trinity.edu',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    description: 'Experience Trinity One as a student with today’s schedule, pending homework, and notes.',
  },
  {
    id: 'user-arun',
    name: 'Arun Nair',
    role: 'student',
    roleLabel: 'Student',
    tag: 'Class 12 CBSE • Batch A',
    email: 'arun@trinity.edu',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150',
    description: 'Peer student in the same batch with separate task submission history.',
  },
  {
    id: 'user-t-priya',
    name: 'Priya Sharma',
    role: 'teacher',
    roleLabel: 'Senior Physics Faculty',
    tag: 'Faculty • Physics',
    email: 'priya@trinity.edu',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    description: 'Assign tasks, mark session attendance, upload board photos & notes.',
  },
  {
    id: 'user-badmin',
    name: 'Rajesh Kumar',
    role: 'batch_admin',
    roleLabel: 'Batch Admin',
    tag: 'Admin • Class 12 & 11 Batch A',
    email: 'rajesh@trinity.edu',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    description: 'Manages schedules, announcements and tasks for assigned batches.',
  },
  {
    id: 'user-admin',
    name: 'Dr. Vikram Trinity',
    role: 'super_admin',
    roleLabel: 'Super Admin',
    tag: 'Institution Director • Full Access',
    email: 'admin@trinity.edu',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    description: 'Full institutional control across all batches, conflict detection, feedback & moderation.',
  },
];

export default function PersonaSwitcherModal({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
}: PersonaSwitcherModalProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isCustomLogin, setIsCustomLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSelectPersona = async (personaId: string) => {
    setLoadingId(personaId);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/switch-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: personaId }),
      });
      if (!res.ok) throw new Error('Failed to switch persona');
      onUserChanged();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingId('custom');
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onUserChanged();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleLogout = async () => {
    setLoadingId('logout');
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      onUserChanged();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Demo Persona Switcher</h2>
              <p className="text-xs text-slate-500">Test different institution roles instantly</p>
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
          <div className="p-3 bg-rose-50 text-rose-700 text-xs font-medium border-b border-rose-100">
            {errorMsg}
          </div>
        )}

        {!isCustomLogin ? (
          <div className="p-4 space-y-2.5 max-h-[70vh] overflow-y-auto">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              Select an account to preview
            </p>

            {PERSONAS.map((persona) => {
              const isActive = currentUser?.id === persona.id;
              const isLoading = loadingId === persona.id;

              return (
                <button
                  key={persona.id}
                  disabled={isLoading}
                  onClick={() => handleSelectPersona(persona.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 relative ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <img
                    src={persona.avatar}
                    alt={persona.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 mt-0.5"
                  />
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{persona.name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        persona.role === 'student' ? 'bg-blue-100 text-blue-700' :
                        persona.role === 'teacher' ? 'bg-amber-100 text-amber-800' :
                        persona.role === 'batch_admin' ? 'bg-purple-100 text-purple-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {persona.roleLabel}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-700 font-medium mt-0.5">{persona.tag}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{persona.description}</p>
                  </div>

                  {isActive && (
                    <div className="absolute right-3 top-3.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                  )}

                  {isLoading && (
                    <div className="absolute right-3 top-3.5 shrink-0">
                      <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                    </div>
                  )}
                </button>
              );
            })}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsCustomLogin(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in with password
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loadingId === 'logout'}
                className="text-xs font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Log out
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCustomLogin} className="p-5 space-y-4">
            <p className="text-xs text-slate-500">
              Sign in with institutional credentials. Password for demo accounts is <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">trinity123</code>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ryan@trinity.edu"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCustomLogin(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to Personas
              </button>
              <button
                type="submit"
                disabled={loadingId === 'custom'}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                {loadingId === 'custom' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
