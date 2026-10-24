// Demo data. Everything is generated relative to the moment the app starts,
// so "next session", "due tomorrow" and "this month" always read correctly.
// Replace this module with API calls when the backend exists; screens only read through the store.

import { addDays, startOfDay } from '../lib/dates';
import type {
  Assessment,
  Child,
  Course,
  Group,
  Handoff,
  Instructor,
  Invoice,
  Material,
  RosterStudent,
  SentAlert,
  Session,
  Submission,
} from './types';

export const NOW = new Date();
const today = startOfDay(NOW);
const at = (dayOffset: number, h = 0, m = 0) => {
  const d = addDays(today, dayOffset);
  d.setHours(h, m, 0, 0);
  return d;
};

// ---------- Instructors ----------

export const instructors: Instructor[] = [
  {
    id: 'i1',
    name: { ar: 'أ. أحمد سمير', en: 'Mr. Ahmed Samir' },
    handle: 'mr-ahmed-physics',
    subject: { ar: 'فيزياء', en: 'Physics' },
    bio: {
      ar: 'مدرس فيزياء للثانوية العامة والبكالوريا. بشرح الفكرة الأول بالتجربة، وبعدين نحل لحد ما المسألة تبقى سهلة.',
      en: 'Physics for Thanaweya Amma and the Egyptian Baccalaureate. Idea first, through an experiment, then practice until the problems feel easy.',
    },
    years: 14,
    studentsThisYear: 312,
    phone: '01001234567',
    hue: '#1F4FD6',
  },
  {
    id: 'i2',
    name: { ar: 'أ. نادية فوزي', en: 'Ms. Nadia Fawzy' },
    handle: 'ms-nadia-math',
    subject: { ar: 'رياضيات', en: 'Mathematics' },
    bio: { ar: 'رياضيات بحتة وتطبيقية للصف التالت الثانوي.', en: 'Pure and applied mathematics for grade 12.' },
    years: 9,
    studentsThisYear: 188,
    phone: '01117654321',
    hue: '#12B5CB',
  },
];

/** The instructor signed in on the instructor side of the demo. */
export const ME_INSTRUCTOR = 'i1';

// ---------- Courses and groups ----------

export const courses: Course[] = [
  {
    id: 'c1',
    instructorId: 'i1',
    title: { ar: 'فيزياء تالتة ثانوي', en: 'Grade 12 Physics' },
    grade: 12,
    system: 'thanaweya',
    track: { ar: 'ثانوية عامة، علمي علوم ورياضة', en: 'Thanaweya Amma, Science and Maths' },
    price: 450,
    startsOn: at(-50),
    pitch: {
      ar: 'المنهج كله بالشرح والمسائل، وامتحان شهري بنفس نظام الوزارة.',
      en: 'The full syllabus with worked problems, and a monthly exam in the ministry format.',
    },
  },
  {
    id: 'c2',
    instructorId: 'i2',
    title: { ar: 'رياضيات تالتة ثانوي', en: 'Grade 12 Mathematics' },
    grade: 12,
    system: 'thanaweya',
    track: { ar: 'ثانوية عامة، علمي رياضة', en: 'Thanaweya Amma, Maths' },
    price: 500,
    startsOn: at(-50),
    pitch: { ar: 'تفاضل وتكامل وديناميكا.', en: 'Calculus and dynamics.' },
  },
  {
    id: 'c3',
    instructorId: 'i1',
    title: { ar: 'فيزياء تانية ثانوي — بكالوريا', en: 'Grade 11 Physics — Baccalaureate' },
    grade: 11,
    system: 'bac',
    track: { ar: 'البكالوريا المصرية، مسار الهندسة وعلوم الحاسب', en: 'Egyptian Baccalaureate, Engineering and CS track' },
    price: 400,
    startsOn: at(10),
    pitch: {
      ar: 'تقييم مستمر طول السنة، فكل واجب بيفرق. بنتابع كل درجة أول بأول.',
      en: 'Continuous assessment all year, so every assignment counts. Every score is tracked as it happens.',
    },
  },
];

const nasrCity = { ar: 'مدينة نصر', en: 'Nasr City' };

