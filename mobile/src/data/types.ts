import type { Localized } from '../i18n';

export type Role = 'student' | 'parent' | 'instructor';
export type System = 'thanaweya' | 'bac';
export type Mode = 'inPerson' | 'online';
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';
export type AssessmentKind = 'homework' | 'quiz' | 'exam';
export type PayMethod = 'instapay' | 'wallet' | 'kiosk' | 'card' | 'cash';

export type Instructor = {
  id: string;
  name: Localized;
  handle: string;
  subject: Localized;
  bio: Localized;
  years: number;
  studentsThisYear: number;
  phone: string;
  hue: string;
};

export type Course = {
  id: string;
  instructorId: string;
  title: Localized;
  grade: 10 | 11 | 12;
  system: System;
  track: Localized;
  price: number; // EGP per month
  startsOn: Date;
  pitch: Localized;
};

export type Group = {
  id: string;
  courseId: string;
  days: number[]; // 0 = Sunday
  hour: number;
  minute: number;
  durationMin: number;
  mode: Mode;
  place?: Localized;
  area?: Localized;
  capacity: number;
  recordings: boolean;
};

export type Session = {
  id: string;
  groupId: string;
  courseId: string;
  start: Date;
  end: Date;
  topic: Localized;
};

export type Assessment = {
  id: string;
  courseId: string;
  kind: AssessmentKind;
  title: Localized;
  due: Date;
  max: number;
  hasAnswerKey: boolean;
};

export type Submission = {
  assessmentId: string;
  childId: string;
  status: 'pending' | 'submitted' | 'graded';
  score?: number;
  submittedAt?: Date;
  feedback?: Localized;
  answer?: string;
};

export type ScorePoint = { title: Localized; pct: number; date: Date };

export type Child = {
  id: string;
  name: Localized;
  grade: 10 | 11 | 12;
  groupIds: string[];
  rosterId: string; // the same person as seen in the instructor's roster
  history: Record<string, ScorePoint[]>; // by courseId
};

export type Invoice = {
  id: string;
  childId: string;
  courseId: string;
  month: number; // 0-11
  year: number;
  amount: number;
  dueDate: Date;
  status: 'paid' | 'due' | 'overdue';
  paidVia?: PayMethod;
  paidAt?: Date;
};

export type Material = { id: string; courseId: string; title: Localized; pages: number };

export type RosterStudent = {
  id: string;
  name: Localized;
  groupId: string;
  phone: string;
  parentName: Localized;
  parentPhone: string;
  attendance: number; // 0..1
  scores: number[]; // recent percents, oldest first
  paidThisMonth: boolean;
  absentStreak: number;
};

export type ChatMessage = {
  id: string;
  from: 'me' | 'bot' | 'instructor';
  text: string | Localized;
  at: Date;
};

export type Handoff = {
  id: string;
  who: Localized;
  aboutStudentId: string;
  question: Localized;
  at: Date;
  channel: 'whatsapp' | 'app';
  reply?: string;
};

export type SentAlert = {
  id: string;
  kind: 'reminder' | 'absence' | 'payment' | 'brief';
  text: Localized;
  count: number;
  at: Date;
};
