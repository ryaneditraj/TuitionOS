# Trinity One — Digital Operating System for Trinity Educational Institutions

Trinity One is a production-ready, consumer-grade, mobile-first web application designed as the central digital operating system for **Trinity Educational Institutions**.

Unlike outdated school ERPs filled with cluttered tables and confusing forms, Trinity One feels like a modern consumer productivity app (inspired by Linear, Notion, and Things 3). When a student opens Trinity One on their phone (designed for ~390×844 screens and responsive on tablet/desktop), they immediately understand what they need to do today.

---

## 🌟 Key Features

### 1. Student Home Dashboard
- **Instant Clarity**: Answers in seconds: *What classes do I have today? What work do I need to complete? What is due soon? What exams are coming? What has recently changed?*
- **Today's Schedule Timeline**: Shows every period (Class, Practice, Study Hall, Idle) with time, subject, room, teacher, and topic.
- **Priority "My Work"**: 🔴 Overdue items, 🟠 Due Today, and Upcoming tasks with one-tap completion and celebration confetti.
- **Upcoming Exam Card**: Real-time countdown to the next scheduled exam with syllabus and instructions.
- **Recent Updates**: Direct feed of newly uploaded lecture notes and urgent announcements.
- **Attendance Glance**: Immediate visibility into personal attendance percentage (e.g. 94%).

### 2. Schedule Engine & Server-Side Conflict Detection
- **Explicit Period Types**: `CLASS`, `PRACTICE`, `STUDY`, `EXAM`, `EVENT`, `HOLIDAY`, and `IDLE`. Empty periods are never left unmanaged.
- **Triple Conflict Detection** (enforced server-side):
  1. *Batch Overlap*: A batch cannot have two classes at the same time.
  2. *Teacher Overlap*: A teacher cannot be booked in two sessions simultaneously.
  3. *Room Overlap*: A room cannot be occupied by two sessions at the same time.
  - Generates clear, human-readable warnings:
    `"Scheduling conflict: Class 12 CBSE Batch A already has Physics from 16:00–17:00."`
- **Recurring Schedules**: Schedule recurring classes (e.g., Every Monday & Wednesday until Dec 31) with per-session modification/cancellation support.

### 3. Digital Classroom, Notes & Board Photos
- **Digital Session History**: Every lecture has an archive with topic breakdown, lecture notes, board photos, and homework.
- **Visual Board Photo Gallery**: Whiteboard captures displayed in an image gallery (no ugly file names). Tap opens a lightbox viewer with zoom, swipe, full-res download, and admin deletion controls.
- **Materials Library**: Filter by subject (Physics, Chemistry, Mathematics, Biology) and search across all PDFs, PPTs, documents, and resources.
- **Past Question Papers**: Download past board exams (e.g. CBSE 2025 Physics and Mathematics) with solutions.

### 4. Academic Tasks / Homework System
- **Batch Assignment**: Assign tasks to an entire batch in 1 click without manually picking 40 individual students.
- **Independent Student Tracking**: Each student has their own status (`To Do`, `In Progress`, `Completed`) and submission record.
- **Automatic Overdue Calculation**: If incomplete and deadline passed, automatically tagged `🔴 OVERDUE`.
- **Student Submissions**: Students can write notes, upload files, and mark tasks completed with celebration confetti.
- **Teacher Review**: Faculty view real-time submission statistics (`X/Y completed`).

### 5. Session-Based Attendance & Separate Test Attendance
- **Session Attendance**: Quick roster with "Mark all present", 1-tap status cycling (Present, Absent, Late, Excused), and historical editing.
- **Student Privacy**: Students can only view their own attendance records and percentages—never other students' attendance.
- **Distinct Test Attendance**: Test attendance is tracked independently from regular class attendance, with support for marks obtained.

### 6. Feedback, Community & 1-Tap Problem Reporting
- **Community Suggestions**: Students post proposals (e.g., *"Can we have a Physics revision class on Gauss's Law?"*), peer upvoting, and administrative replies (*"Added for Saturday."*).
- **Dual-Mode Feedback**: Submit feedback as **Named** or **Anonymous**. When Anonymous is selected, student ID and name are stripped from the record.
- **Quick Problem Reporting**: 1-tap issue reporter for wrong class timing, missing notes, attendance mistake, broken link, or app issue.

### 7. Institutional Admin Dashboard
- Overview metrics: Today's classes, attendance rate, total students, pending tasks, upcoming exams.
- Quick actions: Schedule Class, Assign Task, Upload Notes, Mark Attendance, Post Announcement, Create Event.

### 8. Global Search (⌘K / Ctrl+K)
- Search across sessions, notes, board photos, tasks, exams, question papers, and events simultaneously.

---

## 👥 Demo Personas & Instant Switcher

Trinity One includes a built-in **Demo Persona Switcher** in the top navigation bar. You can test any role with a single click:

| Role | Name | Email | Password | Details |
|---|---|---|---|---|
| **Student** | Ryan Thomas | `ryan@trinity.edu` | `trinity123` | Class 12 CBSE Batch A (94% Attendance) |
| **Student** | Arun Nair | `arun@trinity.edu` | `trinity123` | Class 12 CBSE Batch A |
| **Faculty** | Priya Sharma | `priya@trinity.edu` | `trinity123` | Senior Physics Faculty |
| **Batch Admin** | Rajesh Kumar | `rajesh@trinity.edu` | `trinity123` | Admin for Class 12 & 11 Batch A |
| **Super Admin** | Dr. Vikram Trinity | `admin@trinity.edu` | `trinity123` | Institutional Director (Full Access) |

---

## 🏗️ Technology Stack & Architecture

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom consumer-app tokens
- **Icons**: Lucide Icons
- **Database**:
  - Embedded high-performance SQLite via `better-sqlite3` with WAL mode & foreign keys.
  - Production PostgreSQL & Supabase schema provided in `supabase-schema.sql` with full Row Level Security (RLS) policies and storage buckets.
- **Authentication**: Signed JWT session cookies (`jose`), password hashing (`bcryptjs`), and server-side RBAC authorization.
- **Storage**: Multi-bucket file storage (`/public/uploads/` with subfolders for `class-notes`, `board-photos`, `question-papers`, `task-submissions`, `task-attachments`, `event-photos`).

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Build application
npm run build

# 3. Start production server
npm start -H 0.0.0.0 -p 3000
```

Access the app at `http://localhost:3000`.
Use keyboard shortcut `⌘K` or `Ctrl+K` to search anything instantly.
