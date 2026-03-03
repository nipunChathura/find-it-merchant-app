/**
 * Design System - Modern Blue Professional Theme
 */

export const colors = {
  primary: '#2563EB',
  secondary: '#1E40AF',
  background: '#F8FAFC',
  card: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  accent: '#38BDF8',
  border: '#E2E8F0',

  // Badges
  success: '#16A34A',
  successBg: '#DCFCE7',
  warning: '#EA580C',
  warningBg: '#FFEDD5',
  error: '#DC2626',
  errorBg: '#FEE2E2',

  // UI
  white: '#FFFFFF',
  black: '#0F172A',
} as const;

export type ColorKey = keyof typeof colors;
