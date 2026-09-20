'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, Calendar, Image as ImageIcon, CheckSquare, GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import { formatTime12, formatDateLabel } from '@/lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession?: (id: string) => void;
  onSelectTask?: (id: string) => void;
  onSelectPhoto?: (url: string, title: string) => void;
}

export default function SearchModal({
  isOpen,
  onClose,
  onSelectSession,
  onSelectTask,
  onSelectPhoto,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, sessions, topics, tasks, exams..."
            className="w-full text-base bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />}
          {query && !loading && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            Esc
          </button>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-4 space-y-5 flex-1">
          {!query && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">Quick Global Search</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Type anything like &ldquo;Electrostatics&rdquo;, &ldquo;Physics&rdquo;, &ldquo;Calculus&rdquo; or &ldquo;Unit Test&rdquo;
              </p>
            </div>
          )}

          {query && !loading && results && Object.values(results).every((arr: any) => arr.length === 0) && (
            <div className="text-center py-8">
              <p className="text-sm font-medium text-slate-600">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for subject names or topics</p>
            </div>
          )}

          {/* Sessions */}
          {results?.sessions?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Class Sessions</span>
              </div>
              <div className="space-y-1.5">
                {results.sessions.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectSession?.(item.id);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group border border-transparent hover:border-slate-100"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.subject_color || '#4F46E5' }}
                        />
                        <span className="text-xs font-medium text-slate-500">{item.subject_name || item.session_type}</span>
                        <span className="text-xs text-slate-400">• {formatDateLabel(item.date)} {formatTime12(item.start_time)}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5 line-clamp-1">{item.title}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Materials / Notes */}
          {results?.materials?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Class Notes & Resources</span>
              </div>
              <div className="space-y-1.5">
                {results.materials.map((item: any) => (
                  <a
                    key={item.id}
                    href={item.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group border border-transparent hover:border-slate-100"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.subject_color || '#4F46E5' }}
                        />
                        <span className="text-xs font-medium text-slate-500">{item.subject_name}</span>
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                          {item.file_type}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5 line-clamp-1">{item.title}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Board Photos */}
          {results?.photos?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Board Photos</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {results.photos.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectPhoto?.(item.photo_url, item.title);
                      onClose();
                    }}
                    className="text-left rounded-xl border border-slate-100 overflow-hidden hover:border-indigo-200 transition-all group bg-slate-50"
                  >
                    <div className="h-20 w-full overflow-hidden bg-slate-200">
                      <img
                        src={item.photo_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold text-slate-800 line-clamp-1">{item.title}</p>
                      <p className="text-[10px] text-slate-500">{item.subject_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {results?.tasks?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Academic Tasks</span>
              </div>
              <div className="space-y-1.5">
                {results.tasks.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTask?.(item.id);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group border border-transparent hover:border-slate-100"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">{item.subject_name}</span>
                        <span className="text-xs text-rose-600 font-medium">Due {formatDateLabel(item.due_date)}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5 line-clamp-1">{item.title}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Exams */}
          {results?.exams?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Exams</span>
              </div>
              <div className="space-y-1.5">
                {results.exams.map((item: any) => (
                  <div
                    key={item.id}
                    className="w-full text-left p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-rose-700">{item.exam_type}</span>
                        <span className="text-xs text-slate-500">• {formatDateLabel(item.date)}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