export const groups: Group[] = [
  {
    id: 'g1',
    courseId: 'c1',
    days: [6, 2],
    hour: 16,
    minute: 0,
    durationMin: 120,
    mode: 'inPerson',
    place: { ar: 'سنتر النخبة، شارع عباس العقاد', en: 'Elite Centre, Abbas El-Akkad St' },
    area: nasrCity,
    capacity: 12,
    recordings: true,
  },
  {
    id: 'g2',
    courseId: 'c1',
    days: [0, 3],
    hour: 18,
    minute: 30,
    durationMin: 120,
    mode: 'inPerson',
    place: { ar: 'سنتر النور، الكوربة', en: 'Al-Nour Centre, Korba' },
    area: { ar: 'مصر الجديدة', en: 'Heliopolis' },
    capacity: 10,
    recordings: true,
  },
  {
    id: 'g3',
    courseId: 'c1',
    days: [4],
    hour: 20,
    minute: 0,
    durationMin: 90,
    mode: 'online',
    capacity: 20,
    recordings: true,
  },
  {
    id: 'g4',
    courseId: 'c3',
    days: [1, 4],
    hour: 17,
    minute: 0,
    durationMin: 90,
    mode: 'inPerson',
    place: { ar: 'سنتر النخبة، شارع عباس العقاد', en: 'Elite Centre, Abbas El-Akkad St' },
    area: nasrCity,
    capacity: 10,
    recordings: false,
  },
  {
    id: 'g5',
    courseId: 'c2',
    days: [0, 3],
    hour: 15,
    minute: 0,
    durationMin: 120,
    mode: 'inPerson',
    place: { ar: 'سنتر المستقبل، مكرم عبيد', en: 'Al-Mostaqbal Centre, Makram Ebeid' },
    area: nasrCity,
    capacity: 30,
    recordings: true,
  },
];

// ---------- Sessions ----------

const topics: Record<string, { ar: string; en: string }[]> = {
  c1: [
    { ar: 'التيار الكهربي وقانون أوم', en: "Electric current and Ohm's law" },
    { ar: 'قوانين كيرشوف', en: "Kirchhoff's laws" },
    { ar: 'التأثير المغناطيسي للتيار', en: 'Magnetic effect of current' },
    { ar: 'الحث الكهرومغناطيسي', en: 'Electromagnetic induction' },
    { ar: 'دوائر التيار المتردد', en: 'AC circuits' },
    { ar: 'حصة حل مسائل', en: 'Problem-solving session' },
  ],
  c2: [
    { ar: 'الاشتقاق الضمني', en: 'Implicit differentiation' },
    { ar: 'تطبيقات التفاضل', en: 'Applications of derivatives' },
    { ar: 'التكامل المحدد', en: 'Definite integrals' },
    { ar: 'الديناميكا: كمية الحركة', en: 'Dynamics: momentum' },
  ],
  c3: [
    { ar: 'الحركة في خط مستقيم', en: 'Motion in one dimension' },
    { ar: 'المتجهات', en: 'Vectors' },
    { ar: 'قوانين نيوتن', en: "Newton's laws" },
    { ar: 'الشغل والطاقة', en: 'Work and energy' },
  ],
};

