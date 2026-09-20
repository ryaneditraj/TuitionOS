import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

export function seedDatabase(db: Database.Database) {
  console.log('Seeding Trinity One database...');

  const passwordHash = bcrypt.hashSync('trinity123', 10);
  const now = '2026-09-20T08:00:00Z';

  // 1. Institution
  db.prepare(`
    INSERT OR REPLACE INTO institutions (id, name, code, logo_url, address, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    'inst-trinity',
    'Trinity Educational Institutions',
    'TEI',
    '/logo.png',
    'Trinity Campus, Civil Lines, Kochi, Kerala 682001',
    '+91 98470 12345'
  );

  // 2. Academic Year
  db.prepare(`
    INSERT OR REPLACE INTO academic_years (id, institution_id, name, start_date, end_date, is_current)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('ay-2026-27', 'inst-trinity', '2026–27', '2026-06-01', '2027-03-31', 1);

  // 3. Boards
  const insertBoard = db.prepare(`
    INSERT OR REPLACE INTO boards (id, institution_id, name, description)
    VALUES (?, ?, ?, ?)
  `);
  insertBoard.run('board-cbse', 'inst-trinity', 'CBSE', 'Central Board of Secondary Education');
  insertBoard.run('board-state', 'inst-trinity', 'State Board', 'Kerala Higher Secondary Examination Board');

  // 4. Classes
  const insertClass = db.prepare(`
    INSERT OR REPLACE INTO classes (id, board_id, name, grade_number)
    VALUES (?, ?, ?, ?)
  `);
  insertClass.run('class-12-cbse', 'board-cbse', 'Class 12', 12);
  insertClass.run('class-11-cbse', 'board-cbse', 'Class 11', 11);
  insertClass.run('class-10-cbse', 'board-cbse', 'Class 10', 10);
  insertClass.run('class-12-state', 'board-state', 'Class 12', 12);

  // 5. Batches
  const insertBatch = db.prepare(`
    INSERT OR REPLACE INTO batches (id, class_id, academic_year_id, name, full_label, max_students, color_code)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertBatch.run('batch-12-cbse-a', 'class-12-cbse', 'ay-2026-27', 'Batch A', 'Class 12 CBSE Batch A', 35, '#4F46E5');
  insertBatch.run('batch-12-cbse-b', 'class-12-cbse', 'ay-2026-27', 'Batch B', 'Class 12 CBSE Batch B', 35, '#06B6D4');
  insertBatch.run('batch-11-cbse-a', 'class-11-cbse', 'ay-2026-27', 'Batch A', 'Class 11 CBSE Batch A', 40, '#10B981');
  insertBatch.run('batch-10-state-a', 'class-10-cbse', 'ay-2026-27', 'Batch A', 'Class 10 CBSE Batch A', 40, '#F59E0B');

  // 6. Subjects
  const insertSubject = db.prepare(`
    INSERT OR REPLACE INTO subjects (id, institution_id, name, code, color, icon)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertSubject.run('sub-phy', 'inst-trinity', 'Physics', 'PHY', '#6366F1', 'Atom');
  insertSubject.run('sub-chem', 'inst-trinity', 'Chemistry', 'CHEM', '#EC4899', 'FlaskConical');
  insertSubject.run('sub-math', 'inst-trinity', 'Mathematics', 'MATH', '#3B82F6', 'Calculator');
  insertSubject.run('sub-bio', 'inst-trinity', 'Biology', 'BIO', '#10B981', 'Dna');
  insertSubject.run('sub-cs', 'inst-trinity', 'Computer Science', 'CS', '#F59E0B', 'Laptop');

  // 7. Rooms
  const insertRoom = db.prepare(`
    INSERT OR REPLACE INTO rooms (id, institution_id, name, capacity)
    VALUES (?, ?, ?, ?)
  `);
  insertRoom.run('room-1', 'inst-trinity', 'Room 1 (Tesla Lab)', 40);
  insertRoom.run('room-2', 'inst-trinity', 'Room 2 (Newton Hall)', 45);
  insertRoom.run('room-3', 'inst-trinity', 'Room 3 (Curie Room)', 35);
  insertRoom.run('room-4', 'inst-trinity', 'Room 4 (Ramanujan Hall)', 50);

  // 8. Users
  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, email, password_hash, full_name, role, avatar_url, phone, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Super Admin
  insertUser.run('user-admin', 'admin@trinity.edu', passwordHash, 'Dr. Vikram Trinity', 'super_admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '+91 98470 00001', now);

  // Batch Admin
  insertUser.run('user-badmin', 'rajesh@trinity.edu', passwordHash, 'Rajesh Kumar', 'batch_admin', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '+91 98470 00002', now);
  db.prepare(`INSERT OR REPLACE INTO batch_admins (user_id, batch_id) VALUES (?, ?)`).run('user-badmin', 'batch-12-cbse-a');
  db.prepare(`INSERT OR REPLACE INTO batch_admins (user_id, batch_id) VALUES (?, ?)`).run('user-badmin', 'batch-11-cbse-a');

  // Teachers
  insertUser.run('user-t-priya', 'priya@trinity.edu', passwordHash, 'Priya Sharma', 'teacher', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', '+91 98470 00010', now);
  insertUser.run('user-t-amit', 'amit@trinity.edu', passwordHash, 'Dr. Amit Verma', 'teacher', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', '+91 98470 00011', now);
  insertUser.run('user-t-sarah', 'sarah@trinity.edu', passwordHash, 'Sarah Mathew', 'teacher', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', '+91 98470 00012', now);

  const insertTeacher = db.prepare(`
    INSERT OR REPLACE INTO teachers (id, user_id, title, specialization)
    VALUES (?, ?, ?, ?)
  `);
  insertTeacher.run('t-priya', 'user-t-priya', 'Senior Physics Faculty', 'Electromagnetism, Optics & Modern Physics');
  insertTeacher.run('t-amit', 'user-t-amit', 'Head of Chemistry', 'Organic Chemistry & Reaction Mechanisms');
  insertTeacher.run('t-sarah', 'user-t-sarah', 'Senior Mathematics Specialist', 'Calculus, Probability & 3D Geometry');

  const insertTeacherSubject = db.prepare(`INSERT OR REPLACE INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)`);
  insertTeacherSubject.run('t-priya', 'sub-phy');
  insertTeacherSubject.run('t-amit', 'sub-chem');
  insertTeacherSubject.run('t-sarah', 'sub-math');

  // Students (Batch 12 CBSE Batch A)
  const students = [
    { id: 'stud-ryan', userId: 'user-ryan', email: 'ryan@trinity.edu', name: 'Ryan Thomas', roll: '12A-01', phone: '+91 98470 11001', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150' },
    { id: 'stud-arun', userId: 'user-arun', email: 'arun@trinity.edu', name: 'Arun Nair', roll: '12A-02', phone: '+91 98470 11002', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150' },
    { id: 'stud-rahul', userId: 'user-rahul', email: 'rahul@trinity.edu', name: 'Rahul Sen', roll: '12A-03', phone: '+91 98470 11003', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150' },
    { id: 'stud-nithin', userId: 'user-nithin', email: 'nithin@trinity.edu', name: 'Nithin Varghese', roll: '12A-04', phone: '+91 98470 11004', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150' },
    { id: 'stud-ananya', userId: 'user-ananya', email: 'ananya@trinity.edu', name: 'Ananya Iyer', roll: '12A-05', phone: '+91 98470 11005', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
  ];

  const insertStudent = db.prepare(`
    INSERT OR REPLACE INTO students (id, user_id, batch_id, roll_number, guardian_name, guardian_phone, admission_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of students) {
    insertUser.run(s.userId, s.email, passwordHash, s.name, 'student', s.avatar, s.phone, now);
    insertStudent.run(s.id, s.userId, 'batch-12-cbse-a', s.roll, 'Parent of ' + s.name, '+91 98470 99999', '2026-06-05');
  }

  // 9. Schedule Sessions
  const insertSession = db.prepare(`
    INSERT OR REPLACE INTO schedule_sessions (
      id, batch_id, subject_id, teacher_id, room_id, date, start_time, end_time, session_type, status, topic, notes_summary, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // TODAY: Sep 20, 2026
  insertSession.run(
    'sess-today-1',
    'batch-12-cbse-a',
    'sub-phy',
    't-priya',
    'room-2',
    '2026-09-20',
    '16:00',
    '17:00',
    'CLASS',
    'SCHEDULED',
    'Electrostatics: Gauss’s Law & Continuous Charge Distribution',
    'We will cover flux through closed Gaussian surfaces, cylindrical charge, and infinite sheet field derivations.',
    now
  );

  insertSession.run(
    'sess-today-2',
    'batch-12-cbse-a',
    'sub-phy',
    't-priya',
    'room-2',
    '2026-09-20',
    '17:00',
    '18:00',
    'PRACTICE',
    'SCHEDULED',
    'Electrostatics Numerical Drill & NCERT Exemplar Solving',
    'Hands-on problem solving on dipole moment and electric field intensity at equatorial points.',
    now
  );

  insertSession.run(
    'sess-today-3',
    'batch-12-cbse-a',
    'sub-chem',
    't-amit',
    'room-1',
    '2026-09-20',
    '18:00',
    '19:00',
    'CLASS',
    'SCHEDULED',
    'Organic Chemistry: Alcohols, Phenols & Reaction Mechanisms',
    'Hydroboration-oxidation, Grignard additions to carbonyls, and acidity comparison between alcohols and phenols.',
    now
  );

  // YESTERDAY: Sep 19, 2026 (Completed with Attendance)
  insertSession.run(
    'sess-yest-1',
    'batch-12-cbse-a',
    'sub-math',
    't-sarah',
    'room-4',
    '2026-09-19',
    '16:00',
    '17:30',
    'CLASS',
    'COMPLETED',
    'Calculus: Derivatives & Applications to Tangents & Normals',
    'Covered parametric differentiation, slope calculations, and logarithmic differentiation.',
    now
  );

  // Yesterday Attendance record: Ryan ✓, Arun ✓, Rahul ✕, Nithin ✓, Ananya ✓
  const insertAttendance = db.prepare(`
    INSERT OR REPLACE INTO attendance (id, session_id, student_id, status, remarks, marked_by, marked_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertAttendance.run('att-y1-ryan', 'sess-yest-1', 'stud-ryan', 'PRESENT', 'Active participation', 'user-t-sarah', '2026-09-19T17:35:00Z');
  insertAttendance.run('att-y1-arun', 'sess-yest-1', 'stud-arun', 'PRESENT', 'On time', 'user-t-sarah', '2026-09-19T17:35:00Z');
  insertAttendance.run('att-y1-rahul', 'sess-yest-1', 'stud-rahul', 'ABSENT', 'Medical leave reported', 'user-t-sarah', '2026-09-19T17:35:00Z');
  insertAttendance.run('att-y1-nithin', 'sess-yest-1', 'stud-nithin', 'PRESENT', 'On time', 'user-t-sarah', '2026-09-19T17:35:00Z');
  insertAttendance.run('att-y1-ananya', 'sess-yest-1', 'stud-ananya', 'PRESENT', 'On time', 'user-t-sarah', '2026-09-19T17:35:00Z');

  // Additional historical attendance for Ryan (to reflect realistic 94% attendance: 31/33 present)
  for (let i = 1; i <= 30; i++) {
    const dStr = `2026-08-${String(i < 10 ? '0' + i : i).slice(-2)}`;
    const sId = `sess-hist-${i}`;
    insertSession.run(
      sId,
      'batch-12-cbse-a',
      i % 2 === 0 ? 'sub-phy' : 'sub-chem',
      i % 2 === 0 ? 't-priya' : 't-amit',
      'room-2',
      dStr,
      '16:00',
      '17:00',
      'CLASS',
      'COMPLETED',
      'Historical Lecture ' + i,
      'Archive summary note',
      now
    );
    insertAttendance.run(`att-hist-${i}`, sId, 'stud-ryan', i === 7 ? 'ABSENT' : 'PRESENT', i === 7 ? 'Sick' : 'Present', 'user-t-priya', `${dStr}T17:05:00Z`);
  }

  // TOMORROW: Sep 21, 2026
  insertSession.run(
    'sess-tom-1',
    'batch-12-cbse-a',
    'sub-math',
    't-sarah',
    'room-4',
    '2026-09-21',
    '16:00',
    '17:00',
    'CLASS',
    'SCHEDULED',
    'Calculus: Maxima & Minima Word Problems',
    'Second derivative test, optimization word problems from NCERT board questions.',
    now
  );

  insertSession.run(
    'sess-tom-2',
    'batch-12-cbse-a',
    null,
    null,
    'room-3',
    '2026-09-21',
    '17:00',
    '18:00',
    'STUDY',
    'SCHEDULED',
    'Supervised Self-Study & Peer Discussion',
    'Quiet study room open for individual revision and doubt preparation.',
    now
  );

  insertSession.run(
    'sess-tom-3',
    'batch-12-cbse-a',
    'sub-phy',
    't-priya',
    'room-2',
    '2026-09-21',
    '18:00',
    '19:00',
    'CLASS',
    'SCHEDULED',
    'Electrostatics: Capacitors in Series and Parallel',
    'Dielectrics breakdown and energy density in electric fields.',
    now
  );

  // 10. Academic Tasks / Homework
  const insertTask = db.prepare(`
    INSERT OR REPLACE INTO academic_tasks (
      id, title, description, subject_id, assigned_by, due_date, due_time, priority, type, attachments_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTaskAssign = db.prepare(`
    INSERT OR REPLACE INTO task_assignments (
      id, task_id, student_id, batch_id, status, submitted_at, submission_text, submission_file_url, teacher_feedback
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Task 1: Overdue (Sep 19)
  insertTask.run(
    'task-overdue-1',
    'Physics Worksheet: Electrostatics Numerical Drill',
    'Solve all 25 numerical questions on Coulomb law and electric field vectors. Show complete working steps.',
    'sub-phy',
    'user-t-priya',
    '2026-09-19',
    '20:00',
    'HIGH',
    'Worksheet',
    JSON.stringify([{ name: 'physics_worksheet_electrostatics.pdf', url: '/uploads/task-attachments/physics_worksheet_electrostatics.pdf', size: '1.2 MB' }]),
    '2026-09-17T10:00:00Z'
  );
  insertTaskAssign.run('ta-overdue-ryan', 'task-overdue-1', 'stud-ryan', 'batch-12-cbse-a', 'TODO', null, null, null, null);
  insertTaskAssign.run('ta-overdue-arun', 'task-overdue-1', 'stud-arun', 'batch-12-cbse-a', 'COMPLETED', '2026-09-19T18:00:00Z', 'Completed and verified', null, 'Good work');

  // Task 2: Due Today (Sep 20, 8:00 PM)
  insertTask.run(
    'task-today-1',
    'Chemistry NCERT: Chapter 10 Reaction Mechanisms',
    'Write complete step-by-step mechanisms for SN1 and SN2 substitutions in your tuition homework notebook.',
    'sub-chem',
    'user-t-amit',
    '2026-09-20',
    '20:00',
    'MEDIUM',
    'Practice',
    JSON.stringify([{ name: 'chemistry_ncert_solutions.pdf', url: '/uploads/task-attachments/chemistry_ncert_solutions.pdf', size: '2.1 MB' }]),
    '2026-09-18T11:00:00Z'
  );
  insertTaskAssign.run('ta-today-ryan', 'task-today-1', 'stud-ryan', 'batch-12-cbse-a', 'IN_PROGRESS', null, 'Halfway done, finishing question 12', null, null);

  // Task 3: Upcoming (Sep 23)
  insertTask.run(
    'task-up-1',
    'Maths Paper 4: Integration & Differentiability',
    'Solve CBSE sample questions on definite integrals and continuity before Wednesday.',
    'sub-math',
    'user-t-sarah',
    '2026-09-23',
    '18:00',
    'MEDIUM',
    'Question Paper',
    null,
    '2026-09-19T14:00:00Z'
  );
  insertTaskAssign.run('ta-up1-ryan', 'task-up-1', 'stud-ryan', 'batch-12-cbse-a', 'TODO', null, null, null, null);

  // Task 4: Upcoming Project (Sep 26)
  insertTask.run(
    'task-up-2',
    'Physics Practical Record: Potentiometer Verification',
    'Submit practical record book with diagrams, observations and percentage error calculations.',
    'sub-phy',
    'user-t-priya',
    '2026-09-26',
    '23:59',
    'HIGH',
    'Submission',
    null,
    '2026-09-18T09:00:00Z'
  );
  insertTaskAssign.run('ta-up2-ryan', 'task-up-2', 'stud-ryan', 'batch-12-cbse-a', 'TODO', null, null, null, null);

  // Completed Tasks for Ryan (14 completed tasks to showcase "COMPLETED: 14 tasks")
  const completedTaskTitles = [
    'Maths Calculus Basics Drill',
    'Physics Vectors & Kinematics Quick Quiz',
    'Chemistry Stoichiometry Revision Sheet',
    'Biology Cell Structure Summary',
    'Physics Electrostatics Concept Map',
    'Chemistry Mole Concept Chapter 1',
    'Maths Trigonometry Formulas Sheet',
    'Physics Dimensional Analysis Exercises',
    'Chemistry Solutions Numerical Problems',
    'Maths Matrices & Determinants Set A',
    'Physics Electric Charges & Fields Part 1',
    'Chemistry Solid State Practice Questions',
    'Maths Relations and Functions NCERT Ex 1.1',
    'Physics Coulomb Law Derivations Worksheet'
  ];

  completedTaskTitles.forEach((title, idx) => {
    const tId = `task-comp-${idx + 1}`;
    insertTask.run(
      tId,
      title,
      'Archived academic task completed successfully.',
      idx % 2 === 0 ? 'sub-phy' : 'sub-math',
      'user-t-priya',
      `2026-08-${String((idx % 25) + 1).padStart(2, '0')}`,
      '18:00',
      'LOW',
      'Worksheet',
      null,
      '2026-08-01T10:00:00Z'
    );
    insertTaskAssign.run(
      `ta-comp-ryan-${idx + 1}`,
      tId,
      'stud-ryan',
      'batch-12-cbse-a',
      'COMPLETED',
      '2026-08-15T16:00:00Z',
      'Submitted on time and approved.',
      null,
      'Excellent accuracy!'
    );
  });

  // 11. Notes & Materials
  const insertMaterial = db.prepare(`
    INSERT OR REPLACE INTO class_materials (
      id, session_id, batch_id, subject_id, uploader_id, title, description, file_name, file_url, file_type, file_size, download_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertMaterial.run(
    'mat-1',
    'sess-today-1',
    'batch-12-cbse-a',
    'sub-phy',
    'user-t-priya',
    'Electrostatics: Gauss’s Law Lecture Notes & Derivations',
    'Complete classroom handwritten notes with derivation of electric field due to infinite thin sheet and charged spherical shell.',
    'electrostatics_handwritten_notes.pdf',
    '/uploads/class-notes/electrostatics_handwritten_notes.pdf',
    'pdf',
    '3.4 MB',
    48,
    '2026-09-20T09:30:00Z'
  );

  insertMaterial.run(
    'mat-2',
    'sess-today-3',
    'batch-12-cbse-a',
    'sub-chem',
    'user-t-amit',
    'Organic Chemistry: Reaction Mechanisms & Reagents Summary',
    'Reaction pathways, electrophilic additions, Grignard reagents and acid-catalyzed hydration.',
    'organic_chemistry_reactions_summary.pdf',
    '/uploads/class-notes/organic_chemistry_reactions_summary.pdf',
    'pdf',
    '2.8 MB',
    34,
    '2026-09-19T14:15:00Z'
  );

  insertMaterial.run(
    'mat-3',
    'sess-yest-1',
    'batch-12-cbse-a',
    'sub-math',
    'user-t-sarah',
    'Calculus: Derivatives & Tangents Cheat Sheet',
    'All standard derivatives, chain rule quick lookup, and critical points theorem summary.',
    'calculus_derivatives_cheat_sheet.pdf',
    '/uploads/class-notes/calculus_derivatives_cheat_sheet.pdf',
    'pdf',
    '1.9 MB',
    52,
    '2026-09-18T16:20:00Z'
  );

  // 12. Board Photos
  const insertPhoto = db.prepare(`
    INSERT OR REPLACE INTO class_photos (
      id, session_id, batch_id, subject_id, uploader_id, title, photo_url, caption, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPhoto.run(
    'photo-1',
    'sess-today-1',
    'batch-12-cbse-a',
    'sub-phy',
    'user-t-priya',
    'Gauss Law Spherical Charge Derivation',
    '/uploads/board-photos/physics_electrostatics_board.jpg',
    'Board 1: Gaussian surface flux calculation and step-by-step vector integration.',
    '2026-09-20T10:15:00Z'
  );

  insertPhoto.run(
    'photo-2',
    'sess-today-3',
    'batch-12-cbse-a',
    'sub-chem',
    'user-t-amit',
    'Benzene Ring Electrophilic Substitution Pathway',
    '/uploads/board-photos/chemistry_organic_board.jpg',
    'Board 2: Sigma complex resonance structures and halogenation catalyst role.',
    '2026-09-19T15:30:00Z'
  );

  insertPhoto.run(
    'photo-3',
    'sess-yest-1',
    'batch-12-cbse-a',
    'sub-math',
    'user-t-sarah',
    'Calculus Area Under Curve & Integration Graph',
    '/uploads/board-photos/maths_calculus_board.jpg',
    'Board 3: Definite integral Riemann sum visualization on blackboard.',
    '2026-09-18T17:45:00Z'
  );

  // 13. Exams
  const insertExam = db.prepare(`
    INSERT OR REPLACE INTO exams (
      id, title, subject_id, batch_id, date, start_time, end_time, room_id, syllabus, instructions, exam_type, max_marks, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertExam.run(
    'exam-1',
    'Physics Unit Test 2: Electrostatics & Capacitance',
    'sub-phy',
    'batch-12-cbse-a',
    '2026-09-24',
    '16:00',
    '17:30',
    'room-2',
    'Chapters 1 & 2: Electric Charges and Fields, Electrostatic Potential and Capacitance.',
    'Calculators are not permitted. Bring blue/black ballpoint pens and geometry tools for ray/field diagrams.',
    'Unit Test',
    50,
    'UPCOMING'
  );

  insertExam.run(
    'exam-2',
    'Chemistry Term Assessment: Organic Chemistry',
    'sub-chem',
    'batch-12-cbse-a',
    '2026-10-02',
    '16:00',
    '18:00',
    'room-1',
    'Haloalkanes, Haloarenes, Alcohols, Phenols and Ethers.',
    'Includes 20 Multiple Choice Questions and 5 reasoning mechanism proofs.',
    'Term Exam',
    70,
    'UPCOMING'
  );

  insertExam.run(
    'exam-3',
    'Mathematics Mock Test: Differential Calculus',
    'sub-math',
    'batch-12-cbse-a',
    '2026-10-08',
    '16:00',
    '19:00',
    'room-4',
    'Full Differential Calculus: Continuity, Differentiability, Application of Derivatives.',
    'Strict 3-hour CBSE standard pattern with Section A through E.',
    'Mock Board Exam',
    80,
    'UPCOMING'
  );

  // Past Question Papers
  const insertQP = db.prepare(`
    INSERT OR REPLACE INTO exam_question_papers (
      id, exam_id, title, year, subject_id, class_id, file_url, solution_url, file_size, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertQP.run(
    'qp-1',
    'exam-1',
    'CBSE Class 12 Physics Board Paper 2025 (All India)',
    2025,
    'sub-phy',
    'class-12-cbse',
    '/uploads/question-papers/cbse_class12_physics_board_2025.pdf',
    '/uploads/class-notes/electrostatics_handwritten_notes.pdf',
    '4.2 MB',
    '2026-07-10T12:00:00Z'
  );

  insertQP.run(
    'qp-2',
    'exam-3',
    'CBSE Class 12 Mathematics Board Paper 2025 (Delhi Region)',
    2025,
    'sub-math',
    'class-12-cbse',
    '/uploads/question-papers/cbse_class12_maths_board_2025.pdf',
    null,
    '3.8 MB',
    '2026-07-12T14:30:00Z'
  );

  // 14. Events
  const insertEvent = db.prepare(`
    INSERT OR REPLACE INTO events (
      id, institution_id, title, description, date, start_time, end_time, location, category, photos_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEvent.run(
    'event-1',
    'inst-trinity',
    'Trinity Science Exhibition & Conclave 2026',
    'Annual inter-batch science exhibition showcasing working models in renewable energy, robotics, and applied physics. Judges from Cochin University of Science & Technology.',
    '2026-10-15',
    '09:00',
    '16:00',
    'Trinity Main Auditorium & Tesla Labs',
    'Academic',
    JSON.stringify(['/uploads/event-photos/science_exhibition.jpg']),
    '2026-09-10T10:00:00Z'
  );

  insertEvent.run(
    'event-2',
    'inst-trinity',
    'Annual Academic Excellence Awards & Felicitation Night',
    'Honoring top percentile scorers in CBSE & State Board competitive entrance prep. Keynote speech by Dr. K. Radhakrishnan, former ISRO Chairman.',
    '2026-11-20',
    '17:30',
    '21:00',
    'Trinity Grand Amphitheatre',
    'Cultural',
    JSON.stringify(['/uploads/event-photos/annual_day.jpg']),
    '2026-09-12T11:00:00Z'
  );

  // 15. Announcements
  const insertAnnouncement = db.prepare(`
    INSERT OR REPLACE INTO announcements (
      id, title, content, target_type, target_id, priority, is_pinned, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAnnouncement.run(
    'ann-1',
    'Tomorrow’s Chemistry class has moved from 4 PM to 5 PM',
    'Please take note that Dr. Amit Verma’s Chemistry lecture on Monday will begin at 5:00 PM in Room 1 instead of 4:00 PM due to a faculty meeting.',
    'BATCH',
    'batch-12-cbse-a',
    'URGENT',
    1,
    'user-badmin',
    '2026-09-20T07:15:00Z'
  );

  insertAnnouncement.run(
    'ann-2',
    'New Physics Handwritten Notes & Derivations Uploaded',
    'Priya ma’am has uploaded high-resolution handwritten notes for Electrostatics: Gauss’s Law. Access them from your Learning tab.',
    'SUBJECT',
    'sub-phy',
    'NORMAL',
    0,
    'user-t-priya',
    '2026-09-20T06:30:00Z'
  );

  insertAnnouncement.run(
    'ann-3',
    'Schedule Update: Sunday Doubt Clearing Sessions',
    'Special 2-hour doubt clearing desks are open every Sunday from 10:00 AM to 12:00 PM for Mathematics & Physics in Room 2 and Room 4.',
    'ALL',
    null,
    'NORMAL',
    0,
    'user-admin',
    '2026-09-18T15:00:00Z'
  );

  // 16. Feedback
  const insertFeedback = db.prepare(`
    INSERT OR REPLACE INTO feedback (
      id, student_id, is_anonymous, category, subject, message, status, admin_reply, replied_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertFeedback.run(
    'fb-1',
    'stud-ryan',
    0,
    'tuition',
    'Study Room Air Conditioning & Lighting',
    'The air conditioning in Room 3 (Curie Room) was making a loud rattling noise during our study session yesterday.',
    'Implemented',
    'Maintenance team serviced the unit on Saturday morning. The noise has been resolved.',
    '2026-09-19T14:00:00Z',
    '2026-09-18T12:00:00Z'
  );

  insertFeedback.run(
    'fb-2',
    null, // Anonymous
    1,
    'class',
    'More Numerical Problem Solving Time for Physics',
    'Could we allocate 15 more minutes at the end of every Physics session strictly for clearing numerical doubts?',
    'Reviewing',
    'We are introducing a dedicated 1-hour practice block right after theory classes starting this week.',
    '2026-09-20T08:30:00Z',
    '2026-09-19T17:00:00Z'
  );

  // 17. Community Posts & Upvotes
  const insertCommunity = db.prepare(`
    INSERT OR REPLACE INTO community_posts (
      id, author_id, is_anonymous, title, description, category, status, admin_response, responded_by, responded_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCommunity.run(
    'cp-1',
    'user-ryan',
    0,
    'Can we have a Physics revision class on Electrostatics Gauss’s Law?',
    'A lot of us in Batch A feel we need one more session working through tricky sphere charge and cylindrical flux problems before the Unit Test on Thursday.',
    'Class Request',
    'RESPONDED',
    'Added for Saturday 3:00 PM in Room 2 with Priya ma’am.',
    'user-admin',
    '2026-09-19T19:00:00Z',
    '2026-09-18T14:00:00Z'
  );

  insertCommunity.run(
    'cp-2',
    'user-arun',
    0,
    'Request for Chemistry NCERT Chapter 10 Reaction Conversions Session',
    'Would love a focused 1-hour session dedicated to memorizing reagents for halogen conversions.',
    'Study Group',
    'OPEN',
    null,
    null,
    null,
    '2026-09-19T16:20:00Z'
  );

  insertCommunity.run(
    'cp-3',
    'user-ananya',
    0,
    'Extend Library Study Hall Hours to 9:00 PM during Exam Week',
    'With Unit Tests starting next week, having access to quiet study tables till 9 PM would be super helpful.',
    'General Idea',
    'OPEN',
    null,
    null,
    null,
    '2026-09-20T07:10:00Z'
  );

  const insertVote = db.prepare(`INSERT OR REPLACE INTO community_votes (post_id, user_id, created_at) VALUES (?, ?, ?)`);
  // cp-1 gets 42 votes
  insertVote.run('cp-1', 'user-ryan', now);
  insertVote.run('cp-1', 'user-arun', now);
  insertVote.run('cp-1', 'user-rahul', now);
  insertVote.run('cp-1', 'user-nithin', now);
  insertVote.run('cp-1', 'user-ananya', now);

  // cp-2 gets votes
  insertVote.run('cp-2', 'user-ryan', now);
  insertVote.run('cp-2', 'user-arun', now);

  // 18. Problem Reports
  const insertProblem = db.prepare(`
    INSERT OR REPLACE INTO problem_reports (
      id, student_id, category, title, details, reference_session_id, status, resolution_notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertProblem.run(
    'prob-1',
    'stud-ryan',
    'wrong_timing',
    'Schedule says 4 PM but announcement said 5 PM',
    'Chemistry class schedule was showing 4 PM on calendar but announcement noted 5 PM.',
    'sess-today-3',
    'RESOLVED',
    'Session timing updated in system to match faculty announcement.',
    '2026-09-20T07:30:00Z'
  );

  console.log('Trinity One database seeded successfully with rich realistic data!');
}
