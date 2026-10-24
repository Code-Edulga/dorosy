# Dorosy (دروسي) — mobile app frontend

Private-tutoring management for Egyptian high school students. One React Native app (Expo, iOS and Android) with two sides: students and parents, and instructors. Arabic right-to-left by default, English toggle on every main screen.

All data is mocked in `src/data/mock.ts`, generated relative to the current date, so every flow runs end to end without a backend. Payments can also run for real through Paymob, via the backend in [`../backend`](../backend).

## Run it

Requires Node 20+.

```bash
npm install
npx expo start          # scan the QR code with Expo Go (SDK 58) or press i / a for a simulator
npm run web             # browser preview at phone width
npm run typecheck
```

For real payments, copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the backend. Restart with `npx expo start --clear` so the variable is picked up. Without it the app stays in demo mode.

On the welcome screen, "Try the app as" opens the student, parent or instructor side directly. "Continue with phone number" runs the sign-in flow; in the demo any 6-digit code is accepted.

## Screens

| Area | Route | PRD |
| --- | --- | --- |
| Welcome, phone sign-in, OTP, role pick | `/`, `/auth/*` | MKT-03 |
| Instructor landing page: hero, courses with live seats, testimonials, contact, subscribe CTA | `/t/[handle]` | MKG-01–06 |
| Registration: group, student, parent phone, guardian consent, payment timing | `/register/[courseId]` | MKT-02–05 |
| Student/parent home: next session ticket, billing alert, due soon, courses | `/home` | Dashboard |
| Calendar (week starts Saturday) | `/calendar` | Dashboard |
| Assignments and exams; submit homework | `/assignments`, `/assignment/[id]` | LMS-07 |
| Progress: attendance, scores per course | `/progress` | Dashboard |
| AI assistant chat (answers from the child's data, hands off the rest) | `/assistant` | AI-01–03, AI-06–12 |
| Course view: sessions, materials, recordings (locked when unpaid) | `/course/[id]` | LMS-03, 05, 10 |
| Billing: invoices; card, mobile wallet or Aman/Masary kiosk through Paymob; cash at the centre | `/billing`, `/payment-return` | BIL-02–04 |
| Instructor dashboard: today's sessions, alerts, course progress | `/dashboard` | Dashboard |
| Students list with filters; student profile | `/students`, `/teach/student/[id]` | Dashboard |
| Schedule | `/schedule` | Dashboard |
| Assistant inbox: handoffs, alerts sent, alert settings | `/inbox` | AI-11, AI-13 |
| Revenue: collected vs outstanding, by group, record cash | `/revenue` | BIL-04, BIL-08 |
| Course management: groups, sessions, assessments | `/teach/course/[id]` | LMS-01–09 |
| Attendance: QR check-in or roster tick | `/teach/attendance/[sessionId]` | LMS-06 |
| Grading with assistant draft, publish | `/teach/grade/[assessmentId]` | LMS-08, AI-04 |

Parents switch between children from the name at the top of the home screen.

## Structure

```
src/
  app/            Expo Router screens (file-based routes)
    (family)/     student + parent tabs
    (teach)/      instructor tabs
  components/     shared UI: ui.tsx (Txt, Row, Card, Btn, Tag, Sheet…), Ticket, TabBar, WeekStrip, Agenda
  data/
    api.ts        backend client (payments, invoice status)
    checkout.ts   Paymob checkout: open in-app browser, poll for the result
    types.ts      domain types
    mock.ts       demo data — replace with API calls
    store.tsx     app state + actions (submit, pay, attendance, grades, replies)
    selectors.ts  read-only views used by screens
    assistant.ts  demo assistant logic
  i18n/           strings.ts (ar source, en mirror) and the useT() hook
  lib/dates.ts    date formatting without Intl locale data
  theme/tokens.ts colours, type scale, spacing, radius
```

## Wiring a backend

Screens read data only through `src/data/selectors.ts` and change it only through actions in `src/data/store.tsx`. To connect an API, replace the bodies of those functions (for example with React Query hooks) and delete `mock.ts`; screen code should not need to change.

Things that are visual stand-ins in this build:

- **QR check-in** (`components/QrBlock.tsx`) draws a placeholder pattern. Production needs a signed, rotating token rendered with a QR library, and a scanner on the student side.
- **Payments** go through Paymob when `EXPO_PUBLIC_API_URL` is set. The backend creates a payment intention and the parent pays on Paymob's hosted page, opened with `expo-web-browser`. The backend's signed webhook is what marks the invoice paid. On startup the store pulls paid statuses from the backend (`syncInvoices`). Still to do: receipts, InstaPay (not offered through Paymob here), and paying at registration.
- **Assistant** (`data/assistant.ts`) answers with keyword rules. Production swaps in an LLM call with the same data scope and the same handoff rule, plus WhatsApp Business Platform delivery.
- **Recordings, materials, photo upload** show the UI only.

## Design

- Palette from the brief: deep blue `#1F4FD6` / `#13348F`, cyan `#12B5CB`, and sun yellow `#FFC93C` used only for the subscribe CTA, exams and the ticket's time.
- One typeface: IBM Plex Sans Arabic, which covers Arabic and Latin.
- The next-session card is drawn as a tutoring-centre ticket stub; everything else stays quiet.

## Right-to-left

Direction is handled in layout code (`useT().row`, `useT().align`) rather than `I18nManager.forceRTL`, so switching language applies instantly without a reload on iOS, Android and web. Use `Row` instead of `flexDirection: 'row'` and `Txt` instead of `Text`, and wrap tags or small buttons in a column with `AlignStart`. Phone numbers, OTP codes and scores stay left-to-right in both languages.
