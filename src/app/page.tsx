'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import BottomNav, { TabType } from '@/components/layout/BottomNav';
import HomeView from '@/components/views/HomeView';
import ScheduleView from '@/components/views/ScheduleView';
import LearningView from '@/components/views/LearningView';
import MyWorkView from '@/components/views/MyWorkView';
import CommunityView from '@/components/views/CommunityView';
import ProfileView from '@/components/views/ProfileView';
import AdminDashboardView from '@/components/views/AdminDashboardView';

import SearchModal from '@/components/modals/SearchModal';
import PersonaSwitcherModal from '@/components/modals/PersonaSwitcherModal';
import LightboxModal from '@/components/modals/LightboxModal';
import ScheduleClassModal from '@/components/modals/ScheduleClassModal';
import MarkAttendanceModal from '@/components/modals/MarkAttendanceModal';
import AssignTaskModal from '@/components/modals/AssignTaskModal';
import UploadMaterialModal from '@/components/modals/UploadMaterialModal';
import ProblemReportModal from '@/components/modals/ProblemReportModal';
import FeedbackModal from '@/components/modals/FeedbackModal';

import { User, StudentProfile, TeacherProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | undefined>(undefined);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | undefined>(undefined);
  const [loadingUser, setLoadingUser] = useState(true);

  // Active view tab
  const [currentTab, setCurrentTab] = useState<TabType>('home');

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState('2026-09-20');

  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [attendanceSessionId, setAttendanceSessionId] = useState('');

  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadDefaultType, setUploadDefaultType] = useState<'material' | 'photo'>('material');

  const [isProblemOpen, setIsProblemOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Lightbox
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<any[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Counts
  const [overdueCount, setOverdueCount] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch Current User
  useEffect(() => {
    loadCurrentUser();
  }, [refreshTrigger]);

  const loadCurrentUser = async () => {
    setLoadingUser(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setCurrentUser(data.user || null);
      setStudentProfile(data.student);
      setTeacherProfile(data.teacher);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUser(false);
    }
  };

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenPhotoLightbox = (photos: any[], index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const handleOpenAttendance = (sessionId?: string) => {
    if (sessionId) {
      setAttendanceSessionId(sessionId);
    } else {
      setAttendanceSessionId('sess-today-1');
    }
    setIsAttendanceOpen(true);
  };

  const handleOpenSchedule = (dateStr?: string) => {
    if (dateStr) setSelectedScheduleDate(dateStr);
    setIsScheduleOpen(true);
  };

  const handleOpenUpload = (type: 'material' | 'photo' = 'material') => {
    setUploadDefaultType(type);
    setIsUploadOpen(true);
  };

  const handleUserChanged = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        user={currentUser}
        student={studentProfile}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenPersonaModal={() => setIsPersonaOpen(true)}
        onOpenProblemModal={() => setIsProblemOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-4 pb-20">
        {loadingUser ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading Trinity One...</p>
          </div>
        ) : (
          <>
            {currentTab === 'home' && (
              <HomeView
                user={currentUser}
                student={studentProfile}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onOpenSessionModal={handleOpenAttendance}
              />
            )}

            {currentTab === 'schedule' && (
              <ScheduleView
                user={currentUser}
                student={studentProfile}
                onOpenScheduleModal={handleOpenSchedule}
                onOpenAttendanceModal={handleOpenAttendance}
              />
            )}

            {currentTab === 'learning' && (
              <LearningView
                user={currentUser}
                student={studentProfile}
                onOpenUploadModal={handleOpenUpload}
                onOpenPhotoLightbox={handleOpenPhotoLightbox}
              />
            )}

            {currentTab === 'my-work' && (
              <MyWorkView
                user={currentUser}
                student={studentProfile}
                onOpenAssignModal={() => setIsAssignTaskOpen(true)}
              />
            )}

            {currentTab === 'community' && (
              <CommunityView
                user={currentUser}
                student={studentProfile}
                onOpenFeedbackModal={() => setIsFeedbackOpen(true)}
                onOpenProblemModal={() => setIsProblemOpen(true)}
              />
            )}

            {currentTab === 'profile' && (
              <ProfileView
                user={currentUser}
                student={studentProfile}
                onOpenPersonaModal={() => setIsPersonaOpen(true)}
                onLogout={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  handleUserChanged();
                }}
              />
            )}

            {currentTab === 'admin' && (
              <AdminDashboardView
                user={currentUser}
                onOpenScheduleModal={() => handleOpenSchedule()}
                onOpenAssignModal={() => setIsAssignTaskOpen(true)}
                onOpenUploadModal={() => handleOpenUpload('material')}
                onOpenAttendanceModal={handleOpenAttendance}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Floating Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onChangeTab={(tab) => setCurrentTab(tab)}
        role={currentUser?.role}
        overdueTasksCount={overdueCount}
      />

      {/* ALL INTERACTIVE MODALS */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSession={() => setCurrentTab('schedule')}
        onSelectTask={() => setCurrentTab('my-work')}
        onSelectPhoto={(url, title) => handleOpenPhotoLightbox([{ photo_url: url, title }], 0)}
      />

      <PersonaSwitcherModal
        isOpen={isPersonaOpen}
        onClose={() => setIsPersonaOpen(false)}
        currentUser={currentUser}
        onUserChanged={handleUserChanged}
      />

      <LightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        photos={lightboxPhotos}
        initialIndex={lightboxIndex}
        canDelete={currentUser?.role === 'super_admin' || currentUser?.role === 'batch_admin'}
        onDelete={async (id) => {
          await fetch(`/api/photos?id=${id}`, { method: 'DELETE' });
          handleUserChanged();
        }}
      />

      <ScheduleClassModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        initialDate={selectedScheduleDate}
        onSuccess={() => handleUserChanged()}
      />

      <MarkAttendanceModal
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
        sessionId={attendanceSessionId}
        onSuccess={() => handleUserChanged()}
      />

      <AssignTaskModal
        isOpen={isAssignTaskOpen}
        onClose={() => setIsAssignTaskOpen(false)}
        onSuccess={() => handleUserChanged()}
      />

      <UploadMaterialModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        defaultType={uploadDefaultType}
        onSuccess={() => handleUserChanged()}
      />

      <ProblemReportModal
        isOpen={isProblemOpen}
        onClose={() => setIsProblemOpen(false)}
        onSuccess={() => handleUserChanged()}
      />

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSuccess={() => handleUserChanged()}
      />
    </div>
  );
}
