'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Image as ImageIcon,
  FileText,
  GraduationCap,
  Download,
  ExternalLink,
  Plus,
  Filter,
  Search,
  Eye,
  Calendar,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { formatTime12, formatDateLabel } from '@/lib/utils';
import { User, StudentProfile } from '@/lib/types';

interface LearningViewProps {
  user: User | null;
  student?: StudentProfile;
  onOpenUploadModal: (defaultType?: 'material' | 'photo') => void;
  onOpenPhotoLightbox: (photos: any[], initialIndex: number) => void;
}

type SubTab = 'notes' | 'sessions' | 'photos' | 'papers' | 'exams';

export default function LearningView({
  user,
  student,
  onOpenUploadModal,
  onOpenPhotoLightbox,
}: LearningViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('notes');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [notes, setNotes] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const canUpload = user?.role === 'super_admin' || user?.role === 'batch_admin' || user?.role === 'teacher';

  const SUBJECTS = [
    { id: 'ALL', name: 'All Subjects' },
    { id: 'sub-phy', name: 'Physics' },
    { id: 'sub-chem', name: 'Chemistry' },
    { id: 'sub-math', name: 'Maths' },
    { id: 'sub-bio', name: 'Biology' },
  ];

  useEffect(() => {
    loadLearningData();
  }, [activeSubTab, subjectFilter]);

  const loadLearningData = async () => {
    setLoading(true);
    try {
      const subjParam = subjectFilter !== 'ALL' ? `?subjectId=${subjectFilter}` : '';

      if (activeSubTab === 'notes') {
        const res = await fetch(`/api/materials${subjParam}`);
        const data = await res.json();
        setNotes(data.materials || []);
      } else if (activeSubTab === 'photos') {
        const res = await fetch(`/api/photos${subjParam}`);
        const data = await res.json();
        setPhotos(data.photos || []);
      } else if (activeSubTab === 'sessions') {
        const res = await fetch(`/api/schedule${subjParam}`);
        const data = await res.json();
        setSessions(data.sessions || []);
      } else if (activeSubTab === 'papers') {
        const res = await fetch(`/api/question-papers${subjParam}`);
        const data = await res.json();
        setPapers(data.papers || []);
      } else if (activeSubTab === 'exams') {
        const res = await fetch(`/api/exams${subjParam}`);
        const data = await res.json();
        setExams(data.exams || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter((n) =>
    searchQuery ? n.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const filteredPhotos = photos.filter((p) =>
    searchQuery ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const filteredSessions = sessions.filter((s) =>
    searchQuery ? (s.topic || '').toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const filteredPapers = papers.filter((qp) =>
    searchQuery ? qp.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const filteredExams = exams.filter((e) =>
    searchQuery ? e.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Academic Learning</h2>
            <p className="text-xs text-slate-500">Class notes, board photos, archives & exam papers</p>
          </div>

          {canUpload && (
            <button
              onClick={() => onOpenUploadModal(activeSubTab === 'photos' ? 'photo' : 'material')}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Upload</span>
            </button>
          )}
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'notes', label: 'Notes', icon: FileText },
            { id: 'photos', label: 'Board Photos', icon: ImageIcon },
            { id: 'sessions', label: 'Sessions', icon: Layers },
            { id: 'papers', label: 'Past Papers', icon: BookOpen },
            { id: 'exams', label: 'Exams', icon: GraduationCap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as SubTab)}
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

        {/* Search & Subject Filter Pills */}
        <div className="space-y-2 pt-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${activeSubTab}...`}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {SUBJECTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSubjectFilter(s.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  subjectFilter === s.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading academic materials...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: NOTES & MATERIALS */}
          {activeSubTab === 'notes' && (
            <div className="space-y-2.5">
              {filteredNotes.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No notes uploaded yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">Faculty notes will appear here once shared.</p>
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-indigo-200 transition-all shadow-xs flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-xs uppercase">
                        {note.file_type}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="text-[10px] font-bold px-2 py-0.2 rounded-full text-white"
                            style={{ backgroundColor: note.subject_color || '#4F46E5' }}
                          >
                            {note.subject_name}
                          </span>
                          <span className="text-[10px] text-slate-400">• {note.file_size || '2.4 MB'}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {note.title}
                        </h4>
                        {note.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {note.description}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">
                          Uploaded by {note.uploader_name || 'Faculty'}
                        </p>
                      </div>
                    </div>

                    <a
                      href={note.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 transition-colors shrink-0"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: BOARD PHOTOS GALLERY */}
          {activeSubTab === 'photos' && (
            <div>
              {filteredPhotos.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80">
                  <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No board photos uploaded yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">Whiteboard captures will show up here after class.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredPhotos.map((photo, index) => (
                    <div
                      key={photo.id}
                      onClick={() => onOpenPhotoLightbox(filteredPhotos, index)}
                      className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="aspect-4/3 w-full bg-slate-100 overflow-hidden relative">
                        <img
                          src={photo.photo_url}
                          alt={photo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white drop-shadow-md" />
                        </div>
                      </div>

                      <div className="p-2.5">
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.2 rounded text-white inline-block mb-1"
                          style={{ backgroundColor: photo.subject_color || '#4F46E5' }}
                        >
                          {photo.subject_name}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{photo.title}</h4>
                        {photo.caption && (
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                            {photo.caption}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DIGITAL CLASS SESSIONS */}
          {activeSubTab === 'sessions' && (
            <div className="space-y-2.5">
              {filteredSessions.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80">
                  <p className="text-sm font-bold text-slate-700">No sessions match search</p>
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: session.subject?.color || '#cbd5e1' }}
                        />
                        <span className="text-xs font-bold text-slate-900">{session.subject?.name}</span>
                        <span className="text-xs text-slate-400">• {formatDateLabel(session.date)}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {formatTime12(session.start_time)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{session.topic || 'Class Lecture'}</h4>

                    {session.notes_summary && (
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {session.notes_summary}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>{session.teacher?.full_name || 'Faculty'}</span>
                      <span className="text-indigo-600 font-bold hover:underline cursor-pointer">
                        View digital record →
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: PAST QUESTION PAPERS */}
          {activeSubTab === 'papers' && (
            <div className="space-y-2.5">
              {filteredPapers.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80">
                  <p className="text-sm font-bold text-slate-700">No question papers archived yet</p>
                </div>
              ) : (
                filteredPapers.map((qp) => (
                  <div
                    key={qp.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-indigo-200 transition-all shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                          {qp.year} Board Paper
                        </span>
                        <span className="text-xs font-bold text-slate-500">{qp.subject_name}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate">{qp.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{qp.file_size || '3.5 MB'}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={qp.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: EXAMS */}
          {activeSubTab === 'exams' && (
            <div className="space-y-3">
              {filteredExams.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80">
                  <p className="text-sm font-bold text-slate-700">No exams scheduled 🎉</p>
                </div>
              ) : (
                filteredExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        {exam.exam_type}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        Max Marks: {exam.max_marks}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-slate-900">{exam.title}</h4>
                      <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                        {exam.subject?.name} • 📅 {formatDateLabel(exam.date)} ({formatTime12(exam.start_time)}–{formatTime12(exam.end_time)})
                      </p>
                    </div>

                    {exam.syllabus && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700">
                        <span className="font-bold block text-slate-900 mb-0.5">Syllabus:</span>
                        {exam.syllabus}
                      </div>
                    )}

                    {exam.instructions && (
                      <p className="text-[11px] text-slate-500 italic">
                        ⚠️ Instructions: {exam.instructions}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
