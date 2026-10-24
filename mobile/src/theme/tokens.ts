// Dorosy design tokens.
// Palette from the brief: blue, cyan, a little yellow.
// Yellow is an accent only: subscribe CTA, due-soon markers, the ticket's time.

export const colors = {
  ink: '#0B1B3F', // primary text, deep navy
  inkSoft: '#4A5B7E', // secondary text
  inkMute: '#8593AE', // tertiary text, placeholders
  blue: '#1F4FD6', // primary actions, brand
  blueDeep: '#13348F', // ticket body, headers on blue
  blueTint: '#E8EEFD', // selected states
  cyan: '#12B5CB', // progress, active states, student-side highlights
  cyanTint: '#E3F7FA',
  sun: '#FFC93C', // accent only
  sunTint: '#FFF5DA',
  paper: '#F4F7FC', // app background
  card: '#FFFFFF',
  line: '#DCE4F0', // hairlines
  good: '#13996B',
  goodTint: '#E2F5EE',
  warn: '#C77700',
  warnTint: '#FFF1DB',
  bad: '#D13B4B',
  badTint: '#FDE8EA',
} as const;

export const font = {
  r: 'IBMPlexSansArabic_400Regular',
  m: 'IBMPlexSansArabic_500Medium',
  s: 'IBMPlexSansArabic_600SemiBold',
  b: 'IBMPlexSansArabic_700Bold',
} as const;

// Type scale (modular, ~1.2). Arabic needs generous line height.
export const type = {
  display: { size: 30, line: 42 },
  title: { size: 22, line: 32 },
  heading: { size: 17, line: 26 },
  body: { size: 15, line: 24 },
  small: { size: 13, line: 20 },
  micro: { size: 11.5, line: 16 },
} as const;

export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;

// Radius follows hierarchy: containers soft, controls round, chips pill.
export const radius = { card: 20, control: 14, chip: 999, small: 10 } as const;
