// Design tokens mirrored 1:1 from frontend/src/app/globals.css so the mobile app
// matches the web app's light theme exactly (same background/foreground/accent values).

export const Colors = {
  background: '#fafafa',
  foreground: '#09090b',
  card: '#ffffff',
  cardTranslucent: 'rgba(255,255,255,0.7)',
  cardForeground: '#09090b',
  border: '#e4e4e7',
  muted: '#f4f4f5',
  mutedForeground: '#71717a',
  accent: '#18181b',
  accentForeground: '#fafafa',
  indigo: '#4f46e5',
  purpleGradientEnd: '#7c3aed',
} as const;

// Per-tool accent colors, matching the icon-box background colors on the web home page.
export const ToolColors = {
  ats: '#f97316',
  coverLetter: '#3b82f6',
  linkedin: '#0ea5e9',
  builder: '#a855f7',
  skillGap: '#f97316',
  mockInterview: '#22c55e',
} as const;

// Geist font family names, as registered by useFonts() in app/_layout.tsx.
export const Fonts = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semiBold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
  extraBold: 'Geist_800ExtraBold',
  black: 'Geist_900Black',
  mono: 'GeistMono_500Medium',
} as const;
