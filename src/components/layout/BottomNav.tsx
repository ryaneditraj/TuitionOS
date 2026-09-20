'use client';

import React from 'react';
import { Home, Calendar, BookOpen, CheckSquare, MessageSquare, User, ShieldCheck } from 'lucide-react';
import { UserRole } from '@/lib/types';

export type TabType = 'home' | 'schedule' | 'learning' | 'my-work' | 'community' | 'profile' | 'admin';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  role?: UserRole;
  overdueTasksCount?: number;
  unreadAnnouncementsCount?: number;
}

export default function BottomNav({
  currentTab,
  onChangeTab,
  role = 'student',
  overdueTasksCount = 0,
  unreadAnnouncementsCount = 0,
}: BottomNavProps) {
  const isAdmin = role === 'super_admin' || role === 'batch_admin';

  const navItems = [
    {
      id: 'home' as TabType,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'schedule' as TabType,
      label: 'Schedule',
      icon: Calendar,
    },
    {
      id: 'learning' as TabType,
      label: 'Learning',
      icon: BookOpen,
    },
    {
      id: 'my-work' as TabType,
      label: isAdmin ? 'Tasks' : 'My Work',
      icon: CheckSquare,
      badge: overdueTasksCount > 0 ? overdueTasksCount : undefined,
      badgeColor: 'bg-rose-500',
    },
    {
      id: 'community' as TabType,
      label: 'Community',
      icon: MessageSquare,
      badge: unreadAnnouncementsCount > 0 ? unreadAnnouncementsCount : undefined,
      badgeColor: 'bg-indigo-600',
    },
    {
      id: isAdmin ? ('admin' as TabType) : ('profile' as TabType),
      label: isAdmin ? 'Admin' : 'Profile',
      icon: isAdmin ? ShieldCheck : User,
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 pb-safe">
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all relative ${
                isActive ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-700 font-medium'
              }`}
            >
              <div className="relative">
                <div
                  className={`w-10 h-7 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 text-[10px] font-bold text-white px-1.5 py-0.2 rounded-full ring-2 ring-white ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