function buildSessions(): Session[] {
  const out: Session[] = [];
  for (const g of groups) {
    const course = courses.find((c) => c.id === g.courseId)!;
    let n = 0;
    for (let d = -28; d <= 28; d++) {
      const day = addDays(today, d);
      if (!g.days.includes(day.getDay())) continue;
      const start = at(d, g.hour, g.minute);
      if (start < course.startsOn) continue;
      const list = topics[g.courseId];
      out.push({
        id: `${g.id}_${d + 100}`,
        groupId: g.id,
        courseId: g.courseId,
        start,
        end: new Date(start.getTime() + g.durationMin * 60_000),
        topic: list[n % list.length],
      });
      n++;
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export const sessions: Session[] = buildSessions();

// ---------- Assessments ----------

export const assessments: Assessment[] = [
  { id: 'a1', courseId: 'c1', kind: 'homework', title: { ar: 'ورقة مسائل كيرشوف', en: 'Kirchhoff problem sheet' }, due: at(2, 23, 59), max: 20, hasAnswerKey: true },
  { id: 'a2', courseId: 'c1', kind: 'quiz', title: { ar: 'كويز قانون أوم', en: "Ohm's law quiz" }, due: at(-5, 22), max: 20, hasAnswerKey: true },
  { id: 'a3', courseId: 'c1', kind: 'exam', title: { ar: 'امتحان شهر أكتوبر', en: 'October monthly exam' }, due: at(7, 16), max: 50, hasAnswerKey: true },
  { id: 'a4', courseId: 'c1', kind: 'homework', title: { ar: 'تمارين المجال المغناطيسي', en: 'Magnetic field worksheet' }, due: at(-1, 23, 59), max: 20, hasAnswerKey: true },
  { id: 'a5', courseId: 'c2', kind: 'homework', title: { ar: 'تمارين التكامل', en: 'Integration exercises' }, due: at(1, 23, 59), max: 10, hasAnswerKey: false },
  { id: 'a6', courseId: 'c2', kind: 'quiz', title: { ar: 'كويز الاشتقاق', en: 'Derivatives quiz' }, due: at(-8, 22), max: 10, hasAnswerKey: true },
  { id: 'a7', courseId: 'c3', kind: 'homework', title: { ar: 'ورقة المتجهات', en: 'Vectors sheet' }, due: at(3, 23, 59), max: 15, hasAnswerKey: true },
  { id: 'a8', courseId: 'c3', kind: 'quiz', title: { ar: 'كويز الحركة', en: 'Motion quiz' }, due: at(-6, 22), max: 20, hasAnswerKey: true },
];

// ---------- Family ----------

export const family = {
  parent: { name: { ar: 'منى عبد الرحمن', en: 'Mona Abdelrahman' }, phone: '01223344556' },
};

export const children: Child[] = [
  {
    id: 'k1',
    name: { ar: 'يوسف هاني', en: 'Youssef Hany' },
    grade: 12,
    groupIds: ['g1', 'g5'],
    rosterId: 's1',
    history: {
      c1: [
        { title: { ar: 'واجب الكهربية', en: 'Electricity homework' }, pct: 65, date: at(-33) },
        { title: { ar: 'كويز الوحدات', en: 'Units quiz' }, pct: 72, date: at(-26) },
        { title: { ar: 'امتحان سبتمبر', en: 'September exam' }, pct: 70, date: at(-19) },
        { title: { ar: 'واجب المقاومات', en: 'Resistors homework' }, pct: 80, date: at(-12) },
        { title: { ar: 'كويز قانون أوم', en: "Ohm's law quiz" }, pct: 85, date: at(-5) },
      ],
      c2: [
        { title: { ar: 'واجب النهايات', en: 'Limits homework' }, pct: 78, date: at(-30) },
        { title: { ar: 'كويز الاتصال', en: 'Continuity quiz' }, pct: 74, date: at(-23) },
        { title: { ar: 'امتحان سبتمبر', en: 'September exam' }, pct: 80, date: at(-16) },
        { title: { ar: 'واجب الاشتقاق', en: 'Derivatives homework' }, pct: 76, date: at(-12) },
        { title: { ar: 'كويز الاشتقاق', en: 'Derivatives quiz' }, pct: 80, date: at(-8) },
      ],
    },
  },
  {
    id: 'k2',
    name: { ar: 'سلمى هاني', en: 'Salma Hany' },
    grade: 11,
    groupIds: ['g4'],
    rosterId: 's21',
    history: {
      c3: [
        { title: { ar: 'تقييم تشخيصي', en: 'Diagnostic' }, pct: 60, date: at(-20) },
        { title: { ar: 'واجب الوحدات', en: 'Units homework' }, pct: 70, date: at(-13) },
        { title: { ar: 'كويز الحركة', en: 'Motion quiz' }, pct: 75, date: at(-6) },
      ],
    },
  },
];

export const submissions: Submission[] = [
  { assessmentId: 'a1', childId: 'k1', status: 'pending' },
  {
    assessmentId: 'a2',
    childId: 'k1',
    status: 'graded',
    score: 17,
    submittedAt: at(-5, 21, 10),
    feedback: {
      ar: 'شغل كويس. انتبه للوحدات في السؤال 4، كتبت أوم بدل فولت.',
      en: 'Good work. Watch the units in question 4: you wrote ohms instead of volts.',
    },
  },
  { assessmentId: 'a3', childId: 'k1', status: 'pending' },
  { assessmentId: 'a4', childId: 'k1', status: 'submitted', submittedAt: at(-1, 20, 40) },
  { assessmentId: 'a5', childId: 'k1', status: 'pending' },
  {
    assessmentId: 'a6',
    childId: 'k1',
    status: 'graded',
    score: 8,
    submittedAt: at(-8, 21),
    feedback: { ar: 'ممتاز في القواعد، راجع قاعدة السلسلة.', en: 'Strong on the rules; review the chain rule.' },
  },
  { assessmentId: 'a7', childId: 'k2', status: 'pending' },
  {
    assessmentId: 'a8',
    childId: 'k2',
    status: 'graded',
    score: 15,
    submittedAt: at(-6, 21),
    feedback: { ar: 'فهم كويس للسرعة المتوسطة.', en: 'Good grasp of average velocity.' },
  },
];

/** Past-session attendance for family children; anything not listed counts as present. */
export const childAttendanceExceptions: Record<string, 'absent' | 'late' | 'excused'> = {};
(() => {
  const past = sessions.filter((s) => s.end < NOW);
  const g1Past = past.filter((s) => s.groupId === 'g1');
  const g5Past = past.filter((s) => s.groupId === 'g5');
  const g4Past = past.filter((s) => s.groupId === 'g4');
  if (g1Past.length > 3) childAttendanceExceptions[`k1:${g1Past[g1Past.length - 3].id}`] = 'absent';
  if (g1Past.length > 1) childAttendanceExceptions[`k1:${g1Past[1].id}`] = 'late';
  if (g5Past.length > 2) childAttendanceExceptions[`k1:${g5Past[2].id}`] = 'excused';
  if (g4Past.length > 0) childAttendanceExceptions[`k2:${g4Past[0].id}`] = 'late';
})();

const thisMonth = NOW.getMonth();
const thisYear = NOW.getFullYear();
const nextMonthFirst = new Date(thisYear, thisMonth + 1, 1, 12);
const prevMonth = (thisMonth + 11) % 12;
const prevMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

export const invoices: Invoice[] = [
  { id: 'inv1', childId: 'k1', courseId: 'c1', month: thisMonth, year: thisYear, amount: 450, dueDate: at(-20), status: 'paid', paidVia: 'instapay', paidAt: at(-22) },
  { id: 'inv2', childId: 'k1', courseId: 'c2', month: thisMonth, year: thisYear, amount: 500, dueDate: at(-4), status: 'overdue' },
  { id: 'inv3', childId: 'k1', courseId: 'c1', month: (thisMonth + 1) % 12, year: thisMonth === 11 ? thisYear + 1 : thisYear, amount: 450, dueDate: nextMonthFirst, status: 'due' },
  { id: 'inv4', childId: 'k1', courseId: 'c1', month: prevMonth, year: prevMonthYear, amount: 450, dueDate: at(-50), status: 'paid', paidVia: 'cash', paidAt: at(-52) },
  { id: 'inv5', childId: 'k2', courseId: 'c3', month: thisMonth, year: thisYear, amount: 400, dueDate: at(-18), status: 'paid', paidVia: 'wallet', paidAt: at(-19) },
  { id: 'inv6', childId: 'k2', courseId: 'c3', month: (thisMonth + 1) % 12, year: thisMonth === 11 ? thisYear + 1 : thisYear, amount: 400, dueDate: nextMonthFirst, status: 'due' },
];

export const materials: Material[] = [
  { id: 'm1', courseId: 'c1', title: { ar: 'ملزمة الكهربية — الفصل الأول', en: 'Electricity booklet — chapter 1' }, pages: 48 },
  { id: 'm2', courseId: 'c1', title: { ar: 'ملخص قوانين الفصل', en: 'Chapter formula sheet' }, pages: 4 },
  { id: 'm3', courseId: 'c1', title: { ar: 'نماذج امتحانات السنين اللي فاتت', en: 'Past exam papers' }, pages: 22 },
  { id: 'm4', courseId: 'c2', title: { ar: 'ملزمة التفاضل', en: 'Calculus booklet' }, pages: 36 },
  { id: 'm5', courseId: 'c3', title: { ar: 'ملزمة الحركة', en: 'Motion booklet' }, pages: 30 },
];

// ---------- Instructor roster ----------

type Row = [ar: string, en: string, group: string, att: number, scores: number[], paid: boolean, streak: number, parentAr: string, parentEn: string];

const rows: Row[] = [
  ['يوسف هاني', 'Youssef Hany', 'g1', 0.88, [72, 70, 80, 85], true, 0, 'منى عبد الرحمن', 'Mona Abdelrahman'],
  ['عمر خالد', 'Omar Khaled', 'g1', 0.94, [88, 90, 86, 92], true, 0, 'خالد إبراهيم', 'Khaled Ibrahim'],
  ['مريم عادل', 'Mariam Adel', 'g1', 1, [95, 92, 96, 98], true, 0, 'عادل منصور', 'Adel Mansour'],
  ['أحمد طارق', 'Ahmed Tarek', 'g1', 0.69, [60, 55, 58, 52], false, 2, 'طارق فؤاد', 'Tarek Fouad'],
  ['نور الدين سامي', 'Nour El-Din Samy', 'g1', 0.81, [70, 74, 68, 77], true, 0, 'سامي عبد الله', 'Samy Abdallah'],
  ['حبيبة مصطفى', 'Habiba Mostafa', 'g1', 0.94, [82, 85, 88, 84], true, 0, 'مصطفى رشاد', 'Mostafa Rashad'],
  ['كريم أشرف', 'Karim Ashraf', 'g1', 0.75, [64, 66, 61, 70], false, 0, 'أشرف حمدي', 'Ashraf Hamdy'],
  ['ملك حسام', 'Malak Hossam', 'g1', 0.88, [78, 80, 83, 81], true, 0, 'حسام الدين', 'Hossam El-Din'],
  ['زياد وائل', 'Ziad Wael', 'g1', 0.56, [50, 48, 55, 44], false, 2, 'وائل شريف', 'Wael Sherif'],
  ['فريدة عمرو', 'Farida Amr', 'g1', 1, [90, 94, 91, 95], true, 0, 'عمرو نبيل', 'Amr Nabil'],
  ['آدم محمود', 'Adam Mahmoud', 'g2', 0.9, [76, 79, 81, 80], true, 0, 'محمود حسن', 'Mahmoud Hassan'],
  ['جنى أسامة', 'Jana Osama', 'g2', 0.95, [91, 89, 93, 90], true, 0, 'أسامة رفعت', 'Osama Refaat'],
  ['مازن هشام', 'Mazen Hesham', 'g2', 0.7, [62, 58, 66, 60], false, 1, 'هشام عزت', 'Hesham Ezzat'],
  ['ليلى ياسر', 'Laila Yasser', 'g2', 0.85, [80, 77, 84, 86], true, 0, 'ياسر جمال', 'Yasser Gamal'],
  ['سيف الدين علي', 'Seif El-Din Aly', 'g2', 0.8, [73, 70, 75, 71], true, 0, 'علي سعد', 'Aly Saad'],
  ['رنا شريف', 'Rana Sherif', 'g2', 1, [87, 90, 88, 93], true, 0, 'شريف كمال', 'Sherif Kamal'],
  ['تميم رامي', 'Tamim Ramy', 'g3', 0.82, [74, 78, 72, 79], true, 0, 'رامي صلاح', 'Ramy Salah'],
  ['هنا وليد', 'Hana Walid', 'g3', 0.9, [85, 83, 88, 87], true, 0, 'وليد فتحي', 'Walid Fathy'],
  ['ياسين عماد', 'Yassin Emad', 'g3', 0.64, [58, 61, 57, 63], false, 2, 'عماد السيد', 'Emad El-Sayed'],
  ['لينا حازم', 'Lina Hazem', 'g3', 0.95, [92, 90, 94, 96], true, 0, 'حازم فريد', 'Hazem Farid'],
  ['سلمى هاني', 'Salma Hany', 'g4', 0.86, [60, 70, 75], true, 0, 'منى عبد الرحمن', 'Mona Abdelrahman'],
  ['عبد الرحمن أيمن', 'Abdelrahman Ayman', 'g4', 0.93, [80, 84, 82], true, 0, 'أيمن زكي', 'Ayman Zaki'],
  ['نادين باسم', 'Nadine Bassem', 'g4', 1, [88, 91, 94], true, 0, 'باسم لطفي', 'Bassem Lotfy'],
  ['حمزة تامر', 'Hamza Tamer', 'g4', 0.71, [55, 62, 59], false, 0, 'تامر عصام', 'Tamer Essam'],
  ['روان إيهاب', 'Rawan Ehab', 'g4', 0.86, [77, 73, 80], true, 0, 'إيهاب منير', 'Ehab Mounir'],
];

export const roster: RosterStudent[] = rows.map((r, i) => ({
  id: r[1] === 'Salma Hany' ? 's21' : `s${i + 1}`,
  name: { ar: r[0], en: r[1] },
  groupId: r[2],
  phone: `010${String(20000000 + i * 734123).slice(0, 8)}`,
  parentName: { ar: r[7], en: r[8] },
  parentPhone: `012${String(30000000 + i * 512347).slice(0, 8)}`,
  attendance: r[3],
  scores: r[4],
  paidThisMonth: r[5],
  absentStreak: r[6],
}));

// ---------- Assistant (instructor side) ----------

export const handoffs: Handoff[] = [
  {
    id: 'h1',
    who: { ar: 'منى عبد الرحمن، والدة يوسف', en: "Mona Abdelrahman, Youssef's mother" },
    aboutStudentId: 's1',
    question: {
      ar: 'ممكن يوسف يحضر مع مجموعة الأربع الأسبوع ده بدل التلات؟ عنده درس تاني.',
      en: 'Can Youssef join the Wednesday group this week instead of Tuesday? He has another lesson.',
    },
    at: at(0, 9, 12),
    channel: 'whatsapp',
  },
  {
    id: 'h2',
    who: { ar: 'عمر خالد، طالب', en: 'Omar Khaled, student' },
    aboutStudentId: 's2',
    question: {
      ar: 'حضرتك هتنزل تسجيل حصة الحث النهارده ولا بكرة؟',
      en: "Will the recording of today's induction session go up today or tomorrow?",
    },
    at: at(0, 11, 40),
    channel: 'app',
  },
  {
    id: 'h3',
    who: { ar: 'وائل شريف، والد زياد', en: "Wael Sherif, Ziad's father" },
    aboutStudentId: 's9',
    question: {
      ar: 'دفعت كاش للمساعد يوم الخميس ومجاليش إيصال.',
      en: "I paid the assistant in cash on Thursday and didn't get a receipt.",
    },
    at: at(-1, 19, 5),
    channel: 'whatsapp',
  },
];

export const sentAlerts: SentAlert[] = [
  { id: 'al1', kind: 'reminder', text: { ar: 'تذكير بحصة النهارده الساعة 4', en: "Reminder: today's session at 4 pm" }, count: 10, at: at(0, 10) },
  { id: 'al2', kind: 'absence', text: { ar: 'تنبيه غياب لولي الأمر', en: 'Absence alert to parent' }, count: 2, at: at(0, 8, 30) },
  { id: 'al3', kind: 'payment', text: { ar: 'تذكير بمصاريف الشهر', en: "Reminder: this month's fee" }, count: 7, at: at(0, 8) },
];

/** Collected revenue for the five months before this one (EGP), oldest first. */
export const revenueHistory: number[] = [15300, 8100, 4200, 9900, 13500];

// ---------- Landing page ----------

export const testimonials: { instructorId: string; who: { ar: string; en: string }; text: { ar: string; en: string } }[] = [
  {
    instructorId: 'i1',
    who: { ar: 'مريم، تالتة ثانوي', en: 'Mariam, grade 12' },
    text: {
      ar: 'أول مرة الكهربية تبقى مفهومة. المسائل بقت سهلة بعد شرح الفكرة بالتجربة.',
      en: 'The first time electricity made sense. Problems got easy once the idea was shown with an experiment.',
    },
  },
  {
    instructorId: 'i1',
    who: { ar: 'والد عمر', en: "Omar's father" },
    text: {
      ar: 'بيوصلني تقرير كل خميس، وبعرف لو عمر غاب في نفس اليوم.',
      en: 'I get a report every Thursday, and I know the same day if Omar misses a session.',
    },
  },
  {
    instructorId: 'i1',
    who: { ar: 'فريدة، تالتة ثانوي', en: 'Farida, grade 12' },
    text: {
      ar: 'التسجيلات أنقذتني لما غبت أسبوع وأنا عيانة.',
      en: 'The recordings saved me when I was ill for a week.',
    },
  },
];
